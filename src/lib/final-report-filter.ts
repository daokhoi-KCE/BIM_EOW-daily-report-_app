import type { Finding } from "@/lib/types";

/**
 * Các phát hiện thuộc đợt khảo sát kết cấu cánh — ẩn khỏi báo cáo tổng hợp.
 *
 * Phần khảo sát cánh được ghi theo từng số sê-ri cánh ("Blade ID:
 * 000174-PR65.4P-53"), là một đợt kiểm tra riêng và không nằm trong phạm vi
 * bản báo cáo final. Dữ liệu vẫn giữ nguyên trong cơ sở dữ liệu và vẫn hiện
 * đầy đủ ở báo cáo hằng ngày; chỉ bản tổng hợp là không in ra.
 *
 * Dấu hiệu nhận biết nằm ở cột `area`, không phải phần mô tả: có 10 bản ghi
 * mô tả quá ngắn để nhận ra ("No defects above Severity 2."), nhưng khu vực
 * thì luôn kèm mã sê-ri 6 chữ số. Trường hợp duy nhất không có mã là khu vực
 * ghi thẳng "INSIDE BLADE".
 *
 * Ngược lại, các hạng mục cơ khí của Hub — "Hub-Blade bearing bolts",
 * "Blade bolt", "HUB & Blades — Pitch gear teeth ring" — có chữ "blade"
 * nhưng không có mã sê-ri, và vẫn thuộc báo cáo tổng hợp.
 */
export function isBladeSurveyFinding(areaRaw: string | undefined): boolean {
  const area = (areaRaw ?? "").trim();
  if (!area) return false;
  const lower = area.toLowerCase();
  if (!lower.includes("blade")) return false;
  // "INSIDE BLADE" là khu vực khảo sát cánh duy nhất không ghi kèm sê-ri.
  if (lower.includes("inside blade")) return true;
  return /\d{6}/.test(area);
}

/** Bỏ phần khảo sát cánh khỏi danh sách phát hiện của một báo cáo ngày. */
export function excludeBladeSurvey<T extends Pick<Finding, "area">>(findings: T[]): T[] {
  return findings.filter((f) => !isBladeSurveyFinding(f.area));
}
