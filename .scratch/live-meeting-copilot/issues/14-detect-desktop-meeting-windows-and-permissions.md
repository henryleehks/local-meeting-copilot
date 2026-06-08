Status: ready-for-agent

# Detect desktop meeting windows and permissions

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the first Desktop Capture Agent slice: detect desktop meeting windows and guide the user through the native permissions needed for desktop capture. This should not yet attempt full OCR or audio transcription.

## Acceptance criteria

- [x] Desktop app can detect candidate Zoom, Teams, and Meet/Chrome meeting windows on macOS.
- [x] App shows which desktop meeting window is selected for capture.
- [x] App requests or explains required accessibility and screen recording permissions.
- [x] Capture can only start after explicit user confirmation.
- [x] Permission failure produces an actionable fallback message.

## Blocked by

- `.scratch/live-meeting-copilot/issues/01-adopt-electron-shell-and-event-contracts.md`

## Comments

- Added a macOS-first Desktop Capture Agent slice using System Events window enumeration via Electron IPC. Settings/Privacy now detects candidate Zoom, Teams, and Meet/Chrome windows, shows selected window state, requires explicit confirmation, and provides actionable Accessibility/Screen Recording permission guidance when detection fails.
