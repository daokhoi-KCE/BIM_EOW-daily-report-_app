/**
 * Kiểm tra bố cục bản in A4 của báo cáo tổng hợp.
 *
 * Dựng mục 5 từ chính các component thật, in ra PDF bằng Chromium, rồi đọc
 * ngược file PDF để kiểm ba điều — những lỗi chỉ lộ ra khi in, không thấy
 * được trên màn hình:
 *
 *   1. Không phát hiện nào bị cắt ngang trang.
 *   2. Không dải tiêu đề hạng mục nào lìa khỏi phát hiện đầu tiên của nó.
 *   3. Khoảng trắng thừa cuối trang không quá ngưỡng cho phép.
 *
 * Chạy:  npm run kiem-tra-in
 *
 * Bài kiểm tra chạy nhiều kịch bản số ảnh khác nhau để dải tiêu đề rơi vào
 * đủ mọi vị trí trên trang — một kịch bản đơn lẻ rất dễ may mắn mà qua.
 *
 * Thoát mã 1 nếu có lỗi, để dùng được trong CI.
 */
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import SectionFindings from "@/components/final-report/SectionFindings";
import { SECTIONS } from "@/lib/report-sections";
import type { DatedFinding, SectionGroup } from "@/lib/final-report";

const CHROME = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
/**
 * Dung sai khi so khoảng trắng cuối trang với khối phải dời xuống (mm).
 *
 * Không đặt một ngưỡng cố định kiểu "trống quá 80mm là hỏng": con số đó tuỳ
 * tiện. Khoảng trắng cuối trang là hợp lệ khi nó nhỏ hơn khối đầu tiên của
 * trang sau — nghĩa là khối ấy thật sự không nhét vừa. Nếu trống còn nhiều
 * hơn cả khối đó thì mới là lỗi: có thứ nhét vừa mà vẫn bị đẩy đi.
 */
const DUNG_SAI_MM = 4;

const anh = (w: number, h: number, c: string, t: string) =>
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${c}"/><text x="50%" y="50%" font-size="${Math.round(w / 6)}" fill="#fff" text-anchor="middle" dominant-baseline="middle" font-family="Arial">${t}</text></svg>`,
  );
const ANH = [
  anh(800, 600, "#3B6EA5", "1"),
  anh(500, 900, "#5B8C5A", "2"),
  anh(1200, 500, "#A5643B", "3"),
  anh(700, 700, "#7A5BA5", "4"),
  anh(800, 600, "#A53B5B", "5"),
];

let uid = 0;
const phatHien = (nhan: string, soAnh: number): DatedFinding => ({
  id: `f${++uid}`,
  turbine: "WTG 16",
  area: "Nacelle — Gearbox",
  desc: `${nhan} Oil seepage at the housing joint; the surrounding paint has started to flake and rust is visible on the bracket below the joint.`,
  severity: "3",
  photo: "",
  oemNotified: "",
  time: "",
  date: "2026-09-15",
  photos: ANH.slice(0, soAnh).map((u, k) => ({ id: `p${uid}-${k}`, storagePath: "", url: u })),
});

/** Mỗi phần tử là số phát hiện của một hạng mục. */
const KICH_BAN: { ten: string; muc: number[]; anhTheoThuTu: (i: number) => number }[] = [
  { ten: "ít ảnh", muc: [3, 1, 4, 2, 5, 1, 3, 2, 4, 1, 2, 3], anhTheoThuTu: (i) => (i % 3) + 1 },
  { ten: "nhiều ảnh", muc: [3, 1, 4, 2, 5, 1, 3, 2, 4, 1, 2, 3], anhTheoThuTu: (i) => (i % 5) + 1 },
  { ten: "hạng mục ngắn", muc: [1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1], anhTheoThuTu: (i) => (i % 5) + 1 },
  { ten: "hạng mục dài", muc: [6, 5, 7, 4, 6], anhTheoThuTu: (i) => (i % 4) + 2 },
];

async function dungCss(html: string): Promise<string> {
  const tmp = path.join(os.tmpdir(), `bim-print-${Date.now()}.html`);
  fs.writeFileSync(tmp, html);
  const src =
    `@import "tailwindcss";\n@source "${tmp}";\n` +
    fs.readFileSync("src/app/globals.css", "utf8").replace('@import "tailwindcss";', "");
  const out = await postcss([tailwind()]).process(src, { from: "src/app/globals.css" });
  fs.rmSync(tmp);
  return out.css;
}

async function inRaPdf(html: string, dich: string) {
  const tmp = path.join(os.tmpdir(), `bim-print-${Date.now()}-full.html`);
  fs.writeFileSync(tmp, html);
  execFileSync(
    CHROME,
    ["--headless", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer", `--print-to-pdf=${dich}`, `file://${tmp}`],
    { stdio: "ignore" },
  );
  fs.rmSync(tmp);
}

async function chay(kb: (typeof KICH_BAN)[number]) {
  uid = 0;
  const nhom: SectionGroup[] = kb.muc.map((n, i) => ({
    section: SECTIONS[i % SECTIONS.length],
    findings: Array.from({ length: n }, (_, k) => phatHien(`«S${i + 1}F${k + 1}»`, kb.anhTheoThuTu(k))),
    critical: 0,
    medium: n,
    low: 0,
    photos: n * 2,
    turbines: ["WTG 16"],
  }));
  const than = nhom
    .map((g) => renderToStaticMarkup(React.createElement(SectionFindings, { group: g, multiTurbine: false })))
    .join("");
  const trang = (css: string) =>
    `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>t</title><style>${css}</style></head>` +
    `<body><div style="max-width:800px;margin:0 auto;background:#fff">${than}</div></body></html>`;

  const css = await dungCss(trang(""));
  const pdf = path.join(os.tmpdir(), `bim-${kb.ten.replace(/\s/g, "-")}.pdf`);
  await inRaPdf(trang(css), pdf);

  const pymupdf = `
import pymupdf, re, json, sys
d = pymupdf.open(sys.argv[1]); H = d[0].rect.height
mm = lambda pt: pt / 72 * 25.4
head, find = {}, {}
for i, pg in enumerate(d):
    t = pg.get_text()
    for m in re.finditer(r'5\\.(\\d+)\\s+[A-Z]', t): head.setdefault(int(m.group(1)), i)
    for m in re.finditer(r'«S(\\d+)F(\\d+)»', t): find.setdefault(f"{m.group(1)}-{m.group(2)}", []).append(i)

# Với mỗi trang: mép trên và mép dưới của phần có nội dung, cùng toạ độ y
# của từng phát hiện (nhận ra qua nhãn «SxFy» in trong phần diễn giải).
trang = []
for pg in d:
    ys = [b[3] for b in pg.get_text("blocks")]
    yt = [b[1] for b in pg.get_text("blocks")]
    for dr in pg.get_drawings():
        r = dr["rect"]
        if r.height < H * 0.9:
            ys.append(r.y1); yt.append(r.y0)
    moc = sorted(r.y0 for m in re.finditer(r'«S\\d+F\\d+»', pg.get_text())
                 for r in pg.search_for(m.group(0)))
    trang.append({
        "tren": mm(min(yt)) if yt else 0,
        "duoi": mm(max(ys)) if ys else 0,
        "moc": [mm(y) for y in moc],
    })

print(json.dumps({"pages": len(d), "cao": mm(H), "head": head,
                  "find": {k: sorted(set(v)) for k, v in find.items()}, "trang": trang}))
`;
  const raw = execFileSync("python3", ["-c", pymupdf, pdf], { encoding: "utf8" });
  fs.rmSync(pdf);
  const r = JSON.parse(raw) as {
    pages: number;
    cao: number;
    head: Record<string, number>;
    find: Record<string, number[]>;
    trang: { tren: number; duoi: number; moc: number[] }[];
  };

  const cat = Object.entries(r.find).filter(([, p]) => p.length > 1).map(([k]) => k);
  const lia = Object.entries(r.head)
    .filter(([s, hp]) => {
      const dau = r.find[`${Number(s) % SECTIONS.length || SECTIONS.length}-1`];
      return dau && dau[0] !== hp;
    })
    .map(([s]) => `5.${s}`);

  // Khoảng trắng cuối mỗi trang, và khối đầu tiên của trang kế tiếp. Trang
  // cuối không tính vì sau nó không còn gì để nhét lên.
  const khoangTrong = r.trang.slice(0, -1).map((t, i) => {
    const sau = r.trang[i + 1];
    // Khối đầu của trang sau kết thúc ở chỗ phát hiện thứ hai bắt đầu; nếu
    // trang chỉ có một phát hiện thì lấy tới hết phần có nội dung.
    const ketThuc = sau.moc.length > 1 ? sau.moc[1] : sau.duoi;
    return { trang: i + 1, trong: Math.round(r.cao - t.duoi), khoiSau: Math.round(ketThuc - sau.tren) };
  });
  // Lỗi khi trống còn nhiều hơn cả khối phải dời: thứ nhét vừa mà vẫn bị đẩy.
  const phiPham = khoangTrong.filter((k) => k.trong > k.khoiSau + DUNG_SAI_MM);

  return { kb, r, cat, lia, khoangTrong, phiPham };
}

async function main() {
  let loi = 0;
  console.log(
    "Kiểm tra bố cục bản in A4\n" +
      "Khoảng trắng cuối trang hợp lệ khi nhỏ hơn khối đầu của trang kế — " +
      `dung sai ${DUNG_SAI_MM}mm.\n`,
  );
  for (const kb of KICH_BAN) {
    const { r, cat, lia, khoangTrong, phiPham } = await chay(kb);
    const g = khoangTrong.map((k) => k.trong);
    const tb = g.length ? Math.round(g.reduce((a, b) => a + b, 0) / g.length) : 0;
    const max = g.length ? Math.max(...g) : 0;
    const ok = cat.length === 0 && lia.length === 0 && phiPham.length === 0;
    if (!ok) loi++;
    console.log(
      `${ok ? "ĐẠT " : "HỎNG"}  ${kb.ten.padEnd(15)} ${String(r.pages).padStart(2)} trang · trắng cuối trang: trung bình ${tb}mm, lớn nhất ${max}mm`,
    );
    if (cat.length) console.log(`        phát hiện bị cắt ngang trang: ${cat.join(", ")}`);
    if (lia.length) console.log(`        tiêu đề lìa khỏi phát hiện đầu: ${lia.join(", ")}`);
    for (const k of phiPham)
      console.log(`        trang ${k.trang}: trống ${k.trong}mm nhưng khối kế chỉ cao ${k.khoiSau}mm — lẽ ra nhét vừa`);
  }
  console.log(loi === 0 ? "\nTất cả kịch bản đạt." : `\n${loi} kịch bản không đạt.`);
  process.exit(loi === 0 ? 0 : 1);
}

main();
