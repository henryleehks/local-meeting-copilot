import {
  MeetingTypes,
  SpeakerConfidence,
  validateTranscriptEvent
} from "../src/contracts.js";
import { localMeetingStore } from "./storage.js";

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
  settings: null
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
  captureStatus: document.querySelector("#captureStatus"),
  liveMeetingTitle: document.querySelector("#liveMeetingTitle"),
  livePlatformLabel: document.querySelector("#livePlatformLabel"),
  liveCaptureLabel: document.querySelector("#liveCaptureLabel"),
  transcriptTimeline: document.querySelector("#transcriptTimeline"),
  latestQuestion: document.querySelector("#latestQuestion"),
  suggestedAnswer: document.querySelector("#suggestedAnswer"),
  assistPromptTitle: document.querySelector("#assistPromptTitle"),
  minutesMeetingTitle: document.querySelector("#minutesMeetingTitle"),
  minutesMeetingType: document.querySelector("#minutesMeetingType"),
  minutesPlatformLabel: document.querySelector("#minutesPlatformLabel"),
  minutesContent: document.querySelector("#minutesContent"),
  runtimeVersion: document.querySelector("#runtimeVersion"),
  dbStatus: document.querySelector("#dbStatus"),
  audioPolicyLabel: document.querySelector("#audioPolicyLabel")
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
  els.dbStatus.textContent = "IndexedDB ready; demo records loaded locally";
  renderMeeting();
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
  els.latestQuestion.textContent = meeting.answerSuggestion?.triggerText || "No detected question yet.";
  els.suggestedAnswer.textContent = meeting.answerSuggestion?.suggestedAnswer || "No answer suggestion stored yet.";
  els.assistPromptTitle.textContent = state.meetingType === MeetingTypes.founderCustomer
    ? "Grounded founder answer"
    : "Truthful prep answer";
  renderMeta(meeting);
  renderTranscript(meeting);
  renderMinutes(meeting);
}

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
  els.captureStatus.textContent = "Live";
  els.liveCaptureLabel.textContent = "Live";
  setSection("live");
});

window.desktopApp?.getVersion().then((version) => {
  els.runtimeVersion.textContent = `Electron app v${version}`;
});

function showFatalError(error) {
  els.dbStatus.textContent = error.message || "Local database failed.";
  els.meetingSummary.textContent = "The local meeting database could not be opened.";
}

async function boot() {
  await localMeetingStore.init();
  state.settings = await localMeetingStore.getSetting("privacy-defaults");
  renderSettings();
  await loadMeeting();
}

boot().catch(showFatalError);
