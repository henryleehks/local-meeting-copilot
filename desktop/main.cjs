const { app, BrowserWindow, ipcMain, session, shell } = require("electron");
const { join } = require("node:path");
const { loadEnvFile } = require("../src/env-loader.cjs");
const { GoogleCalendarClient } = require("./google-calendar.cjs");
const { MicrosoftCalendarClient } = require("./microsoft-calendar.cjs");
const { ExtensionBridge } = require("./extension-bridge.cjs");
const { DesktopCaptureAgent } = require("./desktop-capture-agent.cjs");
const { AnswerService } = require("./answer-service.cjs");
const { AudioTranscriptionService } = require("./audio-transcription-service.cjs");

let mainWindow;

loadEnvFile();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 720,
    title: "Live Meeting Copilot",
    backgroundColor: "#f6f7f9",
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.webContents.on("console-message", (event) => {
    if (event.level >= 2) console.error(`Renderer: ${event.message}`);
  });

  mainWindow.loadFile(join(__dirname, "dist", "index.html"));
}

app.whenReady().then(() => {
  const googleCalendar = new GoogleCalendarClient(app, shell);
  const microsoftCalendar = new MicrosoftCalendarClient(app, shell);
  const desktopCaptureAgent = new DesktopCaptureAgent();
  const answerService = new AnswerService();
  const audioTranscriptionService = new AudioTranscriptionService();
  const extensionBridge = new ExtensionBridge({
    onTranscriptEvent: (event) => mainWindow?.webContents.send("extension-bridge:transcript-event", event),
    onConnection: (status) => mainWindow?.webContents.send("extension-bridge:status", status)
  });

  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const isMainWindow = webContents === mainWindow?.webContents;
    callback(isMainWindow && permission === "media");
  });

  ipcMain.handle("app:version", () => app.getVersion());
  ipcMain.handle("extension-bridge:status", () => extensionBridge.statusPayload());
  ipcMain.handle("extension-bridge:set-active-session", (_event, session) => extensionBridge.setActiveSession(session));
  ipcMain.handle("extension-bridge:clear-active-session", () => extensionBridge.clearActiveSession());
  ipcMain.handle("desktop-capture:detect-windows", () => desktopCaptureAgent.detectCandidateWindows());
  ipcMain.handle("answer-service:status", () => answerService.status());
  ipcMain.handle("answer-service:generate", (_event, payload) => answerService.generateAnswer(payload));
  ipcMain.handle("audio-transcription:status", () => audioTranscriptionService.status());
  ipcMain.handle("audio-transcription:transcribe-chunk", (_event, payload) => audioTranscriptionService.transcribeChunk(payload));
  ipcMain.handle("google-calendar:status", () => googleCalendar.status());
  ipcMain.handle("google-calendar:connect", () => googleCalendar.connect());
  ipcMain.handle("google-calendar:disconnect", () => googleCalendar.disconnect());
  ipcMain.handle("google-calendar:fetch-upcoming-events", () => googleCalendar.fetchUpcomingEvents());
  ipcMain.handle("microsoft-calendar:status", () => microsoftCalendar.status());
  ipcMain.handle("microsoft-calendar:connect", () => microsoftCalendar.connect());
  ipcMain.handle("microsoft-calendar:disconnect", () => microsoftCalendar.disconnect());
  ipcMain.handle("microsoft-calendar:fetch-upcoming-events", () => microsoftCalendar.fetchUpcomingEvents());

  app.on("web-contents-created", (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });
  });

  createWindow();
  extensionBridge.start()
    .then(() => mainWindow?.webContents.send("extension-bridge:status", extensionBridge.statusPayload()))
    .catch((error) => console.error(`Extension bridge failed: ${error.message}`));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
