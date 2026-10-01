import type { ReportDraft } from "@/lib/types";
import { NAVY } from "@/lib/theme";
import { td, ThCell } from "@/components/print/shared";
import { SITE_PHOTOS_SECTION } from "@/lib/report-sections";
import { PHOTO_LIBRARY_ROOT } from "@/lib/project-info";
import { normalizeTurbineLabel } from "@/lib/turbine-label";
import { formatDateDMY } from "@/lib/utils";

export const SITE_PHOTOS_ANCHOR = "section-site-photos";

/**
 * Mục 5.20 — ảnh hiện trường.
 *
 * Đây là ảnh chụp chung trong ngày: hiện trạng công trường, lối tiếp cận,
 * quá trình làm việc. Chúng không gắn với phát hiện nào nên không xuất hiện
 * ở mục 5.1-5.19, và trước đây chỉ được cộng vào con số tổng rồi thôi —
 * 1.099 tấm ảnh nằm trong cơ sở dữ liệu mà bản báo cáo không hề nhắc tới.
 *
 * Ở đây chỉ in danh mục, không nhúng ảnh: nhúng cả nghìn tấm vào file PDF
 * là vài trăm MB, mà phần chứng cứ cho từng phát hiện đã có đủ ảnh ở mục
 * 5.1-5.19 rồi.
 *
 * Bảng liệt kê **cả 22 trụ** chứ không chỉ trụ của bản in này, kèm đường dẫn
 * thư mục ảnh gốc trên máy đội kiểm tra. Người cầm bản final của một trụ vẫn
 * thấy được toàn bộ kho ảnh của dự án nằm ở đâu.
 *
 * `scope` là trụ mà bản in này nói tới — được đánh dấu trong bảng.
 */
export default function SitePhotosSection({
  reports,
  scope = [],
}: {
  reports: ReportDraft[];
  scope?: string[];
}) {
  const danhDau = new Set(scope.map((t) => t.trim().toUpperCase()));
  const rows = reports
    .map((r) => {
      const turbine = normalizeTurbineLabel(r.plannedTurbines || r.actualTurbines);
      return {
        id: r.id,
        date: r.date,
        turbine,
        count: r.photos?.length ?? 0,
        me: danhDau.has(turbine.toUpperCase()),
      };
    })
    // Xếp theo tên trụ, không theo ngày: người đọc tra theo số trụ.
    .sort((a, b) => a.turbine.localeCompare(b.turbine, undefined, { numeric: true }));
  const total = rows.reduce((s, r) => s + r.count, 0);

  return (
    <section id={SITE_PHOTOS_ANCHOR} className="mt-5 scroll-mt-16">
      <div className="section-open">
        <div className="section-head rounded-md px-3 py-1.5" style={{ background: NAVY }}>
          <div className="flex items-baseline justify-between gap-3 flex-wrap">
            <h3 className="text-[14.5px] font-extrabold uppercase tracking-wide leading-tight text-white">
              {SITE_PHOTOS_SECTION.no} {SITE_PHOTOS_SECTION.en}
            </h3>
            <span className="text-[10px] font-bold text-white/80">
              {total} {total === 1 ? "photograph" : "photographs"}
            </span>
          </div>
          <div className="text-[9.5px] italic text-white/70 leading-tight">
            {SITE_PHOTOS_SECTION.vi}
          </div>
        </div>

        <p className="prose-doc text-[11px] leading-relaxed text-justify text-slate-800 mt-2">
          Photographs recorded on site that are not attached to a particular finding — general
          condition of the site, access routes and work in progress — for all{" "}
          {rows.length} turbines of the campaign. Evidence for each individual finding is reproduced
          in sections 5.1 to 5.19 above. The full resolution originals are held in the inspection
          photograph library, one folder per turbine:
        </p>
        <p className="text-[10px] font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-sm px-2 py-1 mt-1.5 break-all">
          {PHOTO_LIBRARY_ROOT}
        </p>
        <p className="prose-doc text-[9.5px] italic text-slate-500 leading-relaxed text-justify mt-1.5">
          Ảnh chụp chung tại hiện trường của cả {rows.length} trụ, không gắn với phát hiện cụ thể:
          hiện trạng công trường, lối tiếp cận, quá trình thi công. Ảnh chứng cứ của từng phát hiện
          đã in đầy đủ ở mục 5.1-5.19. Ảnh gốc độ phân giải đầy đủ lưu trong thư mục trên, mỗi trụ
          một thư mục con.
        </p>

        {rows.length === 0 ? (
          <p className="text-[10px] italic text-slate-400 mt-2 px-1">
            No site photographs recorded.{" "}
            <span className="not-italic">/ Không có ảnh hiện trường.</span>
          </p>
        ) : (
          <table className="w-full border-collapse mt-3">
            <thead>
              <tr style={{ background: "rgba(31,53,82,0.06)" }}>
                <ThCell en="Turbine" vi="Tuabin" compact />
                <ThCell en="Date" vi="Ngày" compact />
                <ThCell en="Photographs" vi="Số ảnh" compact />
                <ThCell en="Folder" vi="Thư mục ảnh" compact />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="avoid-break"
                  style={r.me ? { background: "rgba(31,53,82,0.10)" } : undefined}
                >
                  <td className={`${td} pl-2 whitespace-nowrap ${r.me ? "font-extrabold" : "font-semibold"}`}>
                    {r.turbine || "—"}
                    {r.me && (
                      <span
                        className="ml-1.5 text-[8px] font-bold uppercase tracking-wide px-1 py-[1px] rounded align-middle"
                        style={{ background: NAVY, color: "white" }}
                      >
                        Báo cáo này
                      </span>
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{formatDateDMY(r.date)}</td>
                  <td className={`${td} tabular-nums`}>{r.count || "—"}</td>
                  {/* Chỉ in tên thư mục con; đường dẫn gốc đã nêu ở trên, lặp
                      lại 22 lần thì bảng dài ra mà không thêm thông tin gì. */}
                  <td className={`${td} font-mono text-[10px] text-slate-600 break-all`}>
                    {r.turbine ? `…\\${r.turbine}` : "—"}
                  </td>
                </tr>
              ))}
              <tr style={{ background: "rgba(31,53,82,0.06)" }}>
                <td className="py-1.5 px-2 font-bold text-[11px]" style={{ color: NAVY }} colSpan={2}>
                  Total / Tổng cộng — {rows.length} turbines
                </td>
                <td className="py-1.5 px-2 font-extrabold tabular-nums text-[11px]">{total}</td>
                <td />
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
