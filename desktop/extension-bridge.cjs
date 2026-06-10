const { createServer } = require("node:http");

const DEFAULT_PORT = 47843;

function readJson(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString("utf8");
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    "content-type": "application/json; charset=utf-8"
  });
  res.end(JSON.stringify(payload));
}

class ExtensionBridge {
  constructor({ port = DEFAULT_PORT, onTranscriptEvent, onConnection } = {}) {
    this.port = Number(port || DEFAULT_PORT);
    this.onTranscriptEvent = onTranscriptEvent;
    this.onConnection = onConnection;
    this.server = null;
    this.activeSession = null;
  }

  setActiveSession(session = {}) {
    if (!session.meetingId) throw new Error("Active extension session requires a meetingId.");
    this.activeSession = {
      meetingId: session.meetingId,
      meetingTitle: session.meetingTitle || "Untitled meeting",
      platform: session.platform || "unknown",
      startedAt: new Date().toISOString()
    };
    return { ok: true, activeSession: this.activeSession };
  }

  clearActiveSession() {
    const previous = this.activeSession;
    this.activeSession = null;
    return { ok: true, previous };
  }

  statusPayload() {
    return {
      ok: true,
      bridge: "live-meeting-copilot",
      port: this.port,
      activeSession: this.activeSession
    };
  }

  start() {
    if (this.server) return Promise.resolve(this.port);

    this.server = createServer(async (req, res) => {
      try {
        if (req.method === "OPTIONS") return sendJson(res, 204, {});
        if (req.method === "GET" && req.url === "/status") {
          this.onConnection?.({ connected: true, at: new Date().toISOString(), activeSession: this.activeSession });
          return sendJson(res, 200, this.statusPayload());
        }
        if (req.method === "POST" && req.url === "/transcript-event") {
          const event = await readJson(req);
          if (!this.activeSession) {
            return sendJson(res, 409, { ok: false, error: "No active Live Assist session. Start Live Assist in the desktop app first." });
          }
          if (event.meetingId !== this.activeSession.meetingId) {
            return sendJson(res, 409, { ok: false, error: "Transcript event meetingId does not match the active Live Assist session." });
          }
          this.onTranscriptEvent?.(event);
          return sendJson(res, 202, { ok: true });
        }
        return sendJson(res, 404, { ok: false, error: "Not found" });
      } catch (error) {
        return sendJson(res, 400, { ok: false, error: error.message || "Bridge request failed." });
      }
    });

    return new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(this.port, "127.0.0.1", () => {
        this.server.off("error", reject);
        resolve(this.port);
      });
    });
  }

  stop() {
    if (!this.server) return;
    this.server.close();
    this.server = null;
  }
}

module.exports = { ExtensionBridge, DEFAULT_PORT };
