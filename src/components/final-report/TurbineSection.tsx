import type { TurbineAggregate } from "@/lib/final-report";
import { NAVY, AMBER } from "@/lib/theme";
import { tdSm as td, ThCell, severityTier, TIER } from "@/components/print/shared";
import FindingCard from "@/components/final-report/FindingCard";
import { SECTION_BY_ID, classifyFinding } from "@/lib/report-sections";
import { sortFindingsByArea } from "@/lib/finding-order";
import { displayArea } from "@/lib/area-label";
import { groupPhotoNames, parsePhotoRef } from "@/lib/photo-ref";

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

  return (
    <section id={turbineAnchorId(t.turbine)} className="avoid-break mt-7 scroll-mt-16">
      <div
        className="flex items-center justify-between gap-3 rounded-md px-3.5 py-2.5"
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

      <h4 className="text-[11px] font-bold text-slate-700 mt-4 mb-1.5">
        Tiến độ theo ngày <span className="italic font-normal text-slate-400">/ Progress by day</span>
      </h4>
      <table className="w-full border-collapse avoid-break">
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

      {t.findings.length > 0 && (
        <>
          <h4 className="text-[11px] font-bold text-slate-700 mt-4 mb-1.5">
            Phát hiện <span className="italic font-normal text-slate-400">/ Findings</span>
            {compact && (
              <span className="font-normal text-slate-400">
                {" "}
                — ảnh và diễn giải đầy đủ ở mục 5
                <span className="italic"> / full detail and photos in section 5</span>
              </span>
            )}
          </h4>

          {compact ? (
            <table className="w-full border-collapse avoid-break">
              <thead>
                <tr style={{ background: "rgba(31,53,82,0.06)" }}>
                  <ThCell en="Date" vi="Ngày" compact />
                  <ThCell en="Section" vi="Hạng mục" compact />
                  <ThCell en="Area" vi="Khu vực" compact />
                  <ThCell en="Finding" vi="Phát hiện" compact />
                  <ThCell en="Sev." vi="Mức" compact />
                  <ThCell en="Photo" vi="Tên ảnh" compact />
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
                      {/* Tên file ảnh trong thư mục gốc. Chưa đối chiếu được
                          thì in số lượng, để ô không bị trống trơn. Một phát
                          hiện hay nhận cả chùm ảnh chụp liên tiếp, nên các
                          tên đánh số liền nhau gộp lại thành một dải. */}
                      <td className={`${td} text-[10px]`}>
                        {(() => {
                          const { names } = parsePhotoRef(f.photo);
                          const soAnh = f.photos?.length ?? 0;
                          if (names.length === 0)
                            return <span className="tabular-nums text-slate-400">{soAnh} ảnh</span>;
                          return (
                            <>
                              {groupPhotoNames(names).map((g, k) => (
                                <span key={k} className="block font-mono break-all leading-tight">
                                  {g.label}
                                  {g.count > 1 && (
                                    <span className="not-italic text-slate-500"> ({g.count} ảnh)</span>
                                  )}
                                </span>
                              ))}
                              {/* Số tên khác số ảnh nghĩa là còn ảnh chưa đối
                                  chiếu ra — nói thẳng thay vì để người đọc tự đếm. */}
                              {names.length !== soAnh && (
                                <span className="block text-[9px] italic text-amber-700 tabular-nums">
                                  {names.length}/{soAnh} ảnh đã đối chiếu
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </td>
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
