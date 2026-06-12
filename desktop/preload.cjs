const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopApp", {
  getVersion: () => ipcRenderer.invoke("app:version"),
  extensionBridge: {
    status: () => ipcRenderer.invoke("extension-bridge:status"),
    setActiveSession: (session) => ipcRenderer.invoke("extension-bridge:set-active-session", session),
    clearActiveSession: () => ipcRenderer.invoke("extension-bridge:clear-active-session"),
    onStatus: (callback) => {
      const listener = (_event, status) => callback(status);
      ipcRenderer.on("extension-bridge:status", listener);
      return () => ipcRenderer.removeListener("extension-bridge:status", listener);
    },
    onTranscriptEvent: (callback) => {
      const listener = (_event, transcriptEvent) => callback(transcriptEvent);
      ipcRenderer.on("extension-bridge:transcript-event", listener);
      return () => ipcRenderer.removeListener("extension-bridge:transcript-event", listener);
    }
  },
  desktopCapture: {
    detectWindows: () => ipcRenderer.invoke("desktop-capture:detect-windows")
  },
  answerService: {
    status: () => ipcRenderer.invoke("answer-service:status"),
    generate: (payload) => ipcRenderer.invoke("answer-service:generate", payload)
  },
  audioTranscription: {
    status: () => ipcRenderer.invoke("audio-transcription:status"),
    transcribeChunk: (payload) => ipcRenderer.invoke("audio-transcription:transcribe-chunk", payload)
  },
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
