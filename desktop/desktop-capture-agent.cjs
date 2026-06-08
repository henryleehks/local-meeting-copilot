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
    if (process.platform !== "darwin") {
      return {
        ok: false,
        windows: [],
        message: "Desktop meeting window detection is macOS-first in this slice.",
        permissionHelp: this.permissionHelp()
      };
    }

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
      return { ok: true, windows, message: `${windows.length} candidate desktop meeting window(s) found.`, permissionHelp: this.permissionHelp() };
    } catch (error) {
      return {
        ok: false,
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
}

module.exports = { DesktopCaptureAgent };
