import type { ReportDraft, TurbineWork, LockCycle, Finding } from "@/lib/types";
import { severityTier } from "@/components/print/shared";
import { SECTIONS, classifyFinding, type ReportSection } from "@/lib/report-sections";

export interface DatedTurbineWork extends TurbineWork {
  date: string;
}
export interface DatedLockCycle extends LockCycle {
  date: string;
}
export interface DatedFinding extends Finding {
  date: string;
}

/** Một mục "5.x" cùng toàn bộ finding thuộc về nó. */
export interface SectionGroup {
  section: ReportSection;
  findings: DatedFinding[];
  critical: number;
  medium: number;
  low: number;
  photos: number;
  /** Các tuabin có phát hiện trong mục này. */
  turbines: string[];
}

export interface TurbineAggregate {
  turbine: string;
  work: DatedTurbineWork[];
  locks: DatedLockCycle[];
  findings: DatedFinding[];
  latestPct: number | null;
  latestStatus: { blade: string; hub: string; nacelle: string; tower: string; drone: string };
  criticalCount: number;
  mediumCount: number;
  lowCount: number;
  photosCount: number;
}

export interface FinalReportData {
  reports: ReportDraft[];
  dateFrom: string;
  dateTo: string;
  turbines: TurbineAggregate[];
  /** Findings gom theo mục 5.x, giữ nguyên thứ tự trong SECTIONS. */
  sections: SectionGroup[];
  totals: {
    reports: number;
    turbines: number;
    findings: number;
    critical: number;
    medium: number;
    low: number;
    photos: number;
    turbinesCompleted: number;
  };
  preparedBy: string[];
  oemReps: string[];
  safetyFlags: { date: string; hazard: boolean; shutdown: boolean; major: boolean }[];
}

/**
 * Khoá gộp tuabin.
 *
 * Đội hiện trường gõ tên trụ không thống nhất: "WTG 02", "WTG02", "WTG 2"
 * đều là một trụ. Bỏ khoảng trắng và số 0 đứng đầu để ba cách viết cùng về
 * một khoá, đồng thời "WTG 22" không bị nhầm với "WTG 2".
 */
const turbineKey = (t: string) =>
  t
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/(\D)0+(\d)/g, "$1$2");

function lastNonEmpty(entries: DatedTurbineWork[], field: keyof TurbineWork): string {
  for (let i = entries.length - 1; i >= 0; i--) {
    const v = entries[i][field];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

export function buildFinalReportData(reportsIn: ReportDraft[]): FinalReportData {
  const reports = [...reportsIn].sort((a, b) => a.date.localeCompare(b.date));

  const turbineMap = new Map<string, TurbineAggregate>();
  const getAgg = (label: string): TurbineAggregate => {
    const key = turbineKey(label);
    let agg = turbineMap.get(key);
    if (!agg) {
      agg = {
        turbine: label.trim() || key,
        work: [],
        locks: [],
        findings: [],
        latestPct: null,
        latestStatus: { blade: "", hub: "", nacelle: "", tower: "", drone: "" },
        criticalCount: 0,
        mediumCount: 0,
        lowCount: 0,
        photosCount: 0,
      };
      turbineMap.set(key, agg);
    }
    return agg;
  };

  const preparedBySet = new Set<string>();
  const oemRepSet = new Set<string>();
  const safetyFlags: FinalReportData["safetyFlags"] = [];
  let sitePhotos = 0;

  for (const r of reports) {
    if (r.preparedBy.trim()) preparedBySet.add(r.preparedBy.trim());
    if (r.oemRep.trim()) oemRepSet.add(r.oemRep.trim());
    sitePhotos += r.photos?.length ?? 0;

    const hazard = r.safety.hazard.yn === "Có";
    const shutdown = r.safety.shutdown.yn === "Có";
    const major = r.safety.major.yn === "Có";
    if (hazard || shutdown || major) safetyFlags.push({ date: r.date, hazard, shutdown, major });

    // Phần lớn finding không điền cột `turbine` riêng — trụ được ghi ở đầu
    // báo cáo ngày. Không có bước lùi này thì 73% số finding bị bỏ rơi.
    const fallbackTurbine = r.plannedTurbines.trim() || r.actualTurbines.trim();

    for (const t of r.turbines) {
      const label = t.turbine.trim() || fallbackTurbine;
      if (!label) continue;
      getAgg(label).work.push({ ...t, date: r.date });
    }
    for (const l of r.locks) {
      const label = l.turbine.trim() || fallbackTurbine;
      if (!label) continue;
      getAgg(label).locks.push({ ...l, date: r.date });
    }
    for (const f of r.findings) {
      const label = f.turbine.trim() || fallbackTurbine;
      if (!label) continue;
      const agg = getAgg(label);
      agg.findings.push({ ...f, date: r.date });
      agg.photosCount += f.photos?.length ?? 0;
      const tier = severityTier(f.severity);
      if (tier === "high") agg.criticalCount++;
      else if (tier === "med") agg.mediumCount++;
      else if (tier === "low") agg.lowCount++;
    }
  }

  for (const agg of turbineMap.values()) {
    const pctStr = lastNonEmpty(agg.work, "pct");
    agg.latestPct = pctStr.trim() === "" ? null : Number(pctStr);
    agg.latestStatus = {
      blade: lastNonEmpty(agg.work, "blade"),
      hub: lastNonEmpty(agg.work, "hub"),
      nacelle: lastNonEmpty(agg.work, "nacelle"),
      tower: lastNonEmpty(agg.work, "tower"),
      drone: lastNonEmpty(agg.work, "drone"),
    };
  }

  const turbines = [...turbineMap.values()].sort((a, b) =>
    a.turbine.localeCompare(b.turbine, undefined, { numeric: true, sensitivity: "base" }),
  );

  const findingsPhotos = turbines.reduce((s, t) => s + t.photosCount, 0);

  // ── Gom findings theo mục 5.x ────────────────────────────────────────────
  const groupMap = new Map<string, SectionGroup>(
    SECTIONS.map((section) => [
      section.id,
      { section, findings: [], critical: 0, medium: 0, low: 0, photos: 0, turbines: [] },
    ]),
  );
  const seenTurbinePerSection = new Map<string, Set<string>>(
    SECTIONS.map((s) => [s.id, new Set<string>()]),
  );

  for (const agg of turbines) {
    for (const f of agg.findings) {
      const group = groupMap.get(classifyFinding(f.area, f.desc)) ?? groupMap.get("other")!;
      // Gán nhãn trụ đã phân giải: cột `turbine` của finding thường rỗng,
      // tên trụ nằm ở đầu báo cáo ngày và đã được getAgg gom lại.
      group.findings.push({ ...f, turbine: agg.turbine });
      group.photos += f.photos?.length ?? 0;
      const tier = severityTier(f.severity);
      if (tier === "high") group.critical++;
      else if (tier === "med") group.medium++;
      else if (tier === "low") group.low++;

      const seen = seenTurbinePerSection.get(group.section.id)!;
      if (!seen.has(agg.turbine)) {
        seen.add(agg.turbine);
        group.turbines.push(agg.turbine);
      }
    }
  }

  for (const group of groupMap.values()) {
    // Trong mỗi mục, xếp phát hiện nặng lên trước rồi mới đến theo ngày.
    group.findings.sort(
      (a, b) => (Number(b.severity) || 0) - (Number(a.severity) || 0) || a.date.localeCompare(b.date),
    );
  }

  const sections = SECTIONS.map((s) => groupMap.get(s.id)!);

  const totals = {
    reports: reports.length,
    turbines: turbines.length,
    findings: turbines.reduce((s, t) => s + t.findings.length, 0),
    critical: turbines.reduce((s, t) => s + t.criticalCount, 0),
    medium: turbines.reduce((s, t) => s + t.mediumCount, 0),
    low: turbines.reduce((s, t) => s + t.lowCount, 0),
    photos: sitePhotos + findingsPhotos,
    turbinesCompleted: turbines.filter((t) => t.latestPct !== null && t.latestPct >= 100).length,
  };

  return {
    reports,
    dateFrom: reports[0]?.date ?? "",
    dateTo: reports[reports.length - 1]?.date ?? "",
    turbines,
    sections,
    totals,
    preparedBy: [...preparedBySet].sort(),
    oemReps: [...oemRepSet].sort(),
    safetyFlags,
  };
}
