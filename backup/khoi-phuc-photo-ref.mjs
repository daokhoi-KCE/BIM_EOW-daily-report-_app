#!/usr/bin/env node
/**
 * Trả lại ô "Photo ref" về giá trị TRƯỚC KHI script đối chiếu ghi đè.
 *
 * Mỗi lần doi-chieu-dau-anh.mjs chạy --ap-dung, nó lưu giá trị cũ ra một file
 * photo-ref-cu-<thời điểm>.csv. Chạy --ap-dung nhiều lần thì có nhiều file,
 * và file sau ghi lại cả những gì LẦN TRƯỚC script đã ghi. Lấy theo file mới
 * nhất chỉ trả về kết quả của lượt chạy trước, không phải chữ người gõ.
 *
 * Nên lệnh này đọc TẤT CẢ các file sao lưu trong thư mục hiện tại, và với
 * từng phát hiện lấy giá trị ở file SỚM NHẤT có nhắc tới nó — đó là giá trị
 * trước khi script đụng vào lần đầu. Chỉ khôi phục các ô mà giá trị ban đầu
 * có chữ; ô ban đầu trống thì giữ tên ảnh script đã ghi.
 *
 * LƯU Ý: lần ghi đầu tiên cho trụ 16 diễn ra trước khi có tính năng sao lưu,
 * nên giá trị ban đầu của trụ 16 không có trong file nào.
 *
 * CÁCH DÙNG (PowerShell, trong thư mục có các file photo-ref-cu-*.csv)
 *
 *   node --use-system-ca khoi-phuc-photo-ref.mjs              # chỉ xem trước
 *   node --use-system-ca khoi-phuc-photo-ref.mjs --ap-dung    # ghi thật
 *
 * Xem trước ghi ra khoi-phuc-xem-truoc.csv. Trước khi ghi thật, giá trị hiện
 * tại được lưu ra photo-ref-truoc-khoi-phuc-<thời điểm>.csv.
 *
 * Cần biến môi trường SUPABASE_SERVICE_ROLE_KEY như các script khác.
 */
import fs from 'node:fs';

const URL_DU_AN = 'https://mjxkmbbwdjrvphmqloes.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apDung = process.argv.includes('--ap-dung');
if (!KEY) {
  console.error('Thiếu SUPABASE_SERVICE_ROLE_KEY. Đặt bằng:  $env:SUPABASE_SERVICE_ROLE_KEY="<khoá>"');
  process.exit(1);
}
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

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
const gio = () => new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '').slice(2);

async function goi(url, tuyChon = {}, lan = 4) {
  let loiCuoi;
  for (let i = 0; i <= lan; i++) {
    if (i) await new Promise((r) => setTimeout(r, 1000 * 2 ** (i - 1)));
    try {
      const res = await fetch(url, tuyChon);
      if (res.status === 402) {
        console.error('\nSupabase đang KHOÁ dự án (HTTP 402) — gói Free hết hạn mức của tháng.\n' +
          'Lệnh khôi phục chỉ chạy được khi dự án mở lại. Chưa ghi gì.\n');
        process.exit(2);
      }
      if (res.ok || (res.status < 500 && res.status !== 401)) return res;
      const chu = await res.clone().text();
      if (res.status === 401 && !chu.includes('PGRST303')) return res;
      loiCuoi = new Error(`${res.status} ${chu}`);
    } catch (e) {
      const ma = e?.cause?.code ?? e?.code;
      if (/CERT|SIGNATURE/.test(String(ma))) {
        console.error(`\nKết nối HTTPS bị chặn bởi chứng chỉ lạ (${ma}). Chạy kèm --use-system-ca.\n`);
        process.exit(1);
      }
      loiCuoi = e;
    }
  }
  throw loiCuoi;
}

// ── Đọc mọi file sao lưu, cũ trước mới sau ─────────────────────────────────
const tepSaoLuu = fs.readdirSync('.')
  .filter((t) => /^photo-ref-cu-\d{12}(-\d+)?\.csv$/.test(t))
  .sort();
if (!tepSaoLuu.length) {
  console.error('Không thấy file photo-ref-cu-*.csv nào trong thư mục này. Chạy lệnh ở đúng thư mục C:\\Users\\AD.');
  process.exit(1);
}
console.log(`Đọc ${tepSaoLuu.length} file sao lưu (cũ → mới):`);
const banDau = new Map(); // finding_id -> { cu, tru, tep }
for (const tep of tepSaoLuu) {
  const dong = fs.readFileSync(tep, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const dau = tachDong(dong[0]);
  const iId = dau.indexOf('finding_id'), iCu = dau.indexOf('photo_ref_cu'), iTru = dau.indexOf('tru');
  let moi = 0;
  for (const d of dong.slice(1)) {
    const c = tachDong(d);
    const id = c[iId];
    if (!id || banDau.has(id)) continue; // đã có ở file sớm hơn
    banDau.set(id, { cu: c[iCu] ?? '', tru: c[iTru] ?? '', tep });
    moi++;
  }
  console.log(`  ${tep}: ${dong.length - 1} dòng, ${moi} phát hiện lần đầu xuất hiện`);
}

const canTra = [...banDau].filter(([, v]) => v.cu.trim());
console.log(`\n${banDau.size} phát hiện từng bị script ghi; ${canTra.length} trong số đó ban đầu CÓ CHỮ.`);
if (!canTra.length) { console.log('Không có gì cần khôi phục.'); process.exit(0); }

// ── Giá trị hiện tại trong cơ sở dữ liệu ───────────────────────────────────
const hienTai = new Map();
const ids = canTra.map(([id]) => id);
for (let i = 0; i < ids.length; i += 50) {
  const lo = ids.slice(i, i + 50).join(',');
  const res = await goi(`${URL_DU_AN}/rest/v1/findings?select=id,photo_ref&id=in.(${lo})`, { headers });
  if (!res.ok) throw new Error(`Không đọc được findings: ${res.status} ${await res.text()}`);
  for (const r of await res.json()) hienTai.set(r.id, r.photo_ref ?? '');
}

const seTra = canTra.filter(([id, v]) => hienTai.has(id) && hienTai.get(id) !== v.cu);
const daDung = canTra.filter(([id, v]) => hienTai.get(id) === v.cu).length;
const mat = canTra.filter(([id]) => !hienTai.has(id)).length;

fs.writeFileSync('khoi-phuc-xem-truoc.csv', '\uFEFF' + [
  'finding_id,tru,se_tra_ve,hien_tai,lay_tu_file',
  ...seTra.map(([id, v]) => [id, v.tru, v.cu, hienTai.get(id), v.tep].map(oCsv).join(',')),
].join('\n'));

console.log(`  ${seTra.length} ô sẽ được trả về giá trị ban đầu`);
if (daDung) console.log(`  ${daDung} ô đã đúng giá trị ban đầu rồi, bỏ qua`);
if (mat) console.log(`  ${mat} phát hiện không còn trong cơ sở dữ liệu (đã bị xoá), bỏ qua`);
console.log('\nVài ví dụ:');
for (const [id, v] of seTra.slice(0, 5)) {
  console.log(`  ${v.tru.padEnd(8)} "${v.cu.slice(0, 50)}"  ←  "${hienTai.get(id).slice(0, 50)}"`);
}
console.log('\nĐã ghi khoi-phuc-xem-truoc.csv — mở bằng Excel xem đủ danh sách.');

if (!apDung) {
  console.log('Đúng rồi thì chạy lại kèm  --ap-dung  để ghi.');
  process.exit(0);
}

// ── Ghi thật, sau khi lưu giá trị hiện tại ─────────────────────────────────
const luu = `photo-ref-truoc-khoi-phuc-${gio()}.csv`;
fs.writeFileSync(luu, '\uFEFF' + ['finding_id,tru,photo_ref_hien_tai',
  ...seTra.map(([id, v]) => [id, v.tru, hienTai.get(id)].map(oCsv).join(','))].join('\n'));
console.log(`\nĐã lưu giá trị hiện tại vào ${luu} — muốn lùi lại việc khôi phục thì dùng file này.`);

let xong = 0, hong = 0;
for (const [id, v] of seTra) {
  const res = await goi(`${URL_DU_AN}/rest/v1/findings?id=eq.${id}`, {
    method: 'PATCH', headers, body: JSON.stringify({ photo_ref: v.cu }),
  });
  if (res.ok) xong++;
  else { hong++; console.error(`  hỏng ${id}: ${res.status} ${await res.text()}`); }
}
console.log(`Đã khôi phục ${xong}/${seTra.length} ô${hong ? ` · ${hong} lỗi` : ''}.`);
