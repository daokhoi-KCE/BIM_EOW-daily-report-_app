import { newId, todayStr } from "./utils";
import type { ReportDraft, TurbineWork, LockCycle, Finding } from "./types";

export const emptyTurbine = (): TurbineWork => ({
  id: newId(),
  turbine: "",
  blade: "",
  hub: "",
  nacelle: "",
  tower: "",
  drone: "",
  pct: "",
  notes: "",
});

export const emptyLock = (): LockCycle => ({
  id: newId(),
  turbine: "",
  pos: "",
  planned: "",
  actual: "",
  notes: "",
});

export const emptyFinding = (): Finding => ({
  id: newId(),
  turbine: "",
  area: "",
  desc: "",
  severity: "",
  photo: "",
  oemNotified: "",
  time: "",
  photos: [],
});

export const blankReport = (): ReportDraft => ({
  id: newId(),
  date: todayStr(),
  dayNum: "",
  plannedTurbines: "",
  actualTurbines: "",
  preparedBy: "",
  oemRep: "",
  sentTo: "BIM Wind Power JSC / GE / Site team MB",
  weather: "",
  turbines: [emptyTurbine(), emptyTurbine()],
  locks: [emptyLock(), emptyLock(), emptyLock(), emptyLock()],
  findings: [],
  photos: [],
  safety: {
    hazard: { yn: "", detail: "" },
    shutdown: { yn: "", detail: "" },
    major: { yn: "", detail: "" },
  },
  progress: { plannedToday: "", actualToday: "", cumulative: "", onSchedule: "" },
  issues: "",
  tomorrow: "",
  signPrepared: "",
  signOEM: "",
  signSite: "",
  updatedAt: Date.now(),
});
