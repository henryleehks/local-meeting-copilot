const transcribeModel = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe-diarize";

function normalizeDiarizedTranscript(data, speakerNames = []) {
  const segments = data.segments || data.transcript?.segments || data.chunks || [];
  if (!Array.isArray(segments) || !segments.length) return data.text || "";

  const speakerMap = new Map();
  let nextIndex = 0;

  return segments.map((segment) => {
    const rawSpeaker = segment.speaker || segment.speaker_label || segment.channel || `speaker_${nextIndex}`;
    if (!speakerMap.has(rawSpeaker)) {
      speakerMap.set(rawSpeaker, speakerNames[nextIndex] || `Speaker ${nextIndex + 1}`);
      nextIndex += 1;
    }
    const label = speakerMap.get(rawSpeaker);
    const text = segment.text || segment.transcript || "";
    return text.trim() ? `${label}: ${text.trim()}` : "";
  }).filter(Boolean).join("\n\n");
}

class AudioTranscriptionService {
  status() {
    return {
      configured: Boolean(process.env.OPENAI_API_KEY),
      model: transcribeModel
    };
  }

  async transcribeChunk({ audio, mimeType = "audio/webm", speakerNames = [] } = {}) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set. Microphone recording is active, but transcription needs an API key.");
    }

    const audioBuffer = Buffer.from(audio || []);
    if (!audioBuffer.length) throw new Error("No audio bytes were captured for transcription.");

    const form = new FormData();
    form.set("model", transcribeModel);
    form.set("file", new Blob([audioBuffer], { type: mimeType }), "live-assist.webm");
    form.set("response_format", "json");
    if (speakerNames.length) {
      form.set("prompt", `Known meeting participants: ${speakerNames.join(", ")}. Preserve speaker turns and identify speakers when possible.`);
    }

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Transcription request failed.");
    }

    return {
      text: normalizeDiarizedTranscript(data, speakerNames).trim(),
      rawText: (data.text || "").trim(),
      model: transcribeModel
    };
  }
}

module.exports = { AudioTranscriptionService };
