import { motion } from "framer-motion";
import { Square, WandSparkles } from "lucide-react";
import { createSimulatedCaptureEvent, simulatorSources } from "../../capture-simulator.js";
import { captureEventBus } from "../../capture-event-bus.js";
import { Badge, Button, Eyebrow, Panel } from "../components/ui";
import { TranscriptItem } from "../components/TranscriptItem";

export function LiveView({ meeting, captureStatus, latestQuestion, question, setQuestion, privateNotes, setPrivateNotes, suggestedAnswer, answerLoading, generateAnswer, stopCaptureAndDraftMinutes, eventBusStatus, bridgeStatus, simulatorStatus }: any) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.65fr)]">
      <Panel className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Eyebrow>Live Mode</Eyebrow>
            <h2 className="text-3xl font-semibold text-white">What should I answer?</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{meeting?.title || "No meeting loaded"} · {meeting?.platformLabel || "Unknown platform"} · {captureStatus}</p>
          </div>
          <Button variant="danger" onClick={stopCaptureAndDraftMinutes}>
            <Square className="size-4" />
            Stop and draft minutes
          </Button>
        </div>

        <div className="mt-8 rounded-2xl bg-black/35 p-5 ring-1 ring-white/10">
          <p className="text-xs font-bold uppercase text-zinc-500">Detected question</p>
          <p className="mt-3 text-2xl font-semibold leading-tight text-white">{latestQuestion}</p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <label className="grid gap-2 text-xs font-bold uppercase text-zinc-500">
            Selected or latest question
            <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={4} className="field" />
          </label>
          <label className="grid gap-2 text-xs font-bold uppercase text-zinc-500">
            Private notes
            <textarea value={privateNotes} onChange={(event) => setPrivateNotes(event.target.value)} rows={4} className="field" placeholder="Facts, constraints, goals, resume notes, customer context..." />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="primary" onClick={generateAnswer} disabled={answerLoading}>
            <WandSparkles className="size-4" />
            {answerLoading ? "Generating..." : "What should I answer?"}
          </Button>
        </div>

        <motion.div layout className="mt-5 rounded-2xl bg-lime-300/10 p-5 leading-7 text-lime-50 ring-1 ring-lime-300/20">
          {suggestedAnswer}
        </motion.div>
      </Panel>

      <div className="grid gap-5">
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow>Named transcript</Eyebrow>
              <h3 className="text-xl font-semibold">Supporting context</h3>
            </div>
            <Badge tone={captureStatus === "Live" ? "live" : "neutral"}>{captureStatus}</Badge>
          </div>
          <div className="mt-4 grid max-h-[440px] gap-3 overflow-auto pr-1">
            {(meeting?.transcriptEvents || []).map((event: any) => <TranscriptItem key={event.id} event={event} />)}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Eyebrow>Capture simulator</Eyebrow>
              <h3 className="text-xl font-semibold">Emit transcript event</h3>
            </div>
            <Badge>{eventBusStatus}</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{bridgeStatus}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {simulatorSources.map(({ source, label }: any) => (
              <Button key={source} onClick={() => captureEventBus.emitTranscriptEvent(createSimulatedCaptureEvent(meeting, source))} disabled={!meeting}>
                {label}
              </Button>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-500">{simulatorStatus}</p>
        </Panel>
      </div>
    </div>
  );
}
