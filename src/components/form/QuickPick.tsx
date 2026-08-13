import { NAVY } from "@/lib/theme";

export default function QuickPick({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(value === o ? "" : o)}
          className={`px-2.5 py-1.5 rounded-md text-[12px] font-semibold border ${
            value === o ? "text-white" : "bg-white border-slate-300 text-slate-600"
          }`}
          style={value === o ? { background: NAVY, borderColor: NAVY } : {}}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
