import { canonicalArea, UNKNOWN_RANK } from "./area-label";

/**
 * Thứ tự hiển thị phát hiện: đi từ đỉnh trụ xuống chân.
 *
 * Thứ tự và cách gộp do `canonicalArea` quyết định, nên "Middle B-A",
 * "Section B - A" và "Tower B-A" nằm cạnh nhau thay vì rải rác — trước đây
 * bộ luật ở đây dò theo từ khoá "section b" nên bỏ sót hẳn dạng "Middle".
 *
 * Khu vực không nhận ra vị trí xếp cuối, giữ nguyên thứ tự nhập.
 */
export function areaRank(area: string): number {
  return canonicalArea(area).rank;
}

export { UNKNOWN_RANK };

/** Sort ổn định: cùng khu vực thì giữ nguyên thứ tự nhập ban đầu. */
export function sortFindingsByArea<T extends { area: string }>(findings: T[]): T[] {
  return [...findings].sort((a, b) => areaRank(a.area) - areaRank(b.area));
}
