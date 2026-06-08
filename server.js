import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const port = Number(process.env.PORT || 5174);
const host = process.env.HOST || "127.0.0.1";
const answerModel = process.env.OPENAI_MODEL || "gpt-5.4-mini";
const transcribeModel = process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe-diarize";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webm": "audio/webm",
  ".wav": "audio/wav"
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString("utf8");
  return body ? JSON.parse(body) : {};
}

async function handleAnswer(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 400, {
      error: "OPENAI_API_KEY is not set. Live recording still works, but AI answer suggestions need an API key."
    });
    return;
  }

  const { transcript = "", meetingTitle = "Untitled meeting", question = "" } = await readJson(req);
  if (!transcript.trim() && !question.trim()) {
    sendJson(res, 400, { error: "Add some transcript text or type the question first." });
    return;
  }

  const prompt = [
    `Meeting: ${meetingTitle}`,
    "Recent transcript:",
    transcript.slice(-12000),
    question ? `Explicit question: ${question}` : "",
    "Generate a concise answer the user can say out loud. Include a short version first, then 2-3 supporting points. If the question is unclear, say what clarification to ask."
  ].filter(Boolean).join("\n\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: answerModel,
      input: [
        {
          role: "system",
          content: "You are a private real-time meeting copilot. Help the user answer naturally, honestly, and briefly. Do not fabricate details outside the transcript."
        },
        { role: "user", content: prompt }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    sendJson(res, response.status, { error: data.error?.message || "OpenAI request failed." });
    return;
  }

  const answer = data.output_text
    || data.output?.flatMap((item) => item.content || []).map((part) => part.text).filter(Boolean).join("\n")
    || "No answer text returned.";

  sendJson(res, 200, { answer, model: answerModel });
}

function extractOutputText(data) {
  return data.output_text
    || data.output?.flatMap((item) => item.content || []).map((part) => part.text).filter(Boolean).join("\n")
    || "";
}

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

async function handleTranscribe(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 400, {
      error: "OPENAI_API_KEY is not set. Use browser live transcription, or set the key for file transcription."
    });
    return;
  }

  const url = new URL(req.url || "/api/transcribe", `http://${req.headers.host}`);
  const speakerNames = url.searchParams.get("speakers")
    ?.split(",")
    .map((name) => name.trim())
    .filter(Boolean) || [];
  const contentType = req.headers["content-type"] || "";
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const audio = new Blob([Buffer.concat(chunks)], { type: contentType || "audio/webm" });

  const form = new FormData();
  form.set("model", transcribeModel);
  form.set("file", audio, "meeting.webm");
  form.set("response_format", "json");
  if (speakerNames.length) {
    form.set("prompt", `Known meeting participants: ${speakerNames.join(", ")}. Preserve speaker turns and identify speakers when possible.`);
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { "authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form
  });

  const data = await response.json();
  if (!response.ok) {
    sendJson(res, response.status, { error: data.error?.message || "Transcription request failed." });
    return;
  }

  sendJson(res, 200, {
    text: normalizeDiarizedTranscript(data, speakerNames),
    rawText: data.text || "",
    model: transcribeModel
  });
}

async function handleMinutes(req, res) {
  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 400, {
      error: "OPENAI_API_KEY is not set. Meeting minutes need an API key."
    });
    return;
  }

  const {
    transcript = "",
    meetingTitle = "Untitled meeting",
    notes = "",
    speakerNames = []
  } = await readJson(req);

  if (!transcript.trim()) {
    sendJson(res, 400, { error: "No transcript available to summarize." });
    return;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: answerModel,
      input: [
        {
          role: "system",
          content: "You create accurate meeting minutes from transcripts. Only use facts present in the transcript or private notes. Keep unknown owners or dates marked as TBD."
        },
        {
          role: "user",
          content: [
            `Meeting: ${meetingTitle}`,
            speakerNames.length ? `Participants: ${speakerNames.join(", ")}` : "",
            notes.trim() ? `Private notes:\n${notes.trim()}` : "",
            `Transcript:\n${transcript.slice(-18000)}`,
            "Return meeting minutes with these sections: Executive summary, Decisions, Action items with owner and due date, Open questions, Risks or blockers, Follow-up draft."
          ].filter(Boolean).join("\n\n")
        }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) {
    sendJson(res, response.status, { error: data.error?.message || "Minutes request failed." });
    return;
  }

  sendJson(res, 200, { minutes: extractOutputText(data) || "No minutes returned.", model: answerModel });
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const path = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const normalized = normalize(path).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, normalized);

  try {
    const file = await readFile(filePath);
    res.writeHead(200, { "content-type": mimeTypes[extname(filePath)] || "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = createServer(async (req, res) => {
  try {
    const pathname = new URL(req.url || "/", `http://${req.headers.host}`).pathname;
    if (req.method === "POST" && pathname === "/api/answer") return await handleAnswer(req, res);
    if (req.method === "POST" && pathname === "/api/transcribe") return await handleTranscribe(req, res);
    if (req.method === "POST" && pathname === "/api/minutes") return await handleMinutes(req, res);
    if (req.method === "GET" || req.method === "HEAD") return await serveStatic(req, res);
    sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
});

server.listen(port, host, () => {
  console.log(`Local Meeting Copilot running at http://${host}:${port}`);
});
