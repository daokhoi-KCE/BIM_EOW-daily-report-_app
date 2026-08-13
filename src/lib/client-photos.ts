"use client";

import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { EVIDENCE_BUCKET, SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import { newId } from "@/lib/utils";
import { ensureFindingRow } from "@/lib/actions/reports";
import type { Photo } from "@/lib/types";

async function uploadAndSign(path: string, file: File): Promise<Photo> {
  const supabase = createClient();
  const blob = await compressImage(file);

  const { error: uploadErr } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (uploadErr) throw new Error(uploadErr.message);

  const { data: signedData } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  return { id: newId(), storagePath: path, url: signedData?.signedUrl ?? "" };
}

export async function uploadSitePhoto(reportId: string, file: File): Promise<Photo> {
  const path = `${reportId}/site/${newId()}.jpg`;
  const photo = await uploadAndSign(path, file);

  const supabase = createClient();
  const { error } = await supabase
    .from("site_photos")
    .insert({ id: photo.id, report_id: reportId, storage_path: path });
  if (error) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([path]);
    throw new Error(error.message);
  }
  return photo;
}

export async function uploadFindingPhoto(findingId: string, reportId: string, file: File): Promise<Photo> {
  await ensureFindingRow(reportId, findingId);

  const path = `${reportId}/findings/${findingId}/${newId()}.jpg`;
  const photo = await uploadAndSign(path, file);

  const supabase = createClient();
  const { error } = await supabase
    .from("finding_photos")
    .insert({ id: photo.id, finding_id: findingId, storage_path: path });
  if (error) {
    await supabase.storage.from(EVIDENCE_BUCKET).remove([path]);
    throw new Error(error.message);
  }
  return photo;
}

export async function removeSitePhoto(photo: Photo): Promise<void> {
  const supabase = createClient();
  await supabase.from("site_photos").delete().eq("id", photo.id);
  await supabase.storage.from(EVIDENCE_BUCKET).remove([photo.storagePath]);
}

export async function removeFindingPhoto(photo: Photo): Promise<void> {
  const supabase = createClient();
  await supabase.from("finding_photos").delete().eq("id", photo.id);
  await supabase.storage.from(EVIDENCE_BUCKET).remove([photo.storagePath]);
}
