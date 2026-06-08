import { MeetingTypes } from "./contracts.js";

function latestQuestionFromTranscript(transcriptEvents) {
  return [...transcriptEvents]
    .reverse()
    .find((event) => event.text.includes("?"))?.text || "";
}

function recentContext(transcriptEvents) {
  return transcriptEvents.slice(-8).map((event) => `${event.speakerName}: ${event.text}`);
}

function firstActionableLine(meeting, question, notes) {
  if (meeting.meetingType === MeetingTypes.candidatePrep) {
    return "I would answer truthfully from my own experience, then make the reasoning explicit.";
  }
  if (/risk|rollout|implement|pilot/i.test(question)) {
    return "I would reduce risk by starting with a narrow pilot, clear success criteria, and an explicit owner for the first workflow.";
  }
  if (/price|pricing|cost|budget/i.test(question)) {
    return "I would anchor pricing to the business outcome, then offer a concrete next step before making a commitment.";
  }
  if (notes.trim()) {
    return "I would answer from the notes and transcript, keeping the commitment narrow and verifiable.";
  }
  return "I would give a concise answer based only on what has been said so far, then ask for clarification if needed.";
}

export function buildAnswerSuggestion({ meeting, question, notes = "" }) {
  const triggerText = question.trim() || latestQuestionFromTranscript(meeting.transcriptEvents) || "What should I answer?";
  const contextWindow = meeting.transcriptEvents.slice(-8);
  const contextLines = recentContext(meeting.transcriptEvents);
  const participants = meeting.participants.map((participant) => participant.displayName).join(", ") || "Unknown participants";
  const shortAnswer = firstActionableLine(meeting, triggerText, notes);
  const support = [
    `Ground it in ${meeting.title} with participants: ${participants}.`,
    contextLines[0] ? `Use recent context: ${contextLines.slice(-2).join(" / ")}` : "No transcript context yet, so ask a clarifying question before committing.",
    "Do not fabricate credentials, numbers, commitments, or expertise that are not in the transcript or private notes."
  ];

  return {
    id: `answer-${Date.now()}`,
    meetingId: meeting.id,
    createdAt: new Date().toISOString(),
    triggerText,
    contextWindowIds: contextWindow.map((event) => event.id),
    suggestedAnswer: [`Short answer: ${shortAnswer}`, "", "Supporting points:", ...support.map((item) => `- ${item}`)].join("\n"),
    groundingSources: [
      `meeting:${meeting.id}`,
      ...contextWindow.map((event) => `transcript:${event.id}`),
      ...(notes.trim() ? ["private-notes"] : [])
    ]
  };
}
