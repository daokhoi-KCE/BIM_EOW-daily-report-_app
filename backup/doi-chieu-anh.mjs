#!/usr/bin/env node
/**
 * Đối chiếu ảnh trong thư mục của bạn với ảnh đã tải lên app, rồi điền tên
 * file vào ô "Photo ref" của từng phát hiện.
 *
 * VÌ SAO KHÔNG ĐỌC CHỮ NGÀY GIỜ TRÊN ẢNH
 *
 * Ảnh có đóng dấu ngày giờ, nhưng app nén ảnh xuống 1000px chất lượng 0.62
 * trước khi tải lên, nên dải chữ đó mờ đi — đọc bằng OCR sẽ sai lẫn lộn 3
 * với 8, 0 với O. Thay vào đó script so sánh chính NỘI DUNG ảnh bằng "vân
 * tay ảnh" (dHash): thu ảnh về 9x8 điểm xám rồi ghi lại 64 phép so sáng tối
 * giữa hai điểm cạnh nhau. Phép này không đổi khi ảnh bị thu nhỏ hay nén
 * lại, nên bản gốc và bản app vẫn cho cùng một vân tay. Chắc hơn OCR nhiều.
 *
 * CÁCH CHẠY — ba bước
 *
 *   npm install jimp
 *
 *   # 1. tải ảnh từ app về (cần service_role key)
 *   export SUPABASE_SERVICE_ROLE_KEY='<khoá>'
 *   node tai-anh-theo-tru.mjs --tat-ca
 *
 *   # 2. đối chiếu, chưa ghi gì vào cơ sở dữ liệu
 *   node doi-chieu-anh.mjs --thu-muc="D:\\Anh WTG"
 *
 *   # 3. xem file doi-chieu-anh.csv, thấy ổn thì ghi
 *   node doi-chieu-anh.mjs --thu-muc="D:\\Anh WTG" --ap-dung
 *
 * Phát hiện khảo sát cánh (khu vực có "Blade ID" kèm số sê-ri) được bỏ qua.
 *
 * Tuỳ chọn thêm:
 *   --nguong=10   khoảng cách tối đa coi là khớp (0 = giống hệt, 64 = khác hẳn)
 *   --cach=6      chênh lệch tối thiểu giữa ảnh khớp nhất và ảnh nhì
 */

import fs from 'node:fs';
import path from 'node:path';

const URL_DU_AN = 'https://mjxkmbbwdjrvphmqloes.supabase.co';
const THU_MUC_APP = 'anh'; // do tai-anh-theo-tru.mjs tạo ra
const DUOI_ANH = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);

const doiSo = process.argv.slice(2);
const lay = (ten, mac) => doiSo.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac;
const thuMucGoc = lay('thu-muc', '');
const NGUONG = Number(lay('nguong', '10'));
const CACH = Number(lay('cach', '6'));
const apDung = doiSo.includes('--ap-dung');

if (!thuMucGoc) {
  console.error('Thiếu --thu-muc="<đường dẫn thư mục ảnh của bạn>". Xem hướng dẫn ở đầu file.');
  process.exit(1);
}
if (!fs.existsSync(THU_MUC_APP)) {
  console.error(`Chưa có thư mục "${THU_MUC_APP}". Chạy  node tai-anh-theo-tru.mjs --tat-ca  trước.`);
  process.exit(1);
}

let Jimp;
try {
  ({ Jimp } = await import('jimp'));
} catch {
  console.error('Thiếu thư viện đọc ảnh. Chạy:  npm install jimp');
  process.exit(1);
}

/** Vân tay ảnh 64 bit, không đổi khi ảnh bị thu nhỏ hoặc nén lại. */
async function vanTay(tep) {
  const img = await Jimp.read(tep);
  img.greyscale().resize({ w: 9, h: 8 });
  let bits = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const a = img.bitmap.data[(y * 9 + x) * 4];
      const b = img.bitmap.data[(y * 9 + x + 1) * 4];
      bits = (bits << 1n) | (a > b ? 1n : 0n);
    }
  }
  return bits;
}
/** Số bit khác nhau giữa hai vân tay: 0 là một tấm, càng lớn càng khác. */
const khoangCach = (a, b) => {
  let x = a ^ b, n = 0;
  while (x) { n += Number(x & 1n); x >>= 1n; }
  return n;
};

function quetThuMuc(goc, ra = []) {
  for (const m of fs.readdirSync(goc, { withFileTypes: true })) {
    const p = path.join(goc, m.name);
    if (m.isDirectory()) quetThuMuc(p, ra);
    else if (DUOI_ANH.has(path.extname(m.name).toLowerCase())) ra.push(p);
  }
  return ra;
}

/** Đọc CSV đơn giản, có xử lý ô bọc trong dấu nháy kép. */
function docCsv(tep) {
  const txt = fs.readFileSync(tep, 'utf8').replace(/^\uFEFF/, '');
  const dong = [];
  let o = '', hang = [], trongNhay = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (trongNhay) {
      if (c === '"' && txt[i + 1] === '"') { o += '"'; i++; }
      else if (c === '"') trongNhay = false;
      else o += c;
    } else if (c === '"') trongNhay = true;
    else if (c === ',') { hang.push(o); o = ''; }
    else if (c === '\n') { hang.push(o); dong.push(hang); hang = []; o = ''; }
    else if (c !== '\r') o += c;
  }
  if (o || hang.length) { hang.push(o); dong.push(hang); }
  const [dau, ...con] = dong.filter((h) => h.length > 1);
  return con.map((h) => Object.fromEntries(dau.map((k, i) => [k, h[i] ?? ''])));
}

const laCanh = (kv) => /blade/i.test(kv) && /\d{6}/.test(kv);

// ── Gom danh mục ảnh app từ các file danh-muc.csv ────────────────────────
const muc = [];
for (const tru of fs.readdirSync(THU_MUC_APP, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const csv = path.join(THU_MUC_APP, tru.name, 'danh-muc.csv');
  if (!fs.existsSync(csv)) continue;
  for (const r of docCsv(csv)) {
    if (r.loai !== 'phat-hien' || !r.finding_id) continue;
    if (laCanh(r.khu_vuc)) continue; // bỏ phần khảo sát cánh
    const tep = path.join(THU_MUC_APP, tru.name, 'phat-hien', r.tep);
    if (fs.existsSync(tep)) muc.push({ ...r, tep });
  }
}
if (muc.length === 0) {
  console.error('Không thấy ảnh phát hiện nào trong thư mục "anh". Chạy lại bước tải ảnh.');
  process.exit(1);
}

const tepGoc = quetThuMuc(thuMucGoc);
console.log(`Ảnh trong app  : ${muc.length}`);
console.log(`Ảnh thư mục bạn: ${tepGoc.length}`);
console.log('\nĐang tính vân tay ảnh…');

async function vanTayHangLoat(ds, nhan, lay) {
  const ra = [];
  for (let i = 0; i < ds.length; i++) {
    try { ra.push({ muc: ds[i], v: await vanTay(lay(ds[i])) }); }
    catch { /* ảnh hỏng thì bỏ qua */ }
    if ((i + 1) % 50 === 0) process.stdout.write(`\r  ${nhan}: ${i + 1}/${ds.length}`);
  }
  process.stdout.write(`\r  ${nhan}: ${ds.length}/${ds.length}\n`);
  return ra;
}
const vApp = await vanTayHangLoat(muc, 'ảnh app     ', (m) => m.tep);
const vGoc = await vanTayHangLoat(tepGoc, 'ảnh của bạn ', (t) => t);

// ── Tìm ảnh gốc gần nhất cho từng ảnh app ───────────────────────────────
const oCsv = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`;
const ketQua = [];
for (const a of vApp) {
  let nhat = null, nhi = Infinity;
  for (const g of vGoc) {
    const d = khoangCach(a.v, g.v);
    if (!nhat || d < nhat.d) { nhi = nhat ? nhat.d : nhi; nhat = { g, d }; }
    else if (d < nhi) nhi = d;
  }
  const cach = nhat ? nhi - nhat.d : 0;
  const trangThai = !nhat || nhat.d > NGUONG ? 'khong tim thay'
    : cach < CACH ? 'can kiem tra' : 'chac chan';
  ketQua.push({
    ...a.muc,
    tep_goc: nhat && nhat.d <= NGUONG ? path.relative(thuMucGoc, nhat.g.muc).replace(/\\/g, '/') : '',
    khoang_cach: nhat ? nhat.d : '', cach_anh_nhi: nhat ? cach : '', trang_thai: trangThai,
  });
}

const dem = (t) => ketQua.filter((r) => r.trang_thai === t).length;
console.log(`\nchắc chắn      : ${dem('chac chan')}`);
console.log(`cần kiểm tra   : ${dem('can kiem tra')}   (có ảnh khác gần tương đương)`);
console.log(`không tìm thấy : ${dem('khong tim thay')}`);

const CSV = 'doi-chieu-anh.csv';
fs.writeFileSync(CSV, '\uFEFF' + [
  'trang_thai,khoang_cach,cach_anh_nhi,ngay,tru,khu_vuc,muc_do,dien_giai,tep_goc,finding_id,tep_app',
  ...ketQua.sort((a, b) => String(a.tru).localeCompare(String(b.tru)) || String(a.tep).localeCompare(String(b.tep)))
    .map((r) => [r.trang_thai, r.khoang_cach, r.cach_anh_nhi, r.ngay, r.tru, r.khu_vuc, r.muc_do,
                 r.dien_giai, r.tep_goc, r.finding_id, r.tep].map(oCsv).join(',')),
].join('\n'));
console.log(`\nĐã ghi ${CSV} — mở bằng Excel để xem trước khi áp dụng.`);

if (!apDung) {
  console.log('\nChạy lại kèm  --ap-dung  để điền tên file vào ô Photo ref của các phát hiện.');
  process.exit(0);
}

// ── Ghi photo_ref ───────────────────────────────────────────────────────
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error('Thiếu SUPABASE_SERVICE_ROLE_KEY để ghi vào cơ sở dữ liệu.'); process.exit(1); }
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

// Một phát hiện có nhiều ảnh — gom tên file lại, chỉ lấy các ảnh khớp chắc chắn.
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
console.log('\nXong. Mở lại báo cáo trong app để kiểm tra dòng "Photo ref".');
