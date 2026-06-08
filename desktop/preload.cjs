const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  getVersion: () => ipcRenderer.invoke("app:version")
});
