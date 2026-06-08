Status: ready-for-agent

# Capture Teams Web captions and speaker labels

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the Teams Web browser adapter. When captions and speaker labels are available in a browser-based Teams meeting, the extension should stream named transcript events into the desktop app.

## Acceptance criteria

- [x] Extension recognizes an active Teams Web meeting tab.
- [x] Extension captures visible caption text where available.
- [x] Extension captures or infers the visible speaker label where available.
- [x] Captured events appear in Live Mode with source `teams-browser-caption`.
- [x] The adapter degrades gracefully when captions are unavailable.

## Blocked by

- `.scratch/live-meeting-copilot/issues/07-build-chrome-extension-bridge.md`
- `.scratch/live-meeting-copilot/issues/06-connect-microsoft-calendar-and-detect-meetings.md`

## Comments

- Generalized the browser caption observer for Teams Web URL matches. The adapter scans visible live-caption regions, parses direct speaker labels where available, falls back to medium-confidence `Teams speaker`, and emits `teams-browser-caption` events through the existing extension bridge.
