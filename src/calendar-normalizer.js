import {
  AudioRetentionPolicies,
  MeetingTypes
} from "./contracts.js";
import {
  detectMeetingPlatform,
  extractGoogleCalendarMeetingUrl,
  platformLabel
} from "./meeting-url-parser.js";

function eventTime(value) {
  return value?.dateTime || value?.date || "";
}

function participantRole(attendee) {
  if (attendee.self) return "user";
  return "attendee";
}

export function normalizeGoogleCalendarEvent(event) {
  const joinUrl = extractGoogleCalendarMeetingUrl(event);
  const platform = detectMeetingPlatform(joinUrl);
  const participants = (event.attendees || []).map((attendee, index) => ({
    id: `google-${event.id}-participant-${index}`,
    displayName: attendee.displayName || attendee.email || `Attendee ${index + 1}`,
    email: attendee.email,
    calendarSource: "google",
    role: participantRole(attendee)
  }));

  return {
    id: `google-${event.id}`,
    title: event.summary || "Untitled Google Calendar event",
    meetingType: MeetingTypes.founderCustomer,
    platform,
    platformLabel: platformLabel(platform),
    calendarEventId: event.id,
    joinUrl,
    startTime: eventTime(event.start),
    endTime: eventTime(event.end),
    participants,
    capturePolicy: "manual-start-only",
    audioRetentionPolicy: AudioRetentionPolicies.deleteAfterProcessing,
    summary: joinUrl
      ? `Google Calendar event with ${platformLabel(platform)} link detected.`
      : "Google Calendar event without a supported meeting link yet.",
    transcriptEvents: [],
    answerSuggestion: null,
    minutes: null
  };
}
