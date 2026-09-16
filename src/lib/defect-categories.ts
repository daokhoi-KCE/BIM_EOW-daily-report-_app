// Danh mục lỗi phổ biến dùng cho ma trận tổng hợp (trụ × lỗi).
// Finding được phân loại bằng từ khóa trên mô tả + khu vực, hỗ trợ Anh/Việt.
//
// Hai thứ tự tách biệt:
//  - Thứ tự MẢNG = thứ tự hiển thị hàng trong bảng (theo danh sách nghiệp vụ).
//  - `priority`  = thứ tự kiểm tra khi phân loại: luật cụ thể phải chạy trước
//    luật tổng quát, nếu không "Oil leaked from Mainshaft" (khu vực có chữ
//    Nacelle) sẽ rơi nhầm vào nhóm "oil từ nacelle xuống tháp".

export interface DefectCategory {
  id: string;
  en: string;
  vi: string;
  /** Thứ tự kiểm tra khi phân loại — số nhỏ chạy trước. */
  priority: number;
  /** Tất cả phải khớp (AND). */
  all?: RegExp[];
  /** Chỉ cần một khớp (OR). */
  any?: RegExp[];
}

const OIL = /oil|grease|dầu|mỡ|nhớt/i;
const BOLT = /bolt|nut|bu\s*lông|ốc|đai\s*ốc/i;
const RUST = /rust|corro|gỉ|rỉ|sét/i;
// \b tránh khớp "clamp(s)" vào "lamp"; \blight vẫn bắt light/lights/lighting.
const LIGHT = /\blight|\blamp|đèn/i;
const NACELLE = /nacelle|vỏ\s*tuabin/i;

export const DEFECT_CATEGORIES: DefectCategory[] = [
  {
    id: "oil-nacelle-tower",
    en: "Oil leaking from nacelle down to tower",
    vi: "Dầu rò từ nacelle chảy xuống tháp",
    priority: 60,
    all: [OIL, NACELLE],
  },
  {
    id: "painting",
    en: "Scratched or damaged painting",
    vi: "Trầy xước / hỏng lớp sơn",
    priority: 70,
    any: [/scratch|paint|coating|sơn|trầy|xước|tróc/i],
  },
  {
    id: "oil-mainshaft",
    en: "Oil / grease leaking from Mainshaft",
    vi: "Dầu / mỡ rò từ trục chính",
    priority: 10,
    all: [OIL, /main\s*shaft|mainshaft|trục\s*chính/i],
  },
  {
    id: "carbon-brush",
    en: "Magnetic ring outer ring carbon brush",
    vi: "Chổi than vòng từ / vòng ngoài",
    priority: 20,
    any: [/carbon\s*brush|chổi\s*than|magnetic\s*ring|vòng\s*từ/i],
  },
  {
    id: "cms-module",
    en: "CMS module",
    vi: "Mô-đun CMS",
    priority: 20,
    any: [/\bcms\b/i],
  },
  {
    id: "damper-generator",
    en: "Damper generator",
    vi: "Giảm chấn máy phát",
    priority: 20,
    any: [/damper|giảm\s*chấn/i],
  },
  {
    id: "slip-ring",
    en: "Slip ring",
    vi: "Vòng trượt (slip ring)",
    priority: 20,
    any: [/slip\s*ring|vòng\s*trượt/i],
  },
  {
    id: "nacelle-lights",
    en: "Nacelle lights not working",
    vi: "Đèn nacelle không sáng",
    priority: 30,
    all: [LIGHT, NACELLE],
  },
  {
    id: "tower-lights",
    en: "Tower light not working",
    vi: "Đèn tháp không sáng",
    priority: 35,
    all: [LIGHT, /tower|tháp|section|khoang|platform|sàn/i],
  },
  {
    id: "rusty-bolts-stair",
    en: "Bolts of door, hardstand stair are rusty",
    vi: "Bu-lông cửa / cầu thang hardstand bị gỉ",
    priority: 80, // tổng quát nhất — chạy sau cùng
    all: [RUST, BOLT],
  },
  {
    id: "hinge-door",
    en: "Hinge door",
    vi: "Bản lề cửa",
    priority: 15,
    any: [/hinge|bản\s*lề/i],
  },
  {
    id: "bearing-bolts",
    en: "Outer head bolts of bearing",
    vi: "Bu-lông đầu ngoài ổ bi",
    priority: 15,
    all: [BOLT, /bearing|ổ\s*bi|vòng\s*bi|bạc\s*đạn/i],
  },
];

export const OTHER_CATEGORY_ID = "other";

// Thứ tự kiểm tra: cụ thể → tổng quát (ổn định khi priority bằng nhau).
const MATCH_ORDER = DEFECT_CATEGORIES.map((c, i) => ({ c, i })).sort(
  (a, b) => a.c.priority - b.c.priority || a.i - b.i,
).map(({ c }) => c);

/** Phân loại 1 finding → id danh mục, hoặc "other" nếu không khớp. */
export function classifyDefect(finding: { desc?: string; area?: string }): string {
  const text = `${finding.desc ?? ""} ${finding.area ?? ""}`;
  if (!text.trim()) return OTHER_CATEGORY_ID;
  for (const c of MATCH_ORDER) {
    if (c.all && c.all.every((re) => re.test(text))) return c.id;
    if (c.any && c.any.some((re) => re.test(text))) return c.id;
  }
  return OTHER_CATEGORY_ID;
}
