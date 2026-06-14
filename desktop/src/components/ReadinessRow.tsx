import { Check, ChevronRight } from "lucide-react";

export function ReadinessRow({ label, value }: any) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-5 flex-none place-items-center rounded-full bg-lime-300/14 text-lime-200">
        <Check className="size-3" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase text-zinc-500">{label}</p>
        <p className="break-words text-sm leading-5 text-zinc-300">{value}</p>
      </div>
      <ChevronRight className="ml-auto size-4 flex-none text-zinc-700" />
    </div>
  );
}
