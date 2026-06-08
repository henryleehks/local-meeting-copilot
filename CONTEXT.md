# Live Meeting Copilot Context

Live Meeting Copilot is a private assistant for high-stakes external calls where the user needs grounded live help and accurate post-call minutes. The first beachhead users are founders on investor/customer calls and job candidates in interviews.

## Language

**Beachhead User**:
A solo professional using Live Meeting Copilot privately on external calls where they do not control the meeting platform or attendee list.
_Avoid_: Team admin, enterprise recorder

**Founder Call**:
An investor or customer call where the user needs concise live answers, decisions, risks, follow-ups, and meeting minutes.
_Avoid_: Generic sales call

**Job Candidate Call**:
An interview call where the user needs grounded answer support without inventing credentials, numbers, commitments, or expertise.
_Avoid_: Interview cheating, fabricated answer

**Candidate Coding Assistance**:
Help for a job candidate on prep, mock interviews, disclosed or permitted take-home work, or allowed live coding tasks, including problem analysis, implementation support, debugging, and explanation.
_Avoid_: Generic coding assistant

**Evaluated Interview Boundary**:
The product must not provide stealth assistance during evaluated interviews or optimize for concealing AI help from an evaluator.
_Avoid_: Stealth interview copilot

**Meeting Type**:
The product context selected for a meeting, initially founder/customer call or candidate prep/mock interview.
_Avoid_: Generic meeting category

**Local-First App**:
A desktop product that stores meetings, transcript events, minutes, settings, and demo data locally by default, with optional external AI calls only when configured.
_Avoid_: Cloud workspace, SaaS account

**Live Mode**:
The in-meeting product surface for named transcript, speaker confidence, question awareness, and grounded answer suggestions.
_Avoid_: Recorder view

**Minutes Mode**:
The post-meeting product surface for editable minutes, decisions, action items, open questions, risks, and follow-up drafts.
_Avoid_: Summary add-on

**Start Live Assist**:
The explicit user action that begins capture for a meeting.
_Avoid_: Auto-start, background listening

**Transcript Event**:
A structured utterance with meeting, timestamp, speaker label, confidence, text, source, and source confidence.
_Avoid_: Raw transcript line

**Speaker Confidence**:
The confidence level attached to a speaker label based on platform metadata, accessibility data, OCR, diarization, or user correction.
_Avoid_: Speaker accuracy

**Audio Retention Policy**:
The per-meeting or default decision to delete audio after processing or explicitly keep it.
_Avoid_: Recording setting

## Relationships

- A **Beachhead User** may join a **Founder Call** or a **Job Candidate Call**.
- A **Job Candidate Call** may involve **Candidate Coding Assistance**.
- **Candidate Coding Assistance** must respect the **Evaluated Interview Boundary**.
- A meeting has one **Meeting Type** that adapts demo data, labels, and prompt templates.
- A **Local-First App** owns the primary meeting record before any external sharing or export.
- A **Beachhead User** must click **Start Live Assist** before capture begins.
- **Live Mode** renders **Transcript Events** during capture.
- **Minutes Mode** uses **Transcript Events** to produce editable post-call minutes.
- **Speaker Confidence** belongs to each **Transcript Event**.
- **Audio Retention Policy** applies to each captured meeting.

## Example Dialogue

> **Dev:** "Can we start listening when the calendar event begins?"
> **Domain expert:** "No. The **Beachhead User** must click **Start Live Assist** before **Live Mode** captures anything."

## Flagged Ambiguities

- "Solo professional" includes both **Founder Call** and **Job Candidate Call** use cases for V1; implementation language should support both without presenting the product as a generic meeting recorder.
- **Candidate Coding Assistance** is in scope for prep, mock interviews, disclosed assistance, and permitted evaluated tasks; stealth assistance during evaluated interviews is out of scope.
- The first demo should expose both founder/customer and candidate prep/mock interview **Meeting Types**, with founder/customer as the default.
- V1 is a **Local-First App**; account systems and cloud sync are not part of the core product yet.
