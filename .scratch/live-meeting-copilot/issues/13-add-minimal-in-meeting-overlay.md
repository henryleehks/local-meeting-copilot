Status: ready-for-agent

# Add minimal in-meeting overlay

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the small companion overlay in browser meeting pages. The overlay should not replace the desktop app; it should provide only the in-call essentials.

## Acceptance criteria

- [ ] Overlay can appear in supported browser meeting pages.
- [ ] Overlay shows listening/connection status.
- [ ] Overlay shows the latest detected or selected question.
- [ ] Overlay can trigger `What should I answer?`.
- [ ] Overlay shows a short suggested answer without exposing the full dashboard.

## Blocked by

- `.scratch/live-meeting-copilot/issues/07-build-chrome-extension-bridge.md`
- `.scratch/live-meeting-copilot/issues/11-generate-grounded-live-answer-suggestions.md`

## Comments
