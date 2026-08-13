import { Plus } from "lucide-react";

export default function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 text-[13px] font-semibold hover:border-amber-400 hover:text-amber-600"
    >
      <Plus size={15} /> {label}
    </button>
  );
}
