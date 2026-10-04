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
 * ẢNH APP KHÓ ĐỌC HƠN ẢNH GỐC
 *
 * App nén ảnh xuống 1000px chất lượng 0.62 trước khi tải lên, nên dấu nhoè
 * hơn hẳn bản gốc — chạy thử trụ 16 thì ảnh gốc đọc được 525/543 còn ảnh
 * app chỉ 105/157. Nên với ảnh khó, sau khi thử hết các ngưỡng mà vẫn chưa
 * có hai lượt đồng ý, script kéo giãn dải sáng (normalize) rồi thử lại từ
 * đầu — cùng dấu nhưng tương phản mạnh hơn.
 *
 * Đã kiểm trên ảnh thật của dự án với cả hai kiểu dấu — kiểu gọn (ảnh trong
 * app) và kiểu bảng (ảnh gốc trong máy) — xem kiem-dau-timemark.mjs.
 *
 * BIẾT SỚM KHI ẢNH KHÔNG CÓ DẤU
 *
 * Không phải ảnh nào cũng được đóng dấu: thư mục của dự án có vài trăm tấm
 * chụp không qua app Timemark. Trước đây mỗi tấm như vậy vẫn phải thử hết
 * mọi ngưỡng ở cả hai dải rồi mới chịu thua — mười hai lượt OCR cho một tấm
 * chẳng có gì để đọc, tốn gấp sáu lần một tấm đọc được.
 *
 * Nhận ra sớm được, vì ảnh CÓ dấu thì lượt nào cũng ra nhiều chữ, kể cả lượt
 * đặt ngưỡng sai bét: ngưỡng 245 trên ảnh mẫu ra "BIM:WIGM 6. | H [i L Hoan
 * f SIT Ti Horry nD li i NR" — đọc sai hết nhưng vẫn là một đống ký tự. Nên
 * hai lượt đầu của một dải mà không lượt nào ra nổi 12 ký tự chữ số thì dải
 * đó không có dấu, bỏ sang dải sau luôn.
 *
 * LƯU Ý: dấu chỉ in tới PHÚT, không có giây.
 */

import path from 'node:path';
import { createRequire } from 'node:module';

export const DAI_DAU = { x: 0, y: 0.58, w: 0.62, h: 0.42 };
export const DAI_DAY = { x: 0, y: 0.55, w: 1.0, h: 0.45 };
// Thử lần lượt tới khi có hai lượt ra cùng ngày giờ. Ảnh gốc thường xong
// sau hai lượt đầu; ảnh app bị nén xuống 1000px chất lượng 0.62 nên chữ
// nhoè, phải thử thêm mới có hai lượt đồng ý.
export const NGUONG_SANG = [225, 200, 245, 210, 180, 235];
/**
 * Cỡ ngang tối đa của dải sau khi phóng.
 *
 * Đo trên ảnh thật của dự án: 1400 vẫn đọc đúng ngày, giờ và số trụ ở cả hai
 * kiểu dấu, mà nhanh hơn 1600 chừng 1,6 lần. Ở 1400 có mất phần đọc tên vị
 * trí trên dấu, nhưng việc ghép đã chuyển sang so vân tay nên tên vị trí
 * không còn tham gia quyết định nữa.
 */
export const CAO_MAC_DINH = 1400;

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
  const chuan = (y, th, d, h, p) => {
    if (d < 1 || d > 31 || th < 1 || th > 12 || y < 2020 || y > 2100 || h > 23 || p > 59) return null;
    return {
      ngay: `${y}-${String(th).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      gio: `${String(h).padStart(2, '0')}:${String(p).padStart(2, '0')}`,
    };
  };

  // Kiểu chữ: "Fri, 11 Sep 2026 09:35" (dấu dạng bảng, dấu gọn của trụ 16).
  const reChu = /(\d{1,2})\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})\s*(\d{1,2})\s*[:;.\s]\s*(\d{2})/gi;
  for (const m of String(txt).matchAll(reChu)) {
    const kq = chuan(+m[3], THANG[m[2].toLowerCase()], +m[1], +m[4], +m[5]);
    if (kq) return kq;
  }

  // Kiểu số: "Tues, 18/08/2026 10:12" — mẫu dấu của trụ 01 và 08, máy cài
  // định dạng ngày/tháng/năm. Không nhận kiểu này thì OCR đọc đúng từng chữ
  // mà vẫn ra "không đọc được dấu". Ngưỡng sáng cao đôi khi đọc gạch chéo
  // thành dấu phẩy ("18,08,2026"), nên nhận cả , . - làm dấu ngăn.
  // Mặc định ngày trước tháng; chỉ khi số thứ nhất không thể là ngày-trong-
  // tháng hợp lệ ở vị trí tháng (>12) thì mới hiểu là tháng/ngày.
  const reSo = /(\d{1,2})\s*[\/,.\-]\s*(\d{1,2})\s*[\/,.\-]\s*(\d{4})\s+(\d{1,2})\s*[:;.]\s*(\d{2})/g;
  for (const m of String(txt).matchAll(reSo)) {
    let d = +m[1], th = +m[2];
    if (th > 12 && d <= 12) [d, th] = [th, d];
    const kq = chuan(+m[3], th, d, +m[4], +m[5]);
    if (kq) return kq;
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
/**
 * Chuẩn bị ảnh cho OCR bằng jimp — cách cũ, dùng khi máy không có sharp.
 * Trả về một hàm: cho dải, có kéo giãn hay không, ngưỡng sáng → PNG đen trắng.
 */
async function nguonJimp(Jimp, tep) {
  const goc = await Jimp.read(tep);
  const { width: W, height: H } = goc.bitmap;
  return async (dai, cao) => {
    const base = goc.clone().crop({
      x: Math.round(dai.x * W), y: Math.round(dai.y * H),
      w: Math.max(1, Math.round(dai.w * W)), h: Math.max(1, Math.round(dai.h * H)),
    });
    base.resize({ w: Math.min(cao, base.bitmap.width * 3) });
    let gian = null;
    return (manh, muc) => {
      if (manh && !gian) gian = base.clone().normalize();
      return locSang((manh ? gian : base).clone(), muc).getBuffer('image/png');
    };
  };
}

/**
 * Cùng việc đó bằng sharp.
 *
 * Đo trên ảnh gốc 1600x1200 của dự án: mỗi ảnh tốn 808ms thì chỉ 312ms là
 * OCR thật — còn lại là jimp giải mã JPEG (249ms), cắt và phóng dải (104ms)
 * và nén PNG (127ms), toàn bằng JavaScript thuần. sharp làm ba việc đó bằng
 * mã máy. Phần lọc sáng và kéo giãn vẫn viết tay trên mảng điểm ảnh, đúng
 * công thức của jimp, để ảnh đưa vào OCR giống bản cũ:
 *   - xoay theo EXIF trước (jimp cũng xoay);
 *   - kéo giãn: từng kênh màu co giãn tuyến tính từ [nhỏ nhất, lớn nhất] về
 *     [0, 255], như normalize() của jimp;
 *   - lọc sáng: độ sáng 0.299R + 0.587G + 0.114B, như locSang.
 */
/**
 * Bỏ khối pHYs (độ phân giải) khỏi PNG.
 *
 * sharp ghi khối này với một giá trị tesseract đọc ra 25 dpi, nên mỗi lượt
 * OCR in một dòng "Invalid resolution 25 dpi" — hàng nghìn dòng mỗi lượt
 * chạy. PNG của jimp không có khối này và tesseract tự ước lượng; bỏ đi để
 * hai đường xử lý như nhau.
 */
function boDoPhanGiai(png) {
  const phan = [png.subarray(0, 8)];
  for (let i = 8; i < png.length;) {
    const dai = png.readUInt32BE(i);
    const het = i + 12 + dai;
    if (png.toString('latin1', i + 4, i + 8) !== 'pHYs') phan.push(png.subarray(i, het));
    i = het;
  }
  return Buffer.concat(phan);
}

async function nguonSharp(sharp, tep) {
  const anh = sharp(tep, { failOn: 'none' }).rotate();
  const { data: goc, info } = await anh.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  return async (dai, cao) => {
    const w = Math.max(1, Math.round(dai.w * W)), h = Math.max(1, Math.round(dai.h * H));
    const { data: rgb, info: i2 } = await sharp(goc, { raw: { width: W, height: H, channels: 3 } })
      .extract({ left: Math.round(dai.x * W), top: Math.round(dai.y * H), width: Math.min(w, W - Math.round(dai.x * W)), height: Math.min(h, H - Math.round(dai.y * H)) })
      .resize({ width: Math.min(cao, w * 3), kernel: 'linear' })
      .raw().toBuffer({ resolveWithObject: true });
    const n = i2.width * i2.height;
    const sang = (src) => {
      const out = new Float32Array(n);
      for (let k = 0, j = 0; k < n; k++, j += 3) out[k] = src[j] * 0.299 + src[j + 1] * 0.587 + src[j + 2] * 0.114;
      return out;
    };
    const gianRa = () => {
      const g = Buffer.from(rgb);
      for (let c = 0; c < 3; c++) {
        let lo = 255, hi = 0;
        for (let j = c; j < g.length; j += 3) { if (g[j] < lo) lo = g[j]; if (g[j] > hi) hi = g[j]; }
        if (hi > lo) for (let j = c; j < g.length; j += 3) g[j] = Math.round(((g[j] - lo) * 255) / (hi - lo));
      }
      return g;
    };
    const doSang = { false: sang(rgb), true: null };
    return (manh, muc) => {
      if (manh && !doSang.true) doSang.true = sang(gianRa());
      const L = doSang[manh];
      const bw = Buffer.alloc(n);
      for (let k = 0; k < n; k++) bw[k] = L[k] >= muc ? 0 : 255;
      return sharp(bw, { raw: { width: i2.width, height: i2.height, channels: 1 } })
        .png({ compressionLevel: 1 }).toBuffer().then(boDoPhanGiai);
    };
  };
}

export async function docDau(Jimp, worker, tep, { cao = CAO_MAC_DINH, nhanh = false, sharp = null } = {}) {
  const nguon = sharp ? await nguonSharp(sharp, tep) : await nguonJimp(Jimp, tep);

  for (const dai of [DAI_DAU, DAI_DAY]) {
    const lamAnh = await nguon(dai, cao);

    const luot = [];
    let soLuot = 0, chuNhieuNhat = 0;
    // Vòng 1 ảnh nguyên trạng, vòng 2 kéo giãn dải sáng cho ảnh nhoè.
    for (const manh of [false, true]) {
      for (const muc of NGUONG_SANG) {
        const { data } = await worker.recognize(await lamAnh(manh, muc));
        const txt = data.text.replace(/\s+/g, ' ').trim();
        chuNhieuNhat = Math.max(chuNhieuNhat, (txt.match(/[A-Za-z0-9]/g) ?? []).length);
        // Hai lượt đầu không lượt nào ra nổi 12 ký tự thì dải này không có
        // dấu — xem ghi chú "BIẾT SỚM KHI ẢNH KHÔNG CÓ DẤU" ở đầu file.
        if (++soLuot >= 2 && chuNhieuNhat < 12) break;
        const ng = tachNgayGio(txt);
        if (!ng) continue;
        const kq = { ...ng, tru: tachTru(txt), muc: tachMuc(txt), tho: txt.slice(0, 200), lech: '' };
        if (nhanh) return kq;

        // Nhận khi có lượt trước ra đúng ngày và giờ:phút này.
        const truoc = luot.find((q) => q.ngay === kq.ngay && q.gio === kq.gio);
        if (truoc) {
          return { ...truoc,
                   tru: truoc.tru || kq.tru,
                   muc: truoc.muc.length >= kq.muc.length ? truoc.muc : kq.muc };
        }
        luot.push(kq);
      }
      if (soLuot >= 2 && chuNhieuNhat < 12) break; // bỏ cả vòng tăng tương phản
    }
    if (luot.length) {
      // Đọc ra chữ nhưng các lượt không thống nhất — không nhận, ghi lại để dò.
      return { ...RONG, tho: luot[0].tho, lech: luot.map((p) => `${p.ngay} ${p.gio}`).join(' / ') };
    }
  }
  return { ...RONG };
}
