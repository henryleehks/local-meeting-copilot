Status: ready-for-agent

# Capture Google Meet captions and speaker labels

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the first platform adapter for browser meetings: Google Meet. When captions and speaker labels are visible, the extension should stream named transcript events into the desktop app with high or medium confidence.

## Acceptance criteria

- [ ] Extension recognizes an active Google Meet tab.
- [ ] Extension captures visible caption text.
- [ ] Extension captures or infers the visible speaker label.
- [ ] Captured events appear in Live Mode with source `meet-browser-caption`.
- [ ] Speaker confidence is set according to whether the speaker label was directly captured or inferred.

## Blocked by

- `.scratch/live-meeting-copilot/issues/07-build-chrome-extension-bridge.md`
- `.scratch/live-meeting-copilot/issues/05-connect-google-calendar-and-detect-meetings.md`

## Comments
