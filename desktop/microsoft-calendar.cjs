const { createServer } = require("node:http");
const { createHash, randomBytes } = require("node:crypto");
const { readFile, unlink, writeFile } = require("node:fs/promises");
const { join } = require("node:path");

const GRAPH_CALENDAR_VIEW_URL = "https://graph.microsoft.com/v1.0/me/calendarView";
const MICROSOFT_SCOPE = "offline_access User.Read Calendars.Read";

function base64Url(buffer) {
  return buffer.toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function getMicrosoftConfig() {
  return {
    clientId: process.env.MICROSOFT_CLIENT_ID || process.env.MS_CLIENT_ID || "",
    tenant: process.env.MICROSOFT_TENANT_ID || process.env.MS_TENANT_ID || "common"
  };
}

function endpoints(tenant) {
  const base = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0`;
  return {
    authUrl: `${base}/authorize`,
    tokenUrl: `${base}/token`
  };
}

function tokenFilePath(app) {
  return join(app.getPath("userData"), "microsoft-calendar-token.json");
}

async function readToken(app) {
  try {
    return JSON.parse(await readFile(tokenFilePath(app), "utf8"));
  } catch {
    return null;
  }
}

async function writeToken(app, token) {
  await writeFile(tokenFilePath(app), JSON.stringify(token, null, 2));
}

async function postTokenRequest(tokenUrl, body) {
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Microsoft token request failed.");
  return data;
}

async function waitForOAuthCode(redirectPath, expectedState) {
  let server;

  const codePromise = new Promise((resolve, reject) => {
    server = createServer((req, res) => {
      const url = new URL(req.url || "/", "http://127.0.0.1");
      if (url.pathname !== redirectPath) {
        res.writeHead(404).end("Not found");
        return;
      }

      if (url.searchParams.get("state") !== expectedState) {
        res.writeHead(400).end("Invalid OAuth state.");
        reject(new Error("Invalid OAuth state."));
        return;
      }

      const code = url.searchParams.get("code");
      if (!code) {
        const error = url.searchParams.get("error_description") || url.searchParams.get("error") || "Missing OAuth code.";
        res.writeHead(400).end(error);
        reject(new Error(error));
        return;
      }

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end("<!doctype html><title>Live Meeting Copilot</title><p>Microsoft Calendar connected. You can return to Live Meeting Copilot.</p>");
      resolve(code);
    });

    server.on("error", reject);
  });

  await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  const { port } = server.address();
  return {
    port,
    code: codePromise.finally(() => server.close())
  };
}

function toStoredToken(token, existing = {}) {
  return {
    access_token: token.access_token,
    refresh_token: token.refresh_token || existing.refresh_token,
    scope: token.scope || existing.scope,
    token_type: token.token_type || existing.token_type,
    expiry_date: Date.now() + Number(token.expires_in || 3600) * 1000
  };
}

class MicrosoftCalendarClient {
  constructor(app, shell) {
    this.app = app;
    this.shell = shell;
  }

  async status() {
    const config = getMicrosoftConfig();
    const token = await readToken(this.app);
    return {
      configured: Boolean(config.clientId),
      connected: Boolean(token?.refresh_token || token?.access_token),
      scopes: MICROSOFT_SCOPE.split(" ")
    };
  }

  async connect() {
    const config = getMicrosoftConfig();
    if (!config.clientId) {
      throw new Error("Set MICROSOFT_CLIENT_ID before connecting Microsoft Calendar.");
    }

    const state = randomBytes(16).toString("hex");
    const codeVerifier = base64Url(randomBytes(48));
    const codeChallenge = base64Url(createHash("sha256").update(codeVerifier).digest());
    const redirectPath = "/oauth/microsoft/callback";
    const pending = await waitForOAuthCode(redirectPath, state);
    const redirectUri = `http://127.0.0.1:${pending.port}${redirectPath}`;
    const { authUrl, tokenUrl } = endpoints(config.tenant);
    const authorizeUrl = new URL(authUrl);
    authorizeUrl.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: MICROSOFT_SCOPE,
      response_mode: "query",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state
    }).toString();

    await this.shell.openExternal(authorizeUrl.toString());
    const code = await pending.code;
    const token = await postTokenRequest(tokenUrl, {
      client_id: config.clientId,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });
    await writeToken(this.app, toStoredToken(token));
    return this.status();
  }

  async disconnect() {
    try {
      await unlink(tokenFilePath(this.app));
    } catch {
      // Already disconnected.
    }
    return this.status();
  }

  async getAccessToken() {
    const config = getMicrosoftConfig();
    const token = await readToken(this.app);
    if (!token) throw new Error("Microsoft Calendar is not connected.");
    if (!config.clientId) throw new Error("Microsoft Calendar credentials are not configured.");

    if (token.access_token && token.expiry_date > Date.now() + 60_000) return token.access_token;
    if (!token.refresh_token) throw new Error("Microsoft Calendar refresh token is missing. Disconnect and reconnect Microsoft Calendar.");

    const { tokenUrl } = endpoints(config.tenant);
    const refreshed = await postTokenRequest(tokenUrl, {
      client_id: config.clientId,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token",
      scope: MICROSOFT_SCOPE
    });
    const stored = toStoredToken(refreshed, token);
    await writeToken(this.app, stored);
    return stored.access_token;
  }

  async fetchUpcomingEvents() {
    const accessToken = await this.getAccessToken();
    const url = new URL(GRAPH_CALENDAR_VIEW_URL);
    url.search = new URLSearchParams({
      startDateTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      endDateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      "$top": "20",
      "$orderby": "start/dateTime"
    }).toString();

    const response = await fetch(url, {
      headers: {
        authorization: `Bearer ${accessToken}`,
        prefer: "outlook.timezone=\"UTC\""
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Could not read Microsoft Calendar events.");
    return data.value || [];
  }
}

module.exports = { MicrosoftCalendarClient };
