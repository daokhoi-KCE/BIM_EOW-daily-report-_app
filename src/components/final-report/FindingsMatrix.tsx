import type { TurbineAggregate } from "@/lib/final-report";
import { NAVY } from "@/lib/theme";
import { ThCell, td, severityTier, TIER } from "@/components/print/shared";

export default function FindingsMatrix({ turbines }: { turbines: TurbineAggregate[] }) {
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
          <ThCell en="OEM" vi="Báo OEM" />
        </tr>
      </thead>
      {withFindings.map((t) => {
        const oemNotified = t.findings.filter((f) => f.oemNotified === "Có").length;
        return (
          <tbody key={t.turbine}>
            <tr className="avoid-break">
              <td colSpan={5} className="pt-3 pb-1.5 px-2" style={{ borderBottom: `2px solid ${NAVY}` }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[14.5px] font-extrabold uppercase" style={{ color: NAVY }}>
                    {t.turbine}
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
                    {" · "}OEM {oemNotified}/{t.findings.length}
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
                  <td
                    className={`${td} font-semibold ${f.oemNotified === "Không" ? "font-bold text-red-700" : ""}`}
                  >
                    {f.oemNotified || "—"}
                    {f.time && <span className="block text-[10.5px] font-normal text-slate-400">{f.time}</span>}
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
