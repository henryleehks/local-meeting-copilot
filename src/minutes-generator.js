function unresolvedSpeakerLabels(transcriptEvents) {
  return [...new Set(transcriptEvents
    .filter((event) => ["medium", "low"].includes(event.speakerConfidence) || event.speakerName.includes("?"))
    .map((event) => event.speakerName))];
}

function sentenceFrom(event) {
  return event?.text?.replace(/\s+/g, " ").trim() || "";
}

export function generateDraftMinutes(meeting) {
  const transcriptEvents = meeting.transcriptEvents || [];
  const latest = transcriptEvents.slice(-6);
  const participants = meeting.participants.map((participant) => participant.displayName).join(", ") || "TBD";
  const first = sentenceFrom(latest[0]) || "No transcript events captured yet.";
  const lastQuestion = [...transcriptEvents].reverse().find((event) => event.text.includes("?"));
  const uncertain = unresolvedSpeakerLabels(transcriptEvents);

  return {
    id: `minutes-${Date.now()}`,
    meetingId: meeting.id,
    createdAt: new Date().toISOString(),
    summary: `${meeting.title} covered ${meeting.summary || "the selected meeting context"}. Participants: ${participants}. Recent transcript anchor: ${first}`,
    decisions: [
      { text: "Review the transcript and confirm whether any commitment was made.", owner: "TBD", dueDate: "TBD" }
    ],
    actionItems: [
      { text: "Confirm owners and due dates from the captured transcript.", owner: "TBD", dueDate: "TBD" }
    ],
    openQuestions: lastQuestion ? [lastQuestion.text] : ["No explicit open question detected yet."],
    risks: uncertain.length ? [`Unresolved speaker labels need review: ${uncertain.join(", ")}`] : ["No low-confidence speaker labels detected."],
    followUpDraft: `Thanks for the conversation. I captured notes from ${meeting.title}; I will confirm decisions, owners, and next steps before sharing anything externally.`,
    unresolvedSpeakerLabels: uncertain
  };
}
