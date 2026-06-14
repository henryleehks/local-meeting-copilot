import {
  CalendarDays,
  FileText,
  MessageSquareText,
  ShieldCheck
} from "lucide-react";
import {
  normalizeGoogleCalendarEvent,
  normalizeMicrosoftCalendarEvent
} from "../../../src/calendar-normalizer.js";

export const tabs = [
  { id: "home", label: "Home", icon: CalendarDays },
  { id: "live", label: "Live", icon: MessageSquareText },
  { id: "minutes", label: "Minutes", icon: FileText },
  { id: "settings", label: "Settings", icon: ShieldCheck }
];

export const providerSeed = {
  google: {
    name: "Google Calendar",
    normalize: normalizeGoogleCalendarEvent,
    notConfigured: "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, then restart the desktop app.",
    ready: "Connect Google Calendar to read current and upcoming external calls.",
    connected: "Sync reads current and upcoming Google Calendar events, then stores normalized meetings locally."
  },
  microsoft: {
    name: "Microsoft Calendar",
    normalize: normalizeMicrosoftCalendarEvent,
    notConfigured: "Set MICROSOFT_CLIENT_ID, then restart the desktop app.",
    ready: "Connect Microsoft Calendar to read Outlook and Teams meetings.",
    connected: "Sync reads current and upcoming Microsoft Calendar events, then stores normalized meetings locally."
  }
};

export const audioChunkMs = 12000;
