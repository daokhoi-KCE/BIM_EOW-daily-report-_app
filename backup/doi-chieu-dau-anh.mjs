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
 * CHẠY NHẸ MÁY
 *
 * Đọc dấu là việc nặng và kéo dài hàng giờ. Mặc định script chỉ chạy MỘT
 * luồng và tự hạ mức ưu tiên tiến trình xuống thấp, để máy còn dùng được
 * việc khác và không nóng tới mức tự khởi động lại. Máy khoẻ thì tăng
 * --luong, nhưng tăng rồi mà máy treo hay tự tắt thì hạ lại.
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
const LUONG = Math.max(1, Number(lay('luong', '1')));
const CAO = Math.max(600, Number(lay('cao', String(CAO_MAC_DINH))));
const chiTru = new Set(lay('tru', '').split(',').map((t) => t.trim().padStart(2, '0')).filter((t) => t !== '00'));
const nhanh = doiSo.includes('--nhanh');
const apDung = doiSo.includes('--ap-dung');
const chiDoc = doiSo.includes('--chi-doc');
const docLai = doiSo.includes('--doc-lai');
const thuLaiLoi = doiSo.includes('--thu-lai-loi');

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
      if (chiTru.size && !chiTru.has(soTru(tru))) continue;
      mucApp.push({ tep, finding_id: f.id, tru, ngay_bc: r.report_date, khu_vuc: f.area ?? '',
                    dien_giai: f.description ?? '', muc_do: f.severity ?? '' });
    }
  }
}
if (thieuTep) console.log(`  ${thieuTep} ảnh có trong CSDL nhưng chưa tải về — chạy  node tai-anh-theo-tru.mjs --tat-ca`);

const tepGoc = quetThuMuc(thuMucGoc)
  .map((tep) => ({ tep, tuongDoi: path.relative(thuMucGoc, tep).replace(/\\/g, '/') }))
  .filter((g) => !chiTru.size || chiTru.has(soTru(g.tuongDoi)));
if (chiTru.size) console.log(`Chỉ xử lý trụ: ${[...chiTru].sort().join(', ')}`);
console.log(`Ảnh trong app  : ${mucApp.length}`);
console.log(`Ảnh thư mục bạn: ${tepGoc.length}`);

// ── Đọc dấu cho cả hai bên, có cache ────────────────────────────────────
const cache = new Map();
if (!docLai && fs.existsSync(CACHE)) {
  const dong = fs.readFileSync(CACHE, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).slice(1);
  for (const d of dong) {
    if (!d.trim()) continue;
    const [tep, ngay, gio, tru, muc, lech, tho] = tachDong(d);
    if (thuLaiLoi && !ngay) continue; // bỏ ra để đọc lại
    cache.set(tep, { ngay, gio, tru, muc, lech, tho });
  }
  console.log(`Đã có sẵn dấu của ${cache.size} ảnh trong ${CACHE}`);
  if (thuLaiLoi) console.log('  (các ảnh lần trước không ra dấu sẽ được đọc lại)');
}

const canDoc = [...mucApp.map((m) => m.tep), ...tepGoc.map((g) => g.tep)].filter((t) => !cache.has(t));
if (canDoc.length) {
  console.log(`\nĐang đọc dấu trên ${canDoc.length} ảnh bằng ${LUONG} luồng — việc này lâu, cứ để chạy.`);
  // Đọc lại các ảnh hỏng thì phải ghi lại cả file, nếu không các dòng hỏng
  // cũ vẫn nằm đó và lần sau đọc trúng chúng trước.
  const noiThem = cache.size > 0 && !thuLaiLoi;
  const ghi = fs.createWriteStream(CACHE, { flags: noiThem ? 'a' : 'w' });
  if (!noiThem) {
    ghi.write('\uFEFF' + 'tep,ngay,gio,tru,muc,lech,tho\n');
    for (const [t, k] of cache) ghi.write([t, k.ngay, k.gio, k.tru, k.muc, k.lech, k.tho].map(oCsv).join(',') + '\n');
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
      cache.set(tep, kq);
      ghi.write([tep, kq.ngay, kq.gio, kq.tru, kq.muc, kq.lech, kq.tho].map(oCsv).join(',') + '\n');
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

const dauCua = (tep) => cache.get(tep) ?? { ngay: '', gio: '', tru: '', muc: '', lech: '', tho: '' };
const coDau = (ds, lay) => ds.filter((x) => dauCua(lay(x)).ngay).length;
const demLech = (ds, lay) => ds.filter((x) => dauCua(lay(x)).lech).length;
console.log(`\nĐọc được dấu — ảnh app: ${coDau(mucApp, (m) => m.tep)}/${mucApp.length}` +
            ` · ảnh của bạn: ${coDau(tepGoc, (g) => g.tep)}/${tepGoc.length}`);
const tongLech = demLech(mucApp, (m) => m.tep) + demLech(tepGoc, (g) => g.tep);
if (tongLech) console.log(`  ${tongLech} ảnh hai lượt đọc lệch nhau nên bỏ qua — xem cột lech trong ${CACHE}`);

if (chiDoc) {
  console.log(`\nĐã ghi ${CACHE}. Bỏ --chi-doc để đối chiếu.`);
  process.exit(0);
}

// ── Ghép theo PHÁT HIỆN, không ghép từng ảnh một ────────────────────────
//
// Thử ghép 1 ảnh app ↔ 1 ảnh gốc thì hỏng: dấu chỉ in tới phút, mà một
// phút thường có mấy tấm chụp liên tiếp cùng một lỗi. Chạy thử trụ 16 thì
// 92/105 ảnh đọc được rơi vào cảnh "nhiều ảnh cùng một phút", ép chọn một
// tấm trong đó là đoán bừa.
//
// Mà cũng không cần ghép 1-1. Cái cần điền vào báo cáo là TÊN ẢNH GỐC của
// một phát hiện, nên gom theo phát hiện: lấy các phút đọc được từ ảnh app
// của nó, rồi liệt kê mọi ảnh gốc cùng trụ + ngày + phút đó. Mấy tấm cùng
// một phút cùng một chỗ gần như chắc chắn là cùng một lỗi — liệt kê cả
// chùm vừa đúng hơn vừa có ích hơn cho khách khi đi tìm ảnh.
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

/**
 * Vị trí trên trụ, quy về một tên — bản rút gọn của src/lib/area-label.ts.
 * Dùng để loại các ảnh cùng phút nhưng khác chỗ, nên "Middle B-A",
 * "Section B - A" và "Tower B-A" đều phải về một mối.
 */
function viTri(s) {
  const t = String(s).toLowerCase().replace(/[\t_]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (/\b(nacelle\s*top|top\s*nacelle)\b/.test(t)) return 'nacelle-top';
  if (/\bnace/.test(t)) return 'nacelle';
  if (/\bhub\b/.test(t)) return 'hub';
  if (/\bblade/.test(t)) return 'blades';
  if (/\byaw\b/.test(t)) return 'top-yaw';
  if (/\bbasement\b|\bdoor\b/.test(t)) return 'base';
  if (/\b(hardstand|foundation|outside|outer|external|exterior)\b/.test(t)) return 'ngoai';
  const moc = [];
  for (const m of t.matchAll(/\b(base|top|[a-d])\b/g)) if (!moc.includes(m[1])) moc.push(m[1]);
  if (moc.length === 0) return '';
  const thuTu = ['base', 'd', 'c', 'b', 'a', 'top'];
  if (moc.length === 1) return moc[0] === 'base' ? 'base' : moc[0] === 'top' ? 'top-yaw' : `doan-${moc[0]}`;
  const k = moc.map((m) => thuTu.indexOf(m)).sort((x, y) => x - y);
  return `doan-${thuTu[k[0]]}-${thuTu[k[k.length - 1]]}`;
}

// Gom ảnh app theo phát hiện.
const theoPh = new Map();
for (const m of mucApp) {
  if (!theoPh.has(m.finding_id)) theoPh.set(m.finding_id, []);
  theoPh.get(m.finding_id).push(m);
}

const ketQua = [];
for (const [finding_id, anhs] of theoPh) {
  const m0 = anhs[0];
  const tru = soTru(m0.tru);
  const doc = anhs.map((m) => ({ m, d: dauCua(m.tep) }));
  const phut = [...new Set(doc.filter((x) => x.d.ngay).map((x) => khoa(x.d.tru || tru, x.d.ngay, x.d.gio)))];
  const soLech = doc.filter((x) => !x.d.ngay && x.d.lech).length;
  const base = {
    finding_id, tru: m0.tru, ngay_bc: m0.ngay_bc, khu_vuc: m0.khu_vuc,
    muc_do: m0.muc_do, dien_giai: m0.dien_giai,
    so_anh_app: anhs.length, doc_duoc: doc.filter((x) => x.d.ngay).length,
    phut_app: phut.map((k) => k.split('|')[2]).sort().join(' '),
    ngay_dau: [...new Set(doc.filter((x) => x.d.ngay).map((x) => x.d.ngay))].join(' '),
  };

  if (phut.length === 0) {
    ketQua.push({ ...base, ten_anh_goc: '', so_anh_goc: 0, trang_thai: 'khong doc duoc dau',
                  ghi_chu: soLech ? `${soLech} ảnh hai lượt đọc lệch nhau` : '' });
    continue;
  }

  // Mọi ảnh gốc rơi vào đúng các phút đó.
  const ungVien = [];
  const phutTrong = [];
  for (const k of phut) {
    const ds = gocTheoKhoa.get(k) ?? [];
    if (ds.length === 0) phutTrong.push(k.split('|')[2]);
    for (const g of ds) if (!ungVien.some((u) => u.tep === g.tep)) ungVien.push(g);
  }
  if (ungVien.length === 0) {
    ketQua.push({ ...base, ten_anh_goc: '', so_anh_goc: 0, trang_thai: 'khong tim thay', ghi_chu: '' });
    continue;
  }

  // Loại ảnh cùng phút nhưng khác chỗ — chỉ loại khi cả hai bên đều đọc ra vị trí.
  const vtPh = viTri(`${m0.khu_vuc} ${doc.map((x) => x.d.muc).join(' ')}`);
  let chon = ungVien, lechViTri = 0;
  if (vtPh) {
    const hop = ungVien.filter((g) => {
      const v = viTri(`${g.muc} ${g.tuongDoi}`);
      return !v || v === vtPh;
    });
    lechViTri = ungVien.length - hop.length;
    if (hop.length) chon = hop;
  }

  const ghiChu = [];
  if (phutTrong.length) ghiChu.push(`không có ảnh gốc ở phút ${phutTrong.join(', ')}`);
  if (lechViTri && chon !== ungVien) ghiChu.push(`bỏ ${lechViTri} ảnh khác vị trí`);
  if (lechViTri && chon === ungVien) ghiChu.push('vị trí không khớp, giữ nguyên cả chùm');
  if (soLech) ghiChu.push(`${soLech} ảnh app hai lượt đọc lệch nhau`);
  if (base.doc_duoc < anhs.length) ghiChu.push(`chỉ đọc được dấu ${base.doc_duoc}/${anhs.length} ảnh app`);

  ketQua.push({
    ...base, so_anh_goc: chon.length,
    ten_anh_goc: chon.map((g) => g.tuongDoi).join(' | '),
    trang_thai: phutTrong.length || (lechViTri && chon === ungVien) ? 'can kiem tra' : 'chac chan',
    ghi_chu: ghiChu.join('; '),
  });
}

// Một ảnh gốc bị nhiều phát hiện cùng nhận thì không chắc nữa — hai lỗi
// chụp cùng một phút ở cùng một chỗ, phải xem lại bằng mắt.
const nhanBoi = new Map();
for (const r of ketQua) {
  if (!r.ten_anh_goc) continue;
  for (const t of r.ten_anh_goc.split(' | ')) nhanBoi.set(t, (nhanBoi.get(t) ?? 0) + 1);
}
for (const r of ketQua) {
  if (r.trang_thai !== 'chac chan') continue;
  const chung = r.ten_anh_goc.split(' | ').filter((t) => nhanBoi.get(t) > 1).length;
  if (chung) {
    r.trang_thai = 'can kiem tra';
    r.ghi_chu = [r.ghi_chu, `${chung} ảnh cũng thuộc phát hiện khác`].filter(Boolean).join('; ');
  }
}

const dem = (t) => ketQua.filter((r) => r.trang_thai === t).length;
const anhCua = (t) => ketQua.filter((r) => r.trang_thai === t).reduce((n, r) => n + r.so_anh_goc, 0);
console.log(`\nTheo PHÁT HIỆN (${ketQua.length} phát hiện, ${mucApp.length} ảnh app):`);
console.log(`  chắc chắn         : ${dem('chac chan')}   → ${anhCua('chac chan')} tên ảnh gốc`);
console.log(`  cần kiểm tra      : ${dem('can kiem tra')}   → ${anhCua('can kiem tra')} tên ảnh gốc, xem cột ghi_chu`);
console.log(`  không tìm thấy    : ${dem('khong tim thay')}   (không có ảnh gốc nào cùng trụ+ngày+phút)`);
console.log(`  không đọc được dấu: ${dem('khong doc duoc dau')}   (không ảnh app nào của phát hiện đọc được dấu)`);

const lech = ketQua.filter((r) => r.ngay_dau && r.ngay_bc && !r.ngay_dau.includes(r.ngay_bc)).length;
if (lech) console.log(`\n  ${lech} phát hiện có ngày trên dấu khác ngày của báo cáo — xem cột ngay_dau trong CSV.`);

fs.writeFileSync(CSV_RA, '\uFEFF' + [
  'trang_thai,ghi_chu,tru,ngay_bc,ngay_dau,phut_app,khu_vuc,muc_do,so_anh_app,doc_duoc,so_anh_goc,ten_anh_goc,dien_giai,finding_id',
  ...ketQua
    .sort((a, b) => String(a.tru).localeCompare(String(b.tru)) || String(a.phut_app).localeCompare(String(b.phut_app)))
    .map((r) => [r.trang_thai, r.ghi_chu, r.tru, r.ngay_bc, r.ngay_dau, r.phut_app, r.khu_vuc, r.muc_do,
                 r.so_anh_app, r.doc_duoc, r.so_anh_goc, r.ten_anh_goc, r.dien_giai, r.finding_id].map(oCsv).join(',')),
].join('\n'));
console.log(`\nĐã ghi ${CSV_RA} — mở bằng Excel để xem trước khi áp dụng.`);

if (!apDung) {
  console.log('\nChạy lại kèm  --ap-dung  để điền tên file vào ô Photo ref của các phát hiện.');
  process.exit(0);
}

// ── Ghi photo_ref ───────────────────────────────────────────────────────
// Chỉ ghi các phát hiện ghép chắc chắn. Loại "cần kiểm tra" để lại trong
// CSV cho bạn xem bằng mắt rồi quyết định.
const seGhi = ketQua.filter((r) => r.trang_thai === 'chac chan' && r.ten_anh_goc);
console.log(`\nSẽ điền Photo ref cho ${seGhi.length} phát hiện…`);
let xongGhi = 0, hongGhi = 0;
for (const r of seGhi) {
  const ten = [...new Set(r.ten_anh_goc.split(' | '))].join(', ');
  const res = await fetch(`${URL_DU_AN}/rest/v1/findings?id=eq.${r.finding_id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ photo_ref: ten }),
  });
  if (res.ok) { if (++xongGhi % 25 === 0) process.stdout.write(`\r  đã ghi ${xongGhi}/${seGhi.length}`); }
  else { hongGhi++; console.error(`\n  hỏng ${r.finding_id}: ${res.status} ${await res.text()}`); }
}
console.log(`\r  đã ghi ${xongGhi}/${seGhi.length}${hongGhi ? ` · ${hongGhi} lỗi` : ''}`);
console.log('\nXong. Mở lại báo cáo trong app để kiểm tra cột Photo ở mục 6.');
