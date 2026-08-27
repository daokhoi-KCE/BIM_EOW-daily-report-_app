import type { TurbineAggregate } from "@/lib/final-report";
import { delayMinutes } from "@/lib/utils";
import { NAVY, AMBER } from "@/lib/theme";
import { td, severityTier, TIER, delayColor, ThCell } from "@/components/print/shared";

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

      {t.locks.length > 0 && (
        <>
          <h4 className="text-[13px] font-bold text-slate-700 mt-4 mb-1.5">
            Lịch khóa / mở rotor <span className="italic font-normal text-slate-400">/ Lock schedule</span>
          </h4>
          <table className="w-full border-collapse avoid-break">
            <thead>
              <tr style={{ background: "rgba(31,53,82,0.06)" }}>
                <ThCell en="Date" vi="Ngày" />
                <ThCell en="Position" vi="Vị trí" />
                <ThCell en="Planned" vi="Giờ KH" />
                <ThCell en="Actual" vi="Giờ TT" />
                <ThCell en="Delay (min)" vi="Trễ (phút)" />
                <ThCell en="Notes" vi="Ghi chú" />
              </tr>
            </thead>
            <tbody>
              {t.locks.map((l, i) => {
                const d = delayMinutes(l.planned, l.actual);
                return (
                  <tr key={`${l.id}-${i}`} className="avoid-break">
                    <td className={`${td} pl-2 font-semibold whitespace-nowrap`}>{l.date}</td>
                    <td className={td}>{l.pos || "—"}</td>
                    <td className={td}>{l.planned || "--:--"}</td>
                    <td className={td}>{l.actual || "--:--"}</td>
                    <td className={`${td} font-bold ${delayColor(d)}`}>{d !== null ? d : "—"}</td>
                    <td className={td}>{l.notes || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}

      {t.findings.length > 0 && (
        <>
          <h4 className="text-[13px] font-bold text-slate-700 mt-4 mb-1.5">
            Phát hiện <span className="italic font-normal text-slate-400">/ Findings</span>
          </h4>
          <div className="space-y-4">
            {t.findings.map((f, i) => {
              const tier = severityTier(f.severity);
              const tone = TIER[tier];
              return (
                <div
                  key={`${f.id}-${i}`}
                  className={`avoid-break rounded-md border ${tone.border} ${tone.bg} border-l-4 overflow-hidden`}
                >
                  <div className="grid grid-cols-3 gap-0 print:gap-0">
                    {/* Cột trái: Diễn giải & thông tin */}
                    <div className="col-span-1 p-4 border-r print:border-r bg-white" style={{ borderRightColor: `var(--tone-border, ${tone.border})` }}>
                      <div className="mb-3">
                        <div className="text-[17px] font-bold text-slate-900 mb-2 tracking-tight">
                          {f.date} — {f.area || "?"}
                        </div>
                        <div
                          className={`inline-block text-[12px] font-semibold px-2 py-1 rounded-sm ${tone.border} ${tone.text} bg-opacity-10`}
                          style={{ backgroundColor: tone.border + '15' }}
                        >
                          M{f.severity || "?"} • {tone.en}
                        </div>
                      </div>
                      <p className="text-[16px] leading-relaxed text-slate-900 mb-3 font-normal">
                        {f.desc || "—"}
                      </p>
                      <div className="space-y-1.5">
                        {f.photo && <div className="text-[12px] text-slate-600"><span className="font-medium text-slate-700">Ref:</span> {f.photo}</div>}
                        <div className="text-[12px] text-slate-600"><span className="font-medium text-slate-700">Notified:</span> {f.time || "—"}</div>
                        <div className="text-[12px] text-slate-600 flex items-center gap-1.5">
                          <span className="font-medium text-slate-700">OEM:</span>
                          <span className={f.oemNotified === "Không" ? "font-semibold text-red-600" : "font-normal text-slate-600"}>
                            {f.oemNotified || "—"}
                          </span>
                        </div>
                      </div>
                      {tier === "high" && (
                        <div className="mt-3 pt-3 border-t border-red-200">
                          <div className="text-[11px] font-semibold text-red-600 leading-snug">
                            ⚠ REQUIRES IMMEDIATE ATTENTION
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Cột phải: Ảnh chứng cứ */}
                    <div className="col-span-2 p-5">
                      {f.photos && f.photos.length > 0 ? (
                        <div className="photo-list flex flex-wrap gap-3">
                          {f.photos.map((p) => (
                            <div key={p.id} className="photo-item avoid-break flex-1 min-w-[220px]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.url}
                                alt="evidence"
                                className="w-full h-auto rounded block"
                                style={{ maxHeight: '150mm', objectFit: 'contain' }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[12px] text-center py-12">
                          No photos attached / Không có ảnh
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
