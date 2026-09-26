/**
 * Danh mục các mục "5. Main findings" của báo cáo tổng hợp, cùng bộ phân
 * loại đưa từng finding về đúng mục.
 *
 * Danh mục bám theo bố cục báo cáo visual inspection tiêu chuẩn, nhưng phần
 * tháp được đặt theo cách chia thực tế của trụ GE tại công trường
 * (Base → D → C → B → A → Top) thay vì Tower Section 1-8 của tài liệu mẫu,
 * vì đó là cách đội hiện trường đã ghi trong suốt 22 báo cáo ngày.
 */

export interface ReportSection {
  /** Số thứ tự trong mục 5, ví dụ 5.4. */
  no: string;
  id: string;
  en: string;
  vi: string;
}

export const SECTIONS: ReportSection[] = [
  { no: "5.1", id: "foundation-tower-external", en: "Foundation and Tower (External)", vi: "Móng và thân tháp (bên ngoài)" },
  { no: "5.2", id: "tower-base-basement", en: "Tower Base and Basement", vi: "Đế tháp và tầng hầm" },
  { no: "5.3", id: "tower-base-d", en: "Tower Section Base–D", vi: "Đoạn tháp Base–D" },
  { no: "5.4", id: "tower-d-c", en: "Tower Section D–C", vi: "Đoạn tháp D–C" },
  { no: "5.5", id: "tower-c-b", en: "Tower Section C–B", vi: "Đoạn tháp C–B" },
  { no: "5.6", id: "tower-b-a", en: "Tower Section B–A", vi: "Đoạn tháp B–A" },
  { no: "5.7", id: "tower-a-top", en: "Tower Section A–Top", vi: "Đoạn tháp A–Top" },
  { no: "5.8", id: "top-section-yaw-platform", en: "Top Section and Yaw Platform", vi: "Đoạn đỉnh và sàn yaw" },
  { no: "5.9", id: "access-system", en: "Elevator, Ladder and Access System", vi: "Thang máy, thang leo và lối tiếp cận" },
  { no: "5.10", id: "rotor-hub-pitch", en: "Rotor Hub and Pitch System", vi: "Hub và hệ pitch" },
  { no: "5.11", id: "nacelle", en: "Nacelle", vi: "Khoang máy" },
  { no: "5.12", id: "rotor-main-shaft", en: "Rotor, Main Shaft and Main Bearing", vi: "Rotor, trục chính và ổ đỡ chính" },
  { no: "5.13", id: "gearbox", en: "Gearbox", vi: "Hộp số" },
  { no: "5.14", id: "generator", en: "Generator", vi: "Máy phát" },
  { no: "5.15", id: "yaw-system", en: "Yaw System", vi: "Hệ yaw" },
  { no: "5.16", id: "hydraulic-brake", en: "Hydraulic, Rotor Lock and Brake Systems", vi: "Hệ thuỷ lực, khoá rotor và phanh" },
  { no: "5.17", id: "cooling-system", en: "Cooling System", vi: "Hệ làm mát" },
  { no: "5.18", id: "electrical", en: "Electrical Cabinets, Cabling and Lighting", vi: "Tủ điện, cáp và chiếu sáng" },
  { no: "5.19", id: "blades", en: "Blades and Blade Bearings", vi: "Cánh và ổ đỡ cánh" },
  { no: "5.20", id: "safety-devices", en: "Safety Devices / Elements", vi: "Thiết bị và cấu kiện an toàn" },
  { no: "5.21", id: "other", en: "Other Findings", vi: "Phát hiện khác" },
];

export const SECTION_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]));

const has = (text: string, ...needles: string[]) => needles.some((n) => text.includes(n));

/**
 * Đưa một finding về đúng mục 5.x.
 *
 * Cột `area` do đội hiện trường gõ tay nên rất tạp: có bản ghi dùng tab để
 * tách khu vực và cụm thiết bị ("nacelle\tgearbox"), có bản ghi viết tắt,
 * viết hoa hoặc sai chính tả. Vì vậy hàm này xét theo thứ tự ưu tiên:
 * tên cụm thiết bị trước (chính xác hơn), rồi mới đến vị trí trên tháp, và
 * chỉ dùng phần mô tả khi `area` quá chung chung.
 */
export function classifyFinding(areaRaw: string | undefined, descRaw?: string): string {
  const area = (areaRaw ?? "").toLowerCase().replace(/[\t_/]+/g, " ").replace(/\s+/g, " ").trim();
  const desc = (descRaw ?? "").toLowerCase();
  if (!area && !desc) return "other";

  // ── Cụm thiết bị: xét trước vì tên cụm xác định hơn vị trí ──────────────
  // "yaw platform" là vị trí trên tháp, không phải hệ yaw — loại trừ trước.
  const yawComponent = has(area, "yaw bearing", "yaw motor", "yaw gear", "yaw brake", "yaw ring", "yaw system", "yaw drive");
  if (yawComponent) return "yaw-system";

  // Phanh xét trước hộp số: "Gearbox brake caliper" là cụm phanh trục cao
  // tốc, gắn trên hộp số nhưng thuộc hệ phanh.
  if (has(area, "hydraulic", "rotor lock", "brake", "hpu", "lock pin")) return "hydraulic-brake";
  if (has(area, "gearbox", "gear box", "bedplate gearbox")) return "gearbox";
  if (has(area, "generator", "genarator")) return "generator";
  if (has(area, "main bearing", "pillow block", "mainbearing", "mainshaft", "main shaft", "low speed shaft", "slip ring", "flex coupling"))
    return "rotor-main-shaft";
  if (has(area, "cooling", "cooler", "radiator")) return "cooling-system";
  // "electric" bắt được cả "electrical", kể cả khi danh từ đi sau bị gõ sai
  // ("electrical jucntion box" xuất hiện trong dữ liệu thật).
  if (has(area, "cabinet", "electric", "junction box", "transformer", "cms", "light", "cable", "grid", "mvsg", "switch"))
    return "electrical";
  if (has(area, "blade", "pitch gear", "pitch motor", "pitch bearing", "nose cone")) return "blades";
  if (has(area, "anchor point", "tie off", "tie-off", "guardrail", "guard rail", "eye wash", "fall arrest", "safety", "harness"))
    return "safety-devices";
  if (has(area, "elevator", "ladder", "runner", "rung", "stair", "3s")) return "access-system";

  // ── Vị trí trên tháp ────────────────────────────────────────────────────
  if (has(area, "hardstand", "outside", "external", "foundation", "exterior", "anchor bolt")) return "foundation-tower-external";
  // Mối nối giữa hai đoạn tháp, đội hiện trường ghi kiểu "S1-S2 connection".
  if (/\bs\d\b/.test(area) && has(area, "connection", "top", "bottom")) return "foundation-tower-external";
  if (has(area, "basement", "base door", "base tower")) return "tower-base-basement";
  // Cửa vào tháp nằm ở chân tháp; "extra door protection" là cơ cấu chốt cửa.
  if (has(area, "door")) return "tower-base-basement";

  // Các đoạn tháp: chấp nhận cả "section b-a", "middle b-a", "tower b-a", "b - a".
  const segment = area.replace(/\s*-\s*/g, "-");
  if (has(segment, "base-d", "base -d", "base section-middle d", "middle d-base")) return "tower-base-d";
  if (has(segment, "d-c")) return "tower-d-c";
  if (has(segment, "c-b")) return "tower-c-b";
  if (has(segment, "b-a")) return "tower-b-a";
  if (has(segment, "a-top", "top-a")) return "tower-a-top";
  if (/\bmiddle a\b/.test(area)) return "tower-a-top";
  if (has(area, "yaw platform", "top section", "top tower")) return "top-section-yaw-platform";
  if (has(area, "base")) return "tower-base-basement";

  // ── Khoang máy và hub: xét sau cùng vì rất chung ────────────────────────
  if (has(area, "hub")) return "rotor-hub-pitch";
  if (has(area, "nacelle", "nace")) return "nacelle";
  if (has(area, "tower", "flange", "section")) return "foundation-tower-external";

  // ── `area` không đủ thông tin: thử đọc phần mô tả ───────────────────────
  if (has(desc, "gearbox")) return "gearbox";
  if (has(desc, "generator")) return "generator";
  if (has(desc, "yaw bearing", "yaw motor")) return "yaw-system";
  if (has(desc, "mainshaft", "main shaft")) return "rotor-main-shaft";
  if (has(desc, "blade")) return "blades";
  if (has(desc, "nacelle")) return "nacelle";
  if (has(desc, "hub")) return "rotor-hub-pitch";
  if (has(desc, "tower")) return "foundation-tower-external";

  return "other";
}
