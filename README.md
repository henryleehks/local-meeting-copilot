# Local Meeting Copilot

A local meeting assistant inspired by the “AI copilot during calls” workflow: record a meeting, keep a live transcript, and generate a concise answer when someone asks you a question.

This is intentionally not branded as Cluely or a copy of its private product UI. It implements the core local features you asked for.

## Product Direction

The current localhost app is a prototype. The agreed target product is a desktop app plus Chrome extension with Live Mode and Minutes Mode as equal first-class surfaces.

See [docs/PRD_ARCHITECTURE.md](docs/PRD_ARCHITECTURE.md).

Rebuild decision: start with an Electron desktop shell before Chrome extension capture. See [docs/adr/0001-electron-shell-first.md](docs/adr/0001-electron-shell-first.md).

## Run

```bash
cd /Users/henry/local-meeting-copilot
npm start
```

Open `http://localhost:5174`.

If another copy is already running on that port:

```bash
PORT=5175 npm start
```

## Optional AI setup

Live browser transcription works best in Chrome and does not require an API key. For AI answer suggestions and server-side audio transcription, start with:

```bash
OPENAI_API_KEY=your_key_here npm start
```

Optional model overrides:

```bash
OPENAI_MODEL=gpt-5.4-mini OPENAI_TRANSCRIBE_MODEL=gpt-4o-transcribe-diarize npm start
```

## Features

- Record microphone audio or screen audio.
- Live browser transcription where supported.
- Name meeting participants and tag the live transcript with the current speaker.
- Use diarized transcription on the saved recording to separate speaker turns more accurately.
- Editable transcript and private notes.
- “What should I answer?” uses recent transcript context plus your notes.
- Generate meeting minutes after the meeting: summary, decisions, action items, open questions, risks, and follow-up draft.
- Download transcript as a text file.
- Optional server-side transcription of the captured recording.

## Notes

- Browser live transcription support varies. Chrome is the most reliable.
- Browser live transcription cannot automatically identify speakers. Use the “Speaking now” selector while recording, then run “Diarize recording” after the meeting for model-based speaker separation.
- Screen audio capture depends on OS and browser permissions.
- Ask for consent before recording meetings.
