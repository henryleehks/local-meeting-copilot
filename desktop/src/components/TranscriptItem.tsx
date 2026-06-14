import { clsx } from "clsx";
import { SpeakerConfidence, validateTranscriptEvent } from "../../../src/contracts.js";
import { confidenceLabel, formatTime } from "../app/formatters";
import { Badge } from "./ui";

export function TranscriptItem({ event }: any) {
  const validation = validateTranscriptEvent(event);
  const isUncertain = [SpeakerConfidence.medium, SpeakerConfidence.low].includes(event.speakerConfidence);
  return (
    <article className={clsx("rounded-xl border border-white/10 bg-white/5 p-4", isUncertain && "border-amber-300/20")}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <strong>{event.speakerName}{isUncertain ? " ?" : ""}</strong>
        <span className="text-zinc-500">{formatTime(event.timestamp)}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-300">{event.text}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={isUncertain ? "warn" : "neutral"}>{confidenceLabel(event.speakerConfidence)}</Badge>
        <Badge>{event.source}</Badge>
        <Badge>{event.sourceConfidence} source</Badge>
        {!validation.ok && <Badge tone="warn">{validation.error}</Badge>}
      </div>
    </article>
  );
}
