import { AudioLines, Lock, Mic, Plug, Radar, Sparkles, WandSparkles } from "lucide-react";
import { clsx } from "clsx";
import { MeetingTypes } from "../../../src/contracts.js";
import { Badge, Button, Eyebrow, Panel } from "../components/ui";
import { ReadinessRow } from "../components/ReadinessRow";
import { StatusTile } from "../components/StatusTile";

export function HomeView({ meeting, providers, captureStatus, dbStatus, aiStatus, bridgeStatus, meetingType, setMeetingType, startLiveAssist, setActiveTab }: any) {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_420px]">
      <Panel className="relative overflow-hidden p-7 sm:p-8">
        <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-lime-300/20 bg-lime-300/5 blur-2xl sm:block" />
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="live"><Sparkles className="size-3.5" /> Current meeting</Badge>
          <Badge>{meeting?.platformLabel || "No platform"}</Badge>
          <Badge>{captureStatus}</Badge>
        </div>
        <div className="mt-16 max-w-4xl">
          <Eyebrow>Ready when the call starts</Eyebrow>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] text-white sm:text-7xl">
            {meeting?.title || "Loading meeting..."}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">{meeting?.summary || "Preparing the local meeting record."}</p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary" onClick={startLiveAssist} disabled={!meeting}>
            <Mic className="size-4" />
            Start Live Assist
          </Button>
          <Button onClick={() => setActiveTab("settings")}>
            <Plug className="size-4" />
            Integrations
          </Button>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatusTile icon={Lock} label="Storage" value={dbStatus} />
          <StatusTile icon={Radar} label="Capture" value="Chrome extension + manual start" />
          <StatusTile icon={AudioLines} label="Audio" value="Optional microphone fallback" />
          <StatusTile icon={WandSparkles} label="AI" value={aiStatus} />
        </div>
      </Panel>

      <div className="grid gap-5">
        <Panel>
          <Eyebrow>Meeting type</Eyebrow>
          <div className="grid grid-cols-2 gap-2">
            {[
              [MeetingTypes.founderCustomer, "Founder"],
              [MeetingTypes.candidatePrep, "Candidate"]
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setMeetingType(value)}
                className={clsx("rounded-xl px-3 py-3 text-sm font-semibold transition ring-1", meetingType === value ? "bg-lime-300 text-black ring-lime-300" : "bg-white/6 text-zinc-300 ring-white/10 hover:bg-white/10")}
              >
                {label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel>
          <Eyebrow>Live assist preview</Eyebrow>
          <div className="rounded-xl bg-black/35 p-4 ring-1 ring-white/10">
            <p className="text-sm text-zinc-500">Latest question</p>
            <p className="mt-2 text-lg font-semibold text-white">{meeting?.answerSuggestion?.triggerText || "No detected question yet."}</p>
            <div className="mt-4 rounded-xl bg-lime-300/10 p-4 text-sm leading-6 text-lime-50 ring-1 ring-lime-300/20">
              {meeting?.answerSuggestion?.suggestedAnswer || "Grounded suggestions appear here during Live Mode."}
            </div>
          </div>
        </Panel>

        <Panel>
          <Eyebrow>Readiness</Eyebrow>
          <div className="grid gap-3">
            <ReadinessRow label="Extension bridge" value={bridgeStatus} />
            <ReadinessRow label="Google" value={providers.google.status} />
            <ReadinessRow label="Microsoft" value={providers.microsoft.status} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
