Status: ready-for-agent

# Persist meetings and transcript events locally

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add local persistence so the desktop app can store meetings, participants, transcript events, answer suggestions, minutes drafts, and privacy settings. This should support the full product loop: select meeting, capture events, stop capture, generate minutes, reopen later.

## Acceptance criteria

- [ ] A local database is initialized automatically in development.
- [ ] Meetings, participants, transcript events, answer suggestions, and meeting minutes can be created and read back.
- [ ] Transcript events preserve timestamp, speaker name, speaker confidence, text, source, and source confidence.
- [ ] Audio retention policy is persisted per meeting or setting.
- [ ] A small seed/demo dataset can populate the app without external integrations.

## Blocked by

- `.scratch/live-meeting-copilot/issues/01-adopt-electron-shell-and-event-contracts.md`

## Comments
