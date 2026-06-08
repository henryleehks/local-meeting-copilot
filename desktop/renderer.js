import {
  AudioRetentionPolicies,
  MeetingTypes,
  Platforms,
  SourceConfidence,
  SpeakerConfidence,
  TranscriptSources,
  createTranscriptEvent,
  validateTranscriptEvent
} from "../src/contracts.js";

const demoMeetings = {
  [MeetingTypes.founderCustomer]: {
    id: "meeting-founder-northstar",
    title: "Customer discovery with Northstar CFO",
    platform: Platforms.zoom,
    platformLabel: "Zoom",
    startTime: "2026-06-08T09:30:00.000Z",
    capturePolicy: "manual-start-only",
    audioRetentionPolicy: AudioRetentionPolicies.deleteAfterProcessing,
    participants: [
      { id: "p-henry", displayName: "Henry", email: "henry@example.com", calendarSource: "seed", role: "user" },
      { id: "p-maya", displayName: "Maya Chen", email: "maya@northstar.example", calendarSource: "seed", role: "customer" }
    ],
    summary: "A founder/customer call focused on rollout risk, pricing, and follow-up decisions.",
    latestQuestion: "How would you reduce rollout risk for our finance team in the first month?",
    suggestedAnswer: "I would start with a narrow pilot, define success criteria up front, and review the first real workflow together before broad rollout.",
    transcript: [
      createTranscriptEvent({
        id: "event-founder-1",
        meetingId: "meeting-founder-northstar",
        timestamp: "2026-06-08T09:34:00.000Z",
        speakerName: "Maya Chen",
        speakerId: "p-maya",
        speakerConfidence: SpeakerConfidence.high,
        text: "Our concern is not the dashboard. It is whether implementation disrupts month-end close.",
        source: TranscriptSources.zoomBrowserCaption,
        sourceConfidence: SourceConfidence.high
      }),
      createTranscriptEvent({
        id: "event-founder-2",
        meetingId: "meeting-founder-northstar",
        timestamp: "2026-06-08T09:35:20.000Z",
        speakerName: "Henry",
        speakerId: "p-henry",
        speakerConfidence: SpeakerConfidence.high,
        text: "We can scope the first month around read-only reporting and one team workflow before any broader automation.",
        source: TranscriptSources.zoomBrowserCaption,
        sourceConfidence: SourceConfidence.high
      }),
      createTranscriptEvent({
        id: "event-founder-3",
        meetingId: "meeting-founder-northstar",
        timestamp: "2026-06-08T09:36:10.000Z",
        speakerName: "Maya Chen?",
        speakerId: "p-maya",
        speakerConfidence: SpeakerConfidence.medium,
        text: "What would you need from us to make that pilot concrete?",
        source: TranscriptSources.desktopOcr,
        sourceConfidence: SourceConfidence.medium
      })
    ],
    minutes: {
      summary: "Northstar is interested but wants a low-risk pilot that avoids disrupting finance operations.",
      decisions: ["Pilot should begin with read-only reporting and one workflow."],
      actionItems: ["Henry: send a one-page pilot plan with success criteria.", "Maya: identify the finance workflow owner."],
      openQuestions: ["Which month-end reports should be excluded from the first pilot?"],
      risks: ["Month-end disruption is the primary blocker."],
      followUpDraft: "Thanks Maya. I will send a pilot plan that keeps month-end close untouched, starts with read-only reporting, and names the workflow owner decision points."
    }
  },
  [MeetingTypes.candidatePrep]: {
    id: "meeting-candidate-prep",
    title: "Mock interview for senior frontend role",
    platform: Platforms.googleMeet,
    platformLabel: "Google Meet",
    startTime: "2026-06-08T14:00:00.000Z",
    capturePolicy: "manual-start-only",
    audioRetentionPolicy: AudioRetentionPolicies.deleteAfterProcessing,
    participants: [
      { id: "p-candidate", displayName: "Candidate", calendarSource: "seed", role: "candidate" },
      { id: "p-coach", displayName: "Mock interviewer", calendarSource: "seed", role: "interviewer" }
    ],
    summary: "A candidate prep/mock interview focused on truthful recall, coding approach, and clear explanation.",
    latestQuestion: "Talk me through how you would debug a layout shift that only appears after data loads.",
    suggestedAnswer: "I would reproduce with throttled data, inspect the before/after layout boxes, reserve stable space for async content, then add a regression check for the component state.",
    transcript: [
      createTranscriptEvent({
        id: "event-candidate-1",
        meetingId: "meeting-candidate-prep",
        timestamp: "2026-06-08T14:04:00.000Z",
        speakerName: "Mock interviewer",
        speakerId: "p-coach",
        speakerConfidence: SpeakerConfidence.high,
        text: "Tell me about a time you improved a slow interface without a full rewrite.",
        source: TranscriptSources.meetBrowserCaption,
        sourceConfidence: SourceConfidence.high
      }),
      createTranscriptEvent({
        id: "event-candidate-2",
        meetingId: "meeting-candidate-prep",
        timestamp: "2026-06-08T14:05:05.000Z",
        speakerName: "Candidate",
        speakerId: "p-candidate",
        speakerConfidence: SpeakerConfidence.high,
        text: "I would anchor the answer on the dashboard virtualization project and include the before and after metrics from my notes.",
        source: TranscriptSources.manualEdit,
        sourceConfidence: SourceConfidence.high
      }),
      createTranscriptEvent({
        id: "event-candidate-3",
        meetingId: "meeting-candidate-prep",
        timestamp: "2026-06-08T14:06:30.000Z",
        speakerName: "Mock interviewer?",
        speakerId: "p-coach",
        speakerConfidence: SpeakerConfidence.medium,
        text: "Now suppose the task is to implement a debounced search input. What edge cases matter?",
        source: TranscriptSources.desktopOcr,
        sourceConfidence: SourceConfidence.medium
      })
    ],
    minutes: {
      summary: "Candidate prep covered performance storytelling and coding-task reasoning.",
      decisions: ["Use the dashboard virtualization project as the primary performance example."],
      actionItems: ["Candidate: prepare exact before/after metrics.", "Candidate: rehearse debounce edge cases and cancellation behavior."],
      openQuestions: ["Which production incident example best shows ownership?"],
      risks: ["Answers may sound generic if metrics are not ready."],
      followUpDraft: "For the next prep session, bring concrete metrics for the dashboard work and a short explanation of debounce timing, cancellation, and stale responses."
    }
  }
};

const sectionTitles = {
  calendar: "Calendar/Home",
  live: "Live Mode",
  minutes: "Minutes Mode",
  privacy: "Settings/Privacy"
};

const state = {
  activeSection: "calendar",
  meetingType: MeetingTypes.founderCustomer
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
  transcriptTimeline: document.querySelector("#transcriptTimeline"),
  latestQuestion: document.querySelector("#latestQuestion"),
  suggestedAnswer: document.querySelector("#suggestedAnswer"),
  assistPromptTitle: document.querySelector("#assistPromptTitle"),
  minutesContent: document.querySelector("#minutesContent"),
  runtimeVersion: document.querySelector("#runtimeVersion")
};

function confidenceLabel(confidence) {
  return confidence === SpeakerConfidence.medium ? "Medium confidence" : `${confidence[0].toUpperCase()}${confidence.slice(1)} confidence`;
}

function renderMeta(meeting) {
  const rows = [
    ["Meeting type", meeting.meetingType === MeetingTypes.founderCustomer ? "Founder/customer" : "Candidate prep/mock"],
    ["Participants", meeting.participants.map((participant) => participant.displayName).join(", ")],
    ["Capture policy", "Start Live Assist required"],
    ["Audio retention", "Delete after processing"]
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
  meeting.transcript.forEach((event) => {
    const validation = validateTranscriptEvent(event);
    const item = document.createElement("article");
    item.className = `timeline-item ${event.speakerConfidence}`;

    const time = new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    item.innerHTML = `
      <div class="event-meta">
        <strong>${event.speakerName}</strong>
        <span>${time}</span>
      </div>
      <p></p>
      <div class="event-badges">
        <span>${confidenceLabel(event.speakerConfidence)}</span>
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
  const sections = [
    ["Executive summary", [minutes.summary]],
    ["Decisions", minutes.decisions],
    ["Action items", minutes.actionItems],
    ["Open questions", minutes.openQuestions],
    ["Risks or blockers", minutes.risks],
    ["Follow-up draft", [minutes.followUpDraft]]
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

function renderMeeting() {
  const meeting = demoMeetings[state.meetingType];
  els.meetingTitle.textContent = meeting.title;
  els.platformBadge.textContent = meeting.platformLabel;
  els.meetingSummary.textContent = meeting.summary;
  els.latestQuestion.textContent = meeting.latestQuestion;
  els.suggestedAnswer.textContent = meeting.suggestedAnswer;
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
    renderMeeting();
  });
});

els.startAssistBtn.addEventListener("click", () => {
  els.captureStatus.textContent = "Live";
  setSection("live");
});

window.desktopApp?.getVersion().then((version) => {
  els.runtimeVersion.textContent = `Electron app v${version}`;
});

renderMeeting();
