import Image from "next/image";
import type { ReportDraft, SafetyItem } from "@/lib/types";
import { delayMinutes } from "@/lib/utils";
import { NAVY, AMBER } from "@/lib/theme";

const td = "text-[12.5px] align-top border-b border-slate-300 py-2 pr-2";

type Tier = "low" | "med" | "high" | "none";

function severityTier(sev: string): Tier {
  const n = Number(sev);
  if (!n) return "none";
  if (n >= 4) return "high";
  if (n === 3) return "med";
  return "low";
}

const TIER: Record<Tier, { text: string; border: string; bg: string; en: string; vi: string }> = {
  high: { text: "text-red-700", border: "border-red-500", bg: "bg-red-50", en: "CRITICAL", vi: "Nghiêm trọng" },
  med: { text: "text-amber-700", border: "border-amber-500", bg: "bg-amber-50", en: "MEDIUM", vi: "Trung bình" },
  low: { text: "text-emerald-700", border: "border-emerald-500", bg: "bg-emerald-50", en: "LOW", vi: "Thấp" },
  none: { text: "text-slate-500", border: "border-slate-300", bg: "bg-slate-50", en: "N/A", vi: "Chưa rõ" },
};

function delayColor(d: number | null) {
  if (d === null) return "";
  if (d > 15) return "text-red-700";
  if (d > 0) return "text-amber-700";
  return "text-emerald-700";
}

function SectionTitle({ en, vi }: { en: string; vi: string }) {
  return (
    <div className="avoid-break mt-6 mb-2.5">
      <h2 className="text-[16px] font-extrabold uppercase tracking-wide leading-tight" style={{ color: NAVY }}>
        {en}
      </h2>
      <div className="text-[11px] italic text-slate-500 leading-tight">{vi}</div>
      <div className="border-b-2 mt-1" style={{ borderColor: NAVY }} />
    </div>
  );
}

function InfoRow({ en, vi, value }: { en: string; vi: string; value: string }) {
  return (
    <div className="avoid-break">
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-700 leading-tight">{en}</div>
      <div className="text-[9.5px] italic text-slate-400 leading-tight">{vi}</div>
      <div className="text-[14px] font-semibold text-slate-900 min-h-[18px] mt-0.5">{value || "—"}</div>
    </div>
  );
}

function ThCell({ en, vi }: { en: string; vi: string }) {
  return (
    <th className="text-left py-2 px-2 border-b-2 align-bottom" style={{ borderColor: NAVY }}>
      <div className="text-[11.5px] font-bold uppercase tracking-wide leading-tight" style={{ color: NAVY }}>
        {en}
      </div>
      <div className="text-[9px] italic text-slate-400 normal-case leading-tight">{vi}</div>
    </th>
  );
}

function SafetyBox({ en, vi, item }: { en: string; vi: string; item: SafetyItem }) {
  const flagged = item.yn === "Có";
  return (
    <div
      className={`avoid-break rounded-md border p-3 ${flagged ? "border-red-400 bg-red-50" : "border-slate-200"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span>
          <span className="block text-[12px] font-bold text-slate-800 leading-tight">{en}</span>
          <span className="block text-[9.5px] italic text-slate-400 leading-tight">{vi}</span>
        </span>
        <span
          className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded ${
            flagged ? "bg-red-600 text-white" : "text-emerald-700 border border-emerald-400"
          }`}
        >
          {item.yn || "—"}
        </span>
      </div>
      {item.detail && <p className="text-[11.5px] mt-1.5 text-red-800">{item.detail}</p>}
    </div>
  );
}

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
          <div className="flex items-center gap-4 -mt-1 mb-3 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-emerald-500" />
              <span className="font-semibold">Low</span> <span className="italic">/ Thấp</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-amber-500" />
              <span className="font-semibold">Medium</span> <span className="italic">/ Trung bình</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-red-500" />
              <span className="font-semibold">Critical</span> <span className="italic">/ Nghiêm trọng</span>
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
                      className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded border bg-white ${t.border} ${t.text}`}
                    >
                      M{f.severity || "?"} · {t.en} <span className="font-normal italic">/ {t.vi}</span>
                    </div>
                  </div>
                  <p className="text-[12.5px] mt-1.5">{f.desc || "—"}</p>
                  <div className="text-[11px] text-slate-500 mt-1.5">
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
                          className="w-[240px] aspect-[9/16] shrink-0 object-contain bg-white rounded border border-slate-300 avoid-break"
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
          <p className="text-[12.5px] whitespace-pre-wrap avoid-break">{rep.issues}</p>
        </>
      )}

      {rep.tomorrow && (
        <>
          <SectionTitle en="7. Tomorrow's plan" vi="Kế hoạch ngày mai" />
          <p className="text-[12.5px] whitespace-pre-wrap avoid-break">{rep.tomorrow}</p>
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
                className="w-[240px] aspect-[9/16] shrink-0 object-contain bg-white rounded border border-slate-300 avoid-break"
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
          <div key={en} className="text-center">
            <div className="h-16 border-b border-slate-400" />
            <div className="text-[12px] font-semibold mt-1">{value || "—"}</div>
            <div className="text-[10.5px] font-bold text-slate-700">{en}</div>
            <div className="text-[9.5px] italic text-slate-400">{vi}</div>
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
