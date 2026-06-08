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

function textFingerprint(text) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function isVisible(element) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0
    && rect.height > 0
    && style.visibility !== "hidden"
    && style.display !== "none"
    && Number(style.opacity || 1) > 0;
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

function createCaptionTranscriptEvent(detected, caption) {
  return {
    id: `extension-caption-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    meetingId: getMeetingId(),
    timestamp: new Date().toISOString(),
    speakerName: caption.speakerName,
    speakerConfidence: caption.speakerConfidence,
    text: caption.text,
    source: detected.source,
    sourceConfidence: caption.sourceConfidence
  };
}

function parseCaptionText(rawText) {
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const text = lines.join(" ");
  if (!text || text.length < 3) return null;

  const colonMatch = text.match(/^([^:]{1,48}):\s+(.{3,})$/);
  if (colonMatch) {
    return {
      speakerName: colonMatch[1].trim(),
      speakerConfidence: "high",
      text: colonMatch[2].trim(),
      sourceConfidence: "high"
    };
  }

  if (lines.length >= 2 && lines[0].length <= 48 && !/[.!?]$/.test(lines[0])) {
    return {
      speakerName: lines[0],
      speakerConfidence: "high",
      text: lines.slice(1).join(" "),
      sourceConfidence: "high"
    };
  }

  return {
    speakerName: "Google Meet speaker",
    speakerConfidence: "medium",
    text,
    sourceConfidence: "medium"
  };
}

function likelyCaptionElements() {
  const selectors = [
    "[aria-live]",
    "[role='status']",
    "[role='log']",
    "[aria-label*='caption' i]",
    "[aria-label*='subtitle' i]"
  ];
  const candidates = new Set();
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => candidates.add(element));
  });

  document.querySelectorAll("div, span").forEach((element) => {
    if (!isVisible(element)) return;
    const rect = element.getBoundingClientRect();
    const text = element.innerText || element.textContent || "";
    const nearBottom = rect.top > window.innerHeight * 0.45;
    if (nearBottom && text.trim().length >= 12 && text.trim().length <= 280) candidates.add(element);
  });

  return [...candidates].filter(isVisible);
}

function installGoogleMeetCaptionAdapter(detected) {
  if (window.__liveMeetingCopilotMeetAdapter) return;
  window.__liveMeetingCopilotMeetAdapter = true;

  const emitted = new Set();
  let timer = null;

  function scanCaptions() {
    timer = null;
    likelyCaptionElements().forEach((element) => {
      const parsed = parseCaptionText(element.innerText || element.textContent || "");
      if (!parsed) return;
      const fingerprint = textFingerprint(`${parsed.speakerName}:${parsed.text}`);
      if (emitted.has(fingerprint)) return;
      emitted.add(fingerprint);
      if (emitted.size > 120) emitted.delete(emitted.values().next().value);

      chrome.runtime.sendMessage({
        type: "TRANSCRIPT_EVENT",
        event: createCaptionTranscriptEvent(detected, parsed)
      });
    });
  }

  const observer = new MutationObserver(() => {
    if (timer) return;
    timer = setTimeout(scanCaptions, 400);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  scanCaptions();
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
  if (detected.platform === "google-meet") installGoogleMeetCaptionAdapter(detected);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "COPILOT_ACTION_CLICKED") boot();
});

boot();
