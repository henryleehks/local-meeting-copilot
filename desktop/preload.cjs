const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  getVersion: () => ipcRenderer.invoke("app:version"),
  googleCalendar: {
    status: () => ipcRenderer.invoke("google-calendar:status"),
    connect: () => ipcRenderer.invoke("google-calendar:connect"),
    disconnect: () => ipcRenderer.invoke("google-calendar:disconnect"),
    fetchUpcomingEvents: () => ipcRenderer.invoke("google-calendar:fetch-upcoming-events")
  },
  microsoftCalendar: {
    status: () => ipcRenderer.invoke("microsoft-calendar:status"),
    connect: () => ipcRenderer.invoke("microsoft-calendar:connect"),
    disconnect: () => ipcRenderer.invoke("microsoft-calendar:disconnect"),
    fetchUpcomingEvents: () => ipcRenderer.invoke("microsoft-calendar:fetch-upcoming-events")
  }
});
