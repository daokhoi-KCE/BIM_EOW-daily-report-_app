#!/usr/bin/env node
/**
 * KHÔNG DÙNG ĐƯỢC CHO DỰ ÁN NÀY — dùng doi-chieu-dau-anh.mjs thay thế.
 *
 * Script này so chính nội dung ảnh bằng vân tay (dHash) trên toàn bộ kho, và
 * khớp được 0/2864 ảnh. Lúc đó tôi kết luận hai bộ ảnh là hai lần bấm máy
 * khác nhau. KẾT LUẬN ĐÓ SAI: đo lại trong doi-chieu-dau-anh.mjs cho thấy
 * khoảng cách vân tay của các cặp đúng là giữa 0, phân vị 90 là 2 — hai bên
 * đúng là cùng một tấm, chỉ khác cỡ. Vì sao lần chạy đó khớp 0 thì chưa truy
 * ra.
 *
 * Cách dùng thật là doi-chieu-dau-anh.mjs: đọc dấu Timemark để thu phạm vi
 * về đúng một phút (thường 2-5 tấm), rồi mới so vân tay TRONG nhúm đó. Chỉ
 * cần xếp hạng, không cần ngưỡng tuyệt đối trên cả kho như file này.
 *
 * Giữ lại file này để tham khảo.
 *
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
 *   export SUPABASE_SERVICE_ROLE_KEY='<khoá>'
 *
 *   # ảnh app phải có sẵn trong thư mục ./anh — nếu chưa:
 *   node tai-anh-theo-tru.mjs --tat-ca
 *
 *   # đối chiếu, chưa ghi gì vào cơ sở dữ liệu
 *   node doi-chieu-anh.mjs --thu-muc="D:\\Anh WTG"
 *
 *   # xem file doi-chieu-anh.csv, thấy ổn thì ghi
 *   node doi-chieu-anh.mjs --thu-muc="D:\\Anh WTG" --ap-dung
 *
 * Danh mục ảnh đọc thẳng từ cơ sở dữ liệu, không đọc file danh-muc.csv —
 * nhờ vậy ảnh tải về bằng bản script nào cũng dùng được, và không phải tải
 * lại chỉ vì file danh mục cũ thiếu cột.
 *
 * THU HẸP PHẠM VI TRƯỚC KHI SO ẢNH
 *
 * Không so mọi ảnh với mọi ảnh. Trước hết lọc theo số trụ lấy từ đường dẫn
 * thư mục của bạn ("WTG 18/...", "WTG-05/..."), sau đó ưu tiên các ảnh cùng
 * vị trí trên trụ (tên thư mục con so với khu vực của phát hiện, đã gộp
 * "Middle" với "Section" làm một).
 *
 * Số trụ đã kéo theo ngày giờ: cả dự án có 22 báo cáo cho 22 trụ, mỗi trụ
 * đúng một ngày — nên cùng trụ nghĩa là cùng ngày. Đó là lý do không cần
 * đọc dấu ngày giờ in trên ảnh.
 *
 * Phát hiện khảo sát cánh (khu vực có "Blade ID" kèm số sê-ri) được bỏ qua.
 *
 * Tuỳ chọn thêm:
 *   --nguong=10   khoảng cách tối đa coi là khớp (0 = giống hệt, 64 = khác hẳn)
 *   --cach=6      chênh lệch tối thiểu giữa ảnh khớp nhất và ảnh nhì
 *   --bo-loc-tru  tắt việc lọc theo trụ (dùng khi thư mục không chia theo trụ)
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
const boLocTru = doiSo.includes('--bo-loc-tru');

if (!thuMucGoc) {
  console.error('Thiếu --thu-muc="<đường dẫn thư mục ảnh của bạn>". Xem hướng dẫn ở đầu file.');
  process.exit(1);
}
if (!fs.existsSync(THU_MUC_APP)) {
  console.error(`Chưa có thư mục "${THU_MUC_APP}". Chạy  node tai-anh-theo-tru.mjs --tat-ca  trước.`);
  process.exit(1);
}

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error('Thiếu SUPABASE_SERVICE_ROLE_KEY — cần để đọc danh mục ảnh từ cơ sở dữ liệu.');
  process.exit(1);
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

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

const laCanh = (kv) => /blade/i.test(kv) && /\d{6}/.test(kv);

/** Số trụ lấy từ chuỗi bất kỳ: "WTG 18", "WTG-05", "wtg18" → "18", "05". */
function soTru(s) {
  const m = String(s).toUpperCase().match(/WTG[\s\-_]*0*(\d{1,2})\b/);
  return m ? m[1].padStart(2, '0') : '';
}

/**
 * Vị trí trên trụ, quy về một tên — bản rút gọn của src/lib/area-label.ts.
 * Dùng để so tên thư mục con của bạn với khu vực ghi trong phát hiện, nên
 * "Middle B-A", "Section B - A" và "Tower B-A" đều về một mối.
 */
function viTri(s) {
  const t = String(s).toLowerCase().replace(/[\t_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\b(nacelle\s*top|top\s*nacelle)\b/.test(t)) return 'nacelle-top';
  if (/\bnace/.test(t)) return 'nacelle';
  if (/\bhub\b/.test(t)) return 'hub';
  if (/\bblade/.test(t)) return 'blades';
  if (/\byaw\b|yaw\s*platf/.test(t)) return 'top-yaw';
  if (/\btoo\s*section\b/.test(t)) return 'top-yaw';
  if (/\bbasement\b|\bdoor\b/.test(t)) return 'base';
  if (/\b(hardstand|foundation|outside|outer|external|exterior)\b/.test(t)) return 'ngoai';
  const moc = [];
  for (const m of t.matchAll(/\b(base|top|[a-d])\b/g)) if (!moc.includes(m[1])) moc.push(m[1]);
  if (moc.length === 0) return '';
  const thuTu = ['base', 'd', 'c', 'b', 'a', 'top'];
  if (moc.length === 1) return moc[0] === 'base' ? 'base' : moc[0] === 'top' ? 'top-yaw' : `doan-${moc[0]}`;
  const i = moc.map((m) => thuTu.indexOf(m)).sort((x, y) => x - y);
  return `doan-${thuTu[i[0]]}-${thuTu[i[i.length - 1]]}`;
}

// ── Dựng lại danh mục ảnh app từ cơ sở dữ liệu ──────────────────────────
// Tên file trong thư mục ./anh do tai-anh-theo-tru.mjs đặt theo đúng công
// thức dưới đây, nên chỉ cần đọc lại cùng dữ liệu là suy ra được tên file,
// không cần file danh-muc.csv.
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
/** Giống hệt hàm cùng tên trong tai-anh-theo-tru.mjs — đổi là lệch tên file. */
const sach = (s) => (s || '').replace(/[\\/:*?"<>|\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

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

const muc = [];
let thieuTep = 0;
for (const r of baoCao) {
  const tru = (r.planned_turbines || r.actual_turbines || '').trim();
  const thuMuc = path.join(THU_MUC_APP, sach(tru), 'phat-hien');
  const fs_ = (phTheoBaoCao.get(r.id) ?? []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  let stt = 0;
  for (const f of fs_) {
    const list = (anhTheoPh.get(f.id) ?? []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    for (const p of list) {
      stt++;
      if (laCanh(f.area)) continue; // bỏ phần khảo sát cánh
      const duoi = path.extname(p.storage_path) || '.jpg';
      const ten = `${String(stt).padStart(3, '0')} - ${sach(f.area) || 'khong ro khu vuc'} - M${f.severity ?? '?'}${duoi}`;
      const tep = path.join(thuMuc, ten);
      if (!fs.existsSync(tep)) { thieuTep++; continue; }
      muc.push({ tep, finding_id: f.id, tru, ngay: r.report_date, khu_vuc: f.area ?? '',
                 dien_giai: f.description ?? '', muc_do: f.severity ?? '' });
    }
  }
}
if (thieuTep) console.log(`  ${thieuTep} ảnh có trong CSDL nhưng chưa tải về — chạy  node tai-anh-theo-tru.mjs --tat-ca`);
if (muc.length === 0) {
  console.error('Không khớp được ảnh nào trong thư mục "anh" với cơ sở dữ liệu.');
  console.error('Chạy  node tai-anh-theo-tru.mjs --tat-ca  rồi thử lại.');
  process.exit(1);
}

const tepGoc = quetThuMuc(thuMucGoc).map((tep) => {
  const tuongDoi = path.relative(thuMucGoc, tep).replace(/\\/g, '/');
  // Vị trí đọc từ các thư mục cha, không đọc từ tên file — tên file thường
  // lặp lại tên thư mục nên đọc cả hai cũng không thêm thông tin gì.
  const thuMucCha = tuongDoi.split('/').slice(0, -1).join(' ');
  return { tep, tuongDoi, tru: soTru(tuongDoi), vt: viTri(thuMucCha) };
});

const truApp = new Set(muc.map((m) => soTru(m.tru)).filter(Boolean));
const truGoc = new Set(tepGoc.map((g) => g.tru).filter(Boolean));
const chung = [...truApp].filter((t) => truGoc.has(t));
console.log(`Ảnh trong app  : ${muc.length}  (${truApp.size} trụ)`);
console.log(`Ảnh thư mục bạn: ${tepGoc.length}  (${truGoc.size} trụ nhận ra từ đường dẫn)`);
if (!boLocTru && chung.length === 0) {
  console.error('\nKhông đọc được số trụ nào từ đường dẫn thư mục của bạn.');
  console.error('Chạy lại kèm  --bo-loc-tru  để so toàn bộ, hoặc kiểm tra lại cấu trúc thư mục.');
  process.exit(1);
}
if (!boLocTru) console.log(`Trụ khớp nhau  : ${chung.length}/${truApp.size}`);
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
/** Tìm ảnh gần nhất trong một nhóm ứng viên, kèm khoảng cách tới ảnh nhì. */
function ganNhat(v, ds) {
  let nhat = null, nhi = Infinity;
  for (const g of ds) {
    const d = khoangCach(v, g.v);
    if (!nhat || d < nhat.d) { nhi = nhat ? nhat.d : nhi; nhat = { g, d }; }
    else if (d < nhi) nhi = d;
  }
  return nhat ? { g: nhat.g.muc, d: nhat.d, cach: nhi - nhat.d } : null;
}

// Gom ảnh của bạn theo trụ, rồi theo vị trí — để so trong phạm vi hẹp trước.
const theoTru = new Map();
for (const g of vGoc) {
  const k = boLocTru ? '*' : g.muc.tru || '?';
  if (!theoTru.has(k)) theoTru.set(k, []);
  theoTru.get(k).push(g);
}

const ketQua = [];
for (const a of vApp) {
  const tru = boLocTru ? '*' : soTru(a.muc.tru);
  const cungTru = theoTru.get(tru) ?? [];
  const vtApp = viTri(a.muc.khu_vuc);
  const cungViTri = vtApp ? cungTru.filter((g) => g.muc.vt === vtApp) : [];

  // Hẹp trước, rộng sau: cùng trụ + cùng vị trí → cùng trụ → toàn bộ.
  let kq = ganNhat(a.v, cungViTri), pham_vi = 'cùng trụ + vị trí';
  if (!kq || kq.d > NGUONG) {
    const r = ganNhat(a.v, cungTru);
    if (r && (!kq || r.d < kq.d)) { kq = r; pham_vi = 'cùng trụ'; }
  }
  if ((!kq || kq.d > NGUONG) && cungTru.length === 0) {
    const r = ganNhat(a.v, vGoc);
    if (r) { kq = r; pham_vi = 'toàn bộ thư mục'; }
  }

  const trangThai = !kq || kq.d > NGUONG ? 'khong tim thay'
    : kq.cach < CACH ? 'can kiem tra' : 'chac chan';
  ketQua.push({
    ...a.muc, pham_vi: kq ? pham_vi : '',
    tep_goc: kq && kq.d <= NGUONG ? kq.g.tuongDoi : '',
    khoang_cach: kq ? kq.d : '', cach_anh_nhi: kq ? kq.cach : '', trang_thai: trangThai,
  });
}

const dem = (t) => ketQua.filter((r) => r.trang_thai === t).length;
const demPV = (p) => ketQua.filter((r) => r.pham_vi === p && r.trang_thai !== 'khong tim thay').length;
console.log(`\nchắc chắn      : ${dem('chac chan')}`);
console.log(`cần kiểm tra   : ${dem('can kiem tra')}   (có ảnh khác gần tương đương)`);
console.log(`không tìm thấy : ${dem('khong tim thay')}`);
console.log(`\n  khớp trong phạm vi cùng trụ + vị trí: ${demPV('cùng trụ + vị trí')}`);
console.log(`  phải mở rộng ra cả trụ             : ${demPV('cùng trụ')}`);

const CSV = 'doi-chieu-anh.csv';
fs.writeFileSync(CSV, '\uFEFF' + [
  'trang_thai,pham_vi,khoang_cach,cach_anh_nhi,ngay,tru,khu_vuc,muc_do,dien_giai,tep_goc,finding_id,tep_app',
  ...ketQua.sort((a, b) => String(a.tru).localeCompare(String(b.tru)) || String(a.tep).localeCompare(String(b.tep)))
    .map((r) => [r.trang_thai, r.pham_vi, r.khoang_cach, r.cach_anh_nhi, r.ngay, r.tru, r.khu_vuc,
                 r.muc_do, r.dien_giai, r.tep_goc, r.finding_id, r.tep].map(oCsv).join(',')),
].join('\n'));
console.log(`\nĐã ghi ${CSV} — mở bằng Excel để xem trước khi áp dụng.`);

if (!apDung) {
  console.log('\nChạy lại kèm  --ap-dung  để điền tên file vào ô Photo ref của các phát hiện.');
  process.exit(0);
}

// ── Ghi photo_ref ───────────────────────────────────────────────────────
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
