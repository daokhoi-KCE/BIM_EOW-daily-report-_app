/**
 * Đọc dấu Timemark đóng trên ảnh: số trụ WTG, vị trí, ngày và giờ:phút.
 *
 * CÁCH ĐỌC
 *
 * Dấu nằm góc dưới bên trái, chữ trắng. Cắt riêng dải đó, phóng to, rồi giữ
 * lại các điểm sáng (chữ) thành đen và bỏ phần còn lại thành trắng — chữ đen
 * trên nền trắng là kiểu OCR đọc tốt nhất.
 *
 * ĐỌC HAI LƯỢT RỒI MỚI NHẬN
 *
 * Khi thử các cỡ phóng khác nhau trên cùng một tấm, có cỡ cho ra "08:28"
 * trong khi tấm đó ghi "08:29" — sai một phút nhưng nhìn vẫn như đọc được.
 * Loại sai này nguy hiểm nhất: nó không báo lỗi, chỉ lặng lẽ gán nhầm tên
 * ảnh vào báo cáo gửi khách.
 *
 * Nên mỗi ảnh đọc bằng hai ngưỡng lọc sáng khác nhau — hai phép nhị phân
 * hoá khác hẳn nhau — và chỉ nhận khi cả hai ra cùng NGÀY và GIỜ:PHÚT. Hai
 * lượt lệch nhau thì thử ngưỡng thứ ba; vẫn không có giá trị nào lặp lại
 * hai lần thì coi như không đọc được, còn hơn đoán bừa.
 *
 * Số trụ và vị trí không bắt buộc khớp giữa hai lượt: số trụ còn lấy được
 * từ đường dẫn thư mục, còn vị trí chỉ dùng để tách các tấm trùng phút.
 *
 * Đã kiểm trên ảnh thật của dự án với cả hai kiểu dấu — kiểu gọn (ảnh trong
 * app) và kiểu bảng (ảnh gốc trong máy) — xem kiem-dau-timemark.mjs.
 *
 * LƯU Ý: dấu chỉ in tới PHÚT, không có giây.
 */

import path from 'node:path';
import { createRequire } from 'node:module';

export const DAI_DAU = { x: 0, y: 0.58, w: 0.62, h: 0.42 };
export const DAI_DAY = { x: 0, y: 0.55, w: 1.0, h: 0.45 };
export const NGUONG_SANG = [225, 200, 245];
/** Cỡ ngang tối đa của dải sau khi phóng. 1600 đọc đúng mà nhẹ hơn 1800. */
export const CAO_MAC_DINH = 1600;

const THANG = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

/** Dữ liệu nhận chữ trong node_modules, để khỏi phải tải qua mạng. */
export function duongDanNgonNgu() {
  const goi = '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz';
  // Thử cạnh file này trước, rồi tới thư mục đang chạy — ai để node_modules
  // ở đâu cũng tìm ra.
  for (const tu of [import.meta.url, path.join(process.cwd(), 'x.mjs')]) {
    try { return path.dirname(createRequire(tu).resolve(goi)); } catch { /* thử chỗ khác */ }
  }
  return undefined;
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

const RONG = { ngay: '', gio: '', tru: '', muc: '', tho: '', lech: '' };

/**
 * Đọc dấu trên một ảnh.
 *
 *   cao    cỡ ngang tối đa của dải sau khi phóng
 *   nhanh  nhận ngay lượt đọc đầu tiên, không đối chứng — nhanh gấp đôi
 *          nhưng có thể sai phút mà không biết
 *
 * Trả về { ngay, gio, tru, muc, tho, lech }. Không đọc được thì ngay/gio
 * rỗng; hai lượt lệch nhau thì lech ghi lại các giá trị đã đọc ra.
 */
export async function docDau(Jimp, worker, tep, { cao = CAO_MAC_DINH, nhanh = false } = {}) {
  const goc = await Jimp.read(tep);
  const { width: W, height: H } = goc.bitmap;

  for (const dai of [DAI_DAU, DAI_DAY]) {
    const base = goc.clone().crop({
      x: Math.round(dai.x * W), y: Math.round(dai.y * H),
      w: Math.max(1, Math.round(dai.w * W)), h: Math.max(1, Math.round(dai.h * H)),
    });
    base.resize({ w: Math.min(cao, base.bitmap.width * 3) });

    const luot = [];
    for (const muc of NGUONG_SANG) {
      const { data } = await worker.recognize(await locSang(base.clone(), muc).getBuffer('image/png'));
      const txt = data.text.replace(/\s+/g, ' ').trim();
      const ng = tachNgayGio(txt);
      if (!ng) continue;
      const kq = { ...ng, tru: tachTru(txt), muc: tachMuc(txt), tho: txt.slice(0, 200), lech: '' };
      if (nhanh) return kq;

      // Nhận khi có lượt trước ra đúng ngày và giờ:phút này.
      const truoc = luot.find((p) => p.ngay === kq.ngay && p.gio === kq.gio);
      if (truoc) {
        return { ...truoc,
                 tru: truoc.tru || kq.tru,
                 muc: truoc.muc.length >= kq.muc.length ? truoc.muc : kq.muc };
      }
      luot.push(kq);
    }
    if (luot.length) {
      // Đọc ra chữ nhưng các lượt không thống nhất — không nhận, ghi lại để dò.
      return { ...RONG, tho: luot[0].tho, lech: luot.map((p) => `${p.ngay} ${p.gio}`).join(' / ') };
    }
  }
  return { ...RONG };
}
