import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { NAVY } from "@/lib/theme";

export default function SectionCard({
  title,
  en,
  open,
  onToggle,
  badge,
  children,
  tint,
}: {
  title: string;
  en?: string;
  open: boolean;
  onToggle: () => void;
  badge?: ReactNode;
  children: ReactNode;
  tint?: string;
}) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        style={{ background: tint || NAVY }}
      >
        <span className="text-white font-bold text-[13.5px] flex-1">
          {title}
          {en && <span className="block text-[10.5px] font-normal text-white/70 italic">{en}</span>}
        </span>
        {badge}
        {open ? (
          <ChevronUp size={18} className="text-white/80 shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-white/80 shrink-0" />
        )}
      </button>
      {open && <div className="p-3.5 space-y-3">{children}</div>}
    </section>
  );
}
