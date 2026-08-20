import type { ReportDraft, TurbineWork, LockCycle, Finding } from "@/lib/types";
import { severityTier } from "@/components/print/shared";

export interface DatedTurbineWork extends TurbineWork {
  date: string;
}
export interface DatedLockCycle extends LockCycle {
  date: string;
}
export interface DatedFinding extends Finding {
  date: string;
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

const turbineKey = (t: string) => t.trim().toUpperCase();

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

    for (const t of r.turbines) {
      if (!t.turbine.trim()) continue;
      getAgg(t.turbine).work.push({ ...t, date: r.date });
    }
    for (const l of r.locks) {
      if (!l.turbine.trim()) continue;
      getAgg(l.turbine).locks.push({ ...l, date: r.date });
    }
    for (const f of r.findings) {
      if (!f.turbine.trim()) continue;
      const agg = getAgg(f.turbine);
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
    totals,
    preparedBy: [...preparedBySet].sort(),
    oemReps: [...oemRepSet].sort(),
    safetyFlags,
  };
}
