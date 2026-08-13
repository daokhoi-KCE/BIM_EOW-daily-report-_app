import type { ReactNode } from "react";

export default function Field({
  label,
  en,
  children,
  className = "",
}: {
  label: string;
  en?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[12.5px] font-semibold text-slate-700 leading-tight">
        {label}
      </span>
      {en && (
        <span className="block text-[10.5px] italic text-slate-400 leading-tight mb-1">
          {en}
        </span>
      )}
      {!en && <span className="block mb-1" />}
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";
export const inputSm =
  "w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-[13px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";
