import { MeetingTypes, SpeakerConfidence } from "../../../src/contracts.js";

export function meetingTypeLabel(meetingType: string) {
  return meetingType === MeetingTypes.founderCustomer ? "Founder/customer" : "Candidate prep/mock";
}

export function confidenceLabel(confidence: string) {
  return confidence === SpeakerConfidence.medium ? "Medium confidence" : `${confidence[0].toUpperCase()}${confidence.slice(1)} confidence`;
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatStructuredItem(item: any) {
  const owner = item.owner ? `${item.owner}: ` : "";
  const dueDate = item.dueDate ? ` (${item.dueDate})` : "";
  return `${owner}${item.text}${dueDate}`;
}
