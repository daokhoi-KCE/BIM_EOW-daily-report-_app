import type { ReportDraft } from "./types";
import { delayMinutes } from "./utils";

/** Xuất text song ngữ để copy gửi Zalo/email */
export function buildText(rep: ReportDraft): string {
  const L: string[] = [];
  L.push(`BÁO CÁO CÔNG VIỆC HẰNG NGÀY / DAILY WORK REPORT`);
  L.push(`BIM Wind Farm — EOW Inspection — 22 x GE Cypress 5.5-158`);
  L.push(``);
  L.push(`Ngày / Date: ${rep.date || "—"}   Ngày thứ / Day: ${rep.dayNum || "—"} /15`);
  L.push(
    `Trụ kế hoạch / Planned: ${rep.plannedTurbines || "—"}   Trụ thực tế / Actual: ${rep.actualTurbines || "—"}`,
  );
  L.push(`Người lập / Prepared by: ${rep.preparedBy || "—"}   OEM: ${rep.oemRep || "—"}`);
  L.push(`Thời tiết / Weather: ${rep.weather || "—"}`);
  L.push(``);
  L.push(`1. CÔNG VIỆC TỪNG TRỤ / TURBINE WORK`);
  rep.turbines.forEach((t) => {
    if (!t.turbine) return;
    L.push(
      `- ${t.turbine}: cánh/blade ${t.blade || "—"}, Hub ${t.hub || "—"}, Nacelle ${t.nacelle || "—"}, Tower ${t.tower || "—"}, Drone ${t.drone || "—"}, ${t.pct || "?"}%${t.notes ? " — " + t.notes : ""}`,
    );
  });
  L.push(``);
  L.push(`2. LỊCH KHÓA ROTOR / LOCK SCHEDULE`);
  rep.locks.forEach((l) => {
    if (!l.turbine) return;
    const d = delayMinutes(l.planned, l.actual);
    L.push(
      `- ${l.turbine} (${l.pos || "?"}): KH ${l.planned || "--:--"} → TT ${l.actual || "--:--"}${d !== null ? ` (trễ/delay ${d}p)` : ""}${l.notes ? " — " + l.notes : ""}`,
    );
  });
  if (rep.findings.length) {
    L.push(``);
    L.push(`3. PHÁT HIỆN / FINDINGS`);
    rep.findings.forEach((f) => {
      L.push(
        `- [M${f.severity || "?"}] ${f.turbine || "?"} ${f.area || ""}: ${f.desc || ""}${f.photo ? ` (${f.photo})` : ""}${f.photos?.length ? ` [${f.photos.length} ảnh đính kèm/attached]` : ""} — báo OEM/notified: ${f.oemNotified || "?"}`,
      );
    });
  }
  L.push(``);
  L.push(`4. AN TOÀN / SAFETY`);
  L.push(
    `- Nguy hiểm/Hazard: ${rep.safety.hazard.yn || "—"}${rep.safety.hazard.detail ? " — " + rep.safety.hazard.detail : ""}`,
  );
  L.push(
    `- Dừng máy/Shutdown: ${rep.safety.shutdown.yn || "—"}${rep.safety.shutdown.detail ? " — " + rep.safety.shutdown.detail : ""}`,
  );
  L.push(
    `- Lỗi nặng M4-5/Major defect: ${rep.safety.major.yn || "—"}${rep.safety.major.detail ? " — " + rep.safety.major.detail : ""}`,
  );
  L.push(``);
  L.push(`5. SO VỚI KẾ HOẠCH / PROGRESS`);
  L.push(
    `Lũy kế / Cumulative: ${rep.progress.cumulative || "—"} /22   Đúng tiến độ / On schedule: ${rep.progress.onSchedule || "—"}`,
  );
  if (rep.issues) {
    L.push(``);
    L.push(`6. VƯỚNG MẮC / ISSUES`);
    L.push(rep.issues);
  }
  if (rep.tomorrow) {
    L.push(``);
    L.push(`7. KẾ HOẠCH MAI / TOMORROW`);
    L.push(rep.tomorrow);
  }
  L.push(``);
  L.push(
    `Người lập/Prepared: ${rep.signPrepared || "—"}   OEM: ${rep.signOEM || "—"}   Site/BIM: ${rep.signSite || "—"}`,
  );
  const totalPhotos =
    (rep.photos?.length || 0) +
    rep.findings.reduce((s, f) => s + (f.photos?.length || 0), 0);
  if (totalPhotos)
    L.push(
      `\n[Báo cáo có ${totalPhotos} ảnh đính kèm — xem trong app / ${totalPhotos} photos attached — view in app]`,
    );
  return L.join("\n");
}
