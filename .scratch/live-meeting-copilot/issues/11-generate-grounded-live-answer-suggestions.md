Status: ready-for-agent

# Generate grounded live answer suggestions

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the Live Mode answer-assist path. The user can select or accept the latest question, click `What should I answer?`, and receive a concise answer grounded in transcript, calendar context, participants, and private notes.

## Acceptance criteria

- [x] User can trigger `What should I answer?` from Live Mode.
- [x] The request includes recent transcript context, meeting metadata, participants, and notes.
- [x] The generated answer is concise and sayable out loud.
- [x] The prompt tells the model not to fabricate missing facts, commitments, or expertise.
- [x] The answer suggestion is stored with its grounding sources.

## Blocked by

- `.scratch/live-meeting-copilot/issues/03-demo-live-and-minutes-modes-from-seed-data.md`
- `.scratch/live-meeting-copilot/issues/04-ingest-simulated-capture-events-end-to-end.md`

## Comments

- Implemented local grounded answer assist for the Electron shell. Live Mode now has selected/latest question and private notes fields; `What should I answer?` builds a concise answer from meeting metadata, participants, recent transcript context, and notes, includes an explicit no-fabrication guardrail, stores the answer suggestion with grounding source IDs, and rerenders it from local persistence.
