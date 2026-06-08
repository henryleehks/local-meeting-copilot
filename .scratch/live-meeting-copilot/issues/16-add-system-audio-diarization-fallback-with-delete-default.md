Status: ready-for-agent

# Add system audio diarization fallback with delete default

## Parent

`docs/PRD_ARCHITECTURE.md`

## What to build

Add the fallback path for meetings where platform captions, accessibility metadata, and OCR are unavailable. The app should capture system audio, transcribe/diarize it after the call, merge the result into transcript events, and delete audio by default after processing.

## Acceptance criteria

- [ ] User can explicitly enable fallback system audio capture for a session.
- [ ] Captured audio is used to produce diarized transcript events with low confidence unless mapped to known participants.
- [ ] Audio is deleted by default after processing.
- [ ] User can opt in to keeping audio for a specific meeting.
- [ ] Minutes generation can use the fallback transcript.

## Blocked by

- `.scratch/live-meeting-copilot/issues/12-auto-generate-draft-minutes-on-stop.md`
- `.scratch/live-meeting-copilot/issues/14-detect-desktop-meeting-windows-and-permissions.md`

## Comments
