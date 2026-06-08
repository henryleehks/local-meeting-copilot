import {
  SourceConfidence,
  SpeakerConfidence,
  TranscriptSources,
  createTranscriptEvent
} from "../src/contracts.js";

const SIMULATED_LINES = {
  [TranscriptSources.meetBrowserCaption]: {
    speakerConfidence: SpeakerConfidence.high,
    sourceConfidence: SourceConfidence.high,
    text: "Meet captions show the pilot should avoid changing the team's month-end close workflow."
  },
  [TranscriptSources.zoomBrowserCaption]: {
    speakerConfidence: SpeakerConfidence.high,
    sourceConfidence: SourceConfidence.high,
    text: "Zoom captions captured a question about how quickly the first workflow could go live."
  },
  [TranscriptSources.teamsBrowserCaption]: {
    speakerConfidence: SpeakerConfidence.medium,
    sourceConfidence: SourceConfidence.medium,
    text: "Teams captions suggest the buyer wants a clearer owner for the follow-up plan."
  },
  [TranscriptSources.desktopAccessibility]: {
    speakerConfidence: SpeakerConfidence.high,
    sourceConfidence: SourceConfidence.high,
    text: "Desktop accessibility exposed the active speaker label and caption text directly."
  },
  [TranscriptSources.desktopOcr]: {
    speakerConfidence: SpeakerConfidence.medium,
    sourceConfidence: SourceConfidence.medium,
    text: "OCR read a visible caption asking for the next concrete implementation step."
  },
  [TranscriptSources.audioDiarization]: {
    speakerConfidence: SpeakerConfidence.low,
    sourceConfidence: SourceConfidence.low,
    text: "Audio diarization produced a fallback speaker turn that needs later confirmation."
  }
};

function pickSpeaker(meeting, source) {
  if (source === TranscriptSources.audioDiarization) {
    return { speakerName: "Speaker 2", speakerId: undefined };
  }

  const guest = meeting.participants.find((participant) => participant.role !== "user" && participant.role !== "candidate");
  const fallback = meeting.participants[0];
  const speaker = guest || fallback || { displayName: "Unknown speaker", id: undefined };
  return { speakerName: speaker.displayName, speakerId: speaker.id };
}

export function createSimulatedCaptureEvent(meeting, source) {
  const template = SIMULATED_LINES[source];
  if (!template) throw new Error(`Unsupported simulated capture source: ${source}`);

  const speaker = pickSpeaker(meeting, source);
  return createTranscriptEvent({
    id: `sim-${source}-${Date.now()}`,
    meetingId: meeting.id,
    timestamp: new Date().toISOString(),
    speakerName: speaker.speakerName,
    speakerId: speaker.speakerId,
    speakerConfidence: template.speakerConfidence,
    text: template.text,
    source,
    sourceConfidence: template.sourceConfidence
  });
}

export const simulatorSources = Object.freeze([
  { source: TranscriptSources.meetBrowserCaption, label: "Meet captions" },
  { source: TranscriptSources.zoomBrowserCaption, label: "Zoom captions" },
  { source: TranscriptSources.teamsBrowserCaption, label: "Teams captions" },
  { source: TranscriptSources.desktopAccessibility, label: "Desktop accessibility" },
  { source: TranscriptSources.desktopOcr, label: "Desktop OCR" },
  { source: TranscriptSources.audioDiarization, label: "Audio diarization" }
]);
