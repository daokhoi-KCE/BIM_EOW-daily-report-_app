import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

export default function RowCard({
  children,
  onDelete,
}: {
  children: ReactNode;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2 relative">
      {children}
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-2 right-2 text-slate-400 hover:text-red-600 p-1"
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
}
