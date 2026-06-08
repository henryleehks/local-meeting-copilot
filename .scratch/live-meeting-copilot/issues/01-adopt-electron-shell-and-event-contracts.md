Status: ready-for-agent

# Adopt Electron shell and shared event contracts

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Replace the prototype direction with an Electron desktop-app foundation that can host Live Mode and Minutes Mode, receive structured capture events, and run local services. Define the first version of the shared event contracts for meetings, participants, transcript events, answer suggestions, and meeting minutes.

Decision: start the rebuild with an Electron shell, not the Chrome extension. The extension needs a local event contract and receiving app before its capture events have somewhere meaningful to go.

## Acceptance criteria

- [ ] The app can launch as an Electron desktop shell in local development.
- [ ] The shell has placeholder navigation for Calendar/Home, Live Mode, Minutes Mode, and Settings/Privacy.
- [ ] Shared event contract types exist for Meeting, Participant, Transcript Event, Answer Suggestion, and Meeting Minutes.
- [ ] The README explains that Electron is the selected V1 desktop runtime and why.
- [ ] The old localhost prototype remains available or clearly marked as prototype-only.

## Blocked by

None - can start immediately

## Comments
