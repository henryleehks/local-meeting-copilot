const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { join } = require("node:path");

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
  ipcMain.handle("app:version", () => app.getVersion());

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
