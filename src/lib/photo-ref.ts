/**
 * Đọc ô "Photo ref" của một phát hiện.
 *
 * Ô này chứa đường dẫn ảnh trong thư mục ảnh gốc của đội kiểm tra, do script
 * `backup/doi-chieu-anh.mjs` điền vào sau khi đối chiếu nội dung ảnh. Một
 * phát hiện có nhiều ảnh thì các đường dẫn ngăn nhau bằng dấu phẩy:
 *
 *   WTG 19/Tower/02_Top section/WTG 19 - Top section (23).jpg,
 *   WTG 19/Tower/02_Top section/WTG 19 - Top section (19).jpg
 *
 * Bảng ở mục 6 chỉ in tên file, bỏ phần thư mục: trụ và khu vực đã nằm ở
 * hai cột bên cạnh, in lại đường dẫn đầy đủ chỉ làm cột phình ra.
 */
export interface PhotoRefs {
  /** Tên file, đã bỏ phần thư mục. */
  names: string[];
  /** Đường dẫn đầy đủ như đã ghi, giữ nguyên để không mất thông tin. */
  paths: string[];
}

export function parsePhotoRef(raw: string | undefined): PhotoRefs {
  const paths = (raw ?? "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return {
    paths,
    // Cắt ở cả hai kiểu dấu gạch: thư mục ghi trên Windows, nhưng script
    // chuẩn hoá về gạch xuôi khi ghi, nên gặp cả hai là chuyện bình thường.
    names: paths.map((p) => p.split(/[\\/]/).pop() ?? p),
  };
}
