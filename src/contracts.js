export const MeetingTypes = Object.freeze({
  founderCustomer: "founder-customer",
  candidatePrep: "candidate-prep"
});

export const Platforms = Object.freeze({
  googleMeet: "google-meet",
  zoom: "zoom",
  microsoftTeams: "microsoft-teams",
  unknown: "unknown"
});

export const SpeakerConfidence = Object.freeze({
  high: "high",
  medium: "medium",
  low: "low",
  userCorrected: "user-corrected"
});

export const SourceConfidence = Object.freeze({
  high: "high",
  medium: "medium",
  low: "low"
});

export const TranscriptSources = Object.freeze({
  meetBrowserCaption: "meet-browser-caption",
  zoomBrowserCaption: "zoom-browser-caption",
  teamsBrowserCaption: "teams-browser-caption",
  desktopAccessibility: "desktop-accessibility",
  desktopOcr: "desktop-ocr",
  audioDiarization: "audio-diarization",
  manualEdit: "manual-edit",
  simulated: "simulated"
});

export const AudioRetentionPolicies = Object.freeze({
  deleteAfterProcessing: "delete-after-processing",
  keepForMeeting: "keep-for-meeting"
});

/**
 * @typedef {Object} Participant
 * @property {string} id
 * @property {string} displayName
 * @property {string=} email
 * @property {"google"|"microsoft"|"manual"|"seed"} calendarSource
 * @property {"user"|"guest"|"attendee"|"interviewer"|"candidate"|"investor"|"customer"} role
 */

/**
 * @typedef {Object} Meeting
 * @property {string} id
 * @property {string} title
 * @property {string} meetingType
 * @property {string} platform
 * @property {string=} calendarEventId
 * @property {string=} joinUrl
 * @property {string} startTime
 * @property {string=} endTime
 * @property {Participant[]} participants
 * @property {"manual-start-only"} capturePolicy
 * @property {string} audioRetentionPolicy
 */

/**
 * @typedef {Object} TranscriptEvent
 * @property {string} id
 * @property {string} meetingId
 * @property {string} timestamp
 * @property {string} speakerName
 * @property {string=} speakerId
 * @property {string} speakerConfidence
 * @property {string} text
 * @property {string} source
 * @property {string} sourceConfidence
 */

/**
 * @typedef {Object} AnswerSuggestion
 * @property {string} id
 * @property {string} meetingId
 * @property {string} createdAt
 * @property {string} triggerText
 * @property {TranscriptEvent[]} contextWindow
 * @property {string} suggestedAnswer
 * @property {string[]} groundingSources
 */

/**
 * @typedef {Object} MeetingMinutes
 * @property {string} id
 * @property {string} meetingId
 * @property {string} createdAt
 * @property {string} summary
 * @property {{text: string, owner?: string, dueDate?: string}[]} decisions
 * @property {{text: string, owner?: string, dueDate?: string}[]} actionItems
 * @property {string[]} openQuestions
 * @property {string[]} risks
 * @property {string} followUpDraft
 * @property {string[]} unresolvedSpeakerLabels
 */

export function createTranscriptEvent(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    meetingId: "",
    timestamp: new Date().toISOString(),
    speakerName: "Unknown speaker",
    speakerId: undefined,
    speakerConfidence: SpeakerConfidence.low,
    text: "",
    source: TranscriptSources.simulated,
    sourceConfidence: SourceConfidence.low,
    ...overrides
  };
}

export function validateTranscriptEvent(event) {
  const required = ["id", "meetingId", "timestamp", "speakerName", "speakerConfidence", "text", "source", "sourceConfidence"];
  const missing = required.filter((key) => !event?.[key]);
  if (missing.length) return { ok: false, error: `Missing required transcript event fields: ${missing.join(", ")}` };
  if (!Object.values(SpeakerConfidence).includes(event.speakerConfidence)) {
    return { ok: false, error: `Unknown speaker confidence: ${event.speakerConfidence}` };
  }
  if (!Object.values(SourceConfidence).includes(event.sourceConfidence)) {
    return { ok: false, error: `Unknown source confidence: ${event.sourceConfidence}` };
  }
  if (!Object.values(TranscriptSources).includes(event.source)) {
    return { ok: false, error: `Unknown transcript source: ${event.source}` };
  }
  return { ok: true };
}
