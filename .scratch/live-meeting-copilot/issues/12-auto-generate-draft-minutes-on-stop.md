Status: ready-for-agent

# Auto-generate draft minutes on stop

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the Minutes Mode generation flow. When the user stops capture, the app should automatically clean the transcript and create draft meeting minutes for review.

## Acceptance criteria

- [x] Stopping a live session triggers draft minutes generation.
- [x] Minutes include executive summary, decisions, action items with owner/date, open questions, risks/blockers, and follow-up draft.
- [x] Low-confidence or unresolved speaker labels are preserved visibly.
- [x] User can edit the generated minutes locally.
- [x] Sharing/exporting is not automatic.

## Blocked by

- `.scratch/live-meeting-copilot/issues/03-demo-live-and-minutes-modes-from-seed-data.md`
- `.scratch/live-meeting-copilot/issues/04-ingest-simulated-capture-events-end-to-end.md`

## Comments

- Added `Stop Capture And Draft Minutes` in Live Mode. Stopping capture creates local draft minutes from current transcript events, preserves unresolved/low-confidence speaker labels, stores the draft in IndexedDB, and switches to editable Minutes Mode without any automatic sharing/export.
