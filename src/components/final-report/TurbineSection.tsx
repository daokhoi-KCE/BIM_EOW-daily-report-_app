import type { TurbineAggregate } from "@/lib/final-report";
import { NAVY, AMBER } from "@/lib/theme";
import { td, ThCell } from "@/components/print/shared";
import FindingCard from "@/components/final-report/FindingCard";

export function turbineAnchorId(turbine: string) {
  return `turbine-${turbine.trim().replace(/\s+/g, "-")}`;
}

export default function TurbineSection({ t }: { t: TurbineAggregate }) {
  const pctOk = t.latestPct !== null && t.latestPct >= 100;

  return (
    <section id={turbineAnchorId(t.turbine)} className="avoid-break mt-7 scroll-mt-16">
      <div
        className="flex items-center justify-between gap-3 rounded-md px-3.5 py-2.5"
        style={{ background: NAVY }}
      >
        <div>
          <h3 className="text-[19px] font-extrabold uppercase tracking-wide leading-tight text-white">
            {t.turbine}
          </h3>
          <div className="text-[11px] text-white/70 leading-tight">
            {t.work.length} lần cập nhật · {t.findings.length} phát hiện{" "}
            <span className="italic">/ {t.work.length} updates · {t.findings.length} findings</span>
          </div>
        </div>
        <div
          className="shrink-0 text-[15px] font-extrabold px-3.5 py-1.5 rounded"
          style={{ background: pctOk ? "#1E9E5A" : AMBER, color: pctOk ? "white" : "#14222E" }}
        >
          {t.latestPct !== null ? `${t.latestPct}%` : "—"}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-2.5 avoid-break">
        {(
          [
            ["Blade", "Cánh", t.latestStatus.blade],
            ["Hub", "Hub", t.latestStatus.hub],
            ["Nacelle", "Nacelle", t.latestStatus.nacelle],
            ["Tower", "Tháp", t.latestStatus.tower],
            ["Drone", "Drone", t.latestStatus.drone],
          ] as const
        ).map(([en, vi, value]) => (
          <div
            key={en}
            className="rounded-md p-2"
            style={{ background: "rgba(31,53,82,0.05)", border: "1px solid rgba(31,53,82,0.15)" }}
          >
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: NAVY }}>
              {en} <span className="italic font-normal text-slate-400 normal-case">/ {vi}</span>
            </div>
            <div className="text-[13px] font-semibold text-slate-900 mt-0.5">{value || "—"}</div>
          </div>
        ))}
      </div>

      <h4 className="text-[13px] font-bold text-slate-700 mt-4 mb-1.5">
        Tiến độ theo ngày <span className="italic font-normal text-slate-400">/ Progress by day</span>
      </h4>
      <table className="w-full border-collapse avoid-break">
        <thead>
          <tr style={{ background: "rgba(31,53,82,0.06)" }}>
            <ThCell en="Date" vi="Ngày" />
            <ThCell en="Blade" vi="Cánh" />
            <ThCell en="Hub" vi="Hub" />
            <ThCell en="Nacelle" vi="Nacelle" />
            <ThCell en="Tower" vi="Tháp" />
            <ThCell en="Drone" vi="Drone" />
            <ThCell en="%" vi="%" />
            <ThCell en="Notes" vi="Ghi chú" />
          </tr>
        </thead>
        <tbody>
          {t.work.map((w, i) => (
            <tr key={`${w.id}-${i}`} className="avoid-break">
              <td className={`${td} pl-2 font-semibold whitespace-nowrap`}>{w.date}</td>
              <td className={td}>{w.blade || "—"}</td>
              <td className={td}>{w.hub || "—"}</td>
              <td className={td}>{w.nacelle || "—"}</td>
              <td className={td}>{w.tower || "—"}</td>
              <td className={td}>{w.drone || "—"}</td>
              <td className={`${td} font-bold ${Number(w.pct) >= 100 ? "text-emerald-700" : "text-amber-700"}`}>
                {w.pct || "?"}%
              </td>
              <td className={td}>{w.notes || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {t.findings.length > 0 && (
        <>
          <h4 className="text-[13px] font-bold text-slate-700 mt-4 mb-1.5">
            Phát hiện <span className="italic font-normal text-slate-400">/ Findings</span>
          </h4>
          <div className="space-y-4">
            {t.findings.map((f, i) => (
              <FindingCard key={`${f.id}-${i}`} f={f} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
