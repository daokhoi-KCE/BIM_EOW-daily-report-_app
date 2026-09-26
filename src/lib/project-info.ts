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

/** Mục 2.1 — Standards. */
export const STANDARDS = [
  { ref: "IEC 61400-1", title: "Wind energy generation systems — Design requirements" },
  { ref: "IEC 61400-5", title: "Wind energy generation systems — Wind turbine blades" },
  { ref: "ISO 9712", title: "Non-destructive testing — Qualification and certification of NDT personnel" },
  { ref: "DNVGL-ST-0376", title: "Rotor blades for wind turbines" },
] as const;

/** Mục 2.2 — Manuals and Documentation. */
export const MANUALS = [
  { ref: "GE O&M Manual", title: "Operation and maintenance manual for the installed turbine model" },
  { ref: "GE Service Bulletins", title: "Technical bulletins applicable to the installed fleet" },
  { ref: "Site EOW Scope of Work", title: "Agreed inspection scope between the Owner and the OEM" },
] as const;

/** Thang mức độ nghiêm trọng dùng trong toàn báo cáo. */
export const SEVERITY_SCALE = [
  { level: 1, en: "No action required", vi: "Không cần xử lý" },
  { level: 2, en: "Monitor at next scheduled service", vi: "Theo dõi ở lần bảo dưỡng kế tiếp" },
  { level: 3, en: "Repair within the agreed maintenance window", vi: "Sửa trong đợt bảo dưỡng đã thống nhất" },
  { level: 4, en: "Repair required before continued operation", vi: "Phải sửa trước khi vận hành tiếp" },
  { level: 5, en: "Stop the turbine immediately", vi: "Dừng máy ngay" },
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
