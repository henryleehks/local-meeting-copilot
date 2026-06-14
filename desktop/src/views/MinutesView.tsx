import { meetingTypeLabel, formatStructuredItem } from "../app/formatters";
import { ReadinessRow } from "../components/ReadinessRow";
import { Eyebrow, Panel } from "../components/ui";

export function MinutesView({ meeting, minutes }: any) {
  const sections = minutes ? [
    ["Executive summary", [minutes.summary]],
    ["Decisions", minutes.decisions.map((decision: any) => formatStructuredItem(decision))],
    ["Action items", minutes.actionItems.map((actionItem: any) => formatStructuredItem(actionItem))],
    ["Open questions", minutes.openQuestions],
    ["Risks or blockers", minutes.risks],
    ["Follow-up draft", [minutes.followUpDraft]],
    ["Unresolved speaker labels", minutes.unresolvedSpeakerLabels]
  ] : [];

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Panel>
        <Eyebrow>Minutes Mode</Eyebrow>
        <h2 className="text-2xl font-semibold text-white">{meeting?.title || "Draft minutes"}</h2>
        <div className="mt-5 grid gap-3 text-sm">
          <ReadinessRow label="Meeting type" value={meeting ? meetingTypeLabel(meeting.meetingType) : "Unknown"} />
          <ReadinessRow label="Platform" value={meeting?.platformLabel || "Unknown"} />
          <ReadinessRow label="Source" value={meeting?.transcriptEvents?.length ? `${meeting.transcriptEvents.length} local transcript events` : "No transcript events yet"} />
        </div>
      </Panel>

      <article contentEditable suppressContentEditableWarning aria-label="Editable meeting minutes draft" className="min-h-[640px] rounded-2xl bg-zinc-50 p-8 text-zinc-950 shadow-2xl shadow-black/30 outline-none">
        {!minutes ? (
          <p>No minutes draft exists for this meeting yet.</p>
        ) : (
          sections.map(([title, items]: any) => (
            <section key={title} className="border-t border-zinc-200 py-5 first:border-t-0 first:pt-0">
              <h3 className="text-sm font-bold uppercase text-zinc-500">{title}</h3>
              {items.length === 1 && !["Decisions", "Action items", "Open questions", "Risks or blockers"].includes(title) ? (
                <p className="mt-3 leading-7">{items[0]}</p>
              ) : (
                <ul className="mt-3 list-disc space-y-2 pl-5 leading-7">
                  {items.map((item: string, index: number) => <li key={`${title}-${index}`}>{item}</li>)}
                </ul>
              )}
            </section>
          ))
        )}
      </article>
    </div>
  );
}
