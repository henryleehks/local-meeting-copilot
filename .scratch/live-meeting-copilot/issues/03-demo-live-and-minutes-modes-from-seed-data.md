Status: ready-for-agent

# Demo Live and Minutes modes from seed data

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Create the first real desktop UI slice using seed data: a user can open a demo meeting, see Live Mode with named transcript events and speaker confidence markers, then switch to Minutes Mode and review a draft minutes document.

## Acceptance criteria

- [x] Live Mode shows current meeting title, platform, capture status, transcript timeline, and speaker confidence markers.
- [x] Minutes Mode shows summary, decisions, action items, open questions, risks, and follow-up draft.
- [x] The user can move between Live Mode and Minutes Mode without losing selected meeting state.
- [x] Low-confidence speakers are visibly marked rather than hidden.
- [x] The UI uses the PRD vocabulary consistently.

## Blocked by

- `.scratch/live-meeting-copilot/issues/01-adopt-electron-shell-and-event-contracts.md`
- `.scratch/live-meeting-copilot/issues/02-persist-meetings-and-transcript-events-locally.md`

## Comments

- Implemented mode-level selected meeting summaries, visible Live Mode capture state, platform labels, explicit speaker confidence chips, and an editable Minutes Mode draft rendered from the persisted seed dataset.
