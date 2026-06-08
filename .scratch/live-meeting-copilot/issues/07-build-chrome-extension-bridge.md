Status: ready-for-agent

# Build Chrome extension bridge

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Build the Chrome extension foundation that can detect supported browser meeting pages, connect to the desktop app, and send structured transcript events. This slice should prove the bridge with a simple manually triggered event before platform-specific caption adapters are added.

## Acceptance criteria

- [x] Chrome extension can be loaded locally in developer mode.
- [x] Extension detects supported meeting URL patterns for Meet, Zoom Web, and Teams Web.
- [x] Extension can connect to the desktop app event bridge.
- [x] Extension can send a test transcript event that appears in Live Mode.
- [x] Connection status is visible in the desktop app.

## Blocked by

- `.scratch/live-meeting-copilot/issues/04-ingest-simulated-capture-events-end-to-end.md`

## Comments

- Implemented `browser-extension/` as a local-loadable Manifest V3 extension with supported Meet, Zoom Web, and Teams Web content-script matches. Added an Electron localhost bridge on `127.0.0.1:47843`; extension test events POST to the bridge, flow through the existing capture event bus, persist locally, and render in Live Mode. Verified bridge status and transcript POST endpoints via localhost smoke tests.
