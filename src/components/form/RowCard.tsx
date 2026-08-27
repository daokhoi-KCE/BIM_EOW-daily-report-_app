import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";

export default function RowCard({
  children,
  onDelete,
  locked = false,
}: {
  children: ReactNode;
  onDelete: () => void;
  locked?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 space-y-2 relative ${
        locked ? "border-amber-300 bg-amber-50/60" : "border-slate-200 bg-slate-50"
      }`}
    >
      {children}
      {!locked && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-2 right-2 text-slate-400 hover:text-red-600 p-1"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}
