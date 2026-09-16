import type { TurbineAggregate, DatedFinding } from "@/lib/final-report";
import { NAVY } from "@/lib/theme";
import { severityTier, TIER, type Tier } from "@/components/print/shared";
import {
  DEFECT_CATEGORIES,
  OTHER_CATEGORY_ID,
  classifyDefect,
} from "@/lib/defect-categories";

/** Rút gọn nhãn trụ cho đầu cột: "WTG 22" → "22", giữ nguyên nếu không có số. */
function shortLabel(turbine: string): string {
  const m = turbine.match(/(\d+)\s*$/);
  return m ? m[1] : turbine.replace(/^WTG[\s-]*/i, "").trim() || turbine;
}

const TIER_RANK: Record<Tier, number> = { none: 0, low: 1, med: 2, high: 3 };

const CELL_BG: Record<Exclude<Tier, "none">, string> = {
  high: "#FEE2E2",
  med: "#FEF3C7",
  low: "#D1FAE5",
};
const CELL_FG: Record<Exclude<Tier, "none">, string> = {
  high: "#B91C1C",
  med: "#B45309",
  low: "#047857",
};

interface Cell {
  findings: DatedFinding[];
  tier: Tier;
  maxSeverity: number;
}

export default function DefectMatrix({ turbines }: { turbines: TurbineAggregate[] }) {
  if (turbines.length === 0) {
    return <p className="text-[12px] text-slate-400 italic">No data / Không có dữ liệu</p>;
  }

  // grid[categoryId][turbineIndex] → Cell
  const grid = new Map<string, Cell[]>();
  const blank = (): Cell[] =>
    turbines.map(() => ({ findings: [], tier: "none" as Tier, maxSeverity: 0 }));

  for (const c of DEFECT_CATEGORIES) grid.set(c.id, blank());
  grid.set(OTHER_CATEGORY_ID, blank());

  turbines.forEach((t, ti) => {
    for (const f of t.findings) {
      const id = classifyDefect(f);
      const row = grid.get(id);
      if (!row) continue;
      const cell = row[ti];
      cell.findings.push(f);
      const tier = severityTier(f.severity);
      if (TIER_RANK[tier] > TIER_RANK[cell.tier]) cell.tier = tier;
      const sev = Number(f.severity) || 0;
      if (sev > cell.maxSeverity) cell.maxSeverity = sev;
    }
  });

  const otherRow = grid.get(OTHER_CATEGORY_ID)!;
  const hasOther = otherRow.some((c) => c.findings.length > 0);

  const rows: { id: string; en: string; vi: string; cells: Cell[] }[] = [
    ...DEFECT_CATEGORIES.map((c) => ({
      id: c.id,
      en: c.en,
      vi: c.vi,
      cells: grid.get(c.id)!,
    })),
    ...(hasOther
      ? [{ id: OTHER_CATEGORY_ID, en: "Other findings", vi: "Phát hiện khác", cells: otherRow }]
      : []),
  ];

  const perTurbineTotal = turbines.map((_, ti) =>
    rows.reduce((s, r) => s + r.cells[ti].findings.length, 0),
  );
  const grandTotal = perTurbineTotal.reduce((s, n) => s + n, 0);

  return (
    <div className="avoid-break">
      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full border-collapse defect-matrix">
          <thead>
            <tr>
              <th
                className="text-left py-2 px-2 border-b-2 align-bottom sticky left-0 bg-white z-10"
                style={{ borderColor: NAVY, minWidth: "52mm" }}
              >
                <div
                  className="text-[11.5px] font-bold uppercase tracking-wide leading-tight"
                  style={{ color: NAVY }}
                >
                  Common defect
                </div>
                <div className="text-[9px] italic text-slate-400 leading-tight">Lỗi phổ biến</div>
              </th>
              {turbines.map((t) => (
                <th
                  key={t.turbine}
                  className="py-2 px-0.5 border-b-2 text-center align-bottom"
                  style={{ borderColor: NAVY }}
                  title={t.turbine}
                >
                  <div
                    className="text-[11px] font-extrabold leading-tight"
                    style={{ color: NAVY }}
                  >
                    {shortLabel(t.turbine)}
                  </div>
                </th>
              ))}
              <th
                className="py-2 px-1 border-b-2 text-center align-bottom"
                style={{ borderColor: NAVY, background: "rgba(31,53,82,0.06)" }}
              >
                <div
                  className="text-[10px] font-bold uppercase leading-tight"
                  style={{ color: NAVY }}
                >
                  Σ
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => {
              const affected = r.cells.filter((c) => c.findings.length > 0).length;
              return (
                <tr
                  key={r.id}
                  className="avoid-break"
                  style={{ background: ri % 2 ? "rgba(31,53,82,0.03)" : undefined }}
                >
                  <td
                    className="border-b border-slate-300 py-1.5 px-2 align-middle sticky left-0 z-10"
                    style={{ background: ri % 2 ? "#F6F7F9" : "white" }}
                  >
                    <div className="text-[12px] font-semibold text-slate-900 leading-tight">
                      {r.en}
                    </div>
                    <div className="text-[9.5px] italic text-slate-500 leading-tight">{r.vi}</div>
                  </td>
                  {r.cells.map((c, ci) => {
                    const t = turbines[ci];
                    if (c.findings.length === 0) {
                      return (
                        <td
                          key={t.turbine}
                          className="border-b border-slate-300 text-center align-middle text-[11px] text-slate-300"
                        >
                          ·
                        </td>
                      );
                    }
                    const tier = c.tier === "none" ? "low" : c.tier;
                    return (
                      <td
                        key={t.turbine}
                        className="border-b border-slate-300 text-center align-middle p-0"
                        title={`${t.turbine} — ${r.en}: ${c.findings.length} finding(s)`}
                      >
                        <div
                          className="mx-auto my-0.5 flex items-center justify-center rounded-sm font-bold leading-none"
                          style={{
                            background: CELL_BG[tier],
                            color: CELL_FG[tier],
                            fontSize: "10.5px",
                            width: "5.2mm",
                            height: "5.2mm",
                            border: `1px solid ${CELL_FG[tier]}55`,
                          }}
                        >
                          {c.findings.length > 1 ? `${c.maxSeverity || "?"}×${c.findings.length}` : c.maxSeverity || "?"}
                        </div>
                      </td>
                    );
                  })}
                  <td
                    className="border-b border-slate-300 text-center align-middle text-[11px] font-bold"
                    style={{ background: "rgba(31,53,82,0.06)", color: affected ? NAVY : "#CBD5E1" }}
                  >
                    {affected || "·"}
                  </td>
                </tr>
              );
            })}
            <tr className="avoid-break" style={{ background: "rgba(31,53,82,0.08)" }}>
              <td
                className="py-1.5 px-2 sticky left-0 z-10"
                style={{ background: "#E8EBF0", borderTop: `2px solid ${NAVY}` }}
              >
                <div
                  className="text-[11px] font-bold uppercase tracking-wide leading-tight"
                  style={{ color: NAVY }}
                >
                  Total / Tổng
                </div>
              </td>
              {perTurbineTotal.map((n, i) => (
                <td
                  key={turbines[i].turbine}
                  className="text-center text-[11px] font-extrabold"
                  style={{ borderTop: `2px solid ${NAVY}`, color: n ? NAVY : "#CBD5E1" }}
                >
                  {n || "·"}
                </td>
              ))}
              <td
                className="text-center text-[11px] font-extrabold"
                style={{ borderTop: `2px solid ${NAVY}`, color: NAVY }}
              >
                {grandTotal}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[10px] text-slate-600">
        <span className="font-semibold text-slate-700">Chú giải / Legend:</span>
        {(["high", "med", "low"] as const).map((k) => (
          <span key={k} className="flex items-center gap-1.5">
            <span
              className="inline-block rounded-sm"
              style={{
                width: "4mm",
                height: "4mm",
                background: CELL_BG[k],
                border: `1px solid ${CELL_FG[k]}55`,
              }}
            />
            {TIER[k].en} / {TIER[k].vi}
          </span>
        ))}
        <span>
          Số trong ô = mức độ cao nhất (M1–M5); <b>n×k</b> = mức n, k phát hiện.
          <span className="italic text-slate-400">
            {" "}
            Cell = highest severity; n×k = severity n, k findings.
          </span>
        </span>
      </div>
    </div>
  );
}
