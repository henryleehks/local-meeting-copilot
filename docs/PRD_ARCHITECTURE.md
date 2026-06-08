# Live Meeting Copilot PRD And Architecture

## Status

This document captures the agreed product direction from the grill-me session on June 5, 2026.

The current localhost web app is a throwaway prototype for learning the workflows. It is not the target architecture.

## Working Name

Live Meeting Copilot

## Positioning

Live Meeting Copilot helps solo professionals handle external calls by capturing platform speaker context, suggesting grounded live answers, and auto-producing meeting minutes after the call.

## Target User

The first target user is a solo professional using the product privately across external calls.

Examples:

- Job candidate in interviews
- Founder on investor or customer calls
- Salesperson on discovery calls
- Consultant on client calls

The first user may not control the meeting platform, meeting settings, or attendee list. They need the product to work across Google Meet, Zoom, and Microsoft Teams, including browser and desktop meetings.

## Core Product Promise

The product has two equal first-class modes:

- Live Mode: helps the user during the meeting with named live transcript, question awareness, and grounded answer suggestions.
- Minutes Mode: creates accurate post-meeting minutes, decisions, action items, open questions, risks, and follow-up drafts.

Meeting minutes are not a secondary utility. They are a main product surface alongside live assistance.

## UX Principles

- User-confirmed capture only. The app must never silently start listening just because a calendar event begins.
- Grounded assistance only. The app helps the user answer from transcript, calendar context, notes, and prep material; it must not fabricate credentials, numbers, commitments, or expertise.
- Automatic where possible, transparent where uncertain. Speaker names should be automatic, but the UI must carry confidence instead of pretending low-confidence recognition is perfect.
- Audio is sensitive fallback data. Structured transcript events are the primary artifact. Audio recordings are deleted by default after processing unless the user explicitly keeps them.
- Dashboard first, minimal overlay second. The app should have a full desktop dashboard and a small in-meeting overlay companion.

## V1 Scope

V1 must include:

- Desktop app shell as the main product surface.
- Chrome extension companion for browser meeting capture.
- Google and Microsoft calendar authorization.
- Calendar-based meeting detection for Google Meet, Zoom, and Microsoft Teams links.
- Explicit `Start Live Assist` control for each session.
- First-class browser capture for Google Meet, Zoom Web, and Teams Web.
- Desktop capture support for Zoom, Teams, and Meet desktop or standalone windows through native accessibility, screen/caption reading, OCR, and system audio fallback.
- Live transcript with speaker name, timestamp, text, source, and confidence.
- `What should I answer?` live answer generation.
- Equal `Live` and `Minutes` product modes.
- Auto-generated draft minutes immediately after capture stops.
- Audio deleted by default after transcription/diarization/minutes processing.

V1 should include a minimal overlay if it does not slow down the core capture and minutes engine:

- Listening status
- Latest detected question
- `What should I answer?`
- Short suggested answer

## Later Scope

Later releases may include:

- Polished floating overlay across all platforms
- Exports to Google Docs, Notion, Slack, CRM, or email
- Team workspace and admin controls
- Voice enrollment
- Custom user knowledge base
- Mobile app
- Bot participant that joins meetings

## Non-Goals For V1

- Enterprise team recorder
- Bot that joins the call
- Silent background meeting capture
- Perfect audio-only speaker recognition with no platform metadata
- Manual participant entry as the primary speaker naming path
- Building only a generic meeting recorder

## Meeting Flow

1. User signs in with Google and/or Microsoft.
2. App reads upcoming calendar events.
3. App highlights the likely current meeting and shows participants from the invite.
4. User clicks `Start Live Assist`.
5. App chooses the best capture strategy based on platform and environment.
6. Live Mode opens with transcript, speaker labels, confidence states, and answer assist.
7. Optional minimal overlay appears in the meeting surface.
8. User clicks `Stop`.
9. App finalizes transcript, deletes or retains audio according to policy, and auto-generates draft minutes.
10. User reviews and edits Minutes Mode before exporting or sharing.

## Capture Strategy

The product should prefer platform speaker/caption metadata over raw audio.

Priority order:

1. Platform-native caption and speaker metadata from browser integrations.
2. Platform-native or accessibility-readable speaker/caption metadata from desktop apps.
3. OCR over visible captions/speaker names.
4. System audio transcription and diarization fallback.
5. Manual correction only when automatic confidence is low.

### Google Meet

Browser Google Meet should be the first full integration path.

Preferred capture:

- Chrome extension detects Meet tab.
- Extension reads visible captions and speaker labels.
- Extension can turn on captions if permitted.
- Extension streams structured transcript events to the desktop app.

Desktop or standalone Meet should use the desktop capture layer if browser metadata is unavailable.

### Zoom

Zoom must be first-class in V1 for both browser and desktop.

Preferred browser capture:

- Chrome extension detects Zoom Web meeting.
- Extension reads caption and speaker UI where available.
- Extension streams structured events to the desktop app.

Preferred desktop capture:

- Native desktop agent observes Zoom window using accessibility APIs.
- If accessibility metadata is insufficient, OCR reads visible captions/speaker labels.
- System audio transcription/diarization is fallback.

### Microsoft Teams

Teams must be first-class in V1 for both browser and desktop.

Preferred browser capture:

- Chrome extension detects Teams Web meeting.
- Extension reads captions and speaker labels where available.
- Extension streams structured events to the desktop app.

Preferred desktop capture:

- Native desktop agent observes Teams window using accessibility APIs.
- OCR reads visible captions/speaker labels if needed.
- System audio transcription/diarization is fallback.

## Speaker Recognition

The product should automatically know likely participant names from calendar attendees.

Speaker identification sources:

- Calendar attendee list
- Platform speaker labels
- Visible captions
- Accessibility tree
- OCR over active speaker or caption area
- Diarization clusters from audio fallback

Speaker labels must include confidence:

- High: platform metadata or accessibility metadata directly identifies the speaker.
- Medium: OCR/caption context matches a calendar attendee.
- Low: diarization cluster or inferred mapping only.

Display examples:

- `Henry` for high confidence
- `Henry?` for medium confidence
- `Speaker 2` for low confidence

Minutes should use real names where confidence is high or user-corrected. If confidence is low, minutes should preserve uncertainty.

## Data Model

### Meeting

- `id`
- `title`
- `platform`
- `calendarEventId`
- `joinUrl`
- `startTime`
- `endTime`
- `participants`
- `capturePolicy`
- `audioRetentionPolicy`

### Participant

- `id`
- `displayName`
- `email`
- `calendarSource`
- `role`

### Transcript Event

- `id`
- `meetingId`
- `timestamp`
- `speakerName`
- `speakerId`
- `speakerConfidence`
- `text`
- `source`
- `sourceConfidence`

Allowed `source` examples:

- `meet-browser-caption`
- `zoom-browser-caption`
- `teams-browser-caption`
- `desktop-accessibility`
- `desktop-ocr`
- `audio-diarization`
- `manual-edit`

### Answer Suggestion

- `id`
- `meetingId`
- `createdAt`
- `triggerText`
- `contextWindow`
- `suggestedAnswer`
- `groundingSources`

### Meeting Minutes

- `id`
- `meetingId`
- `createdAt`
- `summary`
- `decisions`
- `actionItems`
- `openQuestions`
- `risks`
- `followUpDraft`
- `unresolvedSpeakerLabels`

## Product Surfaces

### Desktop App

The desktop app is the main shell.

Primary sections:

- Calendar/home
- Live Mode
- Minutes Mode
- Settings/privacy

Live Mode should show:

- Current meeting and platform
- Capture status
- Live named transcript
- Speaker confidence markers
- Latest question or selected question
- `What should I answer?`
- Suggested answer

Minutes Mode should show:

- Clean transcript
- Draft meeting minutes
- Decisions
- Action items with owner and due date
- Open questions
- Risks/blockers
- Follow-up draft
- Export actions later

### Chrome Extension

The Chrome extension captures browser meeting context for Meet, Zoom Web, and Teams Web.

Responsibilities:

- Detect active meeting pages.
- Read captions and speaker labels.
- Send structured events to the desktop app.
- Host minimal overlay where feasible.

The extension should not be the full product UI.

### Desktop Capture Agent

The desktop app needs native capture capabilities.

Responsibilities:

- Detect meeting app windows.
- Request accessibility and screen recording permissions.
- Read accessibility tree where available.
- OCR captions/speaker names when needed.
- Capture system audio only as fallback.

## Privacy And Retention

- Capture starts only after explicit user action.
- Audio is deleted by default after processing.
- User can opt in to retaining audio per meeting.
- Transcript and minutes are retained locally by default.
- Sharing/exporting requires explicit user action.
- The UI should clearly show capture status.

## Technical Architecture

Recommended architecture:

- Desktop app: Electron for V1. See `docs/adr/0001-electron-shell-first.md`.
- Native capture layer: platform-specific modules for macOS first, then Windows.
- Chrome extension: content scripts for Meet, Zoom Web, Teams Web.
- Local event bus: WebSocket or native bridge between extension and desktop app.
- AI service layer: transcript cleanup, live answer generation, diarization fallback, minutes generation.
- Local storage: SQLite for meetings, transcript events, minutes, and settings.

### Suggested Runtime Components

- `desktop-app`
  - Calendar connection UI
  - Live Mode UI
  - Minutes Mode UI
  - Settings/privacy UI
  - Local storage
  - AI orchestration

- `browser-extension`
  - Platform detectors
  - Caption/speaker adapters
  - Minimal overlay
  - Local bridge client

- `capture-agent`
  - Window detection
  - Accessibility capture
  - OCR capture
  - System audio fallback

- `integration-service`
  - Google Calendar
  - Microsoft Calendar
  - Meeting URL parsing
  - Participant normalization

## Key Technical Risks

- Desktop Zoom/Teams speaker metadata may not be consistently exposed through accessibility APIs.
- OCR over captions can be brittle if UI layout changes.
- Captions may be disabled, unavailable, or host-controlled.
- Browser DOM structures for Meet/Zoom/Teams can change without notice.
- System audio capture and accessibility permissions require careful user onboarding.
- Perfect raw audio speaker-to-name mapping is not feasible without platform metadata, voice enrollment, or user correction.

## Acceptance Criteria For V1

- User can connect calendar and see current/upcoming meetings with participants.
- User can start a session manually from a meeting.
- Browser Google Meet, Zoom Web, and Teams Web produce named transcript events when captions/speaker labels are visible.
- Desktop Zoom/Teams/Meet have a native capture path with confidence states and fallback.
- Live Mode shows transcript, speaker confidence, and answer suggestions.
- Stopping capture automatically creates draft minutes.
- Minutes include summary, decisions, action items, open questions, risks, and follow-up draft.
- Audio is deleted by default after processing.
- Uncertain speaker labels are visible rather than hidden.

## Milestone Plan

### Milestone 1: Product Foundation

- Replace prototype plan with desktop-app architecture.
- Define data model and event contracts.
- Build static desktop UI mock for Live and Minutes modes.
- Implement local SQLite storage.

### Milestone 2: Calendar And Meeting Detection

- Add Google auth and Calendar read.
- Add Microsoft auth and Calendar read.
- Parse Meet, Zoom, and Teams links.
- Show current/upcoming meetings and participants.

### Milestone 3: Browser Capture

- Build Chrome extension.
- Add Google Meet caption/speaker adapter.
- Add Zoom Web adapter.
- Add Teams Web adapter.
- Stream structured transcript events to desktop app.

### Milestone 4: Live Assist

- Implement transcript event timeline.
- Add speaker confidence display.
- Add question selection/detection.
- Add grounded answer suggestions.
- Add minimal overlay.

### Milestone 5: Minutes Mode

- Auto-generate draft minutes on stop.
- Add editable minutes UI.
- Add transcript cleanup.
- Add action-item extraction with owner/date.

### Milestone 6: Desktop Capture

- Add desktop window detection.
- Add accessibility capture.
- Add OCR fallback.
- Add system audio transcription/diarization fallback.
- Delete audio by default after processing.

## Open Questions

- Should macOS be the first desktop platform?
- Which OCR engine should be used locally or remotely?
- Should voice enrollment be considered in V1.5 for better speaker mapping?
- What export destination should come first after local minutes: Google Docs, email, Notion, or Slack?
