import { validateTranscriptEvent } from "../src/contracts.js";

export const CAPTURE_TRANSCRIPT_EVENT = "capture:transcript-event";

export class CaptureEventBus extends EventTarget {
  emitTranscriptEvent(event) {
    const validation = validateTranscriptEvent(event);
    if (!validation.ok) throw new Error(validation.error);
    this.dispatchEvent(new CustomEvent(CAPTURE_TRANSCRIPT_EVENT, { detail: event }));
    return event;
  }

  onTranscriptEvent(listener) {
    const wrapped = (event) => listener(event.detail);
    this.addEventListener(CAPTURE_TRANSCRIPT_EVENT, wrapped);
    return () => this.removeEventListener(CAPTURE_TRANSCRIPT_EVENT, wrapped);
  }
}

export const captureEventBus = new CaptureEventBus();
