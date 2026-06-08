Status: ready-for-agent

# Connect Google Calendar and detect meetings

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add Google authorization and calendar read support so the user can see current and upcoming external calls. The app should parse Google Meet, Zoom, and Teams links from Google Calendar events and normalize participant names/emails.

## Acceptance criteria

- [x] User can connect and disconnect Google Calendar.
- [x] Current and upcoming events appear in the desktop app.
- [x] Meet, Zoom, and Teams meeting URLs are detected from event fields.
- [x] Participants are normalized into the shared Participant model.
- [x] User must explicitly click `Start Live Assist`; capture never starts automatically.

## Blocked by

- `.scratch/live-meeting-copilot/issues/01-adopt-electron-shell-and-event-contracts.md`
- `.scratch/live-meeting-copilot/issues/02-persist-meetings-and-transcript-events-locally.md`

## Comments

- Implemented Google Calendar OAuth and events fetch IPC in the Electron main process, renderer controls for connect/sync/disconnect, meeting URL detection for Meet/Zoom/Teams, participant normalization, and local persistence of imported calendar meetings. Runtime smoke tested the no-credentials path; live OAuth sync requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
