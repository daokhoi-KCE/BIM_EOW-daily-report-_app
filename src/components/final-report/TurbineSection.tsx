import type { TurbineAggregate } from "@/lib/final-report";
import { NAVY, AMBER } from "@/lib/theme";
import { tdSm as td, ThCell, severityTier, TIER } from "@/components/print/shared";
import FindingCard from "@/components/final-report/FindingCard";
import { SECTION_BY_ID, classifyFinding } from "@/lib/report-sections";
import { sortFindingsByArea } from "@/lib/finding-order";
import { displayArea } from "@/lib/area-label";
import { LIGHT_INSPECTION, lightFindingsFor, lightsFor } from "@/lib/aviation-lights";
import { formatDateDMY } from "@/lib/utils";

export function turbineAnchorId(turbine: string) {
  return `turbine-${turbine.trim().replace(/\s+/g, "-")}`;
}

/**
 * Chi tiết một tuabin.
 *
 * `compact` dùng cho báo cáo nhiều trụ: ở đó mục 5 đã in đầy đủ từng phát
 * hiện kèm ảnh, nên mục này chỉ liệt kê dạng bảng và trỏ ngược về mục 5.
 * In lại cả thẻ ảnh sẽ nhân đôi toàn bộ ảnh của báo cáo — với 22 trụ là
 * gần 5.700 thẻ ảnh, đủ để trang không tải nổi.
 */
export default function TurbineSection({
  t,
  compact = false,
  photoSize,
}: {
  t: TurbineAggregate;
  compact?: boolean;
  photoSize?: { cols: number; height: string };
}) {
  const pctOk = t.latestPct !== null && t.latestPct >= 100;
  const light = lightsFor(t.turbine);
  const lightFindings = lightFindingsFor(t.turbine);

  return (
    <section id={turbineAnchorId(t.turbine)} className="mt-7 scroll-mt-16">
      <div
        className="keep-next flex items-center justify-between gap-3 rounded-md px-3.5 py-2.5"
        style={{ background: NAVY }}
      >
        <div>
          <h3 className="text-[16px] font-extrabold uppercase tracking-wide leading-tight text-white">
            {t.turbine}
          </h3>
          <div className="text-[9.5px] text-white/70 leading-tight">
            {t.work.length} lần cập nhật · {t.findings.length} phát hiện{" "}
            <span className="italic">/ {t.work.length} updates · {t.findings.length} findings</span>
          </div>
        </div>
        <div
          className="shrink-0 text-[12.5px] font-extrabold px-3.5 py-1.5 rounded"
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
            <div className="text-[8.5px] font-bold uppercase tracking-wide" style={{ color: NAVY }}>
              {en} <span className="italic font-normal text-slate-400 normal-case">/ {vi}</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-900 mt-0.5">{value || "—"}</div>
          </div>
        ))}
      </div>

      {light && (
        <div className="mt-2.5 avoid-break">
          <div className="text-[9px] text-slate-500 mb-1">
            <span className="font-bold uppercase tracking-wide" style={{ color: NAVY }}>
              Aviation obstruction light
            </span>{" "}
            <span className="italic">/ Kiểm tra đèn báo bay</span> — {LIGHT_INSPECTION.by},{" "}
            {formatDateDMY(LIGHT_INSPECTION.date)}, from {LIGHT_INSPECTION.time}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["Top light (nacelle)", "Đèn báo bay đỉnh nacelle", light.top, "top light"],
                ["Tower light (tower body)", "Đèn thân tower", light.tower, "tower light"],
              ] as const
            ).map(([en, vi, state, key]) => {
              const ng = state === "ng";
              // Ghi chú gốc bắt đầu bằng tên đèn mà nó nói tới.
              const note = light.remark?.toLowerCase().startsWith(key) ? light.remark : "";
              return (
                <div
                  key={en}
                  className="rounded-md p-2"
                  style={{
                    background: ng ? "rgba(185,28,28,0.06)" : "rgba(4,120,87,0.06)",
                    border: `1px solid ${ng ? "rgba(185,28,28,0.35)" : "rgba(4,120,87,0.3)"}`,
                  }}
                >
                  <div className="text-[8.5px] font-bold uppercase tracking-wide" style={{ color: NAVY }}>
                    {en} <span className="italic font-normal text-slate-400 normal-case">/ {vi}</span>
                  </div>
                  <div
                    className="text-[11px] font-bold mt-0.5"
                    style={{ color: ng ? "#B91C1C" : "#047857" }}
                  >
                    {ng ? "Not working" : "Working"}{" "}
                    <span className="italic font-normal">/ {ng ? "Không hoạt động" : "Hoạt động"}</span>
                  </div>
                  {ng && (
                    <div className="text-[10px] font-bold mt-0.5" style={{ color: "#B91C1C" }}>
                      Need to be replaced{" "}
                      <span className="italic font-normal">/ Cần thay thế</span>
                    </div>
                  )}
                  {note && <div className="text-[9.5px] text-slate-700 mt-0.5">{note}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h4 className="keep-next text-[11px] font-bold text-slate-700 mt-4 mb-1.5">
        Tiến độ theo ngày <span className="italic font-normal text-slate-400">/ Progress by day</span>
      </h4>
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ background: "rgba(31,53,82,0.06)" }}>
            <ThCell en="Date" vi="Ngày" compact />
            <ThCell en="Blade" vi="Cánh" compact />
            <ThCell en="Hub" vi="Hub" compact />
            <ThCell en="Nacelle" vi="Nacelle" compact />
            <ThCell en="Tower" vi="Tháp" compact />
            <ThCell en="Drone" vi="Drone" compact />
            <ThCell en="%" vi="%" compact />
            <ThCell en="Notes" vi="Ghi chú" compact />
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

      {(t.findings.length > 0 || lightFindings.length > 0) && (
        <>
          <h4 className="keep-next text-[11px] font-bold text-slate-700 mt-4 mb-1.5">
            Phát hiện <span className="italic font-normal text-slate-400">/ Findings</span>
            {compact && (
              <span className="font-normal text-slate-400">
                {" "}
                — ảnh và diễn giải đầy đủ ở mục 5
                <span className="italic"> / full detail and photos in section 5</span>
              </span>
            )}
            {lightFindings.length > 0 && (
              <span className="font-normal text-slate-400">
                {" "}
                · {lightFindings.length} dòng từ kiểm tra đèn báo bay {formatDateDMY(LIGHT_INSPECTION.date)}
                <span className="italic"> / {lightFindings.length} from the aviation light inspection</span>
              </span>
            )}
          </h4>

          {compact ? (
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "rgba(31,53,82,0.06)" }}>
                  <ThCell en="Date" vi="Ngày" compact />
                  <ThCell en="Section" vi="Hạng mục" compact />
                  <ThCell en="Area" vi="Khu vực" compact />
                  <ThCell en="Finding" vi="Phát hiện" compact />
                  <ThCell en="Sev." vi="Mức" compact />
                </tr>
              </thead>
              <tbody>
                {sortFindingsByArea(t.findings).map((f, i) => {
                  const section = SECTION_BY_ID.get(classifyFinding(f.area, f.desc));
                  const tone = TIER[severityTier(f.severity)];
                  return (
                    <tr key={`${f.id}-${i}`} className="avoid-break">
                      <td className={`${td} pl-2 whitespace-nowrap`}>{f.date}</td>
                      <td className={`${td} whitespace-nowrap`}>{section?.no ?? "—"}</td>
                      <td className={td}>{displayArea(f.area) || "—"}</td>
                      <td className={td}>{f.desc || "—"}</td>
                      <td className={`${td} font-bold whitespace-nowrap ${tone.text}`}>
                        M{f.severity || "?"}
                      </td>
                    </tr>
                  );
                })}
                {/* Đèn không hoạt động trong đợt kiểm tra 19/10: đúng các ô NG của hai
                    hàng đèn báo bay ở ma trận 4.3. Đặt cuối bảng vì là đợt kiểm tra sau
                    đợt EOW. Mức độ M3 do người lập báo cáo quy định (bảng của đội vận
                    hành không ghi mức). */}
                {lightFindings.map((lf) => {
                  const section = SECTION_BY_ID.get(classifyFinding(lf.area, lf.desc));
                  const tone = TIER[severityTier(lf.severity)];
                  return (
                    <tr key={lf.which} className="avoid-break">
                      <td className={`${td} pl-2 whitespace-nowrap`}>{lf.date}</td>
                      <td className={`${td} whitespace-nowrap`}>{section?.no ?? "—"}</td>
                      <td className={td}>{lf.area}</td>
                      <td className={td}>{lf.desc}</td>
                      <td className={`${td} font-bold whitespace-nowrap ${tone.text}`}>M{lf.severity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="space-y-4">
              {sortFindingsByArea(t.findings).map((f, i) => (
                <FindingCard key={`${f.id}-${i}`} f={f} photoSize={photoSize} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
