Status: ready-for-agent

# Auto-generate draft minutes on stop

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the Minutes Mode generation flow. When the user stops capture, the app should automatically clean the transcript and create draft meeting minutes for review.

## Acceptance criteria

- [ ] Stopping a live session triggers draft minutes generation.
- [ ] Minutes include executive summary, decisions, action items with owner/date, open questions, risks/blockers, and follow-up draft.
- [ ] Low-confidence or unresolved speaker labels are preserved visibly.
- [ ] User can edit the generated minutes locally.
- [ ] Sharing/exporting is not automatic.

## Blocked by

- `.scratch/live-meeting-copilot/issues/03-demo-live-and-minutes-modes-from-seed-data.md`
- `.scratch/live-meeting-copilot/issues/04-ingest-simulated-capture-events-end-to-end.md`

## Comments
