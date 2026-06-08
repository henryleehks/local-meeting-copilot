Status: ready-for-agent

# Capture Teams Web captions and speaker labels

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the Teams Web browser adapter. When captions and speaker labels are available in a browser-based Teams meeting, the extension should stream named transcript events into the desktop app.

## Acceptance criteria

- [ ] Extension recognizes an active Teams Web meeting tab.
- [ ] Extension captures visible caption text where available.
- [ ] Extension captures or infers the visible speaker label where available.
- [ ] Captured events appear in Live Mode with source `teams-browser-caption`.
- [ ] The adapter degrades gracefully when captions are unavailable.

## Blocked by

- `.scratch/live-meeting-copilot/issues/07-build-chrome-extension-bridge.md`
- `.scratch/live-meeting-copilot/issues/06-connect-microsoft-calendar-and-detect-meetings.md`

## Comments
