import {
  AudioRetentionPolicies,
  MeetingTypes,
  Platforms,
  SourceConfidence,
  SpeakerConfidence,
  TranscriptSources,
  createTranscriptEvent
} from "../src/contracts.js";

export const seedMeetings = [
  {
    id: "meeting-founder-northstar",
    title: "Customer discovery with Northstar CFO",
    meetingType: MeetingTypes.founderCustomer,
    platform: Platforms.zoom,
    platformLabel: "Zoom",
    startTime: "2026-06-08T09:30:00.000Z",
    capturePolicy: "manual-start-only",
    audioRetentionPolicy: AudioRetentionPolicies.deleteAfterProcessing,
    summary: "A founder/customer call focused on rollout risk, pricing, and follow-up decisions.",
    participants: [
      { id: "p-founder-henry", displayName: "Henry", email: "henry@example.com", calendarSource: "seed", role: "user" },
      { id: "p-founder-maya", displayName: "Maya Chen", email: "maya@northstar.example", calendarSource: "seed", role: "customer" }
    ],
    transcriptEvents: [
      createTranscriptEvent({
        id: "event-founder-1",
        meetingId: "meeting-founder-northstar",
        timestamp: "2026-06-08T09:34:00.000Z",
        speakerName: "Maya Chen",
        speakerId: "p-founder-maya",
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
        speakerId: "p-founder-henry",
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
        speakerId: "p-founder-maya",
        speakerConfidence: SpeakerConfidence.medium,
        text: "What would you need from us to make that pilot concrete?",
        source: TranscriptSources.desktopOcr,
        sourceConfidence: SourceConfidence.medium
      })
    ],
    answerSuggestion: {
      id: "answer-founder-1",
      meetingId: "meeting-founder-northstar",
      createdAt: "2026-06-08T09:36:20.000Z",
      triggerText: "How would you reduce rollout risk for our finance team in the first month?",
      suggestedAnswer: "I would start with a narrow pilot, define success criteria up front, and review the first real workflow together before broad rollout.",
      groundingSources: ["transcript:event-founder-1", "transcript:event-founder-2", "calendar:participants"]
    },
    minutes: {
      id: "minutes-founder-1",
      meetingId: "meeting-founder-northstar",
      createdAt: "2026-06-08T09:50:00.000Z",
      summary: "Northstar is interested but wants a low-risk pilot that avoids disrupting finance operations.",
      decisions: [{ text: "Pilot should begin with read-only reporting and one workflow." }],
      actionItems: [
        { text: "Send a one-page pilot plan with success criteria.", owner: "Henry", dueDate: "TBD" },
        { text: "Identify the finance workflow owner.", owner: "Maya Chen", dueDate: "TBD" }
      ],
      openQuestions: ["Which month-end reports should be excluded from the first pilot?"],
      risks: ["Month-end disruption is the primary blocker."],
      followUpDraft: "Thanks Maya. I will send a pilot plan that keeps month-end close untouched, starts with read-only reporting, and names the workflow owner decision points.",
      unresolvedSpeakerLabels: ["Maya Chen?"]
    }
  },
  {
    id: "meeting-candidate-prep",
    title: "Mock interview for senior frontend role",
    meetingType: MeetingTypes.candidatePrep,
    platform: Platforms.googleMeet,
    platformLabel: "Google Meet",
    startTime: "2026-06-08T14:00:00.000Z",
    capturePolicy: "manual-start-only",
    audioRetentionPolicy: AudioRetentionPolicies.deleteAfterProcessing,
    summary: "A candidate prep/mock interview focused on truthful recall, coding approach, and clear explanation.",
    participants: [
      { id: "p-candidate", displayName: "Candidate", calendarSource: "seed", role: "candidate" },
      { id: "p-coach", displayName: "Mock interviewer", calendarSource: "seed", role: "interviewer" }
    ],
    transcriptEvents: [
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
    answerSuggestion: {
      id: "answer-candidate-1",
      meetingId: "meeting-candidate-prep",
      createdAt: "2026-06-08T14:06:40.000Z",
      triggerText: "Talk me through how you would debug a layout shift that only appears after data loads.",
      suggestedAnswer: "I would reproduce with throttled data, inspect the before/after layout boxes, reserve stable space for async content, then add a regression check for the component state.",
      groundingSources: ["transcript:event-candidate-1", "transcript:event-candidate-2", "prep:private-notes"]
    },
    minutes: {
      id: "minutes-candidate-1",
      meetingId: "meeting-candidate-prep",
      createdAt: "2026-06-08T14:30:00.000Z",
      summary: "Candidate prep covered performance storytelling and coding-task reasoning.",
      decisions: [{ text: "Use the dashboard virtualization project as the primary performance example." }],
      actionItems: [
        { text: "Prepare exact before/after metrics.", owner: "Candidate", dueDate: "TBD" },
        { text: "Rehearse debounce edge cases and cancellation behavior.", owner: "Candidate", dueDate: "TBD" }
      ],
      openQuestions: ["Which production incident example best shows ownership?"],
      risks: ["Answers may sound generic if metrics are not ready."],
      followUpDraft: "For the next prep session, bring concrete metrics for the dashboard work and a short explanation of debounce timing, cancellation, and stale responses.",
      unresolvedSpeakerLabels: ["Mock interviewer?"]
    }
  }
];

export const seedSettings = {
  id: "privacy-defaults",
  audioRetentionPolicy: AudioRetentionPolicies.deleteAfterProcessing,
  externalAiEnabled: false,
  capturePolicy: "manual-start-only",
  seededAt: "2026-06-08T00:00:00.000Z"
};
