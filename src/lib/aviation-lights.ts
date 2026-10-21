/**
 * Kết quả kiểm tra đèn báo bay (Aviation Obstruction Light) của 22 trụ.
 *
 * Nguồn: "Aviation Obstruction Light Inspection Record" của đội vận hành,
 * ngày 19/10/2026, từ 18:00. Đây là đợt kiểm tra riêng sau đợt EOW, nên
 * không nằm trong báo cáo ngày và không có trong cơ sở dữ liệu — số liệu
 * chép vào đây từ bảng giấy, giữ nguyên ghi chú gốc.
 *
 * `top` là đèn đỉnh nacelle, `tower` là đèn thân tháp. "V" trong bảng gốc là
 * đang hoạt động, "X" là không hoạt động.
 */
export type LightState = "ok" | "ng";

export interface LightRecord {
  top: LightState;
  tower: LightState;
  /** Ghi chú nguyên văn trong bảng gốc, nếu có. */
  remark?: string;
}

export const LIGHT_INSPECTION = {
  date: "2026-10-19",
  time: "18:00",
  by: "Operation team",
} as const;

const R = (top: "V" | "X", tower: "V" | "X", remark?: string): LightRecord => ({
  top: top === "V" ? "ok" : "ng",
  tower: tower === "V" ? "ok" : "ng",
  ...(remark ? { remark } : {}),
});

/** Khoá là số trụ. */
export const LIGHT_BY_TURBINE: Readonly<Record<number, LightRecord>> = {
  1: R("V", "X", "Top light: white light."),
  2: R("V", "V"),
  3: R("X", "X"),
  4: R("X", "X"),
  5: R("V", "X"),
  6: R("V", "V"),
  7: R("V", "V"),
  8: R("V", "V"),
  9: R("V", "V"),
  10: R("V", "V"),
  11: R("X", "X"),
  12: R("V", "V"),
  13: R("V", "V"),
  14: R("X", "V"),
  15: R("X", "V"),
  16: R("X", "X"),
  17: R("X", "V", "Tower light: only one row of lights working."),
  18: R("V", "V"),
  19: R("X", "X"),
  20: R("X", "X"),
  21: R("V", "V", "Tower light: only one row of lights working."),
  22: R("V", "V", "Tower light: only one row of lights working."),
};

/** Một dòng phát hiện sinh ra từ đèn không hoạt động. */
export interface LightFinding {
  which: "top" | "tower";
  date: string;
  area: string;
  desc: string;
}

/**
 * Các dòng phát hiện cho đèn không hoạt động của một trụ — đúng những ô NG của
 * hai hàng đèn báo bay trong ma trận 4.3, không thêm không bớt. Đèn hoạt động
 * (kể cả có ghi chú như "chỉ sáng một hàng") không sinh dòng nào.
 */
export function lightFindingsFor(turbineLabel: string): LightFinding[] {
  const rec = lightsFor(turbineLabel);
  if (!rec) return [];
  const out: LightFinding[] = [];
  if (rec.top === "ng")
    out.push({
      which: "top",
      date: LIGHT_INSPECTION.date,
      area: "Nacelle top — Aviation light",
      desc: "Aviation obstruction light (nacelle top) is not working — need to be replaced.",
    });
  if (rec.tower === "ng")
    out.push({
      which: "tower",
      date: LIGHT_INSPECTION.date,
      area: "Tower body — Tower light",
      desc: "Tower body light is not working — need to be replaced.",
    });
  return out;
}

/** Lấy kết quả theo nhãn trụ ("WTG 01", "WTG01", "Wtg 1"…). Không có số thì undefined. */
export function lightsFor(turbineLabel: string): LightRecord | undefined {
  const m = turbineLabel.match(/(\d+)\s*$/);
  return m ? LIGHT_BY_TURBINE[Number(m[1])] : undefined;
}
