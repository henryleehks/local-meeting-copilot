import { Platforms } from "./contracts.js";

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/gi;

function cleanUrl(url) {
  return url.replace(/[.,;!?]+$/, "");
}

export function detectMeetingPlatform(url = "") {
  const lower = url.toLowerCase();
  if (lower.includes("meet.google.com/")) return Platforms.googleMeet;
  if (lower.includes("zoom.us/") || lower.includes("zoom.com/")) return Platforms.zoom;
  if (lower.includes("teams.microsoft.com/") || lower.includes("teams.live.com/")) return Platforms.microsoftTeams;
  return Platforms.unknown;
}

export function platformLabel(platform) {
  if (platform === Platforms.googleMeet) return "Google Meet";
  if (platform === Platforms.zoom) return "Zoom";
  if (platform === Platforms.microsoftTeams) return "Microsoft Teams";
  return "Unknown";
}

export function extractMeetingUrl(...values) {
  const urls = values
    .filter(Boolean)
    .flatMap((value) => String(value).match(URL_PATTERN) || [])
    .map(cleanUrl);

  return urls.find((url) => detectMeetingPlatform(url) !== Platforms.unknown) || "";
}

export function extractGoogleCalendarMeetingUrl(event) {
  const conferenceUrls = event.conferenceData?.entryPoints
    ?.map((entryPoint) => entryPoint.uri)
    .filter(Boolean) || [];

  return extractMeetingUrl(
    event.hangoutLink,
    ...conferenceUrls,
    event.location,
    event.description
  );
}

export function extractMicrosoftCalendarMeetingUrl(event) {
  return extractMeetingUrl(
    event.onlineMeeting?.joinUrl,
    event.location?.displayName,
    event.bodyPreview,
    event.body?.content
  );
}
