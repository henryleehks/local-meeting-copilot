import assert from "node:assert/strict";
import {
  MeetingTypes
} from "./contracts.js";
import {
  normalizeGoogleCalendarEvent,
  normalizeMicrosoftCalendarEvent
} from "./calendar-normalizer.js";

const googleEvent = {
  id: "calendar-event-1",
  summary: "Candidate prep call",
  hangoutLink: "https://meet.google.com/abc-defg-hij",
  start: { dateTime: "2026-06-12T09:00:00.000Z" },
  end: { dateTime: "2026-06-12T09:30:00.000Z" },
  attendees: [
    { email: "candidate@example.com", self: true },
    { email: "coach@example.com", displayName: "Coach" }
  ]
};

const microsoftEvent = {
  id: "calendar-event-2",
  subject: "Candidate Teams call",
  onlineMeeting: { joinUrl: "https://teams.microsoft.com/l/meetup-join/example" },
  start: { dateTime: "2026-06-12T10:00:00.000" },
  end: { dateTime: "2026-06-12T10:30:00.000" },
  attendees: [
    { emailAddress: { address: "candidate@example.com" }, type: "required" }
  ]
};

const founderGoogle = normalizeGoogleCalendarEvent(googleEvent);
const candidateGoogle = normalizeGoogleCalendarEvent(googleEvent, { meetingType: MeetingTypes.candidatePrep });
assert.equal(founderGoogle.meetingType, MeetingTypes.founderCustomer);
assert.equal(candidateGoogle.meetingType, MeetingTypes.candidatePrep);
assert.notEqual(founderGoogle.id, candidateGoogle.id);
assert.ok(candidateGoogle.participants.every((participant) => participant.id.startsWith(candidateGoogle.id)));

const founderMicrosoft = normalizeMicrosoftCalendarEvent(microsoftEvent);
const candidateMicrosoft = normalizeMicrosoftCalendarEvent(microsoftEvent, { meetingType: MeetingTypes.candidatePrep });
assert.equal(founderMicrosoft.meetingType, MeetingTypes.founderCustomer);
assert.equal(candidateMicrosoft.meetingType, MeetingTypes.candidatePrep);
assert.notEqual(founderMicrosoft.id, candidateMicrosoft.id);
assert.ok(candidateMicrosoft.participants.every((participant) => participant.id.startsWith(candidateMicrosoft.id)));
