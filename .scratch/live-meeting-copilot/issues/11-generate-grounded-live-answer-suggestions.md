Status: ready-for-agent

# Generate grounded live answer suggestions

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the Live Mode answer-assist path. The user can select or accept the latest question, click `What should I answer?`, and receive a concise answer grounded in transcript, calendar context, participants, and private notes.

## Acceptance criteria

- [ ] User can trigger `What should I answer?` from Live Mode.
- [ ] The request includes recent transcript context, meeting metadata, participants, and notes.
- [ ] The generated answer is concise and sayable out loud.
- [ ] The prompt tells the model not to fabricate missing facts, commitments, or expertise.
- [ ] The answer suggestion is stored with its grounding sources.

## Blocked by

- `.scratch/live-meeting-copilot/issues/03-demo-live-and-minutes-modes-from-seed-data.md`
- `.scratch/live-meeting-copilot/issues/04-ingest-simulated-capture-events-end-to-end.md`

## Comments
