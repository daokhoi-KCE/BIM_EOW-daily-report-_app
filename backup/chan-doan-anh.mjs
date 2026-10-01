#!/usr/bin/env node
/**
 * Chẩn đoán: vì sao không ghép được ảnh nào?
 *
 * Chạy nhanh trên MỘT trụ thay vì cả 22, và thử ảnh ở cả bốn góc xoay cùng
 * ảnh lật gương. Mục đích là phân biệt hai nguyên nhân:
 *
 *   A. Ảnh bị XOAY — app nén ảnh bằng canvas của trình duyệt, mà trình duyệt
 *      tự xoay ảnh theo thẻ EXIF; Jimp đọc file gốc thì không xoay. Hai bản
 *      cùng một tấm nhưng khác chiều thì vân tay khác hẳn nhau.
 *      Dấu hiệu: có một góc xoay cho khoảng cách rất nhỏ (0-8).
 *
 *   B. KHÔNG CÙNG MỘT BỘ ẢNH — ảnh tải lên app chụp bằng máy khác, hoặc
 *      thư mục Pictures_Sorted là đợt ảnh khác.
 *      Dấu hiệu: mọi góc xoay đều cho khoảng cách lớn (trên 20).
 *
 * Chạy:
 *   export SUPABASE_SERVICE_ROLE_KEY='<khoá>'
 *   node chan-doan-anh.mjs --thu-muc="D:\\..." --tru="WTG 16"
 */

import fs from 'node:fs';
import path from 'node:path';

const URL_DU_AN = 'https://mjxkmbbwdjrvphmqloes.supabase.co';
const THU_MUC_APP = 'anh';
const DUOI_ANH = new Set(['.jpg', '.jpeg', '.png', '.webp', '.bmp']);
const SO_MAU = 12; // số ảnh app đem ra thử

const doiSo = process.argv.slice(2);
const lay = (t, m) => doiSo.find((a) => a.startsWith(`--${t}=`))?.slice(t.length + 3) ?? m;
const thuMucGoc = lay('thu-muc', '');
const truMuon = lay('tru', 'WTG 16');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!thuMucGoc || !KEY) {
  console.error('Cần --thu-muc="<đường dẫn>" và biến SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const { Jimp } = await import('jimp');

const sach = (s) => (s || '').replace(/[\\/:*?"<>|\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
const soTru = (s) => { const m = String(s).toUpperCase().match(/WTG[\s\-_]*0*(\d{1,2})\b/); return m ? m[1].padStart(2, '0') : ''; };

/** Vân tay 64 bit của một ảnh đã nạp sẵn. */
function vanTayAnh(img) {
  const c = img.clone().greyscale().resize({ w: 9, h: 8 });
  let bits = 0n;
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const a = c.bitmap.data[(y * 9 + x) * 4];
      const b = c.bitmap.data[(y * 9 + x + 1) * 4];
      bits = (bits << 1n) | (a > b ? 1n : 0n);
    }
  return bits;
}
/** Vân tay ở 4 góc xoay và bản lật gương — để lộ lỗi xoay ảnh. */
async function vanTayMoiChieu(tep) {
  const goc = await Jimp.read(tep);
  const ra = {};
  for (const deg of [0, 90, 180, 270]) {
    const c = goc.clone();
    if (deg) c.rotate(deg);
    ra[`${deg}°`] = vanTayAnh(c);
  }
  const lat = goc.clone(); lat.flip({ horizontal: true, vertical: false });
  ra['lật'] = vanTayAnh(lat);
  return ra;
}
const kc = (a, b) => { let x = a ^ b, n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };

function quet(goc, ra = []) {
  for (const m of fs.readdirSync(goc, { withFileTypes: true })) {
    const p = path.join(goc, m.name);
    if (m.isDirectory()) quet(p, ra);
    else if (DUOI_ANH.has(path.extname(m.name).toLowerCase())) ra.push(p);
  }
  return ra;
}

// ── Ảnh app của trụ cần thử ─────────────────────────────────────────────
const thuMucTru = path.join(THU_MUC_APP, sach(truMuon), 'phat-hien');
if (!fs.existsSync(thuMucTru)) {
  console.error(`Không thấy ${thuMucTru}. Kiểm tra lại tên trụ bằng:  dir anh`);
  process.exit(1);
}
const anhApp = fs.readdirSync(thuMucTru).filter((f) => DUOI_ANH.has(path.extname(f).toLowerCase()))
  .slice(0, SO_MAU).map((f) => path.join(thuMucTru, f));

// ── Ảnh gốc của đúng trụ đó ─────────────────────────────────────────────
const anhGoc = quet(thuMucGoc).filter((p) => soTru(path.relative(thuMucGoc, p)) === soTru(truMuon));
console.log(`Trụ thử      : ${truMuon}`);
console.log(`Ảnh app      : ${anhApp.length} tấm đem ra thử`);
console.log(`Ảnh của bạn  : ${anhGoc.length} tấm cùng trụ`);
if (anhGoc.length === 0) { console.error('Không thấy ảnh gốc nào của trụ này.'); process.exit(1); }

console.log('\nĐang tính vân tay ảnh gốc ở 5 chiều…');
const vGoc = [];
for (let i = 0; i < anhGoc.length; i++) {
  try { vGoc.push({ tep: anhGoc[i], v: await vanTayMoiChieu(anhGoc[i]) }); } catch { /* bỏ qua ảnh hỏng */ }
  if ((i + 1) % 50 === 0) process.stdout.write(`\r  ${i + 1}/${anhGoc.length}`);
}
process.stdout.write(`\r  ${vGoc.length}/${anhGoc.length}\n`);

const CHIEU = ['0°', '90°', '180°', '270°', 'lật'];
console.log('\nKhoảng cách nhỏ nhất tìm được, theo từng chiều của ảnh gốc:\n');
console.log('  ảnh app'.padEnd(44) + CHIEU.map((c) => c.padStart(6)).join(''));
const tongTheoChieu = Object.fromEntries(CHIEU.map((c) => [c, []]));
for (const tep of anhApp) {
  let v;
  try { v = vanTayAnh(await Jimp.read(tep)); } catch { continue; }
  const min = {};
  for (const c of CHIEU) min[c] = Math.min(...vGoc.map((g) => kc(v, g.v[c])));
  for (const c of CHIEU) tongTheoChieu[c].push(min[c]);
  console.log('  ' + path.basename(tep).slice(0, 40).padEnd(42) + CHIEU.map((c) => String(min[c]).padStart(6)).join(''));
}
const tb = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : '-');
console.log('\n  trung bình'.padEnd(44) + CHIEU.map((c) => String(tb(tongTheoChieu[c])).padStart(6)).join(''));

const totNhat = CHIEU.reduce((b, c) => (Number(tb(tongTheoChieu[c])) < Number(tb(tongTheoChieu[b])) ? c : b), '0°');
const giaTri = Number(tb(tongTheoChieu[totNhat]));
console.log('\n' + '─'.repeat(70));
if (giaTri <= 10) {
  console.log(`KẾT LUẬN: ảnh KHỚP ở chiều "${totNhat}" (trung bình ${giaTri}).`);
  if (totNhat !== '0°') console.log('→ Nguyên nhân A: ảnh bị xoay. Gửi tôi kết quả này, tôi sửa script.');
  else console.log('→ Ảnh khớp ở chiều thường. Lỗi nằm chỗ khác — gửi tôi kết quả này.');
} else {
  console.log(`KẾT LUẬN: mọi chiều đều xa nhau (gần nhất ${giaTri}).`);
  console.log('→ Nguyên nhân B: ảnh trong app và ảnh trong thư mục KHÔNG phải cùng một bộ.');
  console.log('   Gửi tôi kết quả này cùng tên vài file ảnh gốc của trụ đó.');
}
