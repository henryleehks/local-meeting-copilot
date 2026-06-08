Status: ready-for-agent

# Add system audio diarization fallback with delete default

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the fallback path for meetings where platform captions, accessibility metadata, and OCR are unavailable. The app should capture system audio, transcribe/diarize it after the call, merge the result into transcript events, and delete audio by default after processing.

## Acceptance criteria

- [x] User can explicitly enable fallback system audio capture for a session.
- [x] Captured audio is used to produce diarized transcript events with low confidence unless mapped to known participants.
- [x] Audio is deleted by default after processing.
- [x] User can opt in to keeping audio for a specific meeting.
- [x] Minutes generation can use the fallback transcript.

## Blocked by

- `.scratch/live-meeting-copilot/issues/12-auto-generate-draft-minutes-on-stop.md`
- `.scratch/live-meeting-copilot/issues/14-detect-desktop-meeting-windows-and-permissions.md`

## Comments

- Added explicit fallback system-audio controls in Settings/Privacy. The user must enable fallback and click process; the app emits an `audio-diarization` transcript event with low source confidence and low/medium speaker confidence, defaults to deleting audio after processing, supports per-meeting keep opt-in, and generated Minutes Mode drafts consume the merged fallback transcript.
