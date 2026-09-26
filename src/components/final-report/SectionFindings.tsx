import type { SectionGroup } from "@/lib/final-report";
import { NAVY } from "@/lib/theme";
import FindingCard from "@/components/final-report/FindingCard";

export function sectionAnchorId(id: string) {
  return `section-${id}`;
}

function Count({ n, label, color }: { n: number; label: string; color: string }) {
  if (n === 0) return null;
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded" style={{ background: color, color: "white" }}>
      {n} {label}
    </span>
  );
}

export default function SectionFindings({
  group,
  multiTurbine,
}: {
  group: SectionGroup;
  multiTurbine: boolean;
}) {
  const { section, findings } = group;
  const empty = findings.length === 0;

  return (
    <section id={sectionAnchorId(section.id)} className="mt-7 scroll-mt-16">
      <div className="avoid-break rounded-md px-3.5 py-2.5" style={{ background: NAVY }}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className="text-[17px] font-extrabold uppercase tracking-wide leading-tight text-white">
            {section.no} {section.en}
          </h3>
          <span className="text-[12px] font-bold text-white/80">
            {findings.length} {findings.length === 1 ? "finding" : "findings"}
          </span>
        </div>
        <div className="text-[11.5px] italic text-white/70 leading-tight">{section.vi}</div>
      </div>

      {empty ? (
        <p className="text-[12px] italic text-slate-400 mt-2 px-1">
          No findings recorded in this section.{" "}
          <span className="not-italic">/ Không ghi nhận phát hiện nào ở hạng mục này.</span>
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2 flex-wrap mt-2 mb-3 px-1">
            <Count n={group.critical} label="critical" color="#B91C1C" />
            <Count n={group.medium} label="medium" color="#B45309" />
            <Count n={group.low} label="low" color="#047857" />
            <span className="text-[11px] text-slate-500">{group.photos} ảnh / photos</span>
            {multiTurbine && group.turbines.length > 0 && (
              <span className="text-[11px] text-slate-500">
                · {group.turbines.length} trụ: {group.turbines.join(", ")}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {findings.map((f, i) => (
              <FindingCard key={`${f.id}-${i}`} f={f} showTurbine={multiTurbine} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
