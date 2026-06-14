export function StatusTile({ icon: Icon, label, value }: any) {
  return (
    <div className="rounded-xl bg-black/25 p-4 ring-1 ring-white/10">
      <div className="mb-3 flex items-center gap-2 text-zinc-500">
        <Icon className="size-4" />
        <span className="text-xs font-bold uppercase">{label}</span>
      </div>
      <p className="text-sm font-semibold leading-5 text-zinc-200">{value}</p>
    </div>
  );
}
