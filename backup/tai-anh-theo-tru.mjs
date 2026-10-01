#!/usr/bin/env node
/**
 * Tải toàn bộ ảnh của một hay nhiều trụ từ Supabase Storage về máy.
 *
 * Bucket `evidence-photos` để ở chế độ riêng tư, nên không thể tải ảnh bằng
 * đường dẫn thường — phải có service_role key. Vì vậy phần này chạy tại máy
 * bạn, không chạy được từ phía tôi.
 *
 * Cách chạy:
 *
 *   export SUPABASE_SERVICE_ROLE_KEY='<dán key ở đây>'
 *   node tai-anh-theo-tru.mjs "WTG 13" "WTG 14" "WTG 15"
 *   node tai-anh-theo-tru.mjs --tat-ca          # cả 22 trụ
 *
 * Lọc hẹp lại:
 *
 *   --ngay=2026-08-28           chỉ báo cáo của ngày đó
 *   --khu-vuc="top section,section a-top"   chỉ các khu vực khớp
 *
 * Khu vực so khớp theo kiểu "chứa chuỗi", đã bỏ qua hoa thường và khoảng
 * trắng quanh dấu gạch — nên "section a-top" bắt được cả "Section A-Top"
 * lẫn "Section A -Top", còn "section b-a" thì không dính "section Base-D".
 * Lọc khu vực chỉ áp cho ảnh phát hiện; ảnh hiện trường không có khu vực
 * nên khi lọc sẽ bỏ qua.
 *
 * Kết quả đặt trong thư mục ./anh:
 *
 *   anh/WTG 13/phat-hien/001 - Middle B-A - M3.jpg
 *   anh/WTG 13/hien-truong/001.jpg
 *   anh/WTG 13/danh-muc.csv      ← đối chiếu ảnh với phát hiện
 *
 * Lấy service_role key: Supabase Dashboard > Project Settings > API Keys.
 * Đây là key toàn quyền — đừng commit vào git, đừng dán vào chat.
 */

import fs from 'node:fs';
import path from 'node:path';

const URL_DU_AN = 'https://mjxkmbbwdjrvphmqloes.supabase.co';
const BUCKET = 'evidence-photos';
const TRANG = 1000; // PostgREST cắt ở 1000 dòng
const SONG_SONG = 6; // số ảnh tải cùng lúc

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error('Thiếu SUPABASE_SERVICE_ROLE_KEY. Xem hướng dẫn ở đầu file.');
  process.exit(1);
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const doiSo = process.argv.slice(2);
const tatCa = doiSo.includes('--tat-ca');
const truMuon = doiSo.filter((a) => !a.startsWith('--')).map((t) => t.replace(/\s+/g, '').toUpperCase());
const ngayMuon = doiSo.find((a) => a.startsWith('--ngay='))?.slice('--ngay='.length) || '';

/** Bỏ hoa thường, gom khoảng trắng, dán sát hai bên dấu gạch. */
const chuan = (s) => (s || '').toLowerCase().replace(/\t/g, ' ').replace(/\s+/g, ' ').replace(/\s*-\s*/g, '-').trim();
const mauKhuVuc = (doiSo.find((a) => a.startsWith('--khu-vuc='))?.slice('--khu-vuc='.length) || '')
  .split(',').map(chuan).filter(Boolean);
const hopKhuVuc = (area) => mauKhuVuc.length === 0 || mauKhuVuc.some((m) => chuan(area).includes(m));
if (!tatCa && truMuon.length === 0) {
  console.error('Chưa nêu trụ nào. Ví dụ:  node tai-anh-theo-tru.mjs "WTG 13" "WTG 14"');
  process.exit(1);
}

async function docHet(bang, cot, loc = '') {
  const ra = [];
  for (let tu = 0; ; tu += TRANG) {
    const res = await fetch(`${URL_DU_AN}/rest/v1/${bang}?select=${cot}${loc}&limit=${TRANG}&offset=${tu}`, { headers });
    if (!res.ok) throw new Error(`Không đọc được ${bang}: ${res.status} ${await res.text()}`);
    const rows = await res.json();
    ra.push(...rows);
    if (rows.length < TRANG) return ra;
  }
}

/** Tên file an toàn trên Windows lẫn macOS. */
const sach = (s) => (s || '').replace(/[\\/:*?"<>|\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
const oCsv = (v) => `"${String(v ?? '').replace(/"/g, '""').replace(/[\r\n\t]+/g, ' ')}"`;

async function taiMot(duongDan, dich) {
  const res = await fetch(`${URL_DU_AN}/storage/v1/object/${BUCKET}/${encodeURI(duongDan)}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${duongDan}`);
  fs.mkdirSync(path.dirname(dich), { recursive: true });
  fs.writeFileSync(dich, Buffer.from(await res.arrayBuffer()));
}

/** Chạy nhiều việc cùng lúc nhưng có giới hạn, tránh nghẽn mạng. */
async function chayTheoLo(viec, n) {
  let i = 0, xong = 0, hong = [];
  await Promise.all(
    Array.from({ length: n }, async () => {
      for (;;) {
        const k = i++;
        if (k >= viec.length) return;
        try {
          await viec[k].chay();
          if (++xong % 25 === 0) process.stdout.write(`\r  đã tải ${xong}/${viec.length}`);
        } catch (e) {
          hong.push(`${viec[k].ten}: ${e.message}`);
        }
      }
    }),
  );
  process.stdout.write(`\r  đã tải ${xong}/${viec.length}\n`);
  return hong;
}

const [baoCao, phatHien, anhPh, anhHt] = await Promise.all([
  docHet('reports', 'id,report_date,planned_turbines,actual_turbines'),
  docHet('findings', 'id,report_id,area,description,severity,sort_order'),
  docHet('finding_photos', 'id,finding_id,storage_path,created_at'),
  docHet('site_photos', 'id,report_id,storage_path,created_at'),
]);

const tenTru = (r) => (r.planned_turbines || r.actual_turbines || '').trim();
const chon = baoCao
  .filter((r) => tatCa || truMuon.includes(tenTru(r).replace(/\s+/g, '').toUpperCase()))
  .filter((r) => !ngayMuon || r.report_date === ngayMuon);
if (chon.length === 0) {
  console.error('Không tìm thấy báo cáo nào khớp bộ lọc. Các trụ đang có:');
  console.error('  ' + [...new Set(baoCao.map(tenTru).filter(Boolean))].sort().join(', '));
  process.exit(1);
}

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

for (const r of chon) {
  const tru = tenTru(r);
  const thuMuc = path.join('anh', sach(tru));
  const viec = [];
  const csv = ['loai,tep,ngay,tru,khu_vuc,dien_giai,muc_do,storage_path'];

  const fs_ = (phTheoBaoCao.get(r.id) ?? [])
    .filter((f) => hopKhuVuc(f.area))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  let stt = 0;
  for (const f of fs_) {
    const list = (anhTheoPh.get(f.id) ?? []).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
    for (const p of list) {
      stt++;
      const duoi = path.extname(p.storage_path) || '.jpg';
      const ten = `${String(stt).padStart(3, '0')} - ${sach(f.area) || 'khong ro khu vuc'} - M${f.severity ?? '?'}${duoi}`;
      const dich = path.join(thuMuc, 'phat-hien', ten);
      viec.push({ ten: p.storage_path, chay: () => taiMot(p.storage_path, dich) });
      csv.push(['phat-hien', ten, r.report_date, tru, f.area, f.description, f.severity ?? '', p.storage_path].map(oCsv).join(','));
    }
  }

  // Lọc theo khu vực thì bỏ ảnh hiện trường — chúng không gắn khu vực nào.
  const ht = (mauKhuVuc.length ? [] : anhHt.filter((s) => s.report_id === r.id)).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  ht.forEach((p, k) => {
    const duoi = path.extname(p.storage_path) || '.jpg';
    const ten = `${String(k + 1).padStart(3, '0')}${duoi}`;
    viec.push({ ten: p.storage_path, chay: () => taiMot(p.storage_path, path.join(thuMuc, 'hien-truong', ten)) });
    csv.push(['hien-truong', ten, r.report_date, tru, '', '', '', p.storage_path].map(oCsv).join(','));
  });

  const loc = [ngayMuon && `ngày ${ngayMuon}`, mauKhuVuc.length && `${mauKhuVuc.length} mẫu khu vực`]
    .filter(Boolean).join(', ');
  console.log(`\n${tru} — ${r.report_date}${loc ? ` [lọc: ${loc}]` : ''}: ${fs_.length} phát hiện, ${viec.length} ảnh`);
  if (mauKhuVuc.length) {
    for (const [kv, n] of [...fs_.reduce((m, f) => m.set(String(f.area).replace(/\t/g, ' / '),
        (m.get(String(f.area).replace(/\t/g, ' / ')) ?? 0) + (anhTheoPh.get(f.id) ?? []).length), new Map())])
      console.log(`    ${String(n).padStart(3)} ảnh  ${kv}`);
  }
  const hong = await chayTheoLo(viec, SONG_SONG);
  fs.mkdirSync(thuMuc, { recursive: true });
  fs.writeFileSync(path.join(thuMuc, 'danh-muc.csv'), '﻿' + csv.join('\n'));
  if (hong.length) {
    console.log(`  ${hong.length} ảnh tải hỏng:`);
    hong.slice(0, 10).forEach((h) => console.log('    ' + h));
  }
}
console.log('\nXong. Ảnh nằm trong thư mục ./anh');
