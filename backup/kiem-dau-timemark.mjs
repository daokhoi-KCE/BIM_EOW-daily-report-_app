#!/usr/bin/env node
/**
 * Kiểm việc đọc dấu Timemark trên ảnh thật.
 *
 * Việc đọc dấu quyết định toàn bộ phần ghép tên ảnh, mà sai thì không lộ ra
 * ngay — chỉ thấy khi tên ảnh trong báo cáo lệch. Nên trước khi chạy đối
 * chiếu cả chục nghìn ảnh, hãy chạy script này trên vài ảnh mẫu đã biết
 * trước ngày giờ, xem có đọc đúng không.
 *
 * CÁCH CHẠY
 *
 * Đường dẫn có dấu cách hay dấu ngoặc thì bọc nháy CẢ đối số, đừng chỉ bọc
 * riêng đường dẫn — PowerShell mới hiểu đúng.
 *
 *   # xem thử đọc ra gì
 *   node kiem-dau-timemark.mjs "--anh=D:\...\WTG16_HUB (1).jpg"
 *
 *   # so với giá trị đã biết — sai thì thoát mã khác 0, dùng được trong CI
 *   node kiem-dau-timemark.mjs "--anh=...\a.jpg" "--mong-doi=2026-09-11 08:29 WTG16"
 *
 *   # chạy hàng loạt: mỗi dòng của file là  <đường dẫn>|<mong đợi>
 *   node kiem-dau-timemark.mjs --danh-sach=mau-dau.txt
 *
 * Phần mong đợi viết tự do, script chỉ dò trong đó ngày (YYYY-MM-DD), giờ
 * (HH:MM) và số trụ (WTG nn) — thiếu phần nào thì không kiểm phần đó.
 *
 * Tuỳ chọn --cao=1600 đổi cỡ phóng dải dấu, --nhanh bỏ lượt đọc đối chứng.
 * Dùng --cao để dò lại khi có ảnh đọc không ra.
 */

import fs from 'node:fs';
import { createWorker, PSM } from 'tesseract.js';
import { Jimp } from 'jimp';
// sharp chuẩn bị ảnh nhanh hơn jimp nhiều; không có thì vẫn chạy bằng jimp.
let sharp = null;
try { ({ default: sharp } = await import('sharp')); } catch { /* chạy bằng jimp */ }
import { docDau, duongDanNgonNgu, CAO_MAC_DINH } from './dau-timemark.mjs';

const doiSo = process.argv.slice(2);
const lay = (ten) => doiSo.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? '';
const CAO = Math.max(600, Number(lay('cao') || CAO_MAC_DINH));
const nhanh = doiSo.includes('--nhanh');

const dsAnh = [];
const dsFile = lay('danh-sach');
if (dsFile) {
  for (const d of fs.readFileSync(dsFile, 'utf8').split(/\r?\n/)) {
    if (!d.trim() || d.trim().startsWith('#')) continue;
    const [tep, mong = ''] = d.split('|');
    dsAnh.push({ tep: tep.trim(), mong: mong.trim() });
  }
} else if (lay('anh')) {
  dsAnh.push({ tep: lay('anh'), mong: lay('mong-doi') });
}
if (dsAnh.length === 0) {
  console.error('Thiếu --anh="<đường dẫn ảnh>" hoặc --danh-sach=<file>. Xem hướng dẫn ở đầu file.');
  process.exit(1);
}

const worker = await createWorker('eng', 1, { langPath: duongDanNgonNgu(), gzip: true, cacheMethod: 'none' });
await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });

let hong = 0;
for (const { tep, mong } of dsAnh) {
  const d = await docDau(Jimp, worker, tep, { cao: CAO, nhanh, sharp });
  const ten = tep.split(/[\\/]/).pop();
  if (!d.ngay) {
    console.log(d.lech
      ? `✗ ${ten}: hai lượt đọc lệch nhau (${d.lech}) — không dám nhận`
      : `✗ ${ten}: không đọc được dấu`);
    hong++;
    continue;
  }

  const can = [];
  const mNgay = mong.match(/\d{4}-\d{2}-\d{2}/);
  const mGio = mong.match(/\b(\d{1,2}):(\d{2})\b/);
  const mTru = mong.match(/WTG\s*0*(\d{1,2})/i);
  if (mNgay) can.push(['ngày', d.ngay, mNgay[0]]);
  if (mGio) can.push(['giờ', d.gio, `${mGio[1].padStart(2, '0')}:${mGio[2]}`]);
  if (mTru) can.push(['trụ', d.tru, mTru[1].padStart(2, '0')]);

  const sai = can.filter(([, duoc, cho]) => duoc !== cho);
  const tom = `WTG ${d.tru || '??'} · ${d.ngay} ${d.gio}${d.muc ? ` · ${d.muc}` : ''}`;
  if (sai.length) {
    console.log(`✗ ${ten}: ${tom}`);
    for (const [nhan, duoc, cho] of sai) console.log(`    ${nhan}: đọc ra "${duoc}" nhưng mong đợi "${cho}"`);
    hong++;
  } else {
    console.log(`${can.length ? '✓' : '·'} ${ten}: ${tom}`);
  }
}
await worker.terminate();

if (hong) { console.log(`\n${hong}/${dsAnh.length} ảnh đọc sai.`); process.exit(1); }
console.log(`\n${dsAnh.length}/${dsAnh.length} ảnh đọc đúng.`);
