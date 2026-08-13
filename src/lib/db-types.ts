// Kiểu dữ liệu khớp với các bảng trong supabase/schema.sql (snake_case).

export interface ReportRow {
  id: string;
  report_date: string;
  day_number: number | null;
  planned_turbines: string | null;
  actual_turbines: string | null;
  prepared_by: string | null;
  oem_rep: string | null;
  sent_to: string | null;
  weather: string | null;
  issues: string | null;
  tomorrow_plan: string | null;
  sign_prepared: string | null;
  sign_oem: string | null;
  sign_site: string | null;
  safety_hazard_yn: string | null;
  safety_hazard_detail: string | null;
  safety_shutdown_yn: string | null;
  safety_shutdown_detail: string | null;
  safety_major_yn: string | null;
  safety_major_detail: string | null;
  progress_planned_today: string | null;
  progress_actual_today: string | null;
  progress_cumulative: number | null;
  progress_on_schedule: string | null;
  created_at: string;
  updated_at: string;
}

export interface TurbineWorkRow {
  id: string;
  report_id: string;
  turbine: string | null;
  blade_done: string | null;
  hub: string | null;
  nacelle: string | null;
  tower: string | null;
  drone: string | null;
  pct_done: number | null;
  notes: string | null;
  sort_order: number;
}

export interface LockScheduleRow {
  id: string;
  report_id: string;
  turbine: string | null;
  blade_position: string | null;
  planned_time: string | null;
  actual_time: string | null;
  delay_minutes: number | null;
  notes: string | null;
  sort_order: number;
}

export interface FindingRow {
  id: string;
  report_id: string;
  turbine: string | null;
  area: string | null;
  description: string | null;
  severity: number | null;
  photo_ref: string | null;
  oem_notified: string | null;
  time_notified: string | null;
  sort_order: number;
}

export interface FindingPhotoRow {
  id: string;
  finding_id: string;
  storage_path: string;
  created_at: string;
}

export interface SitePhotoRow {
  id: string;
  report_id: string;
  storage_path: string;
  created_at: string;
}

export interface ReportListViewRow {
  id: string;
  report_date: string;
  day_number: number | null;
  planned_turbines: string | null;
  prepared_by: string | null;
  progress_cumulative: number | null;
  safety_hazard_yn: string | null;
  safety_shutdown_yn: string | null;
  safety_major_yn: string | null;
  updated_at: string;
  findings_count: number;
  site_photos_count: number;
  finding_photos_count: number;
}
