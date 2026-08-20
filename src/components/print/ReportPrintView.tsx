import Image from "next/image";
import type { ReportDraft } from "@/lib/types";
import { delayMinutes } from "@/lib/utils";
import { NAVY, AMBER } from "@/lib/theme";
import { td, severityTier, TIER, delayColor, SectionTitle, InfoRow, ThCell, SafetyBox } from "@/components/print/shared";

export default function ReportPrintView({ rep }: { rep: ReportDraft }) {
  const turbines = rep.turbines.filter((t) => t.turbine);
  const locks = rep.locks.filter((l) => l.turbine);
  const totalPhotos =
    (rep.photos?.length || 0) + rep.findings.reduce((s, f) => s + (f.photos?.length || 0), 0);
  const highFindings = rep.findings.filter((f) => severityTier(f.severity) === "high").length;
  const safetyFlagged =
    rep.safety.hazard.yn === "Có" || rep.safety.shutdown.yn === "Có" || rep.safety.major.yn === "Có";

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-900 px-6 py-6 print:px-0 print:py-0">
      <div className="pb-3 mb-1" style={{ borderBottom: `4px solid ${NAVY}` }}>
        <div className="flex items-center gap-4">
          <Image
            src="/images/logo-mbwind-horizontal.png"
            alt="MB WIND"
            width={220}
            height={75}
            className="h-12 w-auto object-contain"
          />
          <div className="flex-1">
            <h1 className="text-[21px] font-extrabold uppercase leading-tight" style={{ color: NAVY }}>
              Daily Work Report
            </h1>
            <div className="text-[12px] italic text-slate-500 leading-tight">
              Báo cáo công việc hằng ngày
            </div>
            <div className="text-[12.5px] text-slate-600 mt-0.5">
              BIM Wind Farm — EOW Inspection — 22 x GE Cypress 5.5-158
            </div>
          </div>
        </div>
      </div>
      <div className="h-[3px] mb-4" style={{ background: AMBER }} />

      {(safetyFlagged || highFindings > 0) && (
        <div className="avoid-break rounded-md border-2 border-red-600 bg-red-50 px-3 py-2.5 mb-4 flex flex-wrap gap-x-5 gap-y-1.5">
          {safetyFlagged && (
            <span className="text-[12.5px] font-bold text-red-700">
              ⚠ SAFETY ISSUE(S) FLAGGED <span className="font-normal italic">/ Có vấn đề an toàn</span>
            </span>
          )}
          {highFindings > 0 && (
            <span className="text-[12.5px] font-bold text-red-700">
              ⚠ {highFindings} CRITICAL FINDING(S){" "}
              <span className="font-normal italic">/ {highFindings} phát hiện nghiêm trọng</span>
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3.5 avoid-break">
        <InfoRow en="Date" vi="Ngày" value={rep.date} />
        <InfoRow en="Day" vi="Ngày thứ" value={rep.dayNum ? `${rep.dayNum} /15` : ""} />
        <InfoRow en="Planned" vi="Trụ kế hoạch" value={rep.plannedTurbines} />
        <InfoRow en="Actual" vi="Trụ thực tế" value={rep.actualTurbines} />
        <InfoRow en="Prepared by" vi="Người lập" value={rep.preparedBy} />
        <InfoRow en="OEM rep." vi="Đại diện OEM" value={rep.oemRep} />
        <InfoRow en="Weather" vi="Thời tiết" value={rep.weather} />
        <InfoRow en="Sent to" vi="Gửi tới" value={rep.sentTo} />
      </div>

      <SectionTitle en="1. Turbine work" vi="Công việc từng trụ" />
      {turbines.length === 0 ? (
        <p className="text-[12px] text-slate-400 italic">No data / Không có dữ liệu</p>
      ) : (
        <table className="w-full border-collapse avoid-break">
          <thead>
            <tr style={{ background: "rgba(31,53,82,0.06)" }}>
              <ThCell en="Turbine" vi="Trụ" />
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
            {turbines.map((t) => (
              <tr key={t.id} className="avoid-break">
                <td className={`${td} pl-2 font-semibold`}>{t.turbine}</td>
                <td className={td}>{t.blade || "—"}</td>
                <td className={td}>{t.hub || "—"}</td>
                <td className={td}>{t.nacelle || "—"}</td>
                <td className={td}>{t.tower || "—"}</td>
                <td className={td}>{t.drone || "—"}</td>
                <td className={`${td} font-bold ${Number(t.pct) >= 100 ? "text-emerald-700" : "text-amber-700"}`}>
                  {t.pct || "?"}%
                </td>
                <td className={td}>{t.notes || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <SectionTitle en="2. Lock schedule" vi="Lịch khóa / mở rotor" />
      {locks.length === 0 ? (
        <p className="text-[12px] text-slate-400 italic">No data / Không có dữ liệu</p>
      ) : (
        <table className="w-full border-collapse avoid-break">
          <thead>
            <tr style={{ background: "rgba(31,53,82,0.06)" }}>
              <ThCell en="Turbine" vi="Trụ" />
              <ThCell en="Position" vi="Vị trí" />
              <ThCell en="Planned" vi="Giờ KH" />
              <ThCell en="Actual" vi="Giờ TT" />
              <ThCell en="Delay (min)" vi="Trễ (phút)" />
              <ThCell en="Notes" vi="Ghi chú" />
            </tr>
          </thead>
          <tbody>
            {locks.map((l) => {
              const d = delayMinutes(l.planned, l.actual);
              return (
                <tr key={l.id} className="avoid-break">
                  <td className={`${td} pl-2 font-semibold`}>{l.turbine}</td>
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
      )}

      {rep.findings.length > 0 && (
        <>
          <SectionTitle en="3. Findings" vi="Phát hiện" />
          <div className="flex items-center gap-2 -mt-1 mb-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border border-emerald-300 bg-emerald-50">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-emerald-500" />
              <span className="font-bold text-emerald-700">Low</span>{" "}
              <span className="italic text-slate-500">/ Thấp</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border border-amber-300 bg-amber-50">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-amber-500" />
              <span className="font-bold text-amber-700">Medium</span>{" "}
              <span className="italic text-slate-500">/ Trung bình</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full border border-red-300 bg-red-50">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-red-500" />
              <span className="font-bold text-red-700">Critical</span>{" "}
              <span className="italic text-slate-500">/ Nghiêm trọng</span>
            </span>
          </div>
          <div className="space-y-3">
            {rep.findings.map((f, i) => {
              const tier = severityTier(f.severity);
              const t = TIER[tier];
              return (
                <div
                  key={f.id}
                  className={`avoid-break rounded-md border ${t.border} ${t.bg} p-3 border-l-4`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13.5px] font-bold">
                      #{i + 1} — {f.turbine || "?"} {f.area ? `· ${f.area}` : ""}
                    </div>
                    <div
                      className={`shrink-0 text-[12px] font-bold px-2.5 py-1 rounded border bg-white ${t.border} ${t.text}`}
                    >
                      M{f.severity || "?"} · {t.en} <span className="font-normal italic">/ {t.vi}</span>
                    </div>
                  </div>
                  <p className="text-[14px] mt-1.5">{f.desc || "—"}</p>
                  <div className="text-[11.5px] text-slate-500 mt-1.5">
                    {f.photo && <>Photo ref: {f.photo} · </>}
                    Time notified: {f.time || "—"} · OEM notified:{" "}
                    <span className={f.oemNotified === "Không" ? "font-bold text-red-700" : "font-semibold"}>
                      {f.oemNotified || "—"}
                    </span>
                  </div>
                  {tier === "high" && (
                    <div className="mt-1.5 text-[11px] font-bold text-red-700">
                      ⚠ REQUIRES IMMEDIATE ATTENTION{" "}
                      <span className="font-normal italic">/ Cần chú ý — báo OEM ngay</span>
                    </div>
                  )}
                  {f.photos && f.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {f.photos.map((p) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={p.id}
                          src={p.url}
                          alt="evidence"
                          className="max-w-[380px] h-auto shrink-0 rounded avoid-break"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <SectionTitle en="4. Safety & incidents" vi="An toàn & sự cố" />
      <div className="grid grid-cols-1 gap-2">
        <SafetyBox en="Safety hazard" vi="Nguy hiểm an toàn" item={rep.safety.hazard} />
        <SafetyBox en="Shutdown requirement" vi="Yêu cầu dừng máy" item={rep.safety.shutdown} />
        <SafetyBox en="Severity 4–5 defect" vi="Lỗi mức 4–5" item={rep.safety.major} />
      </div>

      <SectionTitle en="5. Progress vs plan" vi="So với kế hoạch" />
      <div className="grid grid-cols-3 gap-3.5 avoid-break">
        <InfoRow en="Planned today" vi="Trụ KH hôm nay" value={rep.progress.plannedToday} />
        <InfoRow en="Actual done" vi="Trụ xong hôm nay" value={rep.progress.actualToday} />
        <InfoRow
          en="Cumulative"
          vi="Lũy kế"
          value={rep.progress.cumulative ? `${rep.progress.cumulative} /22` : ""}
        />
      </div>
      <div className="mt-2.5 text-[12.5px]">
        <span className="font-bold">On schedule</span> <span className="italic text-slate-500">/ Đúng tiến độ:</span>{" "}
        <span
          className={`font-bold ${
            rep.progress.onSchedule === "Chậm"
              ? "text-red-700"
              : rep.progress.onSchedule === "Đúng tiến độ"
                ? "text-emerald-700"
                : ""
          }`}
        >
          {rep.progress.onSchedule || "—"}
        </span>
      </div>

      {rep.issues && (
        <>
          <SectionTitle en="6. Issues" vi="Vướng mắc" />
          <p className="text-[14px] whitespace-pre-wrap avoid-break">{rep.issues}</p>
        </>
      )}

      {rep.tomorrow && (
        <>
          <SectionTitle en="7. Tomorrow's plan" vi="Kế hoạch ngày mai" />
          <p className="text-[14px] whitespace-pre-wrap avoid-break">{rep.tomorrow}</p>
        </>
      )}

      {rep.photos && rep.photos.length > 0 && (
        <>
          <SectionTitle en="Site photos" vi="Hình ảnh hiện trường" />
          <div className="flex flex-wrap gap-2">
            {rep.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.url}
                alt="site evidence"
                className="max-w-[380px] h-auto shrink-0 rounded avoid-break"
              />
            ))}
          </div>
        </>
      )}

      <SectionTitle en="Sign-off" vi="Ký xác nhận" />
      <div className="grid grid-cols-3 gap-6 mt-6 avoid-break">
        {(
          [
            ["Prepared by", "Người lập báo cáo (MB Wind)", rep.signPrepared],
            ["OEM rep.", "Đại diện OEM (GE)", rep.signOEM],
            ["Site / BIM rep.", "Đại diện Site / BIM", rep.signSite],
          ] as const
        ).map(([en, vi, value]) => (
          <div
            key={en}
            className="text-center rounded-md p-3"
            style={{ background: "rgba(31,53,82,0.05)", border: "1px solid rgba(31,53,82,0.15)" }}
          >
            <div className="h-16 border-b border-slate-400" />
            <div className="text-[13px] font-semibold mt-1.5">{value || "—"}</div>
            <div className="text-[11.5px] font-bold text-slate-700">{en}</div>
            <div className="text-[10px] italic text-slate-400">{vi}</div>
          </div>
        ))}
      </div>

      {totalPhotos > 0 && (
        <p className="text-[10.5px] text-slate-400 mt-6">
          {totalPhotos} photos attached <span className="italic">/ {totalPhotos} ảnh đính kèm</span>.
        </p>
      )}
    </div>
  );
}
