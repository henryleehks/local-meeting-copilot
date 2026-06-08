Status: ready-for-agent

# Add minimal in-meeting overlay

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the small companion overlay in browser meeting pages. The overlay should not replace the desktop app; it should provide only the in-call essentials.

## Acceptance criteria

- [x] Overlay can appear in supported browser meeting pages.
- [x] Overlay shows listening/connection status.
- [x] Overlay shows the latest detected or selected question.
- [x] Overlay can trigger `What should I answer?`.
- [x] Overlay shows a short suggested answer without exposing the full dashboard.

## Blocked by

- `.scratch/live-meeting-copilot/issues/07-build-chrome-extension-bridge.md`
- `.scratch/live-meeting-copilot/issues/11-generate-grounded-live-answer-suggestions.md`

## Comments

- Replaced the one-off extension test button with a compact in-meeting overlay for supported browser meeting pages. It shows desktop bridge connection status, latest detected question from captions, a `What should I answer?` trigger, and a short answer preview without exposing the full desktop dashboard.
