/**
 * Chuẩn hoá tên khu vực của một phát hiện.
 *
 * Đội hiện trường gõ tay nên cùng một đoạn tháp có hàng chục cách viết:
 * "Middle B-A", "Mid section B-A", "Section B - A", "Tower B-A",
 * "Tower section B - A" đều là một. Có dòng còn viết ngược đầu ("Section
 * A-B", "Section C-D"). In nguyên như vậy thì cùng một chỗ trên trụ hiện ra
 * năm sáu tên khác nhau, và sắp xếp thì chúng nằm rải rác khắp bảng.
 *
 * Hàm này tách tên khu vực thành hai phần:
 *
 *   zone    vị trí trên trụ, quy về một tên duy nhất
 *   detail  cụm thiết bị đi kèm, giữ nguyên chữ của người ghi
 *
 * Dữ liệu trong cơ sở dữ liệu không đổi — chỉ cách hiển thị và cách sắp xếp
 * là quy về một mối.
 */

/** Các mốc chia đoạn tháp, xếp từ chân lên đỉnh. */
const MOC = ["base", "d", "c", "b", "a", "top"] as const;
type Moc = (typeof MOC)[number];

export interface AreaParts {
  /** Vị trí trên trụ sau khi quy chuẩn. Rỗng nếu không nhận ra. */
  zone: string;
  /** Thứ tự từ đỉnh xuống chân, để sắp xếp. Không nhận ra thì xếp cuối. */
  rank: number;
  /** Cụm thiết bị đi kèm, giữ nguyên chữ gốc. */
  detail: string;
  /** Chuỗi để in ra: zone kèm detail nếu có. */
  label: string;
}

/** Bảng vị trí, xếp từ đỉnh trụ xuống chân — cũng là thứ tự sắp xếp. */
const ZONES: { rank: number; zone: string }[] = [
  { rank: 0, zone: "Nacelle top" },
  { rank: 1, zone: "Nacelle" },
  { rank: 2, zone: "Hub" },
  { rank: 3, zone: "Blades" },
  { rank: 4, zone: "Top section — Yaw platform" },
  { rank: 5, zone: "Tower A–Top" },
  { rank: 6, zone: "Tower section A" },
  { rank: 7, zone: "Tower B–A" },
  { rank: 8, zone: "Tower section B" },
  { rank: 9, zone: "Tower C–B" },
  { rank: 10, zone: "Tower section C" },
  { rank: 11, zone: "Tower D–C" },
  { rank: 12, zone: "Tower section D" },
  { rank: 13, zone: "Tower Base–D" },
  { rank: 14, zone: "Tower base and basement" },
  { rank: 15, zone: "Tower — full height" },
  { rank: 16, zone: "Foundation and outside" },
];
const RANK = new Map(ZONES.map((z) => [z.zone, z.rank]));
/** Khu vực không nhận ra xếp sau tất cả, giữ nguyên tên người ghi. */
export const UNKNOWN_RANK = ZONES.length;

const doan = (a: Moc, b: Moc): string => {
  const [duoi, tren] = MOC.indexOf(a) < MOC.indexOf(b) ? [a, b] : [b, a];
  if (duoi === "base" && tren === "top") return "Tower — full height";
  const hoa = (m: Moc) => (m === "base" ? "Base" : m === "top" ? "Top" : m.toUpperCase());
  return `Tower ${hoa(duoi)}–${hoa(tren)}`;
};
const donLe = (m: Moc): string =>
  m === "base" ? "Tower base and basement" : m === "top" ? "Top section — Yaw platform" : `Tower section ${m.toUpperCase()}`;

/** Từ mở đầu chỉ vị trí — ăn hết ở đầu chuỗi thì phần còn lại là cụm thiết bị. */
const TU_VI_TRI = /^(mid|middle|section|sections|tower|base|basement|top|nacelle|yaw\s+platform|platform|to|and|of|the|[a-d]|\d+)\b/i;

export function canonicalArea(raw: string | undefined): AreaParts {
  const goc = (raw ?? "").replace(/\t/g, "\u0001").trim();
  if (!goc) return { zone: "", rank: UNKNOWN_RANK, detail: "", label: "" };

  // Phần trước tab là vị trí, phần sau là cụm thiết bị — đây là cách đội
  // hiện trường ghi trong phần lớn bản ghi.
  const [dauRaw, ...duoiRaw] = goc.split("\u0001");
  const dau = dauRaw.replace(/\s+/g, " ").trim();
  let detail = duoiRaw.join(" — ").replace(/\s+/g, " ").trim();

  const thap = dau.toLowerCase();

  // ── Vị trí không thuộc thân tháp: xét trước vì tên rất xác định ────────
  let zone = "";
  if (/\b(nacelle\s*top|top\s*nacelle)\b/.test(thap)) zone = "Nacelle top";
  // "Nace" là cách gõ tắt/gõ thiếu của Nacelle, có thật trong dữ liệu.
  else if (/\bnace/.test(thap)) zone = "Nacelle";
  else if (/\bhub\b/.test(thap)) zone = "Hub";
  else if (/\bblade/.test(thap)) zone = "Blades";
  // Hệ yaw nằm ở mặt tiếp giáp đỉnh tháp với khoang máy. "platfrom" là lỗi
  // gõ có thật.
  else if (/\byaw\b|yaw\s*platf/.test(thap)) zone = "Top section — Yaw platform";
  // Cửa vào tháp và tầng hầm đều ở chân tháp — cùng quy ước với bộ phân
  // loại hạng mục 5.x.
  else if (/\bbasement\b|\bdoor\b/.test(thap)) zone = "Tower base and basement";
  else if (/\b(hardstand|foundation|outside|outer|external|exterior)\b/.test(thap))
    zone = "Foundation and outside";
  // "Too section" là lỗi gõ của "Top section".
  else if (/\btoo\s*section\b/.test(thap)) zone = "Top section — Yaw platform";

  if (!zone) {
    // ── Thân tháp: nhặt các mốc xuất hiện trong chuỗi ──────────────────
    // Nhặt theo từ chứ không theo dấu gạch: "Base section - Middle D" không
    // có mốc nào đứng cạnh dấu gạch, nhưng vẫn là đoạn Base–D.
    const mocs: Moc[] = [];
    for (const m of thap.matchAll(/\b(base|top|[a-d])\b/g)) {
      const t = m[1] as Moc;
      if (!mocs.includes(t)) mocs.push(t);
    }
    if (mocs.length >= 2) zone = doan(mocs[0], mocs[mocs.length - 1]);
    else if (mocs.length === 1) zone = donLe(mocs[0]);
  }

  if (!zone) return { zone: "", rank: UNKNOWN_RANK, detail, label: dau + (detail ? ` — ${detail}` : "") };

  // ── Cụm thiết bị khi không có tab: gỡ các từ chỉ vị trí ở đầu chuỗi ───
  if (!detail) {
    let con = dau;
    for (;;) {
      const truoc = con;
      con = con.replace(/^[\s\-–—/,&|.]+/, "").replace(TU_VI_TRI, "");
      if (con === truoc) break;
    }
    detail = con.replace(/^[\s\-–—/,&|.]+/, "").replace(/\s+/g, " ").trim();
  }
  // "Yaw", "Platform" đứng một mình chính là tên vị trí, không phải thiết bị.
  if (/^(yaw|platform|yaw\s+platform|section|tower)$/i.test(detail)) detail = "";

  return { zone, rank: RANK.get(zone) ?? UNKNOWN_RANK, detail, label: detail ? `${zone} — ${detail}` : zone };
}
