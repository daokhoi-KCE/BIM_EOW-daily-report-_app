#!/usr/bin/env node
/**
 * Đối chiếu ảnh theo DẤU TIMEMARK in trên ảnh, rồi điền tên file gốc vào ô
 * "Photo ref" của từng phát hiện.
 *
 * VÌ SAO ĐỔI SANG CÁCH NÀY
 *
 * Bản trước so chính nội dung ảnh bằng vân tay (dHash) và khớp được 0/2864.
 * Nghĩa là ảnh trong app KHÔNG phải bản thu nhỏ của ảnh trong thư mục của
 * bạn — hai bên là hai lần bấm máy khác nhau cho cùng một chỗ. So nội dung
 * kiểu gì cũng trượt.
 *
 * Nhưng cả hai bên đều có dấu Timemark đóng sẵn trên ảnh, ghi cùng một bộ
 * thông tin: SỐ TRỤ WTG, VỊ TRÍ, NGÀY và GIỜ:PHÚT. Đó mới là chỗ hai bên
 * gặp nhau. Script này đọc dấu đó bằng OCR rồi ghép theo khoá
 *
 *       trụ + ngày + giờ:phút
 *
 * LƯU Ý VỀ GIÂY: dấu chỉ in tới PHÚT, không có giây. Nên hai tấm bấm trong
 * cùng một phút sẽ trùng khoá. Gặp trường hợp đó script không tự điền mà
 * xếp vào loại "cần kiểm tra", kèm đủ các ảnh ứng viên để bạn tự chọn.
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
 *   npm install jimp tesseract.js "@tesseract.js-data/eng"
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
 * Đọc dấu khoảng 11.000 ảnh mất chừng 20-40 phút. Kết quả đọc được ghi vào
 * dau-anh.cache.csv nên lần chạy sau không phải đọc lại — bấm Ctrl+C giữa
 * chừng cũng không mất công.
 *
 * Tuỳ chọn:
 *   --luong=4     số luồng OCR chạy song song
 *   --chi-doc     chỉ đọc dấu rồi dừng, không đối chiếu
 *   --doc-lai     bỏ cache, đọc lại từ đầu
 */

import fs from 'node:fs';
import path from 'node:path';
import { docDau, duongDanNgonNgu } from './dau-timemark.mjs';

const URL_DU_AN = 'https://mjxkmbbwdjrvphmqloes.supabase.co';
const THU_MUC_APP = 'anh';
const CACHE = 'dau-anh.cache.csv';
const CSV_RA = 'doi-chieu-dau.csv';
const DUOI_ANH = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);

const doiSo = process.argv.slice(2);
const lay = (ten, mac) => doiSo.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac;
const thuMucGoc = lay('thu-muc', '');
const LUONG = Math.max(1, Number(lay('luong', '4')));
const apDung = doiSo.includes('--ap-dung');
const chiDoc = doiSo.includes('--chi-doc');
const docLai = doiSo.includes('--doc-lai');

if (!thuMucGoc) {
  console.error('Thiếu --thu-muc="<đường dẫn thư mục ảnh của bạn>". Xem hướng dẫn ở đầu file.');
  process.exit(1);
}

let Jimp, createWorker, PSM;
try {
  ({ Jimp } = await import('jimp'));
  ({ createWorker, PSM } = await import('tesseract.js'));
} catch {
  console.error('Thiếu thư viện. Chạy:  npm install jimp tesseract.js @tesseract.js-data/eng');
  process.exit(1);
}
const LANG_PATH = duongDanNgonNgu();

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
async function docHet(bang, cot) {
  const ra = [];
  for (let tu = 0; ; tu += TRANG) {
    const res = await fetch(`${URL_DU_AN}/rest/v1/${bang}?select=${cot}&limit=${TRANG}&offset=${tu}`, { headers });
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
  docHet('findings', 'id,report_id,area,description,severity,sort_order'),
  docHet('finding_photos', 'id,finding_id,storage_path,created_at'),
]);
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
      if (!fs.existsSync(tep)) { thieuTep++; continue; }
      mucApp.push({ tep, finding_id: f.id, tru, ngay_bc: r.report_date, khu_vuc: f.area ?? '',
                    dien_giai: f.description ?? '', muc_do: f.severity ?? '' });
    }
  }
}
if (thieuTep) console.log(`  ${thieuTep} ảnh có trong CSDL nhưng chưa tải về — chạy  node tai-anh-theo-tru.mjs --tat-ca`);

const tepGoc = quetThuMuc(thuMucGoc).map((tep) => ({
  tep, tuongDoi: path.relative(thuMucGoc, tep).replace(/\\/g, '/'),
}));
console.log(`Ảnh trong app  : ${mucApp.length}`);
console.log(`Ảnh thư mục bạn: ${tepGoc.length}`);

// ── Đọc dấu cho cả hai bên, có cache ────────────────────────────────────
const cache = new Map();
if (!docLai && fs.existsSync(CACHE)) {
  const dong = fs.readFileSync(CACHE, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).slice(1);
  for (const d of dong) {
    if (!d.trim()) continue;
    const [tep, ngay, gio, tru, muc, tho] = tachDong(d);
    cache.set(tep, { ngay, gio, tru, muc, tho });
  }
  console.log(`Đã có sẵn dấu của ${cache.size} ảnh trong ${CACHE}`);
}

const canDoc = [...mucApp.map((m) => m.tep), ...tepGoc.map((g) => g.tep)].filter((t) => !cache.has(t));
if (canDoc.length) {
  console.log(`\nĐang đọc dấu trên ${canDoc.length} ảnh bằng ${LUONG} luồng — việc này lâu, cứ để chạy.`);
  const ghi = fs.createWriteStream(CACHE, { flags: cache.size ? 'a' : 'w' });
  if (!cache.size) ghi.write('\uFEFF' + 'tep,ngay,gio,tru,muc,tho\n');

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
      try { kq = await docDau(Jimp, worker, tep); }
      catch { kq = { ngay: '', gio: '', tru: '', muc: '', tho: '' }; }
      cache.set(tep, kq);
      ghi.write([tep, kq.ngay, kq.gio, kq.tru, kq.muc, kq.tho].map(oCsv).join(',') + '\n');
      if (kq.ngay) docDuoc++;
      if (++xong % 20 === 0) {
        const giay = (Date.now() - batDau) / 1000;
        const conLai = Math.round((canDoc.length - xong) * (giay / xong) / 60);
        process.stdout.write(`\r  ${xong}/${canDoc.length} · đọc được dấu ${docDuoc} · còn ~${conLai} phút   `);
      }
    }
  }));
  await Promise.all(luong.map((w) => w.terminate()));
  ghi.end();
  console.log(`\r  ${xong}/${canDoc.length} · đọc được dấu ${docDuoc}${' '.repeat(30)}`);
}

const dauCua = (tep) => cache.get(tep) ?? { ngay: '', gio: '', tru: '', muc: '', tho: '' };
const coDau = (ds, lay) => ds.filter((x) => dauCua(lay(x)).ngay).length;
console.log(`\nĐọc được dấu — ảnh app: ${coDau(mucApp, (m) => m.tep)}/${mucApp.length}` +
            ` · ảnh của bạn: ${coDau(tepGoc, (g) => g.tep)}/${tepGoc.length}`);

if (chiDoc) {
  console.log(`\nĐã ghi ${CACHE}. Bỏ --chi-doc để đối chiếu.`);
  process.exit(0);
}

// ── Ghép theo khoá: trụ + ngày + giờ:phút ───────────────────────────────
// Trụ ưu tiên lấy từ dấu; dấu không đọc ra thì lấy từ đường dẫn thư mục.
const khoa = (tru, ngay, gio) => `${tru}|${ngay}|${gio}`;

const gocTheoKhoa = new Map();
for (const g of tepGoc) {
  const d = dauCua(g.tep);
  if (!d.ngay) continue;
  const tru = d.tru || soTru(g.tuongDoi);
  if (!tru) continue;
  const k = khoa(tru, d.ngay, d.gio);
  if (!gocTheoKhoa.has(k)) gocTheoKhoa.set(k, []);
  gocTheoKhoa.get(k).push({ ...g, muc: d.muc });
}

/** Chữ thường, bỏ dấu câu — để so vị trí trên dấu với khu vực của phát hiện. */
const gon = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
/** Số từ chung giữa hai chuỗi — dùng tách các ảnh trùng khoá. */
function tuChung(a, b) {
  const A = new Set(gon(a).split(' ').filter((w) => w.length > 2));
  return gon(b).split(' ').filter((w) => w.length > 2 && A.has(w)).length;
}

const ketQua = [];
for (const m of mucApp) {
  const d = dauCua(m.tep);
  const tru = d.tru || soTru(m.tru);
  const base = { ...m, ngay_dau: d.ngay, gio_dau: d.gio, tru_dau: tru, muc_dau: d.muc };

  if (!d.ngay) { ketQua.push({ ...base, tep_goc: '', ung_vien: '', trang_thai: 'khong doc duoc dau' }); continue; }
  const ds = gocTheoKhoa.get(khoa(tru, d.ngay, d.gio)) ?? [];
  if (ds.length === 0) { ketQua.push({ ...base, tep_goc: '', ung_vien: '', trang_thai: 'khong tim thay' }); continue; }
  if (ds.length === 1) { ketQua.push({ ...base, tep_goc: ds[0].tuongDoi, ung_vien: '', trang_thai: 'chac chan' }); continue; }

  // Trùng khoá: dấu chỉ in tới phút nên nhiều tấm cùng một phút. Thử tách
  // bằng vị trí ghi trên dấu; vẫn hoà thì để bạn tự chọn.
  const diem = ds.map((g) => ({ g, n: tuChung(g.muc || '', `${m.khu_vuc} ${d.muc}`) })).sort((a, b) => b.n - a.n);
  const nhat = diem[0], nhi = diem[1];
  if (nhat.n > 0 && nhat.n > nhi.n) {
    ketQua.push({ ...base, tep_goc: nhat.g.tuongDoi, ung_vien: ds.map((g) => g.tuongDoi).join(' | '), trang_thai: 'chac chan' });
  } else {
    ketQua.push({ ...base, tep_goc: '', ung_vien: ds.map((g) => g.tuongDoi).join(' | '), trang_thai: 'can kiem tra' });
  }
}

const dem = (t) => ketQua.filter((r) => r.trang_thai === t).length;
console.log(`\nchắc chắn         : ${dem('chac chan')}`);
console.log(`cần kiểm tra      : ${dem('can kiem tra')}   (nhiều ảnh cùng một phút)`);
console.log(`không tìm thấy    : ${dem('khong tim thay')}   (không có ảnh nào cùng trụ+ngày+phút)`);
console.log(`không đọc được dấu: ${dem('khong doc duoc dau')}`);

const lech = ketQua.filter((r) => r.ngay_dau && r.ngay_bc && r.ngay_dau !== r.ngay_bc).length;
if (lech) console.log(`\n  ${lech} ảnh có ngày trên dấu khác ngày của báo cáo — xem cột ngay_dau trong CSV.`);

fs.writeFileSync(CSV_RA, '\uFEFF' + [
  'trang_thai,tru,ngay_bc,ngay_dau,gio_dau,khu_vuc,muc_dau,muc_do,dien_giai,tep_goc,ung_vien,finding_id,tep_app',
  ...ketQua
    .sort((a, b) => String(a.tru).localeCompare(String(b.tru)) || String(a.tep).localeCompare(String(b.tep)))
    .map((r) => [r.trang_thai, r.tru, r.ngay_bc, r.ngay_dau, r.gio_dau, r.khu_vuc, r.muc_dau, r.muc_do,
                 r.dien_giai, r.tep_goc, r.ung_vien, r.finding_id, r.tep].map(oCsv).join(',')),
].join('\n'));
console.log(`\nĐã ghi ${CSV_RA} — mở bằng Excel để xem trước khi áp dụng.`);

if (!apDung) {
  console.log('\nChạy lại kèm  --ap-dung  để điền tên file vào ô Photo ref của các phát hiện.');
  process.exit(0);
}

// ── Ghi photo_ref ───────────────────────────────────────────────────────
const theoFinding = new Map();
for (const r of ketQua) {
  if (r.trang_thai !== 'chac chan' || !r.tep_goc) continue;
  if (!theoFinding.has(r.finding_id)) theoFinding.set(r.finding_id, []);
  theoFinding.get(r.finding_id).push(r.tep_goc);
}
console.log(`\nSẽ điền Photo ref cho ${theoFinding.size} phát hiện…`);
let xong = 0, hong = 0;
for (const [id, teps] of theoFinding) {
  const res = await fetch(`${URL_DU_AN}/rest/v1/findings?id=eq.${id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ photo_ref: [...new Set(teps)].join(', ') }),
  });
  if (res.ok) { if (++xong % 25 === 0) process.stdout.write(`\r  đã ghi ${xong}/${theoFinding.size}`); }
  else { hong++; console.error(`\n  hỏng ${id}: ${res.status} ${await res.text()}`); }
}
console.log(`\r  đã ghi ${xong}/${theoFinding.size}${hong ? ` · ${hong} lỗi` : ''}`);
console.log('\nXong. Mở lại báo cáo trong app để kiểm tra cột Photo ở mục 6.');
