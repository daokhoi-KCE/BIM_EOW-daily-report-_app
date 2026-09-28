#!/usr/bin/env node
/**
 * Xoá các file ảnh mồ côi trong Storage — file không còn bản ghi nào trỏ tới.
 *
 * Supabase chặn xoá file thẳng từ SQL nên phần này phải chạy bằng tay.
 *
 * QUAN TRỌNG — vì sao script này thay cho `xoa_anh_canh.mjs`:
 *
 * Script cũ lấy danh sách đường dẫn từ bảng sao lưu rồi xoá thẳng. Cách đó
 * đúng vào lúc viết, nhưng ngày 28/09 toàn bộ 119 finding khảo sát cánh và
 * 472 bản ghi ảnh của chúng đã được khôi phục lại vào cơ sở dữ liệu. Bảng
 * sao lưu thì vẫn còn nguyên. Chạy script cũ bây giờ là xoá 472 file ảnh
 * mà các finding đang sống vẫn dùng — mất sạch, không lấy lại được.
 *
 * Script này không tin vào bảng sao lưu nữa. Nó đọc toàn bộ đường dẫn còn
 * được tham chiếu trong `finding_photos` và `site_photos`, rồi chỉ xoá
 * những file KHÔNG nằm trong danh sách đó. Chạy lúc nào cũng an toàn, kể cả
 * sau khi khôi phục dữ liệu.
 *
 * Cách chạy (cần service_role key, KHÔNG dùng anon key):
 *
 *   export SUPABASE_SERVICE_ROLE_KEY='<dán key ở đây>'
 *   node xoa_anh_mo_coi.mjs           # chạy thử: liệt kê, không xoá gì
 *   node xoa_anh_mo_coi.mjs --xoa     # xoá thật
 *
 * Lấy service_role key: Supabase Dashboard > Project Settings > API Keys.
 * Đây là key toàn quyền — đừng commit vào git, đừng dán vào chat.
 */

const URL_DU_AN = 'https://mjxkmbbwdjrvphmqloes.supabase.co';
const BUCKET = 'evidence-photos';
const TRANG = 1000; // PostgREST cắt ở 1000 dòng, phải phân trang
const LO = 200; // số file mỗi lần gọi API xoá

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const XOA_THAT = process.argv.includes('--xoa');

if (!KEY) {
  console.error('Thiếu SUPABASE_SERVICE_ROLE_KEY. Xem hướng dẫn ở đầu file.');
  process.exit(1);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

/** Đọc hết một bảng, tự phân trang. */
async function docHet(bang, cot) {
  const ra = [];
  for (let tu = 0; ; tu += TRANG) {
    const res = await fetch(
      `${URL_DU_AN}/rest/v1/${bang}?select=${cot}&limit=${TRANG}&offset=${tu}`,
      { headers },
    );
    if (!res.ok) throw new Error(`Không đọc được ${bang}: ${res.status} ${await res.text()}`);
    const rows = await res.json();
    ra.push(...rows.map((r) => r[cot]).filter(Boolean));
    if (rows.length < TRANG) return ra;
  }
}

/** Liệt kê file trong một thư mục của bucket, đệ quy. */
async function liet(prefix = '', ra = []) {
  for (let tu = 0; ; tu += TRANG) {
    const res = await fetch(`${URL_DU_AN}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix, limit: TRANG, offset: tu }),
    });
    if (!res.ok) throw new Error(`Không liệt kê được ${prefix}: ${res.status} ${await res.text()}`);
    const items = await res.json();
    for (const it of items) {
      const duong = prefix ? `${prefix}/${it.name}` : it.name;
      // Thư mục không có metadata; file thì có.
      if (it.id === null || it.metadata === null) await liet(duong, ra);
      else ra.push({ duong, bytes: Number(it.metadata?.size ?? 0) });
    }
    if (items.length < TRANG) break;
  }
  return ra;
}

async function xoaLo(duongDan) {
  const res = await fetch(`${URL_DU_AN}/storage/v1/object/${BUCKET}`, {
    method: 'DELETE',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: duongDan }),
  });
  if (!res.ok) throw new Error(`Xoá thất bại: ${res.status} ${await res.text()}`);
  return (await res.json()).length;
}

const [anhFinding, anhSite, files] = await Promise.all([
  docHet('finding_photos', 'storage_path'),
  docHet('site_photos', 'storage_path'),
  liet(),
]);

const dangDung = new Set([...anhFinding, ...anhSite]);
const moCoi = files.filter((f) => !dangDung.has(f.duong));
const mb = (b) => (b / 1024 / 1024).toFixed(1) + ' MB';

console.log(`File trong Storage      : ${files.length}`);
console.log(`Còn bản ghi trỏ tới     : ${files.length - moCoi.length}  (được giữ)`);
console.log(`Mồ côi, sẽ xoá          : ${moCoi.length}  (${mb(moCoi.reduce((s, f) => s + f.bytes, 0))})`);

if (moCoi.length === 0) {
  console.log('\nKhông có gì để xoá.');
  process.exit(0);
}

if (!XOA_THAT) {
  console.log('\n--- CHẠY THỬ, chưa xoá gì ---');
  moCoi.slice(0, 10).forEach((f) => console.log('  ' + f.duong));
  if (moCoi.length > 10) console.log(`  ... và ${moCoi.length - 10} file nữa`);
  console.log('\nChạy lại với  --xoa  để xoá thật.');
  process.exit(0);
}

let daXoa = 0;
for (let i = 0; i < moCoi.length; i += LO) {
  daXoa += await xoaLo(moCoi.slice(i, i + LO).map((f) => f.duong));
  console.log(`Đã xoá ${Math.min(i + LO, moCoi.length)}/${moCoi.length}`);
}
console.log(`\nXong. Supabase xác nhận xoá ${daXoa} file.`);
