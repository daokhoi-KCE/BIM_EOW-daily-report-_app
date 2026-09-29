import type { ReportDraft } from "@/lib/types";
import { NAVY } from "@/lib/theme";
import { td, ThCell } from "@/components/print/shared";
import { SITE_PHOTOS_SECTION } from "@/lib/report-sections";
import { APP_BASE_URL, reportPhotoFolderUrl } from "@/lib/project-info";
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
 * Ở đây in danh mục kèm đường dẫn, không nhúng ảnh: nhúng cả nghìn tấm vào
 * file PDF là vài trăm MB, mà phần chứng cứ cho từng phát hiện đã có đủ ảnh
 * ở mục 5.1-5.19 rồi.
 */
export default function SitePhotosSection({ reports }: { reports: ReportDraft[] }) {
  const rows = reports
    .map((r) => ({
      id: r.id,
      date: r.date,
      turbine: normalizeTurbineLabel(r.plannedTurbines || r.actualTurbines),
      count: r.photos?.length ?? 0,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
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
          condition of the site, access routes and work in progress. They are held in the inspection
          application; the link against each report opens that report and its photographs. Evidence
          for each individual finding is reproduced in sections 5.1 to 5.19 above.
        </p>
        <p className="prose-doc text-[9.5px] italic text-slate-500 leading-relaxed text-justify mt-1.5">
          Ảnh chụp chung tại hiện trường, không gắn với phát hiện cụ thể: hiện trạng công trường,
          lối tiếp cận, quá trình thi công. Ảnh lưu trong ứng dụng kiểm tra; đường dẫn ở mỗi dòng mở
          đúng báo cáo ngày đó cùng toàn bộ ảnh của nó. Ảnh chứng cứ của từng phát hiện đã in đầy đủ
          ở mục 5.1-5.19.
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
                <ThCell en="Date" vi="Ngày" compact />
                <ThCell en="Turbine" vi="Tuabin" compact />
                <ThCell en="Photographs" vi="Số ảnh" compact />
                <ThCell en="Photo folder" vi="Thư mục ảnh" compact />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const url = reportPhotoFolderUrl(r.id);
                return (
                  <tr key={r.id} className="avoid-break">
                    <td className={`${td} pl-2 whitespace-nowrap font-semibold`}>
                      {formatDateDMY(r.date)}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{r.turbine || "—"}</td>
                    <td className={`${td} tabular-nums`}>{r.count || "—"}</td>
                    <td className={`${td} break-all`}>
                      {/* In cả địa chỉ chứ không chỉ chữ "mở": bản PDF rời khỏi
                          app, và bản in ra giấy thì không bấm được. */}
                      <a href={url} className="underline" style={{ color: NAVY }}>
                        {APP_BASE_URL ? url : `/reports/${r.id}`}
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {!APP_BASE_URL && (
          <p className="print-hide text-[9.5px] text-amber-700 mt-2">
            Chưa biết địa chỉ app nên chỉ in được đường dẫn tương đối. Đặt biến môi trường
            NEXT_PUBLIC_APP_URL trên Vercel để in địa chỉ đầy đủ.
          </p>
        )}
      </div>
    </section>
  );
}
