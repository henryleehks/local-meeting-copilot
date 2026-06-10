# Capture Event Schema

This schema is the shared ingestion contract for simulated capture, the future Chrome extension, and the Desktop Capture Agent.

## Transcript Event

```json
{
  "id": "event-123",
  "meetingId": "meeting-founder-northstar",
  "timestamp": "2026-06-08T09:36:10.000Z",
  "speakerName": "Maya Chen?",
  "speakerId": "p-founder-maya",
  "speakerConfidence": "medium",
  "text": "What would you need from us to make that pilot concrete?",
  "source": "desktop-ocr",
  "sourceConfidence": "medium"
}
```

## Required Fields

- `id`: Unique event id from the capture producer.
- `meetingId`: Local meeting id receiving the event.
- `timestamp`: ISO-8601 timestamp for when the utterance occurred or was captured.
- `speakerName`: Display label for the speaker, preserving uncertainty when needed.
- `speakerConfidence`: `high`, `medium`, `low`, or `user-corrected`.
- `text`: Captured utterance text.
- `source`: Capture source.
- `sourceConfidence`: `high`, `medium`, or `low`.

## Sources

- `meet-browser-caption`
- `zoom-browser-caption`
- `teams-browser-caption`
- `desktop-accessibility`
- `desktop-ocr`
- `audio-diarization`
- `manual-edit`
- `simulated`

## Ingestion Rule

Capture producers must send valid Transcript Events to the local capture event bus. The desktop app validates the event, persists it locally, and updates Live Mode using the same rendered timeline as seeded transcript events.

Browser extension producers must also match the active Live Assist session exposed by the desktop bridge. The bridge rejects browser transcript events when capture has not been started or when the event `meetingId` differs from the desktop app's active meeting.
