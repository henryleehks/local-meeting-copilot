Status: ready-for-agent

# Ingest simulated capture events end to end

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Build the local capture-event ingestion path before real integrations exist. A simulator should stream transcript events into the desktop app using the same contract that the Chrome extension and Desktop Capture Agent will later use.

## Acceptance criteria

- [ ] A local event bus or bridge accepts structured transcript events.
- [ ] A simulator can emit events for Meet, Zoom, Teams, desktop accessibility, OCR, and audio diarization sources.
- [ ] Incoming events are persisted and rendered live in Live Mode.
- [ ] Speaker confidence and source confidence appear in the transcript UI.
- [ ] This path has a documented event schema that browser and desktop capture implementations can use.

## Blocked by

- `.scratch/live-meeting-copilot/issues/01-adopt-electron-shell-and-event-contracts.md`
- `.scratch/live-meeting-copilot/issues/02-persist-meetings-and-transcript-events-locally.md`

## Comments
