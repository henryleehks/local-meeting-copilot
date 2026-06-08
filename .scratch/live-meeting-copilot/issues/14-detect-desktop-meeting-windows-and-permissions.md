Status: ready-for-agent

# Detect desktop meeting windows and permissions

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the first Desktop Capture Agent slice: detect desktop meeting windows and guide the user through the native permissions needed for desktop capture. This should not yet attempt full OCR or audio transcription.

## Acceptance criteria

- [ ] Desktop app can detect candidate Zoom, Teams, and Meet/Chrome meeting windows on macOS.
- [ ] App shows which desktop meeting window is selected for capture.
- [ ] App requests or explains required accessibility and screen recording permissions.
- [ ] Capture can only start after explicit user confirmation.
- [ ] Permission failure produces an actionable fallback message.

## Blocked by

- `.scratch/live-meeting-copilot/issues/01-adopt-electron-shell-and-event-contracts.md`

## Comments
