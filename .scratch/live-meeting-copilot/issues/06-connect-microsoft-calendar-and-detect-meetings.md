Status: ready-for-agent

# Connect Microsoft Calendar and detect meetings

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add Microsoft authorization and calendar read support so Outlook/Teams users can see current and upcoming calls. The app should parse Teams, Zoom, and Meet links from Microsoft calendar events and normalize participant names/emails.

## Acceptance criteria

- [ ] User can connect and disconnect Microsoft Calendar.
- [ ] Current and upcoming Microsoft calendar events appear in the desktop app.
- [ ] Teams, Zoom, and Meet meeting URLs are detected from event fields.
- [ ] Participants are normalized into the shared Participant model.
- [ ] User must explicitly click `Start Live Assist`; capture never starts automatically.

## Blocked by

- `.scratch/live-meeting-copilot/issues/01-adopt-electron-shell-and-event-contracts.md`
- `.scratch/live-meeting-copilot/issues/02-persist-meetings-and-transcript-events-locally.md`

## Comments
