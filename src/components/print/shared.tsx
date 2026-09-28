import type { SafetyItem } from "@/lib/types";
import { NAVY } from "@/lib/theme";

export const td = "text-[14px] align-top border-b border-slate-300 py-2 pr-2";

/**
 * Ô bảng cỡ nhỏ, dùng cho báo cáo tổng hợp.
 *
 * Bản final gộp dữ liệu của cả 22 trụ nên bảng nào cũng dài; cỡ chữ của báo
 * cáo ngày làm số trang phình ra và khó nhìn tổng thể. Báo cáo ngày giữ
 * nguyên `td` vì mỗi bản chỉ có một trụ, bảng ngắn, không cần nén.
 */
export const tdSm = "text-[11.5px] align-top border-b border-slate-300 py-1.5 pr-2";

export type Tier = "low" | "med" | "high" | "none";

export function severityTier(sev: string): Tier {
  const n = Number(sev);
  if (!n) return "none";
  if (n >= 4) return "high";
  if (n === 3) return "med";
  return "low";
}

export const TIER: Record<
  Tier,
  { text: string; border: string; bg: string; dot: string; en: string; vi: string }
> = {
  high: {
    text: "text-red-700",
    border: "border-red-500",
    bg: "bg-red-50",
    dot: "bg-red-500",
    en: "CRITICAL",
    vi: "Nghiêm trọng",
  },
  med: {
    text: "text-amber-700",
    border: "border-amber-500",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
    en: "MEDIUM",
    vi: "Trung bình",
  },
  low: {
    text: "text-emerald-700",
    border: "border-emerald-500",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
    en: "LOW",
    vi: "Thấp",
  },
  none: {
    text: "text-slate-500",
    border: "border-slate-300",
    bg: "bg-slate-50",
    dot: "bg-slate-300",
    en: "N/A",
    vi: "Chưa rõ",
  },
};

export function delayColor(d: number | null) {
  if (d === null) return "";
  if (d > 15) return "text-red-700";
  if (d > 0) return "text-amber-700";
  return "text-emerald-700";
}

/** `compact`: cỡ chữ của báo cáo tổng hợp — nhỏ hơn báo cáo ngày. */
export function SectionTitle({ en, vi, compact = false }: { en: string; vi: string; compact?: boolean }) {
  return (
    <div
      className={`avoid-break rounded-md ${compact ? "mt-5 mb-2.5 px-3 py-2" : "mt-6 mb-3 px-3.5 py-2.5"}`}
      style={{ background: NAVY }}
    >
      <h2
        className={`${compact ? "text-[16px]" : "text-[19px]"} font-extrabold uppercase tracking-wide leading-tight text-white`}
      >
        {en}
      </h2>
      <div className={`${compact ? "text-[9.5px]" : "text-[11.5px]"} italic text-white/70 leading-tight`}>
        {vi}
      </div>
    </div>
  );
}

export function InfoRow({
  en,
  vi,
  value,
  compact = false,
}: {
  en: string;
  vi: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`avoid-break rounded-md ${compact ? "p-2" : "p-2.5"}`}
      style={{ background: "rgba(31,53,82,0.05)", border: "1px solid rgba(31,53,82,0.15)" }}
    >
      <div
        className={`${compact ? "text-[10px]" : "text-[12px]"} font-bold uppercase tracking-wide leading-tight`}
        style={{ color: NAVY }}
      >
        {en}
      </div>
      <div className={`${compact ? "text-[8.5px]" : "text-[10px]"} italic text-slate-400 leading-tight`}>
        {vi}
      </div>
      <div
        className={`${compact ? "text-[12.5px] min-h-[16px]" : "text-[15px] min-h-[19px]"} font-semibold text-slate-900 mt-1`}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export function ThCell({ en, vi, compact = false }: { en: string; vi: string; compact?: boolean }) {
  return (
    <th
      className={`text-left border-b-2 align-bottom ${compact ? "py-1.5 px-2" : "py-2.5 px-2.5"}`}
      style={{ borderColor: NAVY }}
    >
      <div
        className={`${compact ? "text-[10.5px]" : "text-[12.5px]"} font-bold uppercase tracking-wide leading-tight`}
        style={{ color: NAVY }}
      >
        {en}
      </div>
      <div className={`${compact ? "text-[8px]" : "text-[9.5px]"} italic text-slate-400 normal-case leading-tight`}>
        {vi}
      </div>
    </th>
  );
}

export function SafetyBox({ en, vi, item }: { en: string; vi: string; item: SafetyItem }) {
  const flagged = item.yn === "Có";
  return (
    <div
      className={`avoid-break rounded-md border p-3.5 ${
        flagged ? "border-red-400 bg-red-50" : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span>
          <span className="block text-[13px] font-bold text-slate-800 leading-tight">{en}</span>
          <span className="block text-[10px] italic text-slate-400 leading-tight">{vi}</span>
        </span>
        <span
          className={`shrink-0 text-[12px] font-bold px-3 py-1 rounded ${
            flagged ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
          }`}
        >
          {item.yn || "—"}
        </span>
      </div>
      {item.detail && <p className="text-[13.5px] mt-2 text-red-800">{item.detail}</p>}
    </div>
  );
}
