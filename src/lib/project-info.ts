/**
 * Thông tin cố định của dự án, in ra phần đầu báo cáo tổng hợp.
 *
 * Đây là nơi duy nhất cần sửa khi đổi tên dự án, model tuabin, tên người
 * kiểm tra hay số hiệu tài liệu — các component chỉ đọc từ đây.
 */

export const PROJECT = {
  /** Tên công trường, in trên đầu mỗi trang. */
  siteName: "BIM WIND FARM",
  /** Loại hình kiểm tra, in cạnh tên công trường. */
  inspectionType: "EOW VISUAL INSPECTION",
  /** Chủ đầu tư. */
  owner: "BIM Wind Power JSC",
  /** Nhà sản xuất tuabin. */
  oem: "GE (General Electric)",
  /**
   * Model tuabin — CẦN XÁC NHẬN.
   * Giá trị này được kế thừa từ bản báo cáo trước, chưa có ai đối chiếu với
   * hồ sơ kỹ thuật. Sửa tại đây nếu sai.
   */
  turbineModel: "GE Cypress 5.5-158",
  /** Tổng số tuabin của dự án (dùng cho mẫu số "x/22"). */
  totalTurbines: 22,
  location: "Việt Nam",
} as const;

/** Bảng DOCUMENT CONTRIBUTORS. */
export const INSPECTORS = [
  { name: "Đào Duy Khôi", role: "Inspector", roleVi: "Kỹ sư kiểm tra" },
  { name: "Nguyễn Minh Quyền", role: "Inspector", roleVi: "Kỹ sư kiểm tra" },
] as const;

export const APPROVERS = [
  { name: "", role: "Project Manager", roleVi: "Quản lý dự án" },
] as const;

/** Mức phân loại tài liệu đang áp dụng cho báo cáo này. */
export const DOCUMENT_CLASSIFICATION = "CONFIDENTIAL";

export const CLASSIFICATION_KEY = [
  { level: "STRICTLY CONFIDENTIAL", meaning: "For recipients only", meaningVi: "Chỉ dành cho người nhận" },
  { level: "CONFIDENTIAL", meaning: "May be shared within client's organization", meaningVi: "Được chia sẻ trong nội bộ chủ đầu tư" },
  { level: "CLIENT'S DISCRETION", meaning: "Distribution at the client's discretion", meaningVi: "Chủ đầu tư quyết định phạm vi phát hành" },
  { level: "FOR PUBLIC RELEASE", meaning: "No restriction", meaningVi: "Không hạn chế" },
] as const;

/**
 * Tên tài liệu khi xuất PDF.
 *
 * Trình duyệt lấy tên file từ tiêu đề trang, nên đây chính là tên file người
 * dùng nhận được.
 */
export const EXPORT_DOC_NAME = "BIM - Final inspection";

/**
 * Ghép tên file cho một bản in cụ thể.
 *
 * Báo cáo tổng hợp chỉ có một bản nên dùng tên gốc. Báo cáo ngày có 22 bản;
 * nếu để trùng tên thì tải về cái sau đè cái trước, nên nối thêm tên trụ và
 * ngày. Loại bỏ các ký tự mà hệ điều hành không cho đặt trong tên file.
 */
export function buildExportName(...parts: (string | undefined)[]) {
  const clean = parts
    .map((p) => (p ?? "").replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return [EXPORT_DOC_NAME, ...clean].join(" - ");
}

/** Mục 2 — Standards. */
export const STANDARDS = [
  { ref: "IEC 61400-1", title: "Wind energy generation systems — Design requirements" },
  { ref: "IEC 61400-5", title: "Wind energy generation systems — Wind turbine blades" },
  { ref: "ISO 9712", title: "Non-destructive testing — Qualification and certification of NDT personnel" },
  { ref: "DNVGL-ST-0376", title: "Rotor blades for wind turbines" },
] as const;

/**
 * Thang mức độ nghiêm trọng dùng trong toàn báo cáo.
 *
 * Diễn đạt theo lối của báo cáo visual inspection tiêu chuẩn: mỗi mức nêu
 * tình trạng cụm thiết bị rồi đến hành động khuyến nghị, kèm một dải màu để
 * tra nhanh. Mức "chưa phân loại" dành cho phát hiện chưa được chấm điểm —
 * dữ liệu hiện trường có những dòng như vậy.
 */
export const SEVERITY_SCALE = [
  {
    level: 1,
    title: "Good",
    titleVi: "Tốt",
    en: "Component in good status and no conspicuous issues found. Recorded for reference only; no action required.",
    vi: "Cụm thiết bị ở tình trạng tốt, không phát hiện vấn đề đáng kể. Chỉ ghi nhận để theo dõi, không cần xử lý.",
    color: "#16A34A",
  },
  {
    level: 2,
    title: "Minor defects",
    titleVi: "Lỗi nhẹ",
    en: "Component has minor defects and nonconformities. Monitor at the next scheduled service.",
    vi: "Cụm thiết bị có lỗi nhẹ và điểm không phù hợp. Theo dõi ở lần bảo dưỡng kế tiếp.",
    color: "#FACC15",
  },
  {
    level: 3,
    title: "Moderate defects",
    titleVi: "Lỗi trung bình",
    en: "Component has defects and nonconformities that require repair within the agreed maintenance window.",
    vi: "Cụm thiết bị có lỗi và điểm không phù hợp, cần sửa trong đợt bảo dưỡng đã thống nhất.",
    color: "#F59E0B",
  },
  {
    level: 4,
    title: "Major defects",
    titleVi: "Lỗi nặng",
    en: "Component has major defects and nonconformities and immediate action is recommended. Repair before continued operation.",
    vi: "Cụm thiết bị có lỗi nặng và điểm không phù hợp, khuyến nghị xử lý ngay. Phải sửa trước khi vận hành tiếp.",
    color: "#EA580C",
  },
  {
    level: 5,
    title: "Severe defects",
    titleVi: "Lỗi nghiêm trọng",
    en: "Component has severe defects and nonconformities and further operation of the turbine is not recommended. Stop the turbine immediately.",
    vi: "Cụm thiết bị có lỗi nghiêm trọng và điểm không phù hợp, không khuyến nghị tiếp tục vận hành tuabin. Dừng máy ngay.",
    color: "#DC2626",
  },
  {
    level: null,
    title: "Unclassified",
    titleVi: "Chưa phân loại",
    en: "No severity recorded at the time of inspection, or the component could not be accessed.",
    vi: "Chưa chấm mức độ tại thời điểm kiểm tra, hoặc không tiếp cận được cụm thiết bị.",
    color: "#9CA3AF",
  },
] as const;

/**
 * Số hiệu tài liệu, dựng từ khoảng thời gian khảo sát để hai lần xuất cùng
 * một tập báo cáo luôn cho ra cùng một mã.
 */
export function buildDocumentRef(dateFrom: string, dateTo: string, turbineCount: number) {
  const compact = (d: string) => d.replace(/-/g, "").slice(2);
  const scope = turbineCount === 1 ? "T" : "ALL";
  return `BIM-EOW-${compact(dateFrom) || "000000"}-${compact(dateTo) || "000000"}_${scope}`;
}
