import type { YesNo } from "@/lib/types";

export default function YesNoToggle({
  value,
  onChange,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {(["Có / Yes", "Không / No"] as const).map((opt) => {
        const v: YesNo = opt.startsWith("Có") ? "Có" : "Không";
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(active ? "" : v)}
            className={`flex-1 py-2 rounded-md text-[12.5px] font-bold border transition-colors ${
              active
                ? v === "Có"
                  ? "bg-red-600 border-red-600 text-white"
                  : "bg-emerald-600 border-emerald-600 text-white"
                : "bg-white border-slate-300 text-slate-500"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
