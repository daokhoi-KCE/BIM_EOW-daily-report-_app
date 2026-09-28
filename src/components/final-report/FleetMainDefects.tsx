import type { TurbineAggregate, DatedFinding } from "@/lib/final-report";
import { NAVY } from "@/lib/theme";
import { tdSm as td, ThCell, severityTier, TIER } from "@/components/print/shared";
import { SECTION_BY_ID, classifyFinding } from "@/lib/report-sections";

/**
 * Tóm tắt lỗi chính của toàn bộ dự án, in trong bản final của từng trụ.
 *
 * Khách hàng nhận 22 bản final riêng, mỗi bản chỉ có chi tiết một trụ. Phần
 * này giữ bối cảnh chung: trụ đang xem đứng ở đâu so với 21 trụ còn lại, và
 * những lỗi nặng nhất của cả công trường nằm ở trụ nào.
 *
 * `highlight` là (các) trụ mà bản final này nói tới — được tô đậm để người
 * đọc tìm thấy ngay hàng của mình trong bảng 22 dòng.
 */
export default function FleetMainDefects({
  turbines,
  highlight = [],
}: {
  turbines: TurbineAggregate[];
  highlight?: string[];
}) {
  const marked = new Set(highlight.map((t) => t.trim().toUpperCase()));
  const isMarked = (t: string) => marked.has(t.trim().toUpperCase());

  // Lỗi chính = M4 và M5. M3 chiếm hơn một nửa số phát hiện nên đưa vào đây
  // thì không còn là tóm tắt nữa; M3 đã có trong ma trận phát hiện bên dưới.
  const major: { turbine: string; f: DatedFinding }[] = [];
  for (const t of turbines) {
    for (const f of t.findings) {
      if (severityTier(f.severity) === "high") major.push({ turbine: t.turbine, f });
    }
  }
  major.sort(
    (a, b) =>
      (Number(b.f.severity) || 0) - (Number(a.f.severity) || 0) ||
      a.turbine.localeCompare(b.turbine, undefined, { numeric: true }),
  );

  return (
    <>
      <table className="w-full border-collapse avoid-break">
        <thead>
          <tr style={{ background: "rgba(31,53,82,0.06)" }}>
            <ThCell en="Turbine" vi="Tuabin" compact />
            <ThCell en="Progress" vi="Tiến độ" compact />
            <ThCell en="Findings" vi="Phát hiện" compact />
            <ThCell en="M4-5" vi="Nặng" compact />
            <ThCell en="M3" vi="Trung bình" compact />
            <ThCell en="M1-2" vi="Nhẹ" compact />
            <ThCell en="Photos" vi="Ảnh" compact />
          </tr>
        </thead>
        <tbody>
          {turbines.map((t) => {
            const me = isMarked(t.turbine);
            return (
              <tr
                key={t.turbine}
                className="avoid-break"
                style={me ? { background: "rgba(31,53,82,0.10)" } : undefined}
              >
                <td className={`${td} pl-2 whitespace-nowrap ${me ? "font-extrabold" : "font-semibold"}`}>
                  {t.turbine}
                  {me && (
                    <span className="ml-1.5 text-[8px] font-bold uppercase tracking-wide px-1.5 py-[1px] rounded align-middle" style={{ background: NAVY, color: "white" }}>
                      Báo cáo này / this report
                    </span>
                  )}
                </td>
                <td className={`${td} tabular-nums ${t.latestPct !== null && t.latestPct >= 100 ? "text-emerald-700 font-semibold" : "text-amber-700"}`}>
                  {t.latestPct !== null ? `${t.latestPct}%` : "—"}
                </td>
                <td className={`${td} tabular-nums font-semibold`}>{t.findings.length}</td>
                <td className={`${td} tabular-nums font-bold text-red-700`}>{t.criticalCount || ""}</td>
                <td className={`${td} tabular-nums text-amber-700`}>{t.mediumCount || ""}</td>
                <td className={`${td} tabular-nums text-slate-500`}>{t.lowCount || ""}</td>
                <td className={`${td} tabular-nums text-slate-500`}>{t.photosCount || ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <h5 className="text-[10.5px] font-bold text-slate-700 mt-4 mb-1.5">
        Lỗi nặng của toàn dự án (M4-M5){" "}
        <span className="italic font-normal text-slate-400">/ Major defects across the site</span>
      </h5>
      {major.length === 0 ? (
        <p className="text-[10px] italic text-slate-400 px-1">
          Không ghi nhận lỗi mức M4-M5 nào.{" "}
          <span className="not-italic">/ No M4-M5 defect recorded.</span>
        </p>
      ) : (
        <table className="w-full border-collapse avoid-break">
          <thead>
            <tr style={{ background: "rgba(31,53,82,0.06)" }}>
              <ThCell en="Turbine" vi="Tuabin" compact />
              <ThCell en="Section" vi="Hạng mục" compact />
              <ThCell en="Area" vi="Khu vực" compact />
              <ThCell en="Finding" vi="Phát hiện" compact />
              <ThCell en="Severity" vi="Mức độ" compact />
            </tr>
          </thead>
          <tbody>
            {major.map(({ turbine, f }, i) => {
              const section = SECTION_BY_ID.get(classifyFinding(f.area, f.desc));
              const tone = TIER[severityTier(f.severity)];
              const me = isMarked(turbine);
              return (
                <tr key={`${f.id}-${i}`} className="avoid-break bg-red-50">
                  <td className={`${td} pl-2 whitespace-nowrap ${me ? "font-extrabold" : "font-semibold"}`}>
                    {turbine}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {section ? `${section.no} ${section.en}` : "—"}
                  </td>
                  <td className={td}>{f.area || "—"}</td>
                  <td className={td}>{f.desc || "—"}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    <span
                      className={`inline-block text-[9.5px] font-bold px-2 py-0.5 rounded border bg-white ${tone.border} ${tone.text}`}
                    >
                      M{f.severity || "?"} · {tone.en}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
