# Local Meeting Copilot

A local meeting assistant inspired by the “AI copilot during calls” workflow: record a meeting, keep a live transcript, and generate a concise answer when someone asks you a question.

This is intentionally not branded as Cluely or a copy of its private product UI. It implements the core local features you asked for.

## Product Direction

The current localhost app is a prototype. The agreed target product is a desktop app plus Chrome extension with Live Mode and Minutes Mode as equal first-class surfaces.

See [docs/PRD_ARCHITECTURE.md](docs/PRD_ARCHITECTURE.md).

Rebuild decision: start with an Electron desktop shell before Chrome extension capture. See [docs/adr/0001-electron-shell-first.md](docs/adr/0001-electron-shell-first.md).

## Run The Electron Desktop Shell

```bash
cd /Users/henry/local-meeting-copilot
npm install
npm start
```

V1 starts with an Electron desktop shell because the desktop app is the main product surface for Calendar/Home, Live Mode, Minutes Mode, Settings/Privacy, local storage, AI orchestration, and the future capture bridge. The Chrome extension needs this receiving app and shared event contract before browser capture events have somewhere useful to go.

## Run The Prototype-Only Localhost App

The original localhost browser app is still available as a prototype for microphone/screen recording, browser speech recognition, answer suggestions, and minutes generation.

```bash
cd /Users/henry/local-meeting-copilot
npm run prototype
```

Open `http://localhost:5174`.

If another copy is already running on that port:

```bash
PORT=5175 npm run prototype
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

## Optional Google Calendar Setup

Google Calendar import uses an installed-app OAuth loopback flow in the Electron main process.

```bash
GOOGLE_CLIENT_ID=your_client_id GOOGLE_CLIENT_SECRET=your_client_secret npm start
```

Without these variables, the desktop app still runs with local seed meetings.

## Optional Microsoft Calendar Setup

Microsoft Calendar import uses the Microsoft identity platform authorization code flow with PKCE and Microsoft Graph Calendar APIs.

```bash
MICROSOFT_CLIENT_ID=your_client_id npm start
```

`MICROSOFT_TENANT_ID` is optional and defaults to `common`. Without `MICROSOFT_CLIENT_ID`, the desktop app still runs with local seed meetings.

## Features

- Electron desktop shell with placeholder navigation for Calendar/Home, Live Mode, Minutes Mode, and Settings/Privacy.
- Shared event contracts for meetings, participants, transcript events, answer suggestions, and meeting minutes.
- Demo meeting type toggle for founder/customer calls and candidate prep/mock interviews.
- Local IndexedDB persistence for development seed meetings, participants, transcript events, answer suggestions, minutes, and privacy settings.
- Local capture event bus and simulator for Meet, Zoom, Teams, desktop accessibility, OCR, and audio diarization transcript events.
- Optional Google Calendar connection that imports current/upcoming Meet, Zoom, and Teams events into local meeting records.
- Optional Microsoft Calendar connection that imports current/upcoming Teams, Zoom, and Meet events into local meeting records.
- Local-loadable Chrome extension bridge for Meet, Zoom Web, and Teams Web test transcript events.

## Load The Chrome Extension Bridge

1. Start the Electron app with `npm start`.
2. Open Chrome to `chrome://extensions`.
3. Enable Developer mode.
4. Click `Load unpacked`.
5. Select `/Users/henry/local-meeting-copilot/browser-extension`.

The extension detects Google Meet, Zoom Web, and Microsoft Teams Web URLs. On supported pages it injects a small test button that sends a structured transcript event to the desktop bridge at `http://127.0.0.1:47843`.

On Google Meet pages, the extension also observes visible caption-like regions and sends `meet-browser-caption` transcript events when captions and speaker labels are visible. Meet does not expose a stable public caption DOM API, so this adapter is heuristic and degrades to medium-confidence speaker labels when the speaker cannot be directly read.
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
