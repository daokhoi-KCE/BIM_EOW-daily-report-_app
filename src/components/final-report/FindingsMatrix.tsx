import type { TurbineAggregate } from "@/lib/final-report";
import { NAVY } from "@/lib/theme";
import { ThCell, td, severityTier, TIER } from "@/components/print/shared";

export default function FindingsMatrix({
  turbines,
  highlight = [],
}: {
  turbines: TurbineAggregate[];
  /** Trụ mà bản final đang nói tới — đánh dấu để dễ tìm giữa 22 nhóm. */
  highlight?: string[];
}) {
  const marked = new Set(highlight.map((t) => t.trim().toUpperCase()));
  const withFindings = turbines.filter((t) => t.findings.length > 0);

  if (withFindings.length === 0) {
    return <p className="text-[12px] text-slate-400 italic">No findings / Không có phát hiện</p>;
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr style={{ background: "rgba(31,53,82,0.06)" }}>
          <ThCell en="Date" vi="Ngày" />
          <ThCell en="Area" vi="Khu vực" />
          <ThCell en="Description" vi="Mô tả" />
          <ThCell en="Severity" vi="Mức độ" />
        </tr>
      </thead>
      {withFindings.map((t) => {
        return (
          <tbody key={t.turbine}>
            <tr className="avoid-break">
              <td
                colSpan={4}
                className="pt-3 pb-1.5 px-2"
                style={{
                  borderBottom: `2px solid ${NAVY}`,
                  background: marked.has(t.turbine.trim().toUpperCase())
                    ? "rgba(31,53,82,0.10)"
                    : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[14.5px] font-extrabold uppercase" style={{ color: NAVY }}>
                    {t.turbine}
                    {marked.has(t.turbine.trim().toUpperCase()) && (
                      <span className="ml-2 text-[9.5px] font-bold normal-case tracking-wide px-1.5 py-[1px] rounded align-middle" style={{ background: NAVY, color: "white" }}>
                        Báo cáo này / this report
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {t.findings.length} phát hiện
                    {t.criticalCount > 0 && (
                      <span className="font-bold text-red-700"> · {t.criticalCount} nghiêm trọng</span>
                    )}
                    {t.mediumCount > 0 && (
                      <span className="font-bold text-amber-700"> · {t.mediumCount} trung bình</span>
                    )}
                    {t.lowCount > 0 && (
                      <span className="font-bold text-emerald-700"> · {t.lowCount} thấp</span>
                    )}
                  </span>
                </div>
              </td>
            </tr>
            {t.findings.map((f, i) => {
              const tier = severityTier(f.severity);
              const tone = TIER[tier];
              return (
                <tr key={`${f.id}-${i}`} className={`avoid-break ${tier === "high" ? "bg-red-50" : ""}`}>
                  <td className={`${td} pl-2 font-semibold whitespace-nowrap`}>{f.date}</td>
                  <td className={td}>{f.area || "—"}</td>
                  <td className={td}>
                    {f.desc || "—"}
                    {f.photo && (
                      <span className="block text-[10.5px] text-slate-400">Photo ref: {f.photo}</span>
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded border bg-white ${tone.border} ${tone.text}`}
                    >
                      M{f.severity || "?"} · {tone.en}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        );
      })}
    </table>
  );
}
