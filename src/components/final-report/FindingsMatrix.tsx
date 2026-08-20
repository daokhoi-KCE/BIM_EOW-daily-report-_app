import type { TurbineAggregate } from "@/lib/final-report";
import { ThCell, td } from "@/components/print/shared";

function countCell(n: number, tone: "high" | "med" | "low") {
  const style =
    n === 0
      ? "text-slate-300"
      : tone === "high"
        ? "text-red-700 bg-red-50"
        : tone === "med"
          ? "text-amber-700 bg-amber-50"
          : "text-emerald-700 bg-emerald-50";
  return (
    <td className={`${td} text-center font-bold rounded ${style}`}>
      {n}
    </td>
  );
}

export default function FindingsMatrix({ turbines }: { turbines: TurbineAggregate[] }) {
  const withFindings = turbines.filter((t) => t.findings.length > 0);

  if (withFindings.length === 0) {
    return <p className="text-[12px] text-slate-400 italic">No findings / Không có phát hiện</p>;
  }

  return (
    <table className="w-full border-collapse avoid-break">
      <thead>
        <tr style={{ background: "rgba(31,53,82,0.06)" }}>
          <ThCell en="Turbine" vi="Trụ" />
          <ThCell en="Total" vi="Tổng" />
          <ThCell en="Critical (M4-5)" vi="Nghiêm trọng" />
          <ThCell en="Medium (M3)" vi="Trung bình" />
          <ThCell en="Low (M1-2)" vi="Thấp" />
          <ThCell en="OEM notified" vi="Đã báo OEM" />
          <ThCell en="Photos" vi="Ảnh" />
        </tr>
      </thead>
      <tbody>
        {withFindings.map((t) => {
          const oemNotified = t.findings.filter((f) => f.oemNotified === "Có").length;
          return (
            <tr key={t.turbine} className="avoid-break">
              <td className={`${td} pl-2 font-semibold`}>{t.turbine}</td>
              {countCell(t.findings.length, t.criticalCount > 0 ? "high" : t.mediumCount > 0 ? "med" : "low")}
              {countCell(t.criticalCount, "high")}
              {countCell(t.mediumCount, "med")}
              {countCell(t.lowCount, "low")}
              <td className={`${td} text-center`}>
                {oemNotified}/{t.findings.length}
              </td>
              <td className={`${td} text-center`}>{t.photosCount || "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
