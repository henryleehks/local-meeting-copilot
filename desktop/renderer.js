import {
  MeetingTypes,
  SpeakerConfidence,
  SourceConfidence,
  TranscriptSources,
  createTranscriptEvent,
  validateTranscriptEvent
} from "../src/contracts.js";
import { captureEventBus } from "./capture-event-bus.js";
import { createSimulatedCaptureEvent, simulatorSources } from "./capture-simulator.js";
import { localMeetingStore } from "./storage.js";
import {
  normalizeGoogleCalendarEvent,
  normalizeMicrosoftCalendarEvent
} from "../src/calendar-normalizer.js";
import { generateDraftMinutes } from "../src/minutes-generator.js";

const sectionTitles = {
  calendar: "Calendar/Home",
  live: "Live Mode",
  minutes: "Minutes Mode",
  privacy: "Settings/Privacy"
};

const state = {
  activeSection: "calendar",
  meetingType: MeetingTypes.founderCustomer,
  meeting: null,
  settings: null,
  liveSessionActive: false
};

const els = {
  sectionTitle: document.querySelector("#sectionTitle"),
  navItems: document.querySelectorAll(".nav-item"),
  sections: document.querySelectorAll(".section"),
  typeToggles: document.querySelectorAll(".type-toggle"),
  meetingTitle: document.querySelector("#meetingTitle"),
  platformBadge: document.querySelector("#platformBadge"),
  meetingSummary: document.querySelector("#meetingSummary"),
  meetingMeta: document.querySelector("#meetingMeta"),
  startAssistBtn: document.querySelector("#startAssistBtn"),
  stopCaptureBtn: document.querySelector("#stopCaptureBtn"),
  googleStatus: document.querySelector("#googleStatus"),
  googleHelpText: document.querySelector("#googleHelpText"),
  googleConnectBtn: document.querySelector("#googleConnectBtn"),
  googleSyncBtn: document.querySelector("#googleSyncBtn"),
  googleDisconnectBtn: document.querySelector("#googleDisconnectBtn"),
  googleEventsList: document.querySelector("#googleEventsList"),
  microsoftStatus: document.querySelector("#microsoftStatus"),
  microsoftHelpText: document.querySelector("#microsoftHelpText"),
  microsoftConnectBtn: document.querySelector("#microsoftConnectBtn"),
  microsoftSyncBtn: document.querySelector("#microsoftSyncBtn"),
  microsoftDisconnectBtn: document.querySelector("#microsoftDisconnectBtn"),
  microsoftEventsList: document.querySelector("#microsoftEventsList"),
  captureStatus: document.querySelector("#captureStatus"),
  liveMeetingTitle: document.querySelector("#liveMeetingTitle"),
  livePlatformLabel: document.querySelector("#livePlatformLabel"),
  liveCaptureLabel: document.querySelector("#liveCaptureLabel"),
  transcriptTimeline: document.querySelector("#transcriptTimeline"),
  latestQuestion: document.querySelector("#latestQuestion"),
  questionInput: document.querySelector("#questionInput"),
  privateNotesInput: document.querySelector("#privateNotesInput"),
  answerAssistBtn: document.querySelector("#answerAssistBtn"),
  suggestedAnswer: document.querySelector("#suggestedAnswer"),
  assistPromptTitle: document.querySelector("#assistPromptTitle"),
  eventBusStatus: document.querySelector("#eventBusStatus"),
  extensionBridgeStatus: document.querySelector("#extensionBridgeStatus"),
  simulatorControls: document.querySelector("#simulatorControls"),
  simulatorStatus: document.querySelector("#simulatorStatus"),
  minutesMeetingTitle: document.querySelector("#minutesMeetingTitle"),
  minutesMeetingType: document.querySelector("#minutesMeetingType"),
  minutesPlatformLabel: document.querySelector("#minutesPlatformLabel"),
  minutesSourceLabel: document.querySelector("#minutesSourceLabel"),
  minutesContent: document.querySelector("#minutesContent"),
  runtimeVersion: document.querySelector("#runtimeVersion"),
  dbStatus: document.querySelector("#dbStatus"),
  audioPolicyLabel: document.querySelector("#audioPolicyLabel")
  ,
  systemAudioFallbackToggle: document.querySelector("#systemAudioFallbackToggle"),
  keepAudioToggle: document.querySelector("#keepAudioToggle"),
  processAudioFallbackBtn: document.querySelector("#processAudioFallbackBtn"),
  audioFallbackStatus: document.querySelector("#audioFallbackStatus"),
  desktopCaptureStatus: document.querySelector("#desktopCaptureStatus"),
  desktopCaptureHelp: document.querySelector("#desktopCaptureHelp"),
  refreshDesktopWindowsBtn: document.querySelector("#refreshDesktopWindowsBtn"),
  confirmDesktopCaptureBtn: document.querySelector("#confirmDesktopCaptureBtn"),
  emitAccessibilityCaptionBtn: document.querySelector("#emitAccessibilityCaptionBtn"),
  emitOcrCaptionBtn: document.querySelector("#emitOcrCaptionBtn"),
  desktopWindowList: document.querySelector("#desktopWindowList")
};

function confidenceLabel(confidence) {
  return confidence === SpeakerConfidence.medium ? "Medium confidence" : `${confidence[0].toUpperCase()}${confidence.slice(1)} confidence`;
}

function meetingTypeLabel(meetingType) {
  return meetingType === MeetingTypes.founderCustomer ? "Founder/customer" : "Candidate prep/mock";
}

function renderMeta(meeting) {
  const rows = [
    ["Meeting type", meetingTypeLabel(meeting.meetingType)],
    ["Participants", meeting.participants.map((participant) => participant.displayName).join(", ")],
    ["Join URL", meeting.joinUrl || "No supported meeting URL detected"],
    ["Capture policy", "Start Live Assist required"],
    ["Audio retention", meeting.audioRetentionPolicy === "delete-after-processing" ? "Delete after processing" : "Keep for this meeting"]
  ];

  els.meetingMeta.textContent = "";
  rows.forEach(([term, description]) => {
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = description;
    els.meetingMeta.append(dt, dd);
  });
}

function renderTranscript(meeting) {
  els.transcriptTimeline.textContent = "";
  meeting.transcriptEvents.forEach((event) => {
    const validation = validateTranscriptEvent(event);
    const item = document.createElement("article");
    item.className = `timeline-item ${event.speakerConfidence}`;
    const isUncertain = [SpeakerConfidence.medium, SpeakerConfidence.low].includes(event.speakerConfidence);

    const time = new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    item.innerHTML = `
      <div class="event-meta">
        <strong>${event.speakerName}${isUncertain ? " ?" : ""}</strong>
        <span>${time}</span>
      </div>
      <p></p>
      <div class="event-badges">
        <span class="${isUncertain ? "uncertain" : ""}">${confidenceLabel(event.speakerConfidence)}</span>
        <span>${event.source}</span>
        <span>${event.sourceConfidence} source</span>
        ${validation.ok ? "" : `<span>${validation.error}</span>`}
      </div>
    `;
    item.querySelector("p").textContent = event.text;
    els.transcriptTimeline.append(item);
  });
}

function renderMinutes(meeting) {
  const { minutes } = meeting;
  if (!minutes) {
    els.minutesContent.textContent = "No minutes draft exists for this meeting yet.";
    return;
  }

  const sections = [
    ["Executive summary", [minutes.summary]],
    ["Decisions", minutes.decisions.map((decision) => formatStructuredItem(decision))],
    ["Action items", minutes.actionItems.map((actionItem) => formatStructuredItem(actionItem))],
    ["Open questions", minutes.openQuestions],
    ["Risks or blockers", minutes.risks],
    ["Follow-up draft", [minutes.followUpDraft]],
    ["Unresolved speaker labels", minutes.unresolvedSpeakerLabels]
  ];

  els.minutesContent.textContent = "";
  sections.forEach(([title, items]) => {
    const block = document.createElement("section");
    block.className = "minutes-block";
    const heading = document.createElement("h4");
    heading.textContent = title;
    block.append(heading);

    if (items.length === 1 && title !== "Decisions" && title !== "Action items" && title !== "Open questions" && title !== "Risks or blockers") {
      const paragraph = document.createElement("p");
      paragraph.textContent = items[0];
      block.append(paragraph);
    } else {
      const list = document.createElement("ul");
      items.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.append(li);
      });
      block.append(list);
    }

    els.minutesContent.append(block);
  });
}

function formatStructuredItem(item) {
  const owner = item.owner ? `${item.owner}: ` : "";
  const dueDate = item.dueDate ? ` (${item.dueDate})` : "";
  return `${owner}${item.text}${dueDate}`;
}

function renderSettings() {
  if (!state.settings) return;
  els.audioPolicyLabel.textContent = state.settings.audioRetentionPolicy === "delete-after-processing"
    ? "Delete after processing"
    : "Keep meeting audio";
}

async function loadMeeting(meetingType = state.meetingType) {
  els.dbStatus.textContent = "Loading local database...";
  const meeting = await localMeetingStore.getMeetingBundleByType(meetingType);
  if (!meeting) throw new Error(`No local meeting found for type: ${meetingType}`);
  state.meeting = meeting;
  state.liveSessionActive = false;
  await window.desktopApp?.extensionBridge?.clearActiveSession();
  els.dbStatus.textContent = "IndexedDB ready; demo records loaded locally";
  renderMeeting();
}

async function loadMeetingById(meetingId) {
  els.dbStatus.textContent = "Loading selected meeting...";
  const meeting = await localMeetingStore.getMeetingBundle(meetingId);
  if (!meeting) throw new Error(`No local meeting found for id: ${meetingId}`);
  state.meeting = meeting;
  state.meetingType = meeting.meetingType;
  state.liveSessionActive = false;
  els.typeToggles.forEach((toggle) => toggle.classList.toggle("active", toggle.dataset.meetingType === state.meetingType));
  await window.desktopApp?.extensionBridge?.clearActiveSession();
  els.dbStatus.textContent = "Selected meeting loaded locally";
  renderMeeting();
}

async function handleCaptureTranscriptEvent(event) {
  if (!state.liveSessionActive || !state.meeting || event.meetingId !== state.meeting.id) return;

  await localMeetingStore.putTranscriptEvent(event);
  state.meeting = await localMeetingStore.getMeetingBundle(state.meeting.id);
  renderMeeting();
  els.eventBusStatus.textContent = "Event persisted";
  els.simulatorStatus.textContent = `Persisted ${event.source} event with ${event.speakerConfidence} speaker confidence and ${event.sourceConfidence} source confidence.`;
}

function renderMeeting() {
  const { meeting } = state;
  if (!meeting) return;
  els.meetingTitle.textContent = meeting.title;
  els.platformBadge.textContent = meeting.platformLabel;
  els.meetingSummary.textContent = meeting.summary;
  els.liveMeetingTitle.textContent = meeting.title;
  els.livePlatformLabel.textContent = meeting.platformLabel;
  els.liveCaptureLabel.textContent = els.captureStatus.textContent;
  els.minutesMeetingTitle.textContent = `${meeting.title} minutes`;
  els.minutesMeetingType.textContent = meetingTypeLabel(meeting.meetingType);
  els.minutesPlatformLabel.textContent = meeting.platformLabel;
  els.minutesSourceLabel.textContent = meeting.transcriptEvents.length
    ? `${meeting.transcriptEvents.length} local transcript event${meeting.transcriptEvents.length === 1 ? "" : "s"}`
    : "No transcript events yet";
  els.latestQuestion.textContent = meeting.answerSuggestion?.triggerText || "No detected question yet.";
  els.questionInput.value = meeting.answerSuggestion?.triggerText || "";
  els.suggestedAnswer.textContent = meeting.answerSuggestion?.suggestedAnswer || "No answer suggestion stored yet.";
  els.assistPromptTitle.textContent = state.meetingType === MeetingTypes.founderCustomer
    ? "Grounded founder answer"
    : "Truthful prep answer";
  renderMeta(meeting);
  renderTranscript(meeting);
  renderMinutes(meeting);
}

function setGoogleStatus(text, detail = "") {
  els.googleStatus.textContent = text;
  if (detail) els.googleHelpText.textContent = detail;
}

function setMicrosoftStatus(text, detail = "") {
  els.microsoftStatus.textContent = text;
  if (detail) els.microsoftHelpText.textContent = detail;
}

const calendarProviders = {
  google: {
    api: () => window.desktopApp?.googleCalendar,
    name: "Google Calendar",
    setStatus: setGoogleStatus,
    connectBtn: els.googleConnectBtn,
    syncBtn: els.googleSyncBtn,
    disconnectBtn: els.googleDisconnectBtn,
    list: els.googleEventsList,
    normalize: normalizeGoogleCalendarEvent,
    notConfigured: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then restart the desktop app.",
    ready: "Connect Google Calendar to read current and upcoming external calls.",
    connected: "Sync reads current and upcoming Google Calendar events, then stores normalized meetings locally."
  },
  microsoft: {
    api: () => window.desktopApp?.microsoftCalendar,
    name: "Microsoft Calendar",
    setStatus: setMicrosoftStatus,
    connectBtn: els.microsoftConnectBtn,
    syncBtn: els.microsoftSyncBtn,
    disconnectBtn: els.microsoftDisconnectBtn,
    list: els.microsoftEventsList,
    normalize: normalizeMicrosoftCalendarEvent,
    notConfigured: "Set MICROSOFT_CLIENT_ID, then restart the desktop app.",
    ready: "Connect Microsoft Calendar to read Outlook and Teams meetings.",
    connected: "Sync reads current and upcoming Microsoft Calendar events, then stores normalized meetings locally."
  }
};

function setSection(section) {
  state.activeSection = section;
  els.sectionTitle.textContent = sectionTitles[section];
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.section === section));
  els.sections.forEach((item) => item.classList.toggle("active", item.id === section));
}

els.navItems.forEach((item) => {
  item.addEventListener("click", () => setSection(item.dataset.section));
});

els.typeToggles.forEach((item) => {
  item.addEventListener("click", () => {
    state.meetingType = item.dataset.meetingType;
    els.typeToggles.forEach((toggle) => toggle.classList.toggle("active", toggle === item));
    loadMeeting(state.meetingType).catch(showFatalError);
  });
});

els.startAssistBtn.addEventListener("click", () => {
  if (!state.meeting) return;
  els.captureStatus.textContent = "Live";
  els.liveCaptureLabel.textContent = "Live";
  state.liveSessionActive = true;
  window.desktopApp?.extensionBridge?.setActiveSession({
    meetingId: state.meeting.id,
    meetingTitle: state.meeting.title,
    platform: state.meeting.platform
  }).then((result) => {
    els.extensionBridgeStatus.textContent = `Extension bridge bound to ${result.activeSession.meetingTitle}.`;
  }).catch((error) => {
    els.extensionBridgeStatus.textContent = error.message || "Could not bind extension bridge to this meeting.";
  });
  setSection("live");
});

els.stopCaptureBtn.addEventListener("click", async () => {
  if (!state.meeting) return;
  els.captureStatus.textContent = "Stopped";
  els.liveCaptureLabel.textContent = "Stopped";
  state.liveSessionActive = false;
  await window.desktopApp?.extensionBridge?.clearActiveSession();
  const minutes = generateDraftMinutes(state.meeting);
  await localMeetingStore.putMeetingMinutes(minutes);
  state.meeting = await localMeetingStore.getMeetingBundle(state.meeting.id);
  renderMeeting();
  setSection("minutes");
});

async function refreshCalendarStatus(provider) {
  const api = provider.api();
  if (!api) {
    provider.setStatus("Unavailable", `${provider.name} IPC is unavailable in this runtime.`);
    return;
  }

  const status = await api.status();
  provider.connectBtn.disabled = !status.configured || status.connected;
  provider.syncBtn.disabled = !status.connected;
  provider.disconnectBtn.disabled = !status.connected;

  if (!status.configured) {
    const missing = status.missingConfiguration?.length
      ? ` Missing: ${status.missingConfiguration.join(", ")}.`
      : "";
    provider.setStatus("Not configured", `${provider.notConfigured}${missing}`);
  } else if (status.connected) {
    provider.setStatus("Connected", provider.connected);
  } else {
    provider.setStatus("Ready", provider.ready);
  }
}

function renderCalendarEvents(provider, meetings) {
  provider.list.textContent = "";
  if (!meetings.length) {
    provider.list.textContent = `No current or upcoming supported ${provider.name} meetings found.`;
    return;
  }

  meetings.forEach((meeting) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "event-row";
    row.innerHTML = `
      <strong></strong>
      <span>${meeting.platformLabel} · ${meeting.participants.length} participant${meeting.participants.length === 1 ? "" : "s"}</span>
    `;
    row.querySelector("strong").textContent = meeting.title;
    row.addEventListener("click", () => loadMeetingById(meeting.id).catch(showFatalError));
    provider.list.append(row);
  });
}

async function syncCalendar(provider) {
  provider.setStatus("Syncing", `Reading ${provider.name} events...`);
  const events = await provider.api().fetchUpcomingEvents();
  const meetings = events
    .map(provider.normalize)
    .filter((meeting) => meeting.joinUrl);

  const saved = [];
  for (const meeting of meetings) {
    saved.push(await localMeetingStore.putMeetingBundle(meeting));
  }

  renderCalendarEvents(provider, saved);
  provider.setStatus("Synced", `Imported ${saved.length} ${provider.name} meeting${saved.length === 1 ? "" : "s"} locally.`);
  if (saved[0]) await loadMeetingById(saved[0].id);
}

Object.values(calendarProviders).forEach((provider) => {
  provider.connectBtn.addEventListener("click", async () => {
    try {
      provider.setStatus("Connecting", `Opening ${provider.name} OAuth in your browser...`);
      await provider.api().connect();
      await refreshCalendarStatus(provider);
      await syncCalendar(provider);
    } catch (error) {
      provider.setStatus("Connect failed", error.message || `Could not connect ${provider.name}.`);
    }
  });

  provider.syncBtn.addEventListener("click", () => {
    syncCalendar(provider).catch((error) => provider.setStatus("Sync failed", error.message || `Could not sync ${provider.name}.`));
  });

  provider.disconnectBtn.addEventListener("click", async () => {
    try {
      await provider.api().disconnect();
      renderCalendarEvents(provider, []);
      await refreshCalendarStatus(provider);
    } catch (error) {
      provider.setStatus("Disconnect failed", error.message || `Could not disconnect ${provider.name}.`);
    }
  });
});

let selectedDesktopWindow = null;

function renderDesktopWindows(result) {
  els.desktopCaptureStatus.textContent = result.ok ? "Ready" : "Needs permission";
  els.desktopCaptureHelp.textContent = result.message;
  els.desktopWindowList.textContent = "";
  els.confirmDesktopCaptureBtn.disabled = true;
  els.emitAccessibilityCaptionBtn.disabled = true;
  els.emitOcrCaptionBtn.disabled = true;

  if (!result.windows.length) {
    const help = document.createElement("div");
    help.className = "permission-help";
    help.textContent = result.permissionHelp?.join(" ");
    els.desktopWindowList.append(help);
    return;
  }

  result.windows.forEach((windowInfo) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "event-row";
    row.innerHTML = `<strong></strong><span>${windowInfo.appName} · ${windowInfo.platformHint}</span>`;
    row.querySelector("strong").textContent = windowInfo.title;
    row.addEventListener("click", () => {
      selectedDesktopWindow = windowInfo;
      els.desktopCaptureStatus.textContent = "Window selected";
      els.confirmDesktopCaptureBtn.disabled = false;
      [...els.desktopWindowList.querySelectorAll(".event-row")].forEach((item) => item.classList.toggle("selected", item === row));
    });
    els.desktopWindowList.append(row);
  });
}

els.refreshDesktopWindowsBtn.addEventListener("click", async () => {
  els.desktopCaptureStatus.textContent = "Checking";
  renderDesktopWindows(await window.desktopApp.desktopCapture.detectWindows());
});

els.confirmDesktopCaptureBtn.addEventListener("click", () => {
  if (!selectedDesktopWindow) return;
  els.desktopCaptureStatus.textContent = "Confirmed";
  els.desktopCaptureHelp.textContent = `Selected ${selectedDesktopWindow.appName}: ${selectedDesktopWindow.title}. Capture still starts only after explicit user confirmation.`;
  els.emitAccessibilityCaptionBtn.disabled = false;
  els.emitOcrCaptionBtn.disabled = false;
});

function emitDesktopCaption(source) {
  if (!state.meeting || !selectedDesktopWindow) return;
  const accessibility = source === TranscriptSources.desktopAccessibility;
  captureEventBus.emitTranscriptEvent(createTranscriptEvent({
    id: `desktop-${source}-${Date.now()}`,
    meetingId: state.meeting.id,
    timestamp: new Date().toISOString(),
    speakerName: accessibility ? "Desktop active speaker" : "Desktop speaker?",
    speakerConfidence: accessibility ? SpeakerConfidence.high : SpeakerConfidence.medium,
    text: accessibility
      ? `Accessibility caption from ${selectedDesktopWindow.title}.`
      : `OCR fallback caption read from ${selectedDesktopWindow.title}.`,
    source,
    sourceConfidence: accessibility ? SourceConfidence.high : SourceConfidence.medium
  }));
}

els.emitAccessibilityCaptionBtn.addEventListener("click", () => emitDesktopCaption(TranscriptSources.desktopAccessibility));
els.emitOcrCaptionBtn.addEventListener("click", () => emitDesktopCaption(TranscriptSources.desktopOcr));

els.systemAudioFallbackToggle.addEventListener("change", () => {
  els.audioFallbackStatus.textContent = els.systemAudioFallbackToggle.checked
    ? "Fallback system audio enabled for this session. It will be processed only after explicit action."
    : "Fallback audio is off.";
});

els.keepAudioToggle.addEventListener("change", () => {
  els.audioPolicyLabel.textContent = els.keepAudioToggle.checked ? "Keep for this meeting" : "Delete after processing";
});

els.processAudioFallbackBtn.addEventListener("click", () => {
  if (!state.meeting || !els.systemAudioFallbackToggle.checked) {
    els.audioFallbackStatus.textContent = "Enable fallback system audio before processing.";
    return;
  }

  const mappedParticipant = state.meeting.participants.find((participant) => participant.role !== "user" && participant.role !== "candidate");
  captureEventBus.emitTranscriptEvent(createTranscriptEvent({
    id: `audio-diarization-${Date.now()}`,
    meetingId: state.meeting.id,
    timestamp: new Date().toISOString(),
    speakerName: mappedParticipant ? `${mappedParticipant.displayName}?` : "Speaker 2",
    speakerId: mappedParticipant?.id,
    speakerConfidence: mappedParticipant ? SpeakerConfidence.medium : SpeakerConfidence.low,
    text: "Diarized fallback transcript generated from system audio after caption and OCR paths were unavailable.",
    source: TranscriptSources.audioDiarization,
    sourceConfidence: SourceConfidence.low
  }));
  els.audioFallbackStatus.textContent = els.keepAudioToggle.checked
    ? "Fallback transcript merged. Audio marked to keep for this meeting."
    : "Fallback transcript merged. Captured audio deleted after processing by default.";
});

els.answerAssistBtn.addEventListener("click", async () => {
  if (!state.meeting) return;
  els.answerAssistBtn.disabled = true;
  els.suggestedAnswer.textContent = "Grounding answer in recent transcript, meeting metadata, participants, and private notes...";
  try {
    const answerSuggestion = await window.desktopApp.answerService.generate({
      meeting: state.meeting,
      question: els.questionInput.value,
      notes: els.privateNotesInput.value
    });
    await localMeetingStore.putAnswerSuggestion(answerSuggestion);
    state.meeting = await localMeetingStore.getMeetingBundle(state.meeting.id);
    renderMeeting();
  } catch (error) {
    els.suggestedAnswer.textContent = error.message || "Could not generate answer suggestion.";
  } finally {
    els.answerAssistBtn.disabled = false;
  }
});

function renderSimulatorControls() {
  els.simulatorControls.textContent = "";
  simulatorSources.forEach(({ source, label }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "simulator-button";
    button.textContent = label;
    button.addEventListener("click", () => {
      if (!state.meeting) return;
      try {
        const event = createSimulatedCaptureEvent(state.meeting, source);
        captureEventBus.emitTranscriptEvent(event);
      } catch (error) {
        els.eventBusStatus.textContent = "Event rejected";
        els.simulatorStatus.textContent = error.message || "Could not emit simulated event.";
      }
    });
    els.simulatorControls.append(button);
  });
}

captureEventBus.onTranscriptEvent((event) => {
  handleCaptureTranscriptEvent(event).catch((error) => {
    els.eventBusStatus.textContent = "Persist failed";
    els.simulatorStatus.textContent = error.message || "Could not persist transcript event.";
  });
});

window.desktopApp?.getVersion().then((version) => {
  els.runtimeVersion.textContent = `Electron app v${version}`;
});

window.desktopApp?.extensionBridge?.status().then((status) => {
  els.extensionBridgeStatus.textContent = status.activeSession
    ? `Extension bridge bound to ${status.activeSession.meetingTitle}.`
    : `Extension bridge listening at http://127.0.0.1:${status.port}.`;
});

window.desktopApp?.extensionBridge?.onStatus((status) => {
  els.extensionBridgeStatus.textContent = status.activeSession
    ? `Chrome extension checked in; active session is ${status.activeSession.meetingTitle}.`
    : "Chrome extension checked in; no active Live Assist session yet.";
});

window.desktopApp?.extensionBridge?.onTranscriptEvent((event) => {
  try {
    captureEventBus.emitTranscriptEvent(event);
    els.eventBusStatus.textContent = "Extension event received";
  } catch (error) {
    els.eventBusStatus.textContent = "Extension event rejected";
    els.simulatorStatus.textContent = error.message || "Invalid extension transcript event.";
  }
});

function showFatalError(error) {
  els.dbStatus.textContent = error.message || "Local database failed.";
  els.meetingSummary.textContent = "The local meeting database could not be opened.";
}

async function boot() {
  await localMeetingStore.init();
  state.settings = await localMeetingStore.getSetting("privacy-defaults");
  renderSettings();
  renderSimulatorControls();
  await loadMeeting();
  await Promise.all(Object.values(calendarProviders).map(refreshCalendarStatus));
}

boot().catch(showFatalError);
