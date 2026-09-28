/**
 * Chuẩn hoá tên trụ về dạng "WTG NN".
 *
 * Tên trụ do đội hiện trường gõ tay nên không thống nhất: trong 22 báo cáo
 * có cả "WTG 02", "WTG01", "WTG 13 " (thừa dấu cách cuối). Hệ quả là tên
 * file xuất ra xếp sai thứ tự — "WTG01" rơi xuống sau "WTG 22" vì máy tính
 * xếp chữ số sau dấu cách.
 *
 * Hàm này chỉ đổi cách hiển thị và cách đặt tên file; dữ liệu trong cơ sở
 * dữ liệu giữ nguyên như đội hiện trường đã ghi.
 *
 * Chuỗi không theo dạng WTG (ví dụ "T01") được trả lại nguyên vẹn, chỉ gom
 * các khoảng trắng thừa.
 */
export function normalizeTurbineLabel(raw: string | undefined): string {
  const s = (raw ?? "").trim().replace(/\s+/g, " ");
  if (!s) return "";

  // "WTG 2", "WTG02", "WTG-01" đều là một trụ; phần đuôi (nếu có) giữ lại.
  const m = s.toUpperCase().match(/^WTG\s*[-_]?\s*0*(\d{1,3})\b(.*)$/);
  if (!m) return s;

  const number = m[1].padStart(2, "0");
  const rest = m[2].trim();
  return rest ? `WTG ${number} ${rest}` : `WTG ${number}`;
}

/**
 * Chuỗi này có phải tên một trụ không?
 *
 * Cột tên trụ của finding được gõ tay và thỉnh thoảng bị lỗi: "WT08" (thiếu
 * chữ G), "WTG" (thiếu số), "WTG 0:" (bấm nhầm phím), "T01". Nếu cứ lấy
 * nguyên thì báo cáo tổng hợp mọc thêm những trụ không có thật, mỗi trụ một
 * dòng trong bảng 22 trụ.
 *
 * Tên hợp lệ là "WTG" kèm một số — mọi cách viết hoa thường, có hay không
 * dấu cách, gạch nối đều được. Chuỗi không đạt thì phải lấy tên trụ ghi ở
 * đầu báo cáo ngày thay thế, chứ không bỏ finding đi.
 */
export function isTurbineLabel(raw: string | undefined): boolean {
  return /^WTG\s*[-_]?\s*\d{1,3}$/i.test((raw ?? "").trim().replace(/\s+/g, " "));
}
