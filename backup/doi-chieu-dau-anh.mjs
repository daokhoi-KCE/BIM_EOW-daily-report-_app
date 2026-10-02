#!/usr/bin/env node
/**
 * Đối chiếu ảnh theo DẤU TIMEMARK in trên ảnh, rồi điền tên file gốc vào ô
 * "Photo ref" của từng phát hiện.
 *
 * GHÉP HAI BƯỚC: DẤU THU PHẠM VI, VÂN TAY CHỌN TẤM
 *
 * Mỗi bước một mình đều hỏng, ghép lại mới chạy.
 *
 * So nội dung ảnh một mình: chạy trên cả kho thì khớp 0/2864 — bản trước làm
 * vậy và trượt sạch. Đo lại trên trụ 16 cho thấy KHÔNG phải vì app nén ảnh
 * làm lệch vân tay như tôi đoán lúc đó: khoảng cách của các cặp đúng là giữa
 * 0, phân vị 90 là 2, tức hai bên đúng là cùng một tấm. Lý do thật của lần
 * khớp 0 đó chưa truy ra, và cũng không cần nữa — cách dưới đây không phụ
 * thuộc vào một ngưỡng tuyệt đối nên không dính lại vết xe đó.
 *
 * Đọc dấu một mình: dấu chỉ in tới PHÚT, không có giây, mà một phút thường
 * có mấy tấm chụp liên tiếp. Bản trước gán cả chùm cho phát hiện, thành ra
 * một phát hiện 7 ảnh lại nhận 15 tên — sai hẳn, số tên phải đúng bằng số
 * ảnh.
 *
 * Ghép lại thì:
 *
 *   1. Đọc dấu Timemark (số trụ WTG, ngày, giờ:phút) ở cả hai bên, gom
 *      theo khoá  trụ + ngày + giờ:phút. Mỗi nhúm thường chỉ 2-5 tấm.
 *   2. Trong từng nhúm, so vân tay ảnh để ghép 1 ảnh app ↔ 1 ảnh gốc, chọn
 *      cặp gần nhau nhất trước, mỗi ảnh chỉ dùng một lần.
 *
 * BỎ HẲN BƯỚC ĐỌC DẤU: --khong-ocr
 *
 * Đo trên trụ 16 cho thấy khoảng cách vân tay của các cặp đúng là GIỮA 0,
 * phân vị 90 là 2 — vân tay nhận dạng chính xác hơn hẳn mức cần thiết. Nếu
 * vậy thì cái dấu chỉ còn làm mỗi việc thu phạm vi, mà SỐ TRỤ đã thu phạm vi
 * gần như đủ rồi: số trụ của ảnh app lấy từ cơ sở dữ liệu, của ảnh gốc lấy
 * từ tên thư mục, không cần đọc chữ trên ảnh.
 *
 * --khong-ocr bỏ hẳn bước đọc dấu và so vân tay trong phạm vi cả trụ. Đọc
 * dấu mất chừng một giây mỗi ảnh, tính vân tay mất chừng một phần mười giây
 * — nhanh hơn khoảng mười lần.
 *
 * Đổi lại, phạm vi so rộng ra vài trăm tấm thay vì vài tấm, nên nếu trong
 * trụ có hai tấm chụp gần giống hệt nhau thì dễ chọn nhầm hơn. Script vẫn
 * giữ nguyên hai lớp chặn: ngưỡng loại tự tính theo phân bố, và cảnh báo khi
 * tấm nhì gần tương đương tấm nhất.
 *
 * CÁCH KIỂM TRƯỚC KHI TIN: trụ 16 đã chạy bằng cách đọc dấu và ra 41 phát
 * hiện / 113 tên. Chạy lại trụ 16 với --khong-ocr, ra đúng con số đó thì
 * dùng được cho 21 trụ còn lại; lệch nhiều thì quay lại cách đọc dấu.
 *
 * (Chế độ này ghi vào cache các dòng không có dấu. Sau này muốn quay lại
 * cách đọc dấu thì thêm --thu-lai-loi để đọc dấu cho những ảnh đó.)
 *
 * Bước 2 không cần ngưỡng tuyệt đối — chỉ cần xếp hạng xem trong 3 tấm thì
 * tấm nào giống nhất. Đó là lý do nó chạy được trong khi so cả kho thì không.
 *
 * Cặp nào lệch quá xa so với phần còn lại thì bị loại, vì đó là ảnh app có
 * bản gốc không nằm trong thư mục và thuật toán buộc phải vơ lấy tấm đỡ khác
 * nhất trong nhúm. Ngưỡng loại tính theo chính phân bố đo được của đợt chạy
 * (phân vị 75 cộng 8 bit, tối thiểu 8), không đặt một con số tuỳ tiện.
 *
 * Script in ra khoảng cách vân tay của các cặp đã chọn. Gần 0 nghĩa là hai
 * bên đúng là cùng một tấm, chỉ khác cỡ. Nếu khoảng cách lớn thì hai bên là
 * hai lần bấm máy khác nhau, việc xếp hạng chỉ là chọn tấm đỡ khác nhất, và
 * script sẽ cảnh báo đừng áp dụng.
 *
 * Tên ảnh ghi theo đúng thứ tự created_at — app xếp ảnh cũng theo thứ tự đó
 * — nên tên thứ n ứng với tấm thứ n trong báo cáo.
 *
 * Phát hiện nào không ghép đủ 1-1 cho mọi ảnh thì xếp vào "cần kiểm tra",
 * không ghi vào cơ sở dữ liệu.
 *
 * ĐỌC DẤU THẾ NÀO
 *
 * Dấu nằm ở góc dưới bên trái, chữ trắng. Script cắt riêng dải đó, phóng to
 * 3 lần rồi lọc lấy các điểm sáng (chữ) và bỏ phần còn lại — hoá ra chữ đen
 * trên nền trắng, đúng kiểu OCR đọc tốt nhất. Đã thử trên ảnh thật của dự
 * án với cả hai kiểu dấu (kiểu gọn của app và kiểu bảng của máy chụp) và
 * đọc đúng cả ngày giờ lẫn số trụ.
 *
 * Ngưỡng lọc sáng thử lần lượt 225 → 200 → 245, dừng ở ngưỡng đầu tiên đọc
 * ra được ngày giờ hợp lệ. Ảnh nào vẫn không ra thì thử lại trên cả dải đáy
 * ảnh, phòng khi dấu bị đóng lệch sang phải.
 *
 * CÁCH CHẠY
 *
 * Trong PowerShell gõ TỪNG DÒNG một, Enter sau mỗi dòng — dán cả khối thì
 * PowerShell nối chúng lại thành một lệnh rồi báo lỗi.
 *
 *   npm install jimp tesseract.js "@tesseract.js-data/eng" sharp
 *
 * sharp là tuỳ chọn nhưng nên cài: nó giải mã ảnh nhanh hơn jimp hàng chục
 * lần, mà phần tính vân tay chiếm gần hết thời gian chạy.
 *
 * Nháy quanh "@tesseract..." là bắt buộc: dấu @ đầu đối số bị PowerShell hiểu
 * là toán tử splatting. Đường dẫn có dấu cách hay dấu ngoặc thì bọc nháy cả
 * đối số — "--thu-muc=D:\..." — chứ đừng chỉ bọc riêng đường dẫn.
 *
 *   $env:SUPABASE_SERVICE_ROLE_KEY="<khoá>"
 *
 *   # ảnh app phải có sẵn trong ./anh — nếu chưa:  node tai-anh-theo-tru.mjs --tat-ca
 *
 *   # bước 1+2: đọc dấu rồi đối chiếu, CHƯA ghi gì vào cơ sở dữ liệu
 *   node doi-chieu-dau-anh.mjs "--thu-muc=D:\JCT\KCE\Project\BIM - GE inspection\Pictures_Sorted"
 *
 *   # xem doi-chieu-dau.csv, thấy ổn thì ghi
 *   node doi-chieu-dau-anh.mjs "--thu-muc=..." --ap-dung
 *
 * CHẠY NHẸ MÁY
 *
 * Đọc dấu là việc nặng và kéo dài hàng giờ. Mặc định script chỉ chạy MỘT
 * luồng và tự hạ mức ưu tiên tiến trình xuống thấp, để máy còn dùng được
 * việc khác và không nóng tới mức tự khởi động lại. Máy khoẻ thì tăng
 * --luong, nhưng tăng rồi mà máy treo hay tự tắt thì hạ lại.
 *
 * NHANH NHẤT là --khong-ocr: bỏ hẳn bước đọc dấu, nhanh hơn chừng mười lần.
 * Đọc phần "BỎ HẲN BƯỚC ĐỌC DẤU" ở trên trước khi dùng.
 *
 * Làm từng đợt cũng được: --tru=16,17,18 chỉ đọc mấy trụ đó rồi dừng. Chạy
 * vài trụ, nghỉ cho máy nguội, rồi chạy tiếp vài trụ khác.
 *
 * Kết quả đọc được ghi dần vào dau-anh.cache.csv, nên Ctrl+C giữa chừng hay
 * máy tắt ngang đều không mất công — chạy lại là đọc tiếp chỗ dở.
 *
 * Tuỳ chọn:
 *   --luong=1        số luồng OCR chạy song song
 *   --tru=16,17      chỉ xử lý mấy trụ này
 *   --cao=1600       cỡ phóng dải dấu; nhỏ hơn thì nhanh hơn nhưng dễ đọc sai
 *   --nhanh          bỏ lượt đọc đối chứng — nhanh gấp đôi, đổi lại có thể
 *                    sai phút mà không biết. Chỉ dùng khi chạy thử.
 *   --chi-doc        chỉ đọc dấu rồi dừng, không đối chiếu
 *   --doc-lai        bỏ cache, đọc lại từ đầu
 *   --thu-lai-loi    chỉ đọc lại các ảnh lần trước không ra dấu, giữ nguyên
 *                    các ảnh đã đọc được — dùng sau khi nâng cách đọc
 *   --khong-ocr      BỎ HẲN BƯỚC ĐỌC DẤU, chỉ so vân tay trong phạm vi một
 *                    trụ. Nhanh hơn chừng mười lần. Xem phần dưới.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { docDau, duongDanNgonNgu, CAO_MAC_DINH } from './dau-timemark.mjs';

const URL_DU_AN = 'https://mjxkmbbwdjrvphmqloes.supabase.co';
const THU_MUC_APP = 'anh';
const CACHE = 'dau-anh.cache.csv';
const CSV_RA = 'doi-chieu-dau.csv';
const DUOI_ANH = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);

const doiSo = process.argv.slice(2);
const lay = (ten, mac) => doiSo.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac;
const thuMucGoc = lay('thu-muc', '');
const LUONG = Math.max(1, Number(lay('luong', '2')));
const CAO = Math.max(600, Number(lay('cao', String(CAO_MAC_DINH))));
const chiTru = new Set(lay('tru', '').split(',').map((t) => t.trim().padStart(2, '0')).filter((t) => t !== '00'));
const nhanh = doiSo.includes('--nhanh');
const apDung = doiSo.includes('--ap-dung');
const chiDoc = doiSo.includes('--chi-doc');
const docLai = doiSo.includes('--doc-lai');
const thuLaiLoi = doiSo.includes('--thu-lai-loi');
const khongOcr = doiSo.includes('--khong-ocr');

// Hạ mức ưu tiên để máy còn dùng được việc khác trong lúc đọc dấu.
try { os.setPriority(os.constants.priority.PRIORITY_BELOW_NORMAL); } catch { /* hệ nào không cho thì thôi */ }

if (!thuMucGoc) {
  console.error('Thiếu --thu-muc="<đường dẫn thư mục ảnh của bạn>". Xem hướng dẫn ở đầu file.');
  process.exit(1);
}

let Jimp, createWorker, PSM;
try {
  ({ Jimp } = await import('jimp'));
  ({ createWorker, PSM } = await import('tesseract.js'));
} catch {
  console.error('Thiếu thư viện. Chạy:  npm install jimp tesseract.js "@tesseract.js-data/eng"');
  process.exit(1);
}

/**
 * Thư viện giải mã ảnh để tính vân tay.
 *
 * jimp giải mã trọn vẹn tấm ảnh rồi mới thu nhỏ: đo trên ảnh gốc 1600x1200
 * của dự án mất 335ms một tấm, tức gần một tiếng cho cả kho. sharp giải mã
 * thẳng ở cỡ nhỏ nên mất 13ms — nhanh hơn 14 đến 31 lần tuỳ ảnh.
 *
 * Hai thư viện thu nhỏ ảnh theo cách khác nhau nên VÂN TAY CHÚNG TÍNH RA
 * LỆCH NHAU 4-5 bit. Dưới ngưỡng loại 9 bit nên trộn vào không đổ vỡ ngay,
 * nhưng ăn gần hết phần dư an toàn. Vì vậy cache ghi kèm tên thư viện, và
 * vân tay tính bằng thư viện khác sẽ bị bỏ đi để tính lại.
 *
 * sharp là tuỳ chọn: không cài được thì vẫn chạy bằng jimp, chỉ chậm hơn.
 */
let sharp = null;
try { ({ default: sharp } = await import('sharp')); } catch { /* chạy bằng jimp */ }
const MAY = sharp ? 'sharp' : 'jimp';
const LANG_PATH = duongDanNgonNgu();

/**
 * Vân tay ảnh 64 bit (dHash): thu ảnh về 9x8 điểm xám rồi ghi lại 64 phép so
 * sáng tối giữa hai điểm cạnh nhau. Không đổi khi ảnh bị thu nhỏ hay nén
 * lại, nên bản gốc và bản app cùng một tấm vẫn cho vân tay gần nhau.
 */
async function vanTay(tep) {
  let xam; // 72 điểm xám, 9 cột x 8 hàng
  if (sharp) {
    xam = await sharp(tep, { failOn: 'none' }).greyscale().resize(9, 8, { fit: 'fill' }).raw().toBuffer();
  } else {
    const img = await Jimp.read(tep);
    img.greyscale().resize({ w: 9, h: 8 });
    xam = new Uint8Array(72);
    for (let i = 0; i < 72; i++) xam[i] = img.bitmap.data[i * 4];
  }
  let bits = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      bits = (bits << 1n) | (xam[y * 9 + x] > xam[y * 9 + x + 1] ? 1n : 0n);
    }
  }
  return bits;
}

// ── CSV ─────────────────────────────────────────────────────────────────
const oCsv = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
function tachDong(dong) {
  const ra = []; let cur = '', trong = false;
  for (let i = 0; i < dong.length; i++) {
    const c = dong[i];
    if (trong) {
      if (c === '"') { if (dong[i + 1] === '"') { cur += '"'; i++; } else trong = false; }
      else cur += c;
    } else if (c === '"') trong = true;
    else if (c === ',') { ra.push(cur); cur = ''; }
    else cur += c;
  }
  ra.push(cur);
  return ra;
}

// ── Quét thư mục ────────────────────────────────────────────────────────
function quetThuMuc(goc, ra = []) {
  for (const m of fs.readdirSync(goc, { withFileTypes: true })) {
    const p = path.join(goc, m.name);
    if (m.isDirectory()) quetThuMuc(p, ra);
    else if (DUOI_ANH.has(path.extname(m.name).toLowerCase())) ra.push(p);
  }
  return ra;
}
const soTru = (s) => {
  const m = String(s).toUpperCase().match(/WTG[\s\-_]*0*(\d{1,2})\b/);
  return m ? m[1].padStart(2, '0') : '';
};
const laCanh = (kv) => /blade/i.test(kv) && /\d{6}/.test(kv);
const sach = (s) => (s || '').replace(/[\\/:*?"<>|\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

// ── Danh mục ảnh app, dựng lại từ cơ sở dữ liệu ─────────────────────────
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error('Thiếu SUPABASE_SERVICE_ROLE_KEY — cần để đọc danh mục ảnh từ cơ sở dữ liệu.');
  process.exit(1);
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
const TRANG = 1000;

/**
 * Lỗi chứng chỉ TLS thì báo thẳng, đừng thử lại.
 *
 * Phần mềm diệt virus hoặc proxy công ty chen vào giữa kết nối HTTPS và
 * trình ra chứng chỉ của chính nó; Node không dùng kho chứng chỉ của Windows
 * nên không nhận. Đây không phải trục trặc nhất thời — thử lại 4 lần chỉ mất
 * thêm 15 giây rồi vẫn hỏng, mà lại chôn mất dòng nói ra cách sửa.
 */
const LOI_CHUNG_CHI = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT', 'CERT_HAS_EXPIRED', 'ERR_TLS_CERT_ALTNAME_INVALID',
]);
function chungChiHong(e) {
  const ma = e?.cause?.code ?? e?.code;
  if (!LOI_CHUNG_CHI.has(ma)) return null;
  return `Kết nối HTTPS bị chặn bởi chứng chỉ lạ (${ma}).\n` +
    'Thường là do phần mềm diệt virus hoặc proxy công ty chen vào giữa.\n' +
    'Chạy lại kèm --use-system-ca để Node dùng kho chứng chỉ của Windows:\n\n' +
    '  node --use-system-ca <tên script> ...\n\n' +
    'Hoặc đặt một lần cho cả phiên PowerShell:\n\n' +
    '  $env:NODE_OPTIONS="--use-system-ca"';
}

/**
 * Gọi mạng có thử lại. Lần chạy trước đứt giữa chừng ngay ở bước đọc cơ sở
 * dữ liệu — Node trên Windows chết hẳn với "UV_HANDLE_CLOSING" khi fetch
 * bị cắt ngang. Thử lại 1/2/4/8 giây như các script khác trong dự án.
 */
async function goi(url, tuyChon = {}, lan = 4) {
  let loiCuoi;
  for (let i = 0; i <= lan; i++) {
    if (i) await new Promise((r) => setTimeout(r, 1000 * 2 ** (i - 1)));
    try {
      const res = await fetch(url, tuyChon);
      // 5xx là lỗi phía máy chủ, thử lại có ích. 4xx thì thường vô ích, trừ
      // 401 kèm mã PGRST303 "JWT issued at future" — khoá vẫn đúng, chỉ là
      // đồng hồ lúc cấp khoá lệch so với máy chủ đang kiểm; chờ một lát là hết.
      if (res.ok || (res.status < 500 && res.status !== 401)) return res;
      const chu = res.status === 401 ? await res.clone().text() : await res.text();
      if (res.status === 401 && !chu.includes('PGRST303')) return res; // khoá sai thật
      loiCuoi = new Error(`${res.status} ${chu}`);
    } catch (e) {
      const giaiThich = chungChiHong(e);
      if (giaiThich) { console.error(`\n${giaiThich}\n`); throw e; }
      loiCuoi = e;
    }
    if (i < lan) process.stdout.write(`\r  máy chủ chưa nhận, thử lại lần ${i + 1}…   `);
  }
  throw loiCuoi;
}

async function docHet(bang, cot) {
  const ra = [];
  for (let tu = 0; ; tu += TRANG) {
    const res = await goi(`${URL_DU_AN}/rest/v1/${bang}?select=${cot}&limit=${TRANG}&offset=${tu}`, { headers });
    if (!res.ok) throw new Error(`Không đọc được ${bang}: ${res.status} ${await res.text()}`);
    const rows = await res.json();
    ra.push(...rows);
    if (rows.length < TRANG) return ra;
  }
}

if (!fs.existsSync(THU_MUC_APP)) {
  console.error(`Chưa có thư mục "${THU_MUC_APP}". Chạy  node tai-anh-theo-tru.mjs --tat-ca  trước.`);
  process.exit(1);
}

console.log('Đang đọc danh mục ảnh từ cơ sở dữ liệu…');
const [baoCao, phatHien, anhPh] = await Promise.all([
  docHet('reports', 'id,report_date,planned_turbines,actual_turbines'),
  docHet('findings', 'id,report_id,area,description,severity,sort_order,photo_ref'),
  docHet('finding_photos', 'id,finding_id,storage_path,created_at'),
]);
const photoRefCu = new Map(phatHien.map((f) => [f.id, f.photo_ref ?? '']));
const phTheoBaoCao = new Map();
for (const f of phatHien) {
  if (!phTheoBaoCao.has(f.report_id)) phTheoBaoCao.set(f.report_id, []);
  phTheoBaoCao.get(f.report_id).push(f);
}
const anhTheoPh = new Map();
for (const p of anhPh) {
  if (!anhTheoPh.has(p.finding_id)) anhTheoPh.set(p.finding_id, []);
  anhTheoPh.get(p.finding_id).push(p);
}

const mucApp = [];
const tongAnhTheoPh = new Map(); // finding_id -> số ảnh trong CSDL
let thieuTep = 0;
for (const r of baoCao) {
  const tru = (r.planned_turbines || r.actual_turbines || '').trim();
  const thuMuc = path.join(THU_MUC_APP, sach(tru), 'phat-hien');
  const fsx = (phTheoBaoCao.get(r.id) ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  let stt = 0;
  for (const f of fsx) {
    const list = (anhTheoPh.get(f.id) ?? []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    for (const p of list) {
      stt++;
      if (laCanh(f.area)) continue; // bỏ phần khảo sát cánh
      const duoi = path.extname(p.storage_path) || '.jpg';
      const ten = `${String(stt).padStart(3, '0')} - ${sach(f.area) || 'khong ro khu vuc'} - M${f.severity ?? '?'}${duoi}`;
      const tep = path.join(thuMuc, ten);
      if (chiTru.size && !chiTru.has(soTru(tru))) continue;
      // Đếm theo số ảnh trong CSDL, không theo số ảnh đã tải về: báo cáo in
      // ảnh lấy từ CSDL, nên nếu đếm theo số đã tải thì một phát hiện còn
      // ảnh chưa tải vẫn bị coi là ghép đủ, và báo cáo lại thiếu tên.
      tongAnhTheoPh.set(f.id, (tongAnhTheoPh.get(f.id) ?? 0) + 1);
      if (!fs.existsSync(tep)) { thieuTep++; continue; }
      mucApp.push({ tep, finding_id: f.id, tru, ngay_bc: r.report_date, khu_vuc: f.area ?? '',
                    dien_giai: f.description ?? '', muc_do: f.severity ?? '' });
    }
  }
}
if (thieuTep) console.log(`  ${thieuTep} ảnh (tính cả 22 trụ) có trong CSDL nhưng chưa tải về` +
                          ` — chạy  node tai-anh-theo-tru.mjs --tat-ca  để ghép được đủ`);

const tepGoc = quetThuMuc(thuMucGoc)
  .map((tep) => ({ tep, tuongDoi: path.relative(thuMucGoc, tep).replace(/\\/g, '/') }))
  // Lọc theo đường dẫn, NHƯNG giữ lại ảnh mà đường dẫn không ghi số trụ:
  // thư mục kiểu "WTG Unknown" vẫn có thể chứa ảnh của trụ đang xét, và chỉ
  // dấu Timemark trong ảnh mới nói được. Loại sớm ở đây là mất ảnh oan.
  .filter((g) => !chiTru.size || !soTru(g.tuongDoi) || chiTru.has(soTru(g.tuongDoi)));
if (chiTru.size) console.log(`Chỉ xử lý trụ: ${[...chiTru].sort().join(', ')}`);
console.log(`Ảnh trong app  : ${mucApp.length}`);
console.log(`Ảnh thư mục bạn: ${tepGoc.length}`);

// ── Đọc dấu cho cả hai bên, có cache ────────────────────────────────────
const cache = new Map();
if (!docLai && fs.existsSync(CACHE)) {
  const dong = fs.readFileSync(CACHE, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).slice(1);
  for (const d of dong) {
    if (!d.trim()) continue;
    const [tep, ngay, gio, tru, muc, lech, tho, vt, may] = tachDong(d);
    if (thuLaiLoi && !ngay) continue; // bỏ ra để đọc lại
    // Vân tay của thư viện khác thì bỏ, tính lại — xem ghi chú ở MAY.
    cache.set(tep, { ngay, gio, tru, muc, lech, tho, may: MAY,
                     vt: vt && may === MAY ? BigInt(vt) : null });
  }
  console.log(`Đã có sẵn dấu của ${cache.size} ảnh trong ${CACHE}`);
  if (thuLaiLoi) console.log('  (các ảnh lần trước không ra dấu sẽ được đọc lại)');
}

const dongCache = (t, k) =>
  [t, k.ngay, k.gio, k.tru, k.muc, k.lech, k.tho,
   k.vt === null || k.vt === undefined ? '' : k.vt.toString(),
   k.vt ? (k.may ?? MAY) : ''].map(oCsv).join(',') + '\n';

const canDoc = khongOcr
  ? []
  : [...mucApp.map((m) => m.tep), ...tepGoc.map((g) => g.tep)].filter((t) => !cache.has(t));
if (khongOcr) {
  // Dựng sẵn ô trống cho ảnh chưa có trong cache, để lượt tính vân tay bên
  // dưới nhận ra là phải tính cho chúng.
  for (const t of [...mucApp.map((m) => m.tep), ...tepGoc.map((g) => g.tep)]) {
    if (!cache.has(t)) cache.set(t, { ngay: '', gio: '', tru: '', muc: '', lech: '', tho: '', vt: null, may: MAY });
  }
  console.log('\nBỏ bước đọc dấu (--khong-ocr) — chỉ so vân tay trong phạm vi từng trụ.');
}
if (canDoc.length) {
  console.log(`\nĐang đọc dấu trên ${canDoc.length} ảnh bằng ${LUONG} luồng — việc này lâu, cứ để chạy.`);
  // Đọc lại các ảnh hỏng thì phải ghi lại cả file, nếu không các dòng hỏng
  // cũ vẫn nằm đó và lần sau đọc trúng chúng trước.
  const noiThem = cache.size > 0 && !thuLaiLoi;
  const ghi = fs.createWriteStream(CACHE, { flags: noiThem ? 'a' : 'w' });
  if (!noiThem) {
    ghi.write('\uFEFF' + 'tep,ngay,gio,tru,muc,lech,tho,vt,may\n');
    for (const [t, k] of cache) ghi.write(dongCache(t, k));
  }

  let i = 0, xong = 0, docDuoc = 0;
  const batDau = Date.now();
  const luong = await Promise.all(Array.from({ length: LUONG }, () =>
    createWorker('eng', 1, { langPath: LANG_PATH, gzip: true, cacheMethod: 'none' })));
  for (const w of luong) await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });

  await Promise.all(luong.map(async (worker) => {
    for (;;) {
      const k = i++;
      if (k >= canDoc.length) return;
      const tep = canDoc[k];
      let kq;
      try { kq = await docDau(Jimp, worker, tep, { cao: CAO, nhanh }); }
      catch { kq = { ngay: '', gio: '', tru: '', muc: '', lech: '', tho: '' }; }
      try { kq.vt = await vanTay(tep); kq.may = MAY; } catch { kq.vt = null; }
      cache.set(tep, kq);
      ghi.write(dongCache(tep, kq));
      if (kq.ngay) docDuoc++;
      if (++xong % 20 === 0) {
        const giay = (Date.now() - batDau) / 1000;
        const conLai = Math.round((canDoc.length - xong) * (giay / xong) / 60);
        process.stdout.write(`\r  ${xong}/${canDoc.length} · đọc được dấu ${docDuoc} · còn ~${conLai} phút   `);
      }
    }
  }));
  for (const w of luong) { try { await w.terminate(); } catch { /* đóng được tới đâu hay tới đó */ } }
  await new Promise((r) => ghi.end(r)); // chờ ghi xong hẳn, đừng để mất dòng cuối
  console.log(`\r  ${xong}/${canDoc.length} · đọc được dấu ${docDuoc}${' '.repeat(30)}`);
}

const dauCua = (tep) => cache.get(tep) ?? { ngay: '', gio: '', tru: '', muc: '', lech: '', tho: '', vt: null };
const coDau = (ds, lay) => ds.filter((x) => dauCua(lay(x)).ngay).length;
// Ảnh đã đọc dấu từ lần chạy trước thì chưa có vân tay — tính bổ sung.
// Việc này không cần OCR nên nhanh hơn hẳn lượt đọc dấu.
const canVanTay = [...mucApp.map((m) => m.tep), ...tepGoc.map((g) => g.tep)]
  .filter((t) => cache.has(t) && cache.get(t).vt == null);
if (canVanTay.length) {
  console.log(`\nĐang tính vân tay cho ${canVanTay.length} ảnh bằng ${MAY}` +
              `${sharp ? '' : ' — cài thêm sharp (npm install sharp) thì nhanh hơn chục lần'}…`);
  let n = 0;
  for (const t of canVanTay) {
    try { const k = cache.get(t); k.vt = await vanTay(t); k.may = MAY; } catch { /* ảnh hỏng thì bỏ qua */ }
    if (++n % 50 === 0) process.stdout.write(`\r  ${n}/${canVanTay.length}   `);
  }
  process.stdout.write(`\r  ${canVanTay.length}/${canVanTay.length}\n`);
  const tam = `${CACHE}.tam`;
  fs.writeFileSync(tam, '\uFEFF' + 'tep,ngay,gio,tru,muc,lech,tho,vt,may\n' +
    [...cache].map(([t, k]) => dongCache(t, k)).join(''));
  fs.renameSync(tam, CACHE); // thay một phát, mất điện giữa chừng không hỏng cache
}

const demLech = (ds, lay) => ds.filter((x) => dauCua(lay(x)).lech).length;
if (!khongOcr) {
  console.log(`\nĐọc được dấu — ảnh app: ${coDau(mucApp, (m) => m.tep)}/${mucApp.length}` +
              ` · ảnh của bạn: ${coDau(tepGoc, (g) => g.tep)}/${tepGoc.length}`);
  const tongLech = demLech(mucApp, (m) => m.tep) + demLech(tepGoc, (g) => g.tep);
  if (tongLech) console.log(`  ${tongLech} ảnh hai lượt đọc lệch nhau nên bỏ qua — xem cột lech trong ${CACHE}`);
}

if (chiDoc) {
  console.log(`\nĐã ghi ${CACHE}. Bỏ --chi-doc để đối chiếu.`);
  process.exit(0);
}

// ── Ghép 1 ẢNH ↔ 1 ẢNH ──────────────────────────────────────────────────
//
// Bản trước gán cho mỗi phát hiện cả chùm ảnh cùng phút, nên một phát hiện
// có 7 ảnh lại nhận 15 tên — sai hẳn. Số tên phải đúng bằng số ảnh.
//
// Riêng dấu Timemark không đủ: nó chỉ in tới phút, mà một phút có mấy tấm.
// Nhưng dấu thu phạm vi lại cực hẹp — thường 2 đến 5 tấm — và trong phạm vi
// đó thì SO NỘI DUNG ẢNH lại ăn thua, vì chỉ cần xếp hạng tấm nào giống
// nhất, không cần một ngưỡng tuyệt đối.
//
// (Lần trước so nội dung ảnh trên toàn bộ kho thì khớp 0/2864 vì ngưỡng
// tuyệt đối không chịu nổi việc app nén ảnh xuống 1000px. Xếp hạng trong
// một nhúm 3 tấm là chuyện khác hẳn.)
//
// Vân tay ảnh dHash: thu ảnh về 9x8 điểm xám rồi ghi 64 phép so sáng tối
// giữa hai điểm cạnh nhau. Không đổi khi ảnh bị thu nhỏ hay nén lại.
const CHUA_CO_GOC = '—'; // phải trùng PHOTO_REF_MISSING trong src/lib/photo-ref.ts
const khoa = (tru, ngay, gio) => `${tru}|${ngay}|${gio}`;

const khoangCach = (a, b) => {
  let x = a ^ b, n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n;
};

// Gom cả hai bên: theo phút nếu có đọc dấu, theo trụ nếu --khong-ocr.
const appTheoKhoa = new Map(), gocTheoKhoa = new Map();
const gocChuaRoTru = []; // thư mục không ghi số trụ — so với mọi trụ
for (const m of mucApp) {
  const d = dauCua(m.tep);
  let k;
  if (khongOcr) k = soTru(m.tru);
  else { if (!d.ngay) continue; k = khoa(d.tru || soTru(m.tru), d.ngay, d.gio); }
  if (!k) continue;
  if (!appTheoKhoa.has(k)) appTheoKhoa.set(k, []);
  appTheoKhoa.get(k).push(m);
}
for (const g of tepGoc) {
  const d = dauCua(g.tep);
  let k;
  if (khongOcr) {
    k = soTru(g.tuongDoi);
    if (!k) { gocChuaRoTru.push(g); continue; }
  } else {
    if (!d.ngay) continue;
    const tru = d.tru || soTru(g.tuongDoi);
    if (!tru) continue;
    k = khoa(tru, d.ngay, d.gio);
  }
  if (!gocTheoKhoa.has(k)) gocTheoKhoa.set(k, []);
  gocTheoKhoa.get(k).push(g);
}

// Trong từng phút: chọn cặp gần nhau nhất trước, mỗi ảnh chỉ được dùng một
// lần. Nhúm nhỏ nên cách tham lam này cho đúng kết quả như giải tối ưu.
const vt = (tep) => cache.get(tep)?.vt ?? null;
const ganCho = new Map();
const khoangCachDaChon = [];
for (const [k, apps] of appTheoKhoa) {
  const gocs = [...(gocTheoKhoa.get(k) ?? []), ...gocChuaRoTru].filter((g) => vt(g.tep) !== null);
  if (gocs.length === 0) continue;
  const cap = [];
  for (const a of apps) {
    const va = vt(a.tep);
    if (va === null) continue;
    for (const g of gocs) cap.push({ a, g, d: khoangCach(va, vt(g.tep)) });
  }
  cap.sort((x, y) => x.d - y.d);
  const daA = new Set(), daG = new Set();
  for (const c of cap) {
    if (daA.has(c.a.tep) || daG.has(c.g.tep)) continue;
    daA.add(c.a.tep); daG.add(c.g.tep);
    // Cách biệt với ứng viên nhì của chính ảnh app này — gần bằng nhau thì
    // việc chọn chỉ là may rủi, phải nói ra.
    const cungApp = cap.filter((x) => x.a.tep === c.a.tep && x.g.tep !== c.g.tep).map((x) => x.d);
    const nhi = cungApp.length ? Math.min(...cungApp) : Infinity;
    ganCho.set(c.a.tep, { g: c.g, d: c.d, cach: nhi - c.d, soUngVien: gocs.length });
    khoangCachDaChon.push(c.d);
  }
}

// Loại các cặp quá xa so với phần còn lại.
//
// Khi hai bên đúng là cùng một tấm, khoảng cách gần như bằng 0 — đo trên trụ
// 16: giữa 0, phân vị 90 là 2. Một cặp lệch tới 26 bit thì không thể là cùng
// một tấm; đó là ảnh app có bản gốc KHÔNG nằm trong thư mục, và thuật toán
// buộc phải vơ lấy tấm đỡ khác nhất trong nhúm.
//
// Ngưỡng tính theo chính phân bố đo được, không đặt một con số tuỳ tiện: lấy
// phân vị 75 cộng 8 bit, và không bao giờ thấp hơn 8. Cách này tự co giãn
// theo chất lượng ảnh của từng đợt.
let cat = Infinity, soLoai = 0;
if (khoangCachDaChon.length >= 10) {
  const sx = [...khoangCachDaChon].sort((a, b) => a - b);
  cat = Math.max(8, sx[Math.floor(0.75 * sx.length)] + 8);
  for (const [tep, g] of [...ganCho]) {
    if (g.d > cat) { ganCho.delete(tep); soLoai++; }
  }
}

// Gom lại theo phát hiện. Tên ảnh ghi theo đúng thứ tự created_at — app xếp
// ảnh cũng theo thứ tự đó, nên tên thứ n ứng với tấm thứ n.
const theoPh = new Map();
for (const m of mucApp) {
  if (!theoPh.has(m.finding_id)) theoPh.set(m.finding_id, []);
  theoPh.get(m.finding_id).push(m);
}

const ketQua = [];
for (const [finding_id, anhs] of theoPh) {
  const m0 = anhs[0];
  const doc = anhs.map((m) => ({ m, d: dauCua(m.tep), gan: ganCho.get(m.tep) }));
  const ganDuoc = doc.filter((x) => x.gan);
  const base = {
    finding_id, tru: m0.tru, ngay_bc: m0.ngay_bc, khu_vuc: m0.khu_vuc,
    muc_do: m0.muc_do, dien_giai: m0.dien_giai,
    so_anh_db: tongAnhTheoPh.get(finding_id) ?? anhs.length,
    so_anh_app: anhs.length, so_anh_goc: ganDuoc.length,
    phut_app: [...new Set(doc.filter((x) => x.d.ngay).map((x) => x.d.gio))].sort().join(' '),
    ngay_dau: [...new Set(doc.filter((x) => x.d.ngay).map((x) => x.d.ngay))].join(' '),
    ten_anh_goc: ganDuoc.map((x) => x.gan.g.tuongDoi).join(' | '),
    // Ghi vào photo_ref: tên thứ n là của tấm thứ n (cùng xếp theo
    // created_at với ảnh trong app). Tấm không có bản gốc giữ chỗ bằng "—"
    // để các tên sau vẫn đứng đúng vị trí — app hiểu dấu này.
    ten_theo_vi_tri: doc.map((x) => (x.gan ? x.gan.g.tuongDoi : CHUA_CO_GOC)).join(', '),
  };

  const lyDo = [], ghiChu = [];
  const chuaDoc = khongOcr ? 0 : doc.filter((x) => !x.d.ngay).length;
  const chuaTai = base.so_anh_db - anhs.length;
  const thieu = anhs.length - ganDuoc.length;
  if (chuaTai > 0) {
    lyDo.push('chua-tai-anh');
    ghiChu.push(`${chuaTai} ảnh chưa tải về — chạy node tai-anh-theo-tru.mjs --tat-ca`);
  }
  if (chuaDoc) { lyDo.push('khong-doc-duoc-dau'); ghiChu.push(`${chuaDoc} ảnh không đọc được dấu`); }
  if (thieu > chuaDoc) { lyDo.push('thieu-anh-goc'); ghiChu.push(`${thieu - chuaDoc} ảnh không tìm được bản gốc`); }
  const mongManh = ganDuoc.filter((x) => x.gan.cach < 4 && x.gan.soUngVien > 1).length;
  if (mongManh) { lyDo.push('cach-biet-mong'); ghiChu.push(`${mongManh} ảnh có tấm khác gần tương đương`); }

  // "Một phần": các tấm ghép được đều chắc chắn, chỉ là có tấm không tìm ra
  // bản gốc (hoặc không đọc được dấu). Vẫn ghi — tấm thiếu để "—" — vì tên
  // nằm ngay dưới từng tấm ảnh nên người đọc thấy rõ tấm nào có bản gốc.
  // Không ghi khi còn ảnh chưa tải về (vị trí sẽ lệch) hoặc có cặp mà tấm nhì
  // gần tương đương (tên có thể nhầm giữa hai tấm).
  const trangThai =
    ganDuoc.length === 0 ? (chuaDoc === anhs.length ? 'khong doc duoc dau' : 'khong tim thay')
    : chuaTai > 0 || mongManh > 0 ? 'can kiem tra'
    : thieu > 0 ? 'mot phan'
    : 'chac chan';

  ketQua.push({ ...base, lyDo, trang_thai: trangThai, ghi_chu: ghiChu.join('; ') });
}

const dem = (t) => ketQua.filter((r) => r.trang_thai === t).length;
const anhCua = (t) => ketQua.filter((r) => r.trang_thai === t).reduce((n, r) => n + r.so_anh_goc, 0);
console.log(`\nTheo PHÁT HIỆN (${ketQua.length} phát hiện, ${mucApp.length} ảnh app):`);
console.log(`  chắc chắn         : ${dem('chac chan')}   → ${anhCua('chac chan')} tên ảnh, đúng một tên mỗi ảnh`);
console.log(`  một phần          : ${dem('mot phan')}   → ${anhCua('mot phan')} tên ảnh, tấm không có bản gốc ghi "—"`);
console.log(`  cần kiểm tra      : ${dem('can kiem tra')}   → ${anhCua('can kiem tra')} tên ảnh, xem cột ghi_chu`);
console.log(`  không tìm thấy    : ${dem('khong tim thay')}`);
console.log(`  không đọc được dấu: ${dem('khong doc duoc dau')}`);

const canKt = ketQua.filter((r) => r.trang_thai === 'can kiem tra');
if (canKt.length) {
  const demLyDo = (ma) => canKt.filter((r) => r.lyDo.includes(ma)).length;
  console.log('\n  Vì sao phải kiểm tra:');
  console.log(`    ${demLyDo('thieu-anh-goc')} · có ảnh không tìm được bản gốc cùng phút`);
  console.log(`    ${demLyDo('cach-biet-mong')} · có ảnh mà tấm gốc nhì gần tương đương tấm nhất`);
  if (!khongOcr) console.log(`    ${demLyDo('khong-doc-duoc-dau')} · có ảnh không đọc được dấu`);
  console.log(`    ${demLyDo('chua-tai-anh')} · có ảnh chưa tải về máy`);
}

// Khoảng cách vân tay của các cặp đã chọn cho biết hai bên có thật là một
// tấm hay không. Gần 0 nghĩa là cùng một tấm, chỉ khác cỡ. Lớn nghĩa là hai
// lần bấm máy khác nhau — lúc đó việc xếp hạng chỉ là chọn tấm đỡ khác
// nhất, và tên ảnh ghi ra không đáng tin.
if (khoangCachDaChon.length) {
  const thongKe = (mang) => {
    const sx = [...mang].sort((a, b) => a - b);
    const vi = (q) => sx[Math.min(sx.length - 1, Math.floor(q * sx.length))];
    return { giua: vi(0.5), p90: vi(0.9), max: sx[sx.length - 1] };
  };
  // Hai dòng, vì chúng nói hai chuyện khác nhau. Dòng "trước khi loại" gồm cả
  // các ảnh app không có bản gốc, bị buộc ghép với tấm đỡ khác nhất — nên
  // phân vị 90 ở đó cao là bình thường, không nói gì về chất lượng ghép. Dòng
  // "giữ lại" mới là các cặp thật sự được dùng, và là dòng cần nhìn.
  const truoc = thongKe(khoangCachDaChon);
  console.log(`\n  Khoảng cách vân tay, trước khi loại : giữa ${truoc.giua}, phân vị 90 ${truoc.p90}, lớn nhất ${truoc.max}`);
  const giuLai = khoangCachDaChon.filter((d) => d <= cat);
  if (giuLai.length) {
    const sau = thongKe(giuLai);
    console.log(`  Khoảng cách vân tay, các cặp GIỮ LẠI: giữa ${sau.giua}, phân vị 90 ${sau.p90}, lớn nhất ${sau.max}  (0 = cùng một tấm, 64 = khác hẳn)`);
  }
  if (soLoai) console.log(`  Đã loại ${soLoai} cặp lệch quá ${cat} bit — ảnh đó không có bản gốc trong thư mục.`);
  if (truoc.giua > 12) {
    console.log('  ⚠ Khoảng cách lớn — hai bên có thể không phải cùng một tấm ảnh.');
    console.log('    Đừng áp dụng, gửi dòng này cho tôi xem lại.');
  }
}

// Theo từng trụ: gộp cả đợt thì che mất trụ nào hỏng. Trụ có tỷ lệ "không
// tìm thấy" cao bất thường thường là thư mục ảnh gốc của trụ đó đặt tên khác
// hoặc còn nằm ở thư mục chưa phân loại — việc cần sửa nằm ở dữ liệu, không
// ở thuật toán.
{
  const theoTru = new Map();
  for (const r of ketQua) {
    const k = String(r.tru).trim() || '?';
    if (!theoTru.has(k)) theoTru.set(k, { n: 0, chac: 0, motPhan: 0, kt: 0, khong: 0, chuaDoc: 0 });
    const o = theoTru.get(k);
    o.n++;
    if (r.trang_thai === 'chac chan') o.chac++;
    else if (r.trang_thai === 'mot phan') o.motPhan++;
    else if (r.trang_thai === 'can kiem tra') o.kt++;
    else if (r.trang_thai === 'khong tim thay') o.khong++;
    else o.chuaDoc++;
  }
  if (theoTru.size > 1) {
    console.log('\n  Theo từng trụ:');
    console.log('    trụ         phát hiện  chắc chắn  một phần  cần kiểm tra  không thấy  không đọc dấu');
    for (const [k, o] of [...theoTru].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))) {
      console.log(`    ${k.padEnd(10)}  ${String(o.n).padStart(8)}  ${String(o.chac).padStart(9)}  ${String(o.motPhan).padStart(8)}  ${String(o.kt).padStart(12)}  ${String(o.khong).padStart(10)}  ${String(o.chuaDoc).padStart(13)}`);
    }
  }
}

const lech = ketQua.filter((r) => r.ngay_dau && r.ngay_bc && !r.ngay_dau.includes(r.ngay_bc)).length;
if (lech) console.log(`\n  ${lech} phát hiện có ngày trên dấu khác ngày của báo cáo — xem cột ngay_dau trong CSV.`);

/**
 * Ghi CSV, mở sẵn trong Excel cũng không sao.
 *
 * Windows khoá file đang mở, nên writeFileSync ném EBUSY và cả lượt chạy
 * chết theo — kể cả khi đang chạy --ap-dung, lúc bạn đã xem CSV xong rồi và
 * chỉ còn chờ ghi vào cơ sở dữ liệu. Bị khoá thì ghi sang tên khác rồi chạy
 * tiếp, chứ không bỏ dở.
 */
function ghiCsv(ten, noiDung) {
  try {
    fs.writeFileSync(ten, noiDung);
    return ten;
  } catch (e) {
    if (e.code !== 'EBUSY' && e.code !== 'EPERM' && e.code !== 'EACCES') throw e;
    const gio = new Date().toISOString().slice(11, 19).replace(/:/g, '');
    const thay = ten.replace(/\.csv$/, `-${gio}.csv`);
    fs.writeFileSync(thay, noiDung);
    console.log(`\n  ${ten} đang mở ở chương trình khác nên không ghi đè được.`);
    return thay;
  }
}

const daGhi = ghiCsv(CSV_RA, '﻿' + [
  'trang_thai,ly_do,ghi_chu,tru,ngay_bc,ngay_dau,phut_app,khu_vuc,muc_do,so_anh_db,so_anh_app,so_anh_goc,ten_theo_vi_tri,dien_giai,finding_id',
  ...ketQua
    .sort((a, b) => String(a.tru).localeCompare(String(b.tru)) || String(a.phut_app).localeCompare(String(b.phut_app)))
    .map((r) => [r.trang_thai, r.lyDo.join(' '), r.ghi_chu, r.tru, r.ngay_bc, r.ngay_dau, r.phut_app, r.khu_vuc,
                 r.muc_do, r.so_anh_db, r.so_anh_app, r.so_anh_goc, r.ten_theo_vi_tri, r.dien_giai, r.finding_id].map(oCsv).join(',')),
].join('\n'));
console.log(`\nĐã ghi ${daGhi} — mở bằng Excel để xem trước khi áp dụng.`);

if (!apDung) {
  console.log('\nChạy lại kèm  --ap-dung  để điền tên file vào ô Photo ref của các phát hiện.');
  process.exit(0);
}

// ── Ghi photo_ref ───────────────────────────────────────────────────────
// Ghi các phát hiện "chắc chắn" và "một phần" (tấm thiếu bản gốc ghi "—").
// Loại "cần kiểm tra" để lại trong CSV cho bạn xem bằng mắt rồi quyết định.
const seGhi = ketQua.filter((r) => (r.trang_thai === 'chac chan' || r.trang_thai === 'mot phan') && r.ten_anh_goc);
console.log(`\nSẽ điền Photo ref cho ${seGhi.length} phát hiện…`);

// Lưu giá trị CŨ trước khi ghi đè. Lệnh này thay hẳn ô photo_ref, mà ô đó có
// thể đang chứa chữ do người nhập tay — ghi nhầm mà không có bản sao thì
// không lùi lại được.
const saoLuu = ghiCsv(`photo-ref-cu-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').slice(2)}.csv`,
  '\uFEFF' + ['finding_id,tru,photo_ref_cu,photo_ref_moi',
    ...seGhi.map((r) => [r.finding_id, r.tru, photoRefCu.get(r.finding_id) ?? '',
      r.ten_theo_vi_tri].map(oCsv).join(','))].join('\n'));
const seDe = seGhi.filter((r) => (photoRefCu.get(r.finding_id) ?? '').trim()).length;
console.log(`  Đã lưu giá trị cũ vào ${saoLuu}` +
            `${seDe ? ` — ${seDe} phát hiện đang có chữ sẽ bị thay` : ' — ô đang trống hết'}.`);
let xongGhi = 0, hongGhi = 0;
for (const r of seGhi) {
  // Không gộp trùng: các "—" giữ chỗ phải còn nguyên từng cái một.
  const ten = r.ten_theo_vi_tri;
  const res = await goi(`${URL_DU_AN}/rest/v1/findings?id=eq.${r.finding_id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ photo_ref: ten }),
  });
  if (res.ok) { if (++xongGhi % 25 === 0) process.stdout.write(`\r  đã ghi ${xongGhi}/${seGhi.length}`); }
  else { hongGhi++; console.error(`\n  hỏng ${r.finding_id}: ${res.status} ${await res.text()}`); }
}
console.log(`\r  đã ghi ${xongGhi}/${seGhi.length}${hongGhi ? ` · ${hongGhi} lỗi` : ''}`);
console.log('\nXong. Mở lại báo cáo trong app để kiểm tra cột Photo ở mục 6.');
