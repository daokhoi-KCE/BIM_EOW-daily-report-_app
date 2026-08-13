export type YesNo = "" | "Có" | "Không";

export interface SafetyItem {
  yn: YesNo;
  detail: string;
}

export interface TurbineWork {
  id: string;
  turbine: string;
  blade: string; // "A" / "A,B" / "A,B,C"
  hub: string; // "Xong" / "Dở"
  nacelle: string;
  tower: string;
  drone: string; // "Có" / "Không"
  pct: string; // % done, kept as string for input binding
  notes: string;
}

export interface LockCycle {
  id: string;
  turbine: string;
  pos: string; // A / B / C
  planned: string; // HH:MM
  actual: string; // HH:MM
  notes: string;
}

export interface Photo {
  id: string;
  storagePath: string;
  url: string;
}

export interface Finding {
  id: string;
  turbine: string;
  area: string;
  desc: string;
  severity: string; // "1".."5"
  photo: string; // free-text photo ref, e.g. WTG05-BL-A-014
  oemNotified: YesNo;
  time: string; // HH:MM
  photos: Photo[];
}

export interface ReportDraft {
  id: string;
  date: string;
  dayNum: string;
  plannedTurbines: string;
  actualTurbines: string;
  preparedBy: string;
  oemRep: string;
  sentTo: string;
  weather: string;
  turbines: TurbineWork[];
  locks: LockCycle[];
  findings: Finding[];
  photos: Photo[];
  safety: {
    hazard: SafetyItem;
    shutdown: SafetyItem;
    major: SafetyItem;
  };
  progress: {
    plannedToday: string;
    actualToday: string;
    cumulative: string;
    onSchedule: string;
  };
  issues: string;
  tomorrow: string;
  signPrepared: string;
  signOEM: string;
  signSite: string;
  updatedAt: number;
}

export interface ReportListItem {
  id: string;
  date: string;
  plannedTurbines: string;
  preparedBy: string;
  findingsCount: number;
  photosCount: number;
  cumulative: string;
  hasMajor: boolean;
  updatedAt: number;
}
