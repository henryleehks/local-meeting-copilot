# ADR 0001: Start Rebuild With Electron Desktop Shell

## Status

Accepted

## Context

Live Meeting Copilot needs three cooperating surfaces:

- A desktop app for Live Mode, Minutes Mode, calendar state, storage, AI orchestration, and desktop capture.
- A Chrome extension for browser meeting capture and minimal overlay.
- A native capture layer for desktop Zoom, Teams, and Meet windows.

The next build step must choose whether to begin with the desktop shell, the Chrome extension capture path, or a Tauri/Electron runtime decision.

## Decision

Start with an Electron desktop shell.

The first implementation issue is `.scratch/live-meeting-copilot/issues/01-adopt-electron-shell-and-event-contracts.md`.

## Rationale

- The Chrome extension needs a receiving app and event contract before capture events are useful.
- Live Mode and Minutes Mode are equal product pillars, so the main shell should exist before platform adapters.
- Electron gives the fastest path from the current web prototype to a desktop app while preserving the existing JavaScript/HTML/CSS work.
- Electron has mature local development ergonomics for app UI, local services, WebSocket/native bridges, and Chrome extension-adjacent workflows.
- Tauri remains attractive later for footprint and native Rust modules, but choosing it now would slow the first tracer bullet while the capture contracts are still unsettled.

## Consequences

- V1 prioritizes delivery speed and integration flexibility over smallest binary size.
- Native desktop capture may still require platform-specific helpers or native modules.
- The Chrome extension begins after the desktop shell can receive and render simulated transcript events.
- If Electron becomes a bottleneck, a future ADR can revisit Tauri after the event contracts and product surfaces are stable.
