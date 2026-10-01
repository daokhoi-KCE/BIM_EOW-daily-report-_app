/**
 * Đọc dấu Timemark đóng trên ảnh: số trụ WTG, vị trí, ngày và giờ:phút.
 *
 * Dấu nằm góc dưới bên trái, chữ trắng. Cách làm: cắt riêng dải đó, phóng
 * to 3 lần, rồi giữ lại các điểm sáng (chữ) thành đen và bỏ phần còn lại
 * thành trắng — chữ đen trên nền trắng là kiểu OCR đọc tốt nhất.
 *
 * Ngưỡng lọc sáng thử lần lượt 225 → 200 → 245, dừng ở ngưỡng đầu tiên cho
 * ra ngày giờ hợp lệ; vẫn không ra thì thử lại trên cả dải đáy ảnh phòng
 * khi dấu bị đóng lệch sang phải.
 *
 * Đã kiểm trên ảnh thật của dự án với cả hai kiểu dấu — kiểu gọn (bản ảnh
 * trong app) và kiểu bảng (bản ảnh gốc trong máy) — xem kiem-dau-timemark.mjs.
 *
 * LƯU Ý: dấu chỉ in tới PHÚT, không có giây.
 */

import path from 'node:path';
import { createRequire } from 'node:module';

export const DAI_DAU = { x: 0, y: 0.58, w: 0.62, h: 0.42 };
export const DAI_DAY = { x: 0, y: 0.55, w: 1.0, h: 0.45 };
export const NGUONG_SANG = [225, 200, 245];

const THANG = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** Đường dẫn dữ liệu nhận chữ trong node_modules, để khỏi phải tải qua mạng. */
export function duongDanNgonNgu() {
  try {
    const req = createRequire(import.meta.url);
    return path.dirname(req.resolve('@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'));
  } catch { return undefined; }
}

/** Giữ lại điểm sáng (chữ của dấu) thành đen, phần còn lại thành trắng. */
export function locSang(img, muc) {
  const b = img.bitmap;
  for (let i = 0; i < b.data.length; i += 4) {
    const s = b.data[i] * 0.299 + b.data[i + 1] * 0.587 + b.data[i + 2] * 0.114;
    const v = s >= muc ? 0 : 255;
    b.data[i] = b.data[i + 1] = b.data[i + 2] = v;
  }
  return img;
}

/** "Fri, 11 Sep 2026 08:29" → { ngay: '2026-09-11', gio: '08:29' }. */
export function tachNgayGio(txt) {
  const re = /(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})\s*(\d{1,2})\s*[:;.\s]\s*(\d{2})/gi;
  for (const m of String(txt).matchAll(re)) {
    const d = +m[1], th = THANG[m[2].toLowerCase()], y = +m[3], h = +m[4], p = +m[5];
    if (d < 1 || d > 31 || y < 2020 || y > 2100 || h > 23 || p > 59) continue;
    return {
      ngay: `${y}-${String(th).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      gio: `${String(h).padStart(2, '0')}:${String(p).padStart(2, '0')}`,
    };
  }
  return null;
}

/** Số trụ in trên dấu. Lấy giá trị xuất hiện nhiều nhất, phòng khi OCR lạc. */
export function tachTru(txt) {
  const dem = new Map();
  for (const m of String(txt).matchAll(/WTG\s*[:\-–]?\s*0*(\d{1,2})\b/gi)) {
    const s = m[1].padStart(2, '0');
    dem.set(s, (dem.get(s) ?? 0) + 1);
  }
  let nhat = '', n = 0;
  for (const [k, v] of dem) if (v > n) { nhat = k; n = v; }
  return nhat;
}

/** Vị trí: "Item | HUB, Main shaft" (kiểu bảng) hoặc "WTG 16: Top section-Yaw platform" (kiểu gọn). */
export function tachMuc(txt) {
  const a = String(txt).match(/\bItem\s*[|:]?\s*([^|\n]{2,60})/i);
  if (a) return a[1].trim();
  const b = String(txt).match(/WTG\s*\d{1,2}\s*[:\-]\s*([^|\n]{2,60})/i);
  if (b) return b[1].trim();
  return '';
}

/** Đọc dấu trên một ảnh. Trả về ngay/gio/tru/muc rỗng nếu không đọc được. */
export async function docDau(Jimp, worker, tep) {
  const goc = await Jimp.read(tep);
  const { width: W, height: H } = goc.bitmap;
  for (const dai of [DAI_DAU, DAI_DAY]) {
    const base = goc.clone().crop({
      x: Math.round(dai.x * W), y: Math.round(dai.y * H),
      w: Math.max(1, Math.round(dai.w * W)), h: Math.max(1, Math.round(dai.h * H)),
    });
    base.resize({ w: Math.min(1800, base.bitmap.width * 3) });
    for (const muc of NGUONG_SANG) {
      const buf = await locSang(base.clone(), muc).getBuffer('image/png');
      const { data } = await worker.recognize(buf);
      const txt = data.text.replace(/\s+/g, ' ').trim();
      const ng = tachNgayGio(txt);
      if (ng) return { ...ng, tru: tachTru(txt), muc: tachMuc(txt), tho: txt.slice(0, 200) };
    }
  }
  return { ngay: '', gio: '', tru: '', muc: '', tho: '' };
}
