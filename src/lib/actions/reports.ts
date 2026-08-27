"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EVIDENCE_BUCKET, SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import {
  draftToReportRow,
  draftTurbineToRow,
  draftLockToRow,
  draftFindingToRow,
  rowToListItem,
  rowsToReportDraft,
} from "@/lib/db-mappers";
import type {
  ReportRow,
  TurbineWorkRow,
  LockScheduleRow,
  FindingRow,
  FindingPhotoRow,
  SitePhotoRow,
  ReportListViewRow,
} from "@/lib/db-types";
import type { ReportDraft, ReportListItem, Photo } from "@/lib/types";
import { newId } from "@/lib/utils";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function listReports(): Promise<ReportListItem[]> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("report_list_view")
    .select("*")
    .returns<ReportListViewRow[]>();
  if (error) throw new Error(error.message);

  const items = (data ?? []).map(rowToListItem);
  items.sort(
    (a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt,
  );
  return items;
}

export async function createReport(): Promise<string> {
  const { supabase } = await requireUser();
  const id = newId();
  const today = new Date().toISOString().slice(0, 10);

  const { error: reportErr } = await supabase.from("reports").insert({
    id,
    report_date: today,
    sent_to: "BIM Wind Power JSC / GE / Site team MB",
  });
  if (reportErr) throw new Error(reportErr.message);

  const turbineRows = [0, 1].map((i) => ({
    id: newId(),
    report_id: id,
    sort_order: i,
  }));
  const lockRows = [0, 1, 2, 3].map((i) => ({
    id: newId(),
    report_id: id,
    sort_order: i,
  }));

  await Promise.all([
    supabase.from("turbine_work").insert(turbineRows),
    supabase.from("lock_schedule").insert(lockRows),
  ]);

  return id;
}

export async function createReportAction(): Promise<void> {
  const id = await createReport();
  redirect(`/reports/${id}`);
}

async function signPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  const map = new Map<string, string>();
  if (error || !data) return map;
  data.forEach((d) => {
    if (d.signedUrl && d.path) map.set(d.path, d.signedUrl);
  });
  return map;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getReportDraft(id: string): Promise<ReportDraft | null> {
  if (!UUID_RE.test(id)) return null;

  const { supabase } = await requireUser();

  const [reportRes, turbinesRes, locksRes, findingsRes, sitePhotosRes] =
    await Promise.all([
      supabase.from("reports").select("*").eq("id", id).returns<ReportRow[]>().maybeSingle(),
      supabase
        .from("turbine_work")
        .select("*")
        .eq("report_id", id)
        .order("sort_order")
        .returns<TurbineWorkRow[]>(),
      supabase
        .from("lock_schedule")
        .select("*")
        .eq("report_id", id)
        .order("sort_order")
        .returns<LockScheduleRow[]>(),
      supabase
        .from("findings")
        .select("*")
        .eq("report_id", id)
        .order("sort_order")
        .returns<FindingRow[]>(),
      supabase
        .from("site_photos")
        .select("*")
        .eq("report_id", id)
        .order("created_at")
        .returns<SitePhotoRow[]>(),
    ]);

  if (reportRes.error) throw new Error(reportRes.error.message);
  if (!reportRes.data) return null;

  const findingRows = findingsRes.data ?? [];
  const findingIds = findingRows.map((f) => f.id);

  let findingPhotoRows: FindingPhotoRow[] = [];
  if (findingIds.length > 0) {
    const { data, error } = await supabase
      .from("finding_photos")
      .select("*")
      .in("finding_id", findingIds)
      .order("created_at")
      .returns<FindingPhotoRow[]>();
    if (error) throw new Error(error.message);
    findingPhotoRows = data ?? [];
  }

  const sitePhotoRows = sitePhotosRes.data ?? [];
  const allPaths = [
    ...sitePhotoRows.map((p) => p.storage_path),
    ...findingPhotoRows.map((p) => p.storage_path),
  ];
  const signed = await signPhotos(supabase, allPaths);

  const sitePhotos: Photo[] = sitePhotoRows.map((p) => ({
    id: p.id,
    storagePath: p.storage_path,
    url: signed.get(p.storage_path) ?? "",
  }));

  const findingPhotosMap = new Map<string, Photo[]>();
  for (const p of findingPhotoRows) {
    const arr = findingPhotosMap.get(p.finding_id) ?? [];
    arr.push({ id: p.id, storagePath: p.storage_path, url: signed.get(p.storage_path) ?? "" });
    findingPhotosMap.set(p.finding_id, arr);
  }

  return rowsToReportDraft(
    reportRes.data,
    turbinesRes.data ?? [],
    locksRes.data ?? [],
    findingRows,
    findingPhotosMap,
    sitePhotos,
  );
}

/**
 * Đảm bảo hàng finding đã tồn tại trong DB trước khi đính ảnh — dòng finding
 * mới thêm trên UI chỉ được ghi khi autosave debounce (700ms) chạy, nhưng
 * người dùng có thể bấm chụp ảnh ngay lập tức, trước khi finding_id tồn tại
 * để finding_photos tham chiếu tới (foreign key).
 */
export async function ensureFindingRow(reportId: string, findingId: string): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("findings")
    .upsert({ id: findingId, report_id: reportId });
  if (error) throw new Error(error.message);
}

export async function getReportDraftsByIds(ids: string[]): Promise<ReportDraft[]> {
  const uniqueValid = [...new Set(ids)].filter((id) => UUID_RE.test(id));
  const drafts = await Promise.all(uniqueValid.map((id) => getReportDraft(id)));
  return drafts.filter((d): d is ReportDraft => d !== null);
}

export async function getCumulativeHint(): Promise<number> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("turbine_work")
    .select("turbine")
    .gte("pct_done", 100)
    .not("turbine", "is", null)
    .returns<{ turbine: string | null }[]>();
  if (error) throw new Error(error.message);

  const done = new Set<string>();
  for (const row of data ?? []) {
    const t = row.turbine?.trim().toUpperCase();
    if (t) done.add(t);
  }
  return done.size;
}

export async function saveReport(
  draft: ReportDraft,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { supabase } = await requireUser();

    const { error: reportErr } = await supabase
      .from("reports")
      .upsert(draftToReportRow(draft));
    if (reportErr) throw new Error(reportErr.message);

    await syncTurbines(supabase, draft);
    await syncLocks(supabase, draft);
    await syncFindings(supabase, draft);

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Lỗi lưu báo cáo" };
  }
}

type ServerSupabase = Awaited<ReturnType<typeof createClient>>;

async function syncTurbines(supabase: ServerSupabase, draft: ReportDraft) {
  const { data: existing } = await supabase
    .from("turbine_work")
    .select("id")
    .eq("report_id", draft.id)
    .returns<{ id: string }[]>();
  const keepIds = new Set(draft.turbines.map((t) => t.id));
  const toDelete = (existing ?? []).filter((r) => !keepIds.has(r.id)).map((r) => r.id);
  if (toDelete.length) {
    await supabase.from("turbine_work").delete().in("id", toDelete);
  }
  if (draft.turbines.length) {
    const rows = draft.turbines.map((t, i) => draftTurbineToRow(t, draft.id, i));
    const { error } = await supabase.from("turbine_work").upsert(rows);
    if (error) throw new Error(error.message);
  }
}

async function syncLocks(supabase: ServerSupabase, draft: ReportDraft) {
  const { data: existing } = await supabase
    .from("lock_schedule")
    .select("id")
    .eq("report_id", draft.id)
    .returns<{ id: string }[]>();
  const keepIds = new Set(draft.locks.map((l) => l.id));
  const toDelete = (existing ?? []).filter((r) => !keepIds.has(r.id)).map((r) => r.id);
  if (toDelete.length) {
    await supabase.from("lock_schedule").delete().in("id", toDelete);
  }
  if (draft.locks.length) {
    const rows = draft.locks.map((l, i) => draftLockToRow(l, draft.id, i));
    const { error } = await supabase.from("lock_schedule").upsert(rows);
    if (error) throw new Error(error.message);
  }
}

async function syncFindings(supabase: ServerSupabase, draft: ReportDraft) {
  const { data: existing } = await supabase
    .from("findings")
    .select("id")
    .eq("report_id", draft.id)
    .returns<{ id: string }[]>();
  const keepIds = new Set(draft.findings.map((f) => f.id));
  const toDelete = (existing ?? []).filter((r) => !keepIds.has(r.id)).map((r) => r.id);
  if (toDelete.length) {
    await removeFindingPhotosStorage(supabase, toDelete);
    await supabase.from("findings").delete().in("id", toDelete);
  }
  if (draft.findings.length) {
    const rows = draft.findings.map((f, i) => draftFindingToRow(f, draft.id, i));
    const { error } = await supabase.from("findings").upsert(rows);
    if (error) throw new Error(error.message);
  }
}

async function removeFindingPhotosStorage(supabase: ServerSupabase, findingIds: string[]) {
  const { data } = await supabase
    .from("finding_photos")
    .select("storage_path")
    .in("finding_id", findingIds)
    .returns<{ storage_path: string }[]>();
  const paths = (data ?? []).map((r) => r.storage_path);
  if (paths.length) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove(paths);
  }
}

// Ký URL cho 1 ảnh vừa được người khác thêm (đồng bộ realtime).
export async function signPhotoPath(path: string): Promise<string> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) return "";
  return data.signedUrl;
}

export async function deleteReport(id: string): Promise<void> {
  const { supabase } = await requireUser();

  const [siteRes, findingIdsRes] = await Promise.all([
    supabase.from("site_photos").select("storage_path").eq("report_id", id).returns<{ storage_path: string }[]>(),
    supabase.from("findings").select("id").eq("report_id", id).returns<{ id: string }[]>(),
  ]);

  const findingIds = (findingIdsRes.data ?? []).map((f) => f.id);
  let findingPhotoPaths: string[] = [];
  if (findingIds.length) {
    const { data } = await supabase
      .from("finding_photos")
      .select("storage_path")
      .in("finding_id", findingIds)
      .returns<{ storage_path: string }[]>();
    findingPhotoPaths = (data ?? []).map((r) => r.storage_path);
  }

  const allPaths = [...(siteRes.data ?? []).map((r) => r.storage_path), ...findingPhotoPaths];
  if (allPaths.length) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove(allPaths);
  }

  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
