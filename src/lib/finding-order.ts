// Thứ tự ưu tiên hiển thị findings theo khu vực (từ trên xuống dưới trụ):
// Nacelle → Hub → Blade → Yaw platform → Top section → Section A → B → C → D
// → Base → Outside.
// So khớp theo từ khóa (không phân biệt hoa thường, hỗ trợ cả tiếng Việt);
// khu vực không nhận diện được xếp cuối, giữ nguyên thứ tự nhập.

const AREA_RULES: { rank: number; test: RegExp }[] = [
  { rank: 0, test: /nacelle|vỏ\s*tuabin/i },
  { rank: 1, test: /\bhub\b|moay\s*ơ/i },
  { rank: 2, test: /blade|cánh/i },
  { rank: 3, test: /yaw|sàn\s*xoay/i },
  { rank: 4, test: /top\s*section|section\s*top|\bđỉnh\b/i },
  { rank: 5, test: /section\s*a\b|khoang\s*a\b/i },
  { rank: 6, test: /section\s*b\b|khoang\s*b\b/i },
  { rank: 7, test: /section\s*c\b|khoang\s*c\b/i },
  { rank: 8, test: /section\s*d\b|khoang\s*d\b/i },
  { rank: 9, test: /\bbase\b|chân\s*(trụ|tháp)|móng/i },
  { rank: 10, test: /outside|bên\s*ngoài|ngoài/i },
];

const UNMATCHED_RANK = AREA_RULES.length;

export function areaRank(area: string): number {
  for (const rule of AREA_RULES) {
    if (rule.test.test(area)) return rule.rank;
  }
  return UNMATCHED_RANK;
}

// Sort ổn định: cùng khu vực thì giữ nguyên thứ tự nhập ban đầu.
export function sortFindingsByArea<T extends { area: string }>(findings: T[]): T[] {
  return [...findings].sort((a, b) => areaRank(a.area) - areaRank(b.area));
}
