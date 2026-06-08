const SUPPORTED_PATTERNS = [
  { platform: "google-meet", source: "meet-browser-caption", test: (url) => url.hostname === "meet.google.com" },
  { platform: "zoom", source: "zoom-browser-caption", test: (url) => url.hostname.endsWith(".zoom.us") || url.hostname.endsWith(".zoom.com") },
  { platform: "microsoft-teams", source: "teams-browser-caption", test: (url) => url.hostname === "teams.microsoft.com" }
];

function detectMeetingPage() {
  const url = new URL(window.location.href);
  return SUPPORTED_PATTERNS.find((pattern) => pattern.test(url)) || null;
}

function getMeetingId() {
  return localStorage.getItem("liveMeetingCopilotMeetingId") || "meeting-founder-northstar";
}

function createTestTranscriptEvent(detected) {
  return {
    id: `extension-test-${Date.now()}`,
    meetingId: getMeetingId(),
    timestamp: new Date().toISOString(),
    speakerName: "Browser extension",
    speakerConfidence: "medium",
    text: `Test transcript event from ${detected.platform} page bridge.`,
    source: detected.source,
    sourceConfidence: "medium"
  };
}

function ensureBridgeButton(detected) {
  if (document.querySelector("#live-meeting-copilot-test")) return;

  const button = document.createElement("button");
  button.id = "live-meeting-copilot-test";
  button.type = "button";
  button.textContent = "Send Copilot test event";
  button.style.cssText = [
    "position:fixed",
    "right:16px",
    "bottom:16px",
    "z-index:2147483647",
    "border:0",
    "border-radius:8px",
    "padding:10px 12px",
    "font:600 13px system-ui,sans-serif",
    "color:#fff",
    "background:#0f766e",
    "box-shadow:0 10px 30px rgba(0,0,0,.2)",
    "cursor:pointer"
  ].join(";");

  button.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      type: "TRANSCRIPT_EVENT",
      event: createTestTranscriptEvent(detected)
    }, (response) => {
      button.textContent = response?.ok ? "Sent to Copilot" : "Bridge unavailable";
      setTimeout(() => {
        button.textContent = "Send Copilot test event";
      }, 1800);
    });
  });

  document.documentElement.append(button);
}

function boot() {
  const detected = detectMeetingPage();
  if (!detected) return;

  chrome.runtime.sendMessage({ type: "BRIDGE_STATUS" }, () => {});
  ensureBridgeButton(detected);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "COPILOT_ACTION_CLICKED") boot();
});

boot();
