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

/**
 * Thư mục ảnh gốc trên máy đội kiểm tra.
 *
 * Mục 5.20 in đường dẫn này kèm tên trụ, để người đọc báo cáo biết tìm ảnh
 * đầy đủ ở đâu. Ảnh trong app là bản đã nén để đưa vào báo cáo; bản gốc
 * nằm trong thư mục này.
 *
 * Dùng dấu gạch chéo ngược vì đích đến là máy Windows.
 */
export const PHOTO_LIBRARY_ROOT = "D:\\JCT\\KCE\\Project\\BIM - GE inspection\\Pictures_Sorted";

/**
 * Cỡ ảnh trong mục phát hiện của bản final.
 *
 * `default` — 3 ảnh một hàng, khung cao 34mm. Đủ để nhìn tổng quát cả phát
 * hiện trong một cái liếc, đây là cỡ dùng cho hầu hết các trụ.
 *
 * `large` — 2 ảnh một hàng, khung cao 46mm. Ít cột hơn mới là điều làm ảnh
 * to lên thật: khung rộng khoảng 59mm thay vì 39mm, nên ảnh ngang cũng to
 * theo. Chỉ nâng chiều cao mà giữ 3 cột thì ảnh ngang không đổi một chút
 * nào, chỉ thừa thêm khoảng trắng trên dưới.
 */
export const PHOTO_SIZES = {
  default: { cols: 3, height: "34mm" },
  large: { cols: 2, height: "46mm" },
} as const;

/**
 * Các trụ in ảnh cỡ lớn. Bản final của trụ nào có tên trong danh sách này
 * thì mục 5 dùng cỡ `large`.
 *
 * Bản gộp nhiều trụ chỉ dùng cỡ lớn khi mọi trụ trong đó đều có tên ở đây —
 * một bản in phải có cỡ ảnh thống nhất từ đầu đến cuối.
 *
 * Tên viết theo dạng đã chuẩn hoá "WTG NN". Thêm bớt trụ ở ngay dòng này.
 */
export const LARGE_PHOTO_TURBINES: readonly string[] = ["WTG 01", "WTG 02", "WTG 03"];

/**
 * Đơn vị thực hiện kiểm tra.
 *
 * Bộ khung báo cáo lấy theo tài liệu của UL/GIM; ở đây đơn vị kiểm tra là
 * MB WIND, còn khách hàng là chủ đầu tư BIM. Mọi câu về trách nhiệm và
 * khuyến nghị phải đứng tên MB WIND, không đứng tên chủ đầu tư.
 *
 * `legalName` — CẦN XÁC NHẬN tên pháp nhân đầy đủ để in dưới phần ký.
 */
export const INSPECTION_COMPANY = {
  name: "MB WIND",
  legalName: "MB WIND",
} as const;

/**
 * Thời gian của đợt kiểm tra EOW trên toàn công trường.
 *
 * Đây là mốc cố định của cả chiến dịch, không phải khoảng ngày của những
 * báo cáo đang được chọn: bản final cho một trụ chỉ gộp đúng một báo cáo
 * ngày, nhưng phần giới thiệu vẫn phải nêu thời gian kiểm tra của cả đợt.
 */
export const INSPECTION_PERIOD = {
  from: "2026-08-17",
  to: "2026-09-15",
} as const;

/**
 * Có in bảng "Findings matrix" — liệt kê toàn bộ phát hiện của cả 22 trụ —
 * vào bản final hay không. Đang tắt.
 *
 * Bảng này khoảng 990 dòng, chiếm gần 70% dung lượng trang và chừng 30
 * trang in, và lặp lại y hệt trong cả 22 bản. Mục 4.2 (lỗi chính theo trụ)
 * và 4.3 (ma trận OK/NG) đã cho cùng bức tranh tổng thể trong hai trang,
 * còn chi tiết từng phát hiện của trụ đang xem nằm ở mục 5.
 *
 * Đổi thành true là bật lại, không cần sửa gì khác; khi đó bảng trở lại
 * làm mục 4.4.
 */
export const INCLUDE_FULL_FINDINGS_MATRIX: boolean = false;

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
