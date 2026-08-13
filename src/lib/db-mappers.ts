import type {
  ReportRow,
  TurbineWorkRow,
  LockScheduleRow,
  FindingRow,
  ReportListViewRow,
} from "./db-types";
import type {
  ReportDraft,
  ReportListItem,
  TurbineWork,
  LockCycle,
  Finding,
  Photo,
  YesNo,
} from "./types";

const s = (v: string | null | undefined) => v ?? "";
const yn = (v: string | null | undefined): YesNo => (v === "Có" || v === "Không" ? v : "");
const numStr = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));
const timeStr = (v: string | null | undefined) => (v ? v.slice(0, 5) : "");

export function rowToListItem(row: ReportListViewRow): ReportListItem {
  return {
    id: row.id,
    date: row.report_date,
    plannedTurbines: s(row.planned_turbines),
    preparedBy: s(row.prepared_by),
    findingsCount: row.findings_count,
    photosCount: row.site_photos_count + row.finding_photos_count,
    cumulative: numStr(row.progress_cumulative),
    hasMajor: row.safety_major_yn === "Có",
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function rowsToReportDraft(
  report: ReportRow,
  turbineRows: TurbineWorkRow[],
  lockRows: LockScheduleRow[],
  findingRows: FindingRow[],
  findingPhotos: Map<string, Photo[]>,
  sitePhotos: Photo[],
): ReportDraft {
  const turbines: TurbineWork[] = turbineRows.map((t) => ({
    id: t.id,
    turbine: s(t.turbine),
    blade: s(t.blade_done),
    hub: s(t.hub),
    nacelle: s(t.nacelle),
    tower: s(t.tower),
    drone: s(t.drone),
    pct: numStr(t.pct_done),
    notes: s(t.notes),
  }));

  const locks: LockCycle[] = lockRows.map((l) => ({
    id: l.id,
    turbine: s(l.turbine),
    pos: s(l.blade_position),
    planned: timeStr(l.planned_time),
    actual: timeStr(l.actual_time),
    notes: s(l.notes),
  }));

  const findings: Finding[] = findingRows.map((f) => ({
    id: f.id,
    turbine: s(f.turbine),
    area: s(f.area),
    desc: s(f.description),
    severity: numStr(f.severity),
    photo: s(f.photo_ref),
    oemNotified: yn(f.oem_notified),
    time: timeStr(f.time_notified),
    photos: findingPhotos.get(f.id) ?? [],
  }));

  return {
    id: report.id,
    date: report.report_date,
    dayNum: numStr(report.day_number),
    plannedTurbines: s(report.planned_turbines),
    actualTurbines: s(report.actual_turbines),
    preparedBy: s(report.prepared_by),
    oemRep: s(report.oem_rep),
    sentTo: s(report.sent_to),
    weather: s(report.weather),
    turbines,
    locks,
    findings,
    photos: sitePhotos,
    safety: {
      hazard: { yn: yn(report.safety_hazard_yn), detail: s(report.safety_hazard_detail) },
      shutdown: { yn: yn(report.safety_shutdown_yn), detail: s(report.safety_shutdown_detail) },
      major: { yn: yn(report.safety_major_yn), detail: s(report.safety_major_detail) },
    },
    progress: {
      plannedToday: s(report.progress_planned_today),
      actualToday: s(report.progress_actual_today),
      cumulative: numStr(report.progress_cumulative),
      onSchedule: s(report.progress_on_schedule),
    },
    issues: s(report.issues),
    tomorrow: s(report.tomorrow_plan),
    signPrepared: s(report.sign_prepared),
    signOEM: s(report.sign_oem),
    signSite: s(report.sign_site),
    updatedAt: new Date(report.updated_at).getTime(),
  };
}

const toIntOrNull = (v: string) => (v.trim() === "" ? null : Number.isNaN(Number(v)) ? null : Math.trunc(Number(v)));
const toTimeOrNull = (v: string) => (v.trim() === "" ? null : v);
const toTextOrNull = (v: string) => (v.trim() === "" ? null : v);

export function draftToReportRow(d: ReportDraft) {
  return {
    id: d.id,
    report_date: d.date,
    day_number: toIntOrNull(d.dayNum),
    planned_turbines: toTextOrNull(d.plannedTurbines),
    actual_turbines: toTextOrNull(d.actualTurbines),
    prepared_by: toTextOrNull(d.preparedBy),
    oem_rep: toTextOrNull(d.oemRep),
    sent_to: toTextOrNull(d.sentTo),
    weather: toTextOrNull(d.weather),
    issues: toTextOrNull(d.issues),
    tomorrow_plan: toTextOrNull(d.tomorrow),
    sign_prepared: toTextOrNull(d.signPrepared),
    sign_oem: toTextOrNull(d.signOEM),
    sign_site: toTextOrNull(d.signSite),
    safety_hazard_yn: toTextOrNull(d.safety.hazard.yn),
    safety_hazard_detail: toTextOrNull(d.safety.hazard.detail),
    safety_shutdown_yn: toTextOrNull(d.safety.shutdown.yn),
    safety_shutdown_detail: toTextOrNull(d.safety.shutdown.detail),
    safety_major_yn: toTextOrNull(d.safety.major.yn),
    safety_major_detail: toTextOrNull(d.safety.major.detail),
    progress_planned_today: toTextOrNull(d.progress.plannedToday),
    progress_actual_today: toTextOrNull(d.progress.actualToday),
    progress_cumulative: toIntOrNull(d.progress.cumulative),
    progress_on_schedule: toTextOrNull(d.progress.onSchedule),
  };
}

export function draftTurbineToRow(t: TurbineWork, reportId: string, sortOrder: number) {
  return {
    id: t.id,
    report_id: reportId,
    turbine: toTextOrNull(t.turbine),
    blade_done: toTextOrNull(t.blade),
    hub: toTextOrNull(t.hub),
    nacelle: toTextOrNull(t.nacelle),
    tower: toTextOrNull(t.tower),
    drone: toTextOrNull(t.drone),
    pct_done: toIntOrNull(t.pct),
    notes: toTextOrNull(t.notes),
    sort_order: sortOrder,
  };
}

export function draftLockToRow(l: LockCycle, reportId: string, sortOrder: number) {
  return {
    id: l.id,
    report_id: reportId,
    turbine: toTextOrNull(l.turbine),
    blade_position: toTextOrNull(l.pos),
    planned_time: toTimeOrNull(l.planned),
    actual_time: toTimeOrNull(l.actual),
    notes: toTextOrNull(l.notes),
    sort_order: sortOrder,
  };
}

export function draftFindingToRow(f: Finding, reportId: string, sortOrder: number) {
  return {
    id: f.id,
    report_id: reportId,
    turbine: toTextOrNull(f.turbine),
    area: toTextOrNull(f.area),
    description: toTextOrNull(f.desc),
    severity: toIntOrNull(f.severity),
    photo_ref: toTextOrNull(f.photo),
    oem_notified: toTextOrNull(f.oemNotified),
    time_notified: toTimeOrNull(f.time),
    sort_order: sortOrder,
  };
}
