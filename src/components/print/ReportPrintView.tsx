import Image from "next/image";
import type { ReportDraft, SafetyItem } from "@/lib/types";
import { delayMinutes } from "@/lib/utils";
import { NAVY, AMBER } from "@/lib/theme";

const td = "text-[11px] align-top border-b border-slate-300 py-1.5 pr-2";

type Tier = "low" | "med" | "high" | "none";

function severityTier(sev: string): Tier {
  const n = Number(sev);
  if (!n) return "none";
  if (n >= 4) return "high";
  if (n === 3) return "med";
  return "low";
}

const TIER: Record<Tier, { text: string; border: string; bg: string; label: string }> = {
  high: { text: "text-red-700", border: "border-red-500", bg: "bg-red-50", label: "NGHIÊM TRỌNG / CRITICAL" },
  med: { text: "text-amber-700", border: "border-amber-500", bg: "bg-amber-50", label: "TRUNG BÌNH / MEDIUM" },
  low: { text: "text-emerald-700", border: "border-emerald-500", bg: "bg-emerald-50", label: "THẤP / LOW" },
  none: { text: "text-slate-500", border: "border-slate-300", bg: "bg-slate-50", label: "CHƯA RÕ / N/A" },
};

function delayColor(d: number | null) {
  if (d === null) return "";
  if (d > 15) return "text-red-700";
  if (d > 0) return "text-amber-700";
  return "text-emerald-700";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[12.5px] font-bold uppercase pb-1 mb-2 mt-5 border-b-2"
      style={{ color: NAVY, borderColor: NAVY }}
    >
      {children}
    </h2>
  );
}

function InfoRow({ label, en, value }: { label: string; en: string; value: string }) {
  return (
    <div className="avoid-break">
      <div className="text-[9.5px] uppercase tracking-wide text-slate-500">
        {label} <span className="italic normal-case">/ {en}</span>
      </div>
      <div className="text-[12px] font-semibold text-slate-900 min-h-[16px]">{value || "—"}</div>
    </div>
  );
}

function SafetyBox({ label, en, item }: { label: string; en: string; item: SafetyItem }) {
  const flagged = item.yn === "Có";
  return (
    <div
      className={`avoid-break rounded-md border p-2.5 ${flagged ? "border-red-400 bg-red-50" : "border-slate-200"}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10.5px] font-semibold text-slate-700">
          {label} <span className="italic text-slate-400 font-normal">/ {en}</span>
        </span>
        <span
          className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${
            flagged ? "bg-red-600 text-white" : "text-emerald-700 border border-emerald-400"
          }`}
        >
          {item.yn || "—"}
        </span>
      </div>
      {item.detail && <p className="text-[10.5px] mt-1.5 text-red-800">{item.detail}</p>}
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
            <h1 className="text-[16px] font-bold leading-tight" style={{ color: NAVY }}>
              BÁO CÁO CÔNG VIỆC HẰNG NGÀY / DAILY WORK REPORT
            </h1>
            <div className="text-[11px] text-slate-600">
              BIM Wind Farm — EOW Inspection — 22 x GE Cypress 5.5-158
            </div>
          </div>
        </div>
      </div>
      <div className="h-[3px] mb-4" style={{ background: AMBER }} />

      {(safetyFlagged || highFindings > 0) && (
        <div className="avoid-break rounded-md border-2 border-red-600 bg-red-50 px-3 py-2 mb-4 flex flex-wrap gap-x-4 gap-y-1">
          {safetyFlagged && (
            <span className="text-[11px] font-bold text-red-700">
              ⚠ CÓ VẤN ĐỀ AN TOÀN / SAFETY ISSUE(S) FLAGGED
            </span>
          )}
          {highFindings > 0 && (
            <span className="text-[11px] font-bold text-red-700">
              ⚠ {highFindings} PHÁT HIỆN NGHIÊM TRỌNG / {highFindings} CRITICAL FINDING(S)
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-3 avoid-break">
        <InfoRow label="Ngày" en="Date" value={rep.date} />
        <InfoRow label="Ngày thứ" en="Day" value={rep.dayNum ? `${rep.dayNum} /15` : ""} />
        <InfoRow label="Trụ kế hoạch" en="Planned" value={rep.plannedTurbines} />
        <InfoRow label="Trụ thực tế" en="Actual" value={rep.actualTurbines} />
        <InfoRow label="Người lập" en="Prepared by" value={rep.preparedBy} />
        <InfoRow label="Đại diện OEM" en="OEM rep." value={rep.oemRep} />
        <InfoRow label="Thời tiết" en="Weather" value={rep.weather} />
        <InfoRow label="Gửi tới" en="Sent to" value={rep.sentTo} />
      </div>

      <SectionTitle>1. Công việc từng trụ / Turbine work</SectionTitle>
      {turbines.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">Không có dữ liệu / No data</p>
      ) : (
        <table className="w-full border-collapse avoid-break">
          <thead>
            <tr style={{ background: "rgba(31,53,82,0.06)" }}>
              {["Trụ", "Cánh / Blade", "Hub", "Nacelle", "Tower", "Drone", "%", "Ghi chú"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[10px] font-bold uppercase tracking-wide py-1.5 px-2 border-b-2"
                  style={{ color: NAVY, borderColor: NAVY }}
                >
                  {h}
                </th>
              ))}
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

      <SectionTitle>2. Lịch khóa / mở rotor / Lock schedule</SectionTitle>
      {locks.length === 0 ? (
        <p className="text-[11px] text-slate-400 italic">Không có dữ liệu / No data</p>
      ) : (
        <table className="w-full border-collapse avoid-break">
          <thead>
            <tr style={{ background: "rgba(31,53,82,0.06)" }}>
              {["Trụ", "Vị trí", "Giờ KH", "Giờ TT", "Trễ (phút)", "Ghi chú"].map((h) => (
                <th
                  key={h}
                  className="text-left text-[10px] font-bold uppercase tracking-wide py-1.5 px-2 border-b-2"
                  style={{ color: NAVY, borderColor: NAVY }}
                >
                  {h}
                </th>
              ))}
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
          <SectionTitle>3. Phát hiện / Findings</SectionTitle>
          <div className="flex items-center gap-3 -mt-1 mb-2.5 text-[9.5px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block bg-emerald-500" /> Thấp / Low
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block bg-amber-500" /> Trung bình / Medium
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block bg-red-500" /> Nghiêm trọng / Critical
            </span>
          </div>
          <div className="space-y-3">
            {rep.findings.map((f, i) => {
              const tier = severityTier(f.severity);
              const t = TIER[tier];
              return (
                <div
                  key={f.id}
                  className={`avoid-break rounded-md border ${t.border} ${t.bg} p-2.5 border-l-4`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11.5px] font-bold">
                      #{i + 1} — {f.turbine || "?"} {f.area ? `· ${f.area}` : ""}
                    </div>
                    <div
                      className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded border bg-white ${t.border} ${t.text}`}
                    >
                      M{f.severity || "?"} · {t.label}
                    </div>
                  </div>
                  <p className="text-[11px] mt-1">{f.desc || "—"}</p>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {f.photo && <>Ảnh ref: {f.photo} · </>}
                    Giờ báo: {f.time || "—"} · Đã báo OEM:{" "}
                    <span className={f.oemNotified === "Không" ? "font-bold text-red-700" : "font-semibold"}>
                      {f.oemNotified || "—"}
                    </span>
                  </div>
                  {tier === "high" && (
                    <div className="mt-1.5 text-[10px] font-bold text-red-700">
                      ⚠ CẦN CHÚ Ý — BÁO OEM NGAY / REQUIRES IMMEDIATE ATTENTION
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
                          className="w-[250px] h-[250px] shrink-0 object-cover rounded border border-slate-300 avoid-break"
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

      <SectionTitle>4. An toàn & sự cố / Safety &amp; incidents</SectionTitle>
      <div className="grid grid-cols-1 gap-2">
        <SafetyBox label="Nguy hiểm an toàn" en="Safety hazard" item={rep.safety.hazard} />
        <SafetyBox label="Yêu cầu dừng máy" en="Shutdown requirement" item={rep.safety.shutdown} />
        <SafetyBox label="Lỗi mức 4–5" en="Severity 4–5 defect" item={rep.safety.major} />
      </div>

      <SectionTitle>5. So với kế hoạch / Progress vs plan</SectionTitle>
      <div className="grid grid-cols-3 gap-3 avoid-break">
        <InfoRow label="Trụ KH hôm nay" en="Planned today" value={rep.progress.plannedToday} />
        <InfoRow label="Trụ xong hôm nay" en="Actual done" value={rep.progress.actualToday} />
        <InfoRow
          label="Lũy kế"
          en="Cumulative"
          value={rep.progress.cumulative ? `${rep.progress.cumulative} /22` : ""}
        />
      </div>
      <div className="mt-2 text-[11px]">
        <span className="font-semibold">Đúng tiến độ / On schedule: </span>
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
          <SectionTitle>6. Vướng mắc / Issues</SectionTitle>
          <p className="text-[11px] whitespace-pre-wrap avoid-break">{rep.issues}</p>
        </>
      )}

      {rep.tomorrow && (
        <>
          <SectionTitle>7. Kế hoạch ngày mai / Tomorrow&apos;s plan</SectionTitle>
          <p className="text-[11px] whitespace-pre-wrap avoid-break">{rep.tomorrow}</p>
        </>
      )}

      {rep.photos && rep.photos.length > 0 && (
        <>
          <SectionTitle>Hình ảnh hiện trường / Site photos</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {rep.photos.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.url}
                alt="site evidence"
                className="w-[250px] h-[250px] shrink-0 object-cover rounded border border-slate-300 avoid-break"
              />
            ))}
          </div>
        </>
      )}

      <SectionTitle>Ký xác nhận / Sign-off</SectionTitle>
      <div className="grid grid-cols-3 gap-6 mt-6 avoid-break">
        {(
          [
            ["Người lập báo cáo (MB Wind)", "Prepared by", rep.signPrepared],
            ["Đại diện OEM (GE)", "OEM rep.", rep.signOEM],
            ["Đại diện Site / BIM", "Site / BIM rep.", rep.signSite],
          ] as const
        ).map(([label, en, value]) => (
          <div key={label} className="text-center">
            <div className="h-16 border-b border-slate-400" />
            <div className="text-[11px] font-semibold mt-1">{value || "—"}</div>
            <div className="text-[9.5px] text-slate-500">
              {label} <span className="italic">/ {en}</span>
            </div>
          </div>
        ))}
      </div>

      {totalPhotos > 0 && (
        <p className="text-[9.5px] text-slate-400 mt-6">
          Báo cáo có {totalPhotos} ảnh đính kèm / {totalPhotos} photos attached.
        </p>
      )}
    </div>
  );
}
