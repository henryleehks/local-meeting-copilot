const BRIDGE_BASE_URL = "http://127.0.0.1:47843";

async function postJson(path, payload) {
  const response = await fetch(`${BRIDGE_BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Desktop bridge request failed.");
  return data;
}

async function getStatus() {
  const response = await fetch(`${BRIDGE_BASE_URL}/status`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Desktop bridge unavailable.");
  return data;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "BRIDGE_STATUS") {
    getStatus()
      .then((status) => sendResponse({ ok: true, status }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  if (message?.type === "TRANSCRIPT_EVENT") {
    postJson("/transcript-event", message.event)
      .then((result) => sendResponse({ ok: true, result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));
    return true;
  }

  return false;
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;
  chrome.tabs.sendMessage(tab.id, { type: "COPILOT_ACTION_CLICKED" });
});
