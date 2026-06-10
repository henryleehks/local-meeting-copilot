const DEFAULT_MODEL = "gpt-5.4-mini";

function latestQuestionFromTranscript(transcriptEvents) {
  return [...transcriptEvents]
    .reverse()
    .find((event) => event.text.includes("?"))?.text || "";
}

function contextWindow(meeting) {
  return (meeting.transcriptEvents || []).slice(-10);
}

function groundingSourceIds(meeting, notes) {
  return [
    `meeting:${meeting.id}`,
    ...contextWindow(meeting).map((event) => `transcript:${event.id}`),
    ...(String(notes || "").trim() ? ["private-notes"] : [])
  ];
}

function policyForMeetingType(meetingType) {
  if (meetingType === "candidate-prep") {
    return [
      "You help a candidate recover and answer truthfully in a prep, mock, disclosed, or permitted interview-assistance context.",
      "Use only the transcript and private notes supplied in this request.",
      "Do not invent credentials, employment history, metrics, tools, commitments, or expertise.",
      "If the evidence is thin, draft a safe answer that says what the candidate knows, asks a clarifying question, or describes the next reasoning step.",
      "Do not optimize for concealing AI assistance from an evaluator."
    ].join(" ");
  }

  return [
    "You help a solo professional answer during an external founder, customer, investor, sales, or consulting call.",
    "Use only the transcript, meeting metadata, participants, and private notes supplied in this request.",
    "Keep commitments narrow, verifiable, and grounded.",
    "If facts are missing, ask a clarifying question instead of inventing details."
  ].join(" ");
}

function buildUserPrompt({ meeting, question, notes }) {
  const participants = (meeting.participants || [])
    .map((participant) => `${participant.displayName}${participant.role ? ` (${participant.role})` : ""}`)
    .join(", ") || "Unknown participants";
  const transcript = contextWindow(meeting)
    .map((event) => `[${event.timestamp}] ${event.speakerName}: ${event.text}`)
    .join("\n") || "No transcript events captured yet.";

  return [
    `Meeting title: ${meeting.title}`,
    `Meeting type: ${meeting.meetingType}`,
    `Platform: ${meeting.platformLabel || meeting.platform || "unknown"}`,
    `Participants: ${participants}`,
    "",
    `Question to answer: ${question || latestQuestionFromTranscript(meeting.transcriptEvents || []) || "No explicit question selected."}`,
    "",
    "Private notes:",
    String(notes || "").trim() || "None provided.",
    "",
    "Recent transcript:",
    transcript,
    "",
    "Return a concise answer the user can say out loud. Format it as:",
    "Short answer: ...",
    "",
    "Supporting points:",
    "- ...",
    "- ...",
    "",
    "Grounding:",
    "- Name the transcript or private-note facts you relied on.",
    "",
    "If the answer would require unsupported facts, make that limitation explicit and provide a truthful recovery line."
  ].join("\n");
}

function fallbackSuggestion({ meeting, question, notes }) {
  const triggerText = String(question || "").trim()
    || latestQuestionFromTranscript(meeting.transcriptEvents || [])
    || "What should I answer?";
  const hasTranscript = contextWindow(meeting).length > 0;
  const hasNotes = String(notes || "").trim().length > 0;
  const candidate = meeting.meetingType === "candidate-prep";
  const shortAnswer = candidate
    ? "I would answer from what I can verify, make my reasoning explicit, and ask for clarification where the prompt is underspecified."
    : "I would answer from the transcript and notes, keep the commitment narrow, and ask a clarifying question before promising anything new.";

  return {
    id: `answer-${Date.now()}`,
    meetingId: meeting.id,
    createdAt: new Date().toISOString(),
    triggerText,
    contextWindowIds: contextWindow(meeting).map((event) => event.id),
    suggestedAnswer: [
      `Short answer: ${shortAnswer}`,
      "",
      "Supporting points:",
      hasTranscript ? "- Use the latest captured transcript context." : "- No transcript is available yet, so do not infer missing facts.",
      hasNotes ? "- Use only the private notes provided for this meeting." : "- No private notes are available yet; ask for clarification before adding specifics.",
      "- Do not fabricate credentials, numbers, commitments, or expertise."
    ].join("\n"),
    groundingSources: groundingSourceIds(meeting, notes),
    model: "local-fallback",
    mode: "fallback"
  };
}

function extractOutputText(data) {
  if (data.output_text) return data.output_text;
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n")
    .trim();
}

class AnswerService {
  constructor({ apiKey = process.env.OPENAI_API_KEY, model = process.env.OPENAI_MODEL || DEFAULT_MODEL } = {}) {
    this.apiKey = apiKey;
    this.model = model;
  }

  status() {
    return {
      configured: Boolean(this.apiKey),
      model: this.model,
      fallback: "local-fallback"
    };
  }

  async generateAnswer({ meeting, question = "", notes = "" }) {
    if (!meeting?.id) throw new Error("A meeting is required before generating an answer.");
    const triggerText = String(question || "").trim()
      || latestQuestionFromTranscript(meeting.transcriptEvents || [])
      || "What should I answer?";

    if (!this.apiKey) return fallbackSuggestion({ meeting, question: triggerText, notes });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "system",
            content: policyForMeetingType(meeting.meetingType)
          },
          {
            role: "user",
            content: buildUserPrompt({ meeting, question: triggerText, notes })
          }
        ]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "OpenAI answer generation failed.");

    return {
      id: `answer-${Date.now()}`,
      meetingId: meeting.id,
      createdAt: new Date().toISOString(),
      triggerText,
      contextWindowIds: contextWindow(meeting).map((event) => event.id),
      suggestedAnswer: extractOutputText(data) || fallbackSuggestion({ meeting, question: triggerText, notes }).suggestedAnswer,
      groundingSources: groundingSourceIds(meeting, notes),
      model: this.model,
      mode: "openai"
    };
  }
}

module.exports = { AnswerService };
