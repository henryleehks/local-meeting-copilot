const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { join } = require("node:path");
const { GoogleCalendarClient } = require("./google-calendar.cjs");

function createWindow() {
  const window = new BrowserWindow({
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

  window.webContents.on("console-message", (event) => {
    if (event.level >= 2) console.error(`Renderer: ${event.message}`);
  });

  window.loadFile(join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  const googleCalendar = new GoogleCalendarClient(app, shell);

  ipcMain.handle("app:version", () => app.getVersion());
  ipcMain.handle("google-calendar:status", () => googleCalendar.status());
  ipcMain.handle("google-calendar:connect", () => googleCalendar.connect());
  ipcMain.handle("google-calendar:disconnect", () => googleCalendar.disconnect());
  ipcMain.handle("google-calendar:fetch-upcoming-events", () => googleCalendar.fetchUpcomingEvents());

  app.on("web-contents-created", (_event, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: "deny" };
    });
  });

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
