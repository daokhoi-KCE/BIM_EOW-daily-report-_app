export type SaveState = "saved" | "saving" | "dirty";

export default function SaveStateBadge({ state }: { state: SaveState }) {
  const cls =
    state === "saved"
      ? "bg-emerald-900/50 text-emerald-300"
      : state === "saving"
        ? "bg-amber-900/50 text-amber-300"
        : "bg-slate-700/50 text-slate-300";
  const label = state === "saved" ? "✓ đã lưu" : state === "saving" ? "đang lưu…" : "chưa lưu";

  return (
    <span className={`text-[10px] font-mono px-2 py-1 rounded shrink-0 ${cls}`}>{label}</span>
  );
}
