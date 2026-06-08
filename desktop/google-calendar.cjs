const { createServer } = require("node:http");
const { randomBytes } = require("node:crypto");
const { readFile, unlink, writeFile } = require("node:fs/promises");
const { join } = require("node:path");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_EVENTS_URL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const GOOGLE_SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";

function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET || ""
  };
}

function tokenFilePath(app) {
  return join(app.getPath("userData"), "google-calendar-token.json");
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

async function postTokenRequest(body) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || data.error || "Google token request failed.");
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
        res.writeHead(400).end("Missing OAuth code.");
        reject(new Error("Missing OAuth code."));
        return;
      }

      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end("<!doctype html><title>Live Meeting Copilot</title><p>Google Calendar connected. You can return to Live Meeting Copilot.</p>");
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

class GoogleCalendarClient {
  constructor(app, shell) {
    this.app = app;
    this.shell = shell;
  }

  async status() {
    const config = getGoogleConfig();
    const token = await readToken(this.app);
    return {
      configured: Boolean(config.clientId && config.clientSecret),
      connected: Boolean(token?.refresh_token || token?.access_token),
      scopes: [GOOGLE_SCOPE]
    };
  }

  async connect() {
    const config = getGoogleConfig();
    if (!config.clientId || !config.clientSecret) {
      throw new Error("Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before connecting Google Calendar.");
    }

    const state = randomBytes(16).toString("hex");
    const redirectPath = "/oauth/google/callback";
    const pending = await waitForOAuthCode(redirectPath, state);
    const redirectUri = `http://127.0.0.1:${pending.port}${redirectPath}`;
    const authUrl = new URL(GOOGLE_AUTH_URL);
    authUrl.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_SCOPE,
      access_type: "offline",
      prompt: "consent",
      state
    }).toString();

    await this.shell.openExternal(authUrl.toString());
    const code = await pending.code;
    const token = await postTokenRequest({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
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
    const config = getGoogleConfig();
    const token = await readToken(this.app);
    if (!token) throw new Error("Google Calendar is not connected.");
    if (!config.clientId || !config.clientSecret) throw new Error("Google Calendar credentials are not configured.");

    if (token.access_token && token.expiry_date > Date.now() + 60_000) return token.access_token;
    if (!token.refresh_token) throw new Error("Google Calendar refresh token is missing. Disconnect and reconnect Google Calendar.");

    const refreshed = await postTokenRequest({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: token.refresh_token,
      grant_type: "refresh_token"
    });
    const stored = toStoredToken(refreshed, token);
    await writeToken(this.app, stored);
    return stored.access_token;
  }

  async fetchUpcomingEvents() {
    const accessToken = await this.getAccessToken();
    const url = new URL(GOOGLE_EVENTS_URL);
    url.search = new URLSearchParams({
      singleEvents: "true",
      orderBy: "startTime",
      timeMin: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      timeMax: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: "20"
    }).toString();

    const response = await fetch(url, {
      headers: { authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Could not read Google Calendar events.");
    return data.items || [];
  }
}

module.exports = { GoogleCalendarClient };
