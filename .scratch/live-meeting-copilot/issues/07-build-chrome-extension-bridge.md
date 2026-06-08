Status: ready-for-agent

# Build Chrome extension bridge

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Build the Chrome extension foundation that can detect supported browser meeting pages, connect to the desktop app, and send structured transcript events. This slice should prove the bridge with a simple manually triggered event before platform-specific caption adapters are added.

## Acceptance criteria

- [ ] Chrome extension can be loaded locally in developer mode.
- [ ] Extension detects supported meeting URL patterns for Meet, Zoom Web, and Teams Web.
- [ ] Extension can connect to the desktop app event bridge.
- [ ] Extension can send a test transcript event that appears in Live Mode.
- [ ] Connection status is visible in the desktop app.

## Blocked by

- `.scratch/live-meeting-copilot/issues/04-ingest-simulated-capture-events-end-to-end.md`

## Comments
