const { execFile } = require("node:child_process");

const MEETING_APPS = ["zoom", "microsoft teams", "google chrome", "chrome", "meet"];

function runOsaScript(script) {
  return new Promise((resolve, reject) => {
    execFile("osascript", ["-e", script], { timeout: 4000 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr.trim() || error.message));
        return;
      }
      resolve(stdout.trim());
    });
  });
}

function parseWindowLines(output) {
  return output.split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [appName, title] = line.split("\t");
      return {
        id: `desktop-window-${index}`,
        appName: appName || "Unknown app",
        title: title || "Untitled window",
        platformHint: inferPlatform(`${appName} ${title}`)
      };
    });
}

function inferPlatform(text) {
  const lower = text.toLowerCase();
  if (lower.includes("zoom")) return "zoom";
  if (lower.includes("teams")) return "microsoft-teams";
  if (lower.includes("meet") || lower.includes("chrome")) return "google-meet";
  return "unknown";
}

class DesktopCaptureAgent {
  async detectCandidateWindows() {
    if (process.platform === "win32") return this.windowsBrowserE2eStatus();
    if (process.platform !== "darwin") return this.unsupportedPlatformStatus();

    const script = `
      tell application "System Events"
        set output to ""
        repeat with proc in (application processes whose background only is false)
          set procName to name of proc
          repeat with win in windows of proc
            set winName to name of win
            if winName is not "" then set output to output & procName & tab & winName & linefeed
          end repeat
        end repeat
        return output
      end tell
    `;

    try {
      const windows = parseWindowLines(await runOsaScript(script))
        .filter((window) => MEETING_APPS.some((needle) => `${window.appName} ${window.title}`.toLowerCase().includes(needle)));
      return {
        ok: true,
        supported: true,
        platform: process.platform,
        statusLabel: "Ready",
        windows,
        message: `${windows.length} candidate desktop meeting window(s) found.`,
        permissionHelp: this.permissionHelp()
      };
    } catch (error) {
      return {
        ok: false,
        supported: true,
        platform: process.platform,
        statusLabel: "Needs permission",
        windows: [],
        message: "Could not read desktop windows. Grant Accessibility permission to the terminal/Electron app and try again.",
        error: error.message,
        permissionHelp: this.permissionHelp()
      };
    }
  }

  permissionHelp() {
    return [
      "Open macOS System Settings.",
      "Grant Accessibility permission to the terminal or packaged app running Live Meeting Copilot.",
      "Grant Screen Recording permission before OCR or screen capture slices.",
      "Return here and refresh desktop windows."
    ];
  }

  windowsBrowserE2eStatus() {
    return {
      ok: false,
      supported: false,
      platform: "win32",
      statusLabel: "Browser E2E ready",
      windows: [],
      message: "Windows browser testing is supported through Chrome plus the Live Meeting Copilot extension. Native Zoom/Teams desktop window detection is deferred for this slice.",
      permissionHelp: [
        "Use PowerShell to run npm start.",
        "Load the browser-extension folder in Chrome at chrome://extensions.",
        "Open Google Meet in Chrome, start Live Assist in the desktop app, then use the extension overlay to send a test transcript event.",
        "Microphone transcription is optional and requires Windows microphone permission plus OPENAI_API_KEY."
      ]
    };
  }

  unsupportedPlatformStatus() {
    return {
      ok: false,
      supported: false,
      platform: process.platform,
      statusLabel: "Browser E2E only",
      windows: [],
      message: "Native desktop meeting window detection is not implemented for this platform. Use the Chrome extension browser-meeting path for end-to-end testing.",
      permissionHelp: [
        "Start the Electron desktop app.",
        "Load the browser-extension folder in Chrome.",
        "Open a supported browser meeting and start Live Assist before sending transcript events."
      ]
    };
  }
}

module.exports = { DesktopCaptureAgent };
