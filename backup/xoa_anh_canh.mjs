#!/usr/bin/env node
/**
 * Xoá các file ảnh còn sót lại trong Storage sau khi finding đã bị xoá khỏi DB.
 *
 * Supabase chặn xoá file thẳng từ SQL, nên phần này phải chạy bằng tay.
 *
 * Danh sách đường dẫn được đọc trực tiếp từ bảng sao lưu, nên script luôn
 * khớp với dữ liệu thật, không nhúng cứng đường dẫn nào. Hai bảng đang có:
 *
 *   finding_photos_blade_deleted_20260925      472 ảnh — khảo sát cánh
 *   finding_photos_bad_turbine_deleted_20260928  5 ảnh — sai tên trụ
 *
 * Cách chạy (cần service_role key, KHÔNG dùng anon key):
 *
 *   export SUPABASE_SERVICE_ROLE_KEY='<dán key ở đây>'
 *   node xoa_anh_canh.mjs                                  # chạy thử bảng mặc định
 *   node xoa_anh_canh.mjs --xoa                            # xoá thật
 *   node xoa_anh_canh.mjs --bang=finding_photos_bad_turbine_deleted_20260928 --xoa
 *
 * Lấy service_role key: Supabase Dashboard > Project Settings > API Keys.
 * Đây là key toàn quyền — đừng commit vào git, đừng dán vào chat.
 */

const URL_DU_AN = 'https://mjxkmbbwdjrvphmqloes.supabase.co';
const BUCKET = 'evidence-photos';
const BANG_MAC_DINH = 'finding_photos_blade_deleted_20260925';
const BANG_SAO_LUU =
  process.argv.find((a) => a.startsWith('--bang='))?.slice('--bang='.length) || BANG_MAC_DINH;
const LO = 200; // số file mỗi lần gọi API

const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const XOA_THAT = process.argv.includes('--xoa');

if (!KEY) {
  console.error('Thiếu SUPABASE_SERVICE_ROLE_KEY. Xem hướng dẫn ở đầu file.');
  process.exit(1);
}

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

async function layDanhSach() {
  const res = await fetch(
    `${URL_DU_AN}/rest/v1/${BANG_SAO_LUU}?select=storage_path`,
    { headers }
  );
  if (!res.ok) throw new Error(`Không đọc được bảng sao lưu: ${res.status} ${await res.text()}`);
  return (await res.json()).map((r) => r.storage_path).filter(Boolean);
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

const duongDan = await layDanhSach();
console.log(`Bảng ${BANG_SAO_LUU}: tìm thấy ${duongDan.length} đường dẫn ảnh.`);

if (!XOA_THAT) {
  console.log('\n--- CHẠY THỬ, chưa xoá gì ---');
  duongDan.slice(0, 5).forEach((p) => console.log('  ' + p));
  if (duongDan.length > 5) console.log(`  ... và ${duongDan.length - 5} file nữa`);
  console.log('\nChạy lại với  --xoa  để xoá thật.');
  process.exit(0);
}

let daXoa = 0;
for (let i = 0; i < duongDan.length; i += LO) {
  const lo = duongDan.slice(i, i + LO);
  daXoa += await xoaLo(lo);
  console.log(`Đã xoá ${Math.min(i + LO, duongDan.length)}/${duongDan.length}`);
}
console.log(`\nXong. Supabase xác nhận xoá ${daXoa} file.`);
