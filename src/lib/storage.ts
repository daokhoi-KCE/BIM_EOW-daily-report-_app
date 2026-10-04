export const EVIDENCE_BUCKET = "evidence-photos";

/**
 * Hạn của đường link ảnh đã ký.
 *
 * Trước đây là 1 giờ và mỗi lần mở trang lại ký link mới. Link mới thì trình
 * duyệt lẫn mạng phân phối của Supabase đều coi là ảnh khác và tải lại từ
 * đầu: tháng 9–10/2026 dự án dùng 6,15 GB băng thông mà chỉ 0,057 GB là lấy
 * từ cache, và gói Free bị khoá. Nay link sống 12 giờ và được dùng lại (xem
 * signPhotos), nên mở lại cùng báo cáo thì trình duyệt lấy ảnh có sẵn.
 *
 * Đổi lại, một link lỡ lộ ra ngoài xem được ảnh trong 12 giờ thay vì 1 giờ.
 */
export const SIGNED_URL_TTL_SECONDS = 12 * 60 * 60;

/**
 * Thời gian trình duyệt được giữ ảnh, ghi vào ảnh lúc tải lên.
 *
 * Ảnh không bao giờ đổi: mỗi tấm có đường dẫn riêng sinh ngẫu nhiên và tải
 * lên với upsert: false. Nên giữ được lâu — một năm.
 */
export const PHOTO_CACHE_CONTROL = String(365 * 24 * 60 * 60);
