Status: ready-for-agent

# Capture desktop captions via accessibility and OCR

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add desktop caption/speaker capture for Zoom, Teams, and Meet windows using accessibility metadata first and OCR fallback second. Events should flow through the same ingestion path as browser capture.

## Acceptance criteria

- [ ] Accessibility capture can emit transcript events when caption/speaker text is exposed by the desktop app.
- [ ] OCR fallback can read visible captions or speaker labels from the selected meeting window.
- [ ] Events use source `desktop-accessibility` or `desktop-ocr`.
- [ ] Speaker/source confidence reflects the capture method.
- [ ] Events appear live in Live Mode and persist locally.

## Blocked by

- `.scratch/live-meeting-copilot/issues/04-ingest-simulated-capture-events-end-to-end.md`
- `.scratch/live-meeting-copilot/issues/14-detect-desktop-meeting-windows-and-permissions.md`

## Comments
