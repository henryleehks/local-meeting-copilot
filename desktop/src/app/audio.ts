export function preferredAudioMimeType() {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus"
  ];
  return candidates.find((candidate) => window.MediaRecorder?.isTypeSupported(candidate)) || "";
}

export function getProviderApi(id: string) {
  return id === "google" ? window.desktopApp?.googleCalendar : window.desktopApp?.microsoftCalendar;
}
