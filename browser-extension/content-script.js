const SUPPORTED_PATTERNS = [
  { platform: "google-meet", source: "meet-browser-caption", test: (url) => url.hostname === "meet.google.com" },
  { platform: "zoom", source: "zoom-browser-caption", test: (url) => url.hostname.endsWith(".zoom.us") || url.hostname.endsWith(".zoom.com") },
  { platform: "microsoft-teams", source: "teams-browser-caption", test: (url) => url.hostname === "teams.microsoft.com" }
];

function detectMeetingPage() {
  const url = new URL(window.location.href);
  return SUPPORTED_PATTERNS.find((pattern) => pattern.test(url)) || null;
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

function activeMeetingId() {
  return overlayState.activeSession?.meetingId || "";
}

function createTestTranscriptEvent(detected) {
  return {
    id: `extension-test-${Date.now()}`,
    meetingId: activeMeetingId(),
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
    meetingId: activeMeetingId(),
    timestamp: new Date().toISOString(),
    speakerName: caption.speakerName,
    speakerConfidence: caption.speakerConfidence,
    text: caption.text,
    source: detected.source,
    sourceConfidence: caption.sourceConfidence
  };
}

const overlayState = {
  connected: false,
  activeSession: null,
  latestQuestion: "No question detected yet.",
  suggestedAnswer: "Start Live Assist in the desktop app to capture captions."
};

function parseCaptionText(rawText) {
  const lines = rawText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^(captions?|subtitles?|closed captions?|live transcript)$/i.test(line));
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
    speakerName: "Browser meeting speaker",
    speakerConfidence: "medium",
    text,
    sourceConfidence: "medium"
  };
}

function likelyCaptionElements(detected) {
  const selectors = [
    "[aria-live]",
    "[role='status']",
    "[role='log']",
    "[aria-label*='caption' i]",
    "[aria-label*='subtitle' i]",
    "[class*='caption' i]",
    "[class*='subtitle' i]",
    "[data-testid*='caption' i]"
  ];
  if (detected.platform === "zoom") {
    selectors.push("[class*='live-transcription' i]", "[class*='closed-caption' i]", "[aria-label*='transcription' i]");
  }
  if (detected.platform === "microsoft-teams") {
    selectors.push("[data-tid*='caption' i]", "[class*='ts-calling-caption' i]", "[aria-label*='live caption' i]");
  }

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

function fallbackSpeakerName(detected) {
  if (detected.platform === "google-meet") return "Google Meet speaker";
  if (detected.platform === "zoom") return "Zoom speaker";
  if (detected.platform === "microsoft-teams") return "Teams speaker";
  return "Browser meeting speaker";
}

function installBrowserCaptionAdapter(detected) {
  if (window.__liveMeetingCopilotCaptionAdapter) return;
  window.__liveMeetingCopilotCaptionAdapter = true;

  const emitted = new Set();
  let timer = null;

  function scanCaptions() {
    timer = null;
    if (!activeMeetingId()) return;
    likelyCaptionElements(detected).forEach((element) => {
      const parsed = parseCaptionText(element.innerText || element.textContent || "");
      if (!parsed) return;
      if (parsed.speakerName === "Browser meeting speaker") parsed.speakerName = fallbackSpeakerName(detected);
      const fingerprint = textFingerprint(`${parsed.speakerName}:${parsed.text}`);
      if (emitted.has(fingerprint)) return;
      emitted.add(fingerprint);
      if (emitted.size > 120) emitted.delete(emitted.values().next().value);

      chrome.runtime.sendMessage({
        type: "TRANSCRIPT_EVENT",
        event: createCaptionTranscriptEvent(detected, parsed)
      });
      if (parsed.text.includes("?")) {
        overlayState.latestQuestion = parsed.text;
        renderOverlay(detected);
      }
    });
  }

  const observer = new MutationObserver(() => {
    if (timer) return;
    timer = setTimeout(scanCaptions, 400);
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  setInterval(scanCaptions, 1500);
  scanCaptions();
}

function overlayStyles() {
  return [
    "position:fixed",
    "right:16px",
    "bottom:16px",
    "z-index:2147483647",
    "width:280px",
    "border:1px solid rgba(255,255,255,.18)",
    "border-radius:8px",
    "padding:12px",
    "font:13px system-ui,sans-serif",
    "color:#fff",
    "background:#101828",
    "box-shadow:0 10px 30px rgba(0,0,0,.2)",
    "line-height:1.4"
  ].join(";");
}

function sendTestEvent(detected, button) {
  if (!activeMeetingId()) {
    overlayState.suggestedAnswer = "No active desktop session. Start Live Assist first.";
    renderOverlay(detected);
    if (button) button.disabled = false;
    return;
  }
  chrome.runtime.sendMessage({
    type: "TRANSCRIPT_EVENT",
    event: createTestTranscriptEvent(detected)
  }, (response) => {
    overlayState.connected = Boolean(response?.ok);
    overlayState.suggestedAnswer = response?.ok ? "Bridge test event sent. Use the desktop app for full context." : "Desktop bridge unavailable.";
    renderOverlay(detected);
    if (button) button.disabled = false;
  });
}

function renderOverlay(detected) {
  let overlay = document.querySelector("#live-meeting-copilot-overlay");
  if (!overlay) {
    overlay = document.createElement("section");
    overlay.id = "live-meeting-copilot-overlay";
    overlay.style.cssText = overlayStyles();
    document.documentElement.append(overlay);
  }

  overlay.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;">
      <strong>Live Copilot</strong>
      <span>${overlayState.activeSession ? "Live" : (overlayState.connected ? "Idle" : "Checking")}</span>
    </div>
    <div style="margin-bottom:8px;color:#cbd5e1;">
      <strong style="display:block;color:#fff;">Desktop session</strong>
      <span id="live-meeting-copilot-session"></span>
    </div>
    <div style="margin-bottom:8px;color:#cbd5e1;">
      <strong style="display:block;color:#fff;">Latest question</strong>
      <span id="live-meeting-copilot-question"></span>
    </div>
    <button id="live-meeting-copilot-answer" style="width:100%;border:0;border-radius:8px;padding:8px 10px;color:#fff;background:#0f766e;font-weight:700;cursor:pointer;">What should I answer?</button>
    <div style="margin-top:8px;color:#d1fae5;">
      <strong style="display:block;color:#fff;">Short answer</strong>
      <span id="live-meeting-copilot-answer-text"></span>
    </div>
  `;
  overlay.querySelector("#live-meeting-copilot-session").textContent = overlayState.activeSession
    ? overlayState.activeSession.meetingTitle
    : "Start Live Assist to bind this tab.";
  overlay.querySelector("#live-meeting-copilot-question").textContent = overlayState.latestQuestion;
  overlay.querySelector("#live-meeting-copilot-answer-text").textContent = overlayState.suggestedAnswer;
  overlay.querySelector("#live-meeting-copilot-answer").addEventListener("click", (event) => {
    event.currentTarget.disabled = true;
    overlayState.suggestedAnswer = overlayState.latestQuestion.includes("?")
      ? "Answer from your transcript and notes; keep it concise and avoid inventing facts."
      : "No clear question yet. Ask for clarification before committing.";
    sendTestEvent(detected, event.currentTarget);
  });
}

function ensureOverlay(detected) {
  chrome.runtime.sendMessage({ type: "BRIDGE_STATUS" }, (response) => {
    overlayState.connected = Boolean(response?.ok);
    overlayState.activeSession = response?.status?.activeSession || null;
    renderOverlay(detected);
  });
}

function boot() {
  const detected = detectMeetingPage();
  if (!detected) return;

  chrome.runtime.sendMessage({ type: "BRIDGE_STATUS" }, (response) => {
    overlayState.connected = Boolean(response?.ok);
    overlayState.activeSession = response?.status?.activeSession || null;
    renderOverlay(detected);
    installBrowserCaptionAdapter(detected);
  });

  if (!window.__liveMeetingCopilotStatusPoll) {
    window.__liveMeetingCopilotStatusPoll = setInterval(() => ensureOverlay(detected), 2000);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === "COPILOT_ACTION_CLICKED") boot();
});

boot();
