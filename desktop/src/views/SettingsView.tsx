import { Laptop } from "lucide-react";
import { clsx } from "clsx";
import { TranscriptSources } from "../../../src/contracts.js";
import { providerSeed } from "../app/constants";
import { Badge, Button, Eyebrow, Panel } from "../components/ui";

export function SettingsView({ providers, connectProvider, disconnectProvider, syncCalendar, loadMeetingById, desktopCapture, refreshDesktopWindows, setDesktopCapture, confirmDesktopWindow, emitDesktopCaption, systemAudioFallback, setSystemAudioFallback, keepAudio, setKeepAudio, processAudioFallback, audioFallbackStatus, audioPolicyLabel }: any) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel>
        <Eyebrow>Integrations</Eyebrow>
        <h2 className="text-2xl font-semibold">Calendar providers</h2>
        <div className="mt-5 grid gap-4">
          {(["google", "microsoft"] as const).map((id) => {
            const provider = providers[id];
            return (
              <div key={id} className="rounded-2xl bg-black/25 p-4 ring-1 ring-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{providerSeed[id].name}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-400">{provider.detail}</p>
                  </div>
                  <Badge tone={provider.status === "Connected" || provider.status === "Synced" ? "live" : "neutral"}>{provider.status}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => connectProvider(id)} disabled={!provider.configured || provider.connected || provider.busy}>Connect</Button>
                  <Button onClick={() => syncCalendar(id)} disabled={!provider.connected || provider.busy}>Sync events</Button>
                  <Button variant="ghost" onClick={() => disconnectProvider(id)} disabled={!provider.connected || provider.busy}>Disconnect</Button>
                </div>
                <div className="mt-4 grid gap-2">
                  {provider.events.length ? provider.events.map((item: any) => (
                    <button key={item.id} onClick={() => loadMeetingById(item.id)} className="rounded-xl bg-white/6 p-3 text-left ring-1 ring-white/10 transition hover:bg-white/10">
                      <strong className="block text-sm">{item.title}</strong>
                      <span className="text-xs text-zinc-500">{item.platformLabel} · {item.participants.length} participant{item.participants.length === 1 ? "" : "s"}</span>
                    </button>
                  )) : <p className="text-sm text-zinc-500">No imported meetings shown.</p>}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <Eyebrow>Privacy</Eyebrow>
        <h2 className="text-2xl font-semibold">{audioPolicyLabel}</h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Audio is fallback data and should be deleted by default unless a meeting explicitly opts in to keeping it.</p>
        <label className="mt-5 flex gap-3 text-sm text-zinc-300">
          <input type="checkbox" checked={systemAudioFallback} onChange={(event) => setSystemAudioFallback(event.target.checked)} />
          Enable microphone audio capture for this session
        </label>
        <label className="mt-3 flex gap-3 text-sm text-zinc-300">
          <input type="checkbox" checked={keepAudio} onChange={(event) => setKeepAudio(event.target.checked)} />
          Keep audio for this meeting instead of deleting after processing
        </label>
        <Button className="mt-4" onClick={processAudioFallback}>Process current microphone buffer</Button>
        <p className="mt-3 text-sm text-zinc-500">{audioFallbackStatus}</p>
      </Panel>

      <Panel className="xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Eyebrow>Desktop Capture Agent</Eyebrow>
            <h2 className="text-2xl font-semibold">Meeting windows and permissions</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{desktopCapture.help}</p>
          </div>
          <Badge tone={desktopCapture.status === "Confirmed" ? "live" : "neutral"}>{desktopCapture.status}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={refreshDesktopWindows}><Laptop className="size-4" />Refresh desktop windows</Button>
          <Button variant="primary" onClick={confirmDesktopWindow} disabled={!desktopCapture.selected}>Confirm selected window</Button>
          <Button onClick={() => emitDesktopCaption(TranscriptSources.desktopAccessibility)} disabled={desktopCapture.status !== "Confirmed"}>Emit accessibility caption</Button>
          <Button onClick={() => emitDesktopCaption(TranscriptSources.desktopOcr)} disabled={desktopCapture.status !== "Confirmed"}>Emit OCR fallback</Button>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {desktopCapture.windows.length ? desktopCapture.windows.map((item: any) => (
            <button
              key={`${item.appName}-${item.title}`}
              onClick={() => setDesktopCapture((current: any) => ({ ...current, selected: item, status: "Window selected" }))}
              className={clsx("rounded-xl p-3 text-left ring-1 transition", desktopCapture.selected === item ? "bg-lime-300/10 ring-lime-300/30" : "bg-white/6 ring-white/10 hover:bg-white/10")}
            >
              <strong className="block text-sm">{item.title}</strong>
              <span className="text-xs text-zinc-500">{item.appName} · {item.platformHint}</span>
            </button>
          )) : (
            <div className="rounded-xl bg-amber-300/10 p-4 text-sm leading-6 text-amber-100 ring-1 ring-amber-300/20">
              {desktopCapture.permissionHelp?.join(" ") || "No desktop windows checked yet."}
            </div>
          )}
        </div>
      </Panel>

      <Panel className="xl:col-span-2">
        <Eyebrow>Evaluated interview boundary</Eyebrow>
        <h2 className="text-2xl font-semibold">Grounded help only</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">Candidate workflows support prep, mock interviews, truthful recall, and disclosed or permitted coding help. The product should not optimize for concealing assistance from an evaluator.</p>
      </Panel>
    </div>
  );
}
