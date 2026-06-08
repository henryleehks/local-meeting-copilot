Status: ready-for-agent

# Capture Google Meet captions and speaker labels

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the first platform adapter for browser meetings: Google Meet. When captions and speaker labels are visible, the extension should stream named transcript events into the desktop app with high or medium confidence.

## Acceptance criteria

- [x] Extension recognizes an active Google Meet tab.
- [x] Extension captures visible caption text.
- [x] Extension captures or infers the visible speaker label.
- [x] Captured events appear in Live Mode with source `meet-browser-caption`.
- [x] Speaker confidence is set according to whether the speaker label was directly captured or inferred.

## Blocked by

- `.scratch/live-meeting-copilot/issues/07-build-chrome-extension-bridge.md`
- `.scratch/live-meeting-copilot/issues/05-connect-google-calendar-and-detect-meetings.md`

## Comments

- Implemented the first Google Meet content-script adapter. It observes visible caption-like regions on `meet.google.com`, parses direct speaker labels from `Speaker: text` or label-plus-caption layouts, falls back to medium-confidence inferred speaker labels, emits `meet-browser-caption` events through the extension bridge, and dedupes repeated caption text. Verified the bridge accepts a Meet-caption-shaped event.
