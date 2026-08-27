"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Copy, FileText } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import type { SaveState } from "@/components/SaveStateBadge";
import Field, { inputCls, inputSm } from "@/components/form/Field";
import SectionCard from "@/components/form/SectionCard";
import RowCard from "@/components/form/RowCard";
import AddButton from "@/components/form/AddButton";
import QuickPick from "@/components/form/QuickPick";
import YesNoToggle from "@/components/form/YesNoToggle";
import PhotoGrid from "@/components/form/PhotoGrid";
import Lightbox from "@/components/form/Lightbox";
import { NAVY, AMBER, NAVY_DARK } from "@/lib/theme";
import { delayMinutes } from "@/lib/utils";
import { emptyTurbine, emptyLock, emptyFinding } from "@/lib/blank-report";
import { buildText } from "@/lib/report-text";
import { saveReport } from "@/lib/actions/reports";
import {
  uploadSitePhoto,
  removeSitePhoto,
  uploadFindingPhoto,
  removeFindingPhoto,
} from "@/lib/client-photos";
import type { ReportDraft, Photo, YesNo } from "@/lib/types";

type OpenSections = {
  info: boolean;
  turbines: boolean;
  locks: boolean;
  findings: boolean;
  photos: boolean;
  safety: boolean;
  progress: boolean;
  issues: boolean;
  tomorrow: boolean;
  sign: boolean;
};

const initialOpen: OpenSections = {
  info: true,
  turbines: true,
  locks: false,
  findings: false,
  photos: false,
  safety: false,
  progress: false,
  issues: false,
  tomorrow: false,
  sign: false,
};

export default function ReportEditor({
  initialDraft,
  cumulativeHint,
}: {
  initialDraft: ReportDraft;
  cumulativeHint: number;
}) {
  const [rep, setRep] = useState<ReportDraft>(initialDraft);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [open, setOpen] = useState<OpenSections>(initialOpen);
  const [copied, setCopied] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    if (saveState !== "dirty") return;
    const t = setTimeout(async () => {
      setSaveState("saving");
      const result = await saveReport(rep);
      setSaveState(result.ok ? "saved" : "dirty");
    }, 700);
    return () => clearTimeout(t);
  }, [rep, saveState]);

  const toggle = (k: keyof OpenSections) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const update = (patch: Partial<ReportDraft>) => {
    setRep((r) => ({ ...r, ...patch }));
    setSaveState("dirty");
  };

  const updateSafety = (
    key: "hazard" | "shutdown" | "major",
    patch: Partial<{ yn: YesNo; detail: string }>,
  ) => {
    setRep((r) => ({ ...r, safety: { ...r.safety, [key]: { ...r.safety[key], ...patch } } }));
    setSaveState("dirty");
  };

  const updateProgress = (patch: Partial<ReportDraft["progress"]>) => {
    setRep((r) => ({ ...r, progress: { ...r.progress, ...patch } }));
    setSaveState("dirty");
  };

  const updateTurbine = (id: string, patch: Partial<ReportDraft["turbines"][number]>) => {
    setRep((r) => ({ ...r, turbines: r.turbines.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
    setSaveState("dirty");
  };
  const addTurbine = () => {
    setRep((r) => ({ ...r, turbines: [...r.turbines, emptyTurbine()] }));
    setSaveState("dirty");
  };
  const delTurbine = (id: string) => {
    setRep((r) => ({ ...r, turbines: r.turbines.filter((t) => t.id !== id) }));
    setSaveState("dirty");
  };

  const updateLock = (id: string, patch: Partial<ReportDraft["locks"][number]>) => {
    setRep((r) => ({ ...r, locks: r.locks.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
    setSaveState("dirty");
  };
  const addLock = () => {
    setRep((r) => ({ ...r, locks: [...r.locks, emptyLock()] }));
    setSaveState("dirty");
  };
  const delLock = (id: string) => {
    setRep((r) => ({ ...r, locks: r.locks.filter((l) => l.id !== id) }));
    setSaveState("dirty");
  };

  const updateFinding = (id: string, patch: Partial<ReportDraft["findings"][number]>) => {
    setRep((r) => ({ ...r, findings: r.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));
    setSaveState("dirty");
  };
  const addFinding = () => {
    setRep((r) => ({ ...r, findings: [...r.findings, emptyFinding()] }));
    setSaveState("dirty");
  };
  const delFinding = (id: string) => {
    setRep((r) => ({ ...r, findings: r.findings.filter((f) => f.id !== id) }));
    setSaveState("dirty");
  };

  const handleAddReportPhoto = async (file: File) => {
    const photo = await uploadSitePhoto(rep.id, file);
    setRep((r) => ({ ...r, photos: [...r.photos, photo] }));
  };
  const handleRemoveReportPhoto = async (photo: Photo) => {
    setRep((r) => ({ ...r, photos: r.photos.filter((p) => p.id !== photo.id) }));
    await removeSitePhoto(photo);
  };
  const handleAddFindingPhoto = (findingId: string) => async (file: File) => {
    const photo = await uploadFindingPhoto(findingId, rep.id, file);
    setRep((r) => ({
      ...r,
      findings: r.findings.map((f) =>
        f.id === findingId ? { ...f, photos: [...f.photos, photo] } : f,
      ),
    }));
  };
  const handleRemoveFindingPhoto = (findingId: string) => async (photo: Photo) => {
    setRep((r) => ({
      ...r,
      findings: r.findings.map((f) =>
        f.id === findingId ? { ...f, photos: f.photos.filter((p) => p.id !== photo.id) } : f,
      ),
    }));
    await removeFindingPhoto(photo);
  };

  const copyText = async () => {
    const txt = buildText(rep);
    try {
      await navigator.clipboard.writeText(txt);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const findingCount = rep.findings.filter((f) => f.turbine).length;
  const safetyIssue =
    rep.safety.hazard.yn === "Có" || rep.safety.shutdown.yn === "Có" || rep.safety.major.yn === "Có";

  return (
    <div className="min-h-screen bg-slate-100 pb-24">
      <AppHeader title={`Báo cáo ${rep.date || ""}`} subtitle="Daily report" backHref="/" saveState={saveState} />
      <main className="px-3.5 py-3.5 space-y-3 max-w-md mx-auto">
        <div className="flex items-center gap-2.5 px-1 pb-0.5">
          <Image
            src="/images/logo-mbwind-icon.png"
            alt=""
            width={40}
            height={40}
            className="w-10 h-10 object-contain shrink-0"
          />
          <div className="min-w-0">
            <div className="font-bold text-[13.5px] leading-tight" style={{ color: NAVY }}>
              BÁO CÁO CÔNG VIỆC HẰNG NGÀY
            </div>
            <div className="text-[10.5px] text-slate-500 italic leading-tight">
              Daily Work Report — BIM Wind Farm EOW
            </div>
          </div>
        </div>

        <SectionCard title="Thông tin báo cáo" en="Report info" open={open.info} onToggle={() => toggle("info")}>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Ngày báo cáo" en="Report date">
              <input
                type="date"
                className={inputCls}
                value={rep.date}
                onChange={(e) => update({ date: e.target.value })}
              />
            </Field>
            <Field label="Ngày thứ" en="Day #">
              <input
                className={inputCls}
                placeholder="1–15"
                value={rep.dayNum}
                onChange={(e) => update({ dayNum: e.target.value })}
              />
            </Field>
            <Field label="Trụ kế hoạch" en="Planned turbine(s)">
              <input
                className={inputCls}
                placeholder="T05 + T06"
                value={rep.plannedTurbines}
                onChange={(e) => update({ plannedTurbines: e.target.value })}
              />
            </Field>
            <Field label="Trụ thực tế" en="Actual turbine(s)">
              <input
                className={inputCls}
                value={rep.actualTurbines}
                onChange={(e) => update({ actualTurbines: e.target.value })}
              />
            </Field>
            <Field label="Người lập" en="Prepared by">
              <input
                className={inputCls}
                value={rep.preparedBy}
                onChange={(e) => update({ preparedBy: e.target.value })}
              />
            </Field>
            <Field label="Đại diện OEM" en="OEM rep.">
              <input className={inputCls} value={rep.oemRep} onChange={(e) => update({ oemRep: e.target.value })} />
            </Field>
          </div>
          <Field label="Thời tiết" en="Weather">
            <input
              className={inputCls}
              placeholder="nắng, gió 8 m/s, không mưa"
              value={rep.weather}
              onChange={(e) => update({ weather: e.target.value })}
            />
          </Field>
          <Field label="Gửi tới" en="Sent to">
            <input className={inputCls} value={rep.sentTo} onChange={(e) => update({ sentTo: e.target.value })} />
          </Field>
        </SectionCard>

        <SectionCard
          title="1. Công việc từng trụ"
          en="Turbine work today"
          open={open.turbines}
          onToggle={() => toggle("turbines")}
          badge={<span className="text-[11px] text-white/70 font-mono">{rep.turbines.length}</span>}
        >
          {rep.turbines.map((t) => (
            <RowCard key={t.id} onDelete={() => delTurbine(t.id)}>
              <div className="grid grid-cols-2 gap-2 pr-6">
                <Field label="Trụ" en="Turbine">
                  <input
                    className={inputSm}
                    placeholder="T05"
                    value={t.turbine}
                    onChange={(e) => updateTurbine(t.id, { turbine: e.target.value })}
                  />
                </Field>
                <Field label="Cánh trong đã xong" en="Blade done">
                  <QuickPick
                    value={t.blade}
                    onChange={(v) => updateTurbine(t.id, { blade: v })}
                    options={["A", "A,B", "A,B,C"]}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-2 pr-6">
                {(["hub", "nacelle", "tower"] as const).map((k) => (
                  <Field key={k} label={k === "hub" ? "Hub" : k === "nacelle" ? "Nacelle" : "Tháp / Tower"}>
                    <QuickPick value={t[k]} onChange={(v) => updateTurbine(t.id, { [k]: v })} options={["Xong", "Dở"]} />
                  </Field>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 pr-6">
                <Field label="Drone (cánh ngoài)" en="Drone (ext. blade)">
                  <QuickPick value={t.drone} onChange={(v) => updateTurbine(t.id, { drone: v })} options={["Có", "Không"]} />
                </Field>
                <Field label="% hoàn thành" en="% done">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={inputSm}
                    placeholder="0-100"
                    value={t.pct}
                    onChange={(e) => updateTurbine(t.id, { pct: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Ghi chú" en="Notes">
                <input className={inputSm} value={t.notes} onChange={(e) => updateTurbine(t.id, { notes: e.target.value })} />
              </Field>
            </RowCard>
          ))}
          <AddButton label="Thêm trụ / Add turbine" onClick={addTurbine} />
        </SectionCard>

        <SectionCard
          title="2. Lịch khóa / mở rotor"
          en="Rotor lock/unlock schedule"
          open={open.locks}
          onToggle={() => toggle("locks")}
          badge={<span className="text-[11px] text-white/70 font-mono">{rep.locks.length}</span>}
        >
          {rep.locks.map((l) => {
            const d = delayMinutes(l.planned, l.actual);
            return (
              <RowCard key={l.id} onDelete={() => delLock(l.id)}>
                <div className="grid grid-cols-2 gap-2 pr-6">
                  <Field label="Trụ" en="Turbine">
                    <input
                      className={inputSm}
                      placeholder="T05"
                      value={l.turbine}
                      onChange={(e) => updateLock(l.id, { turbine: e.target.value })}
                    />
                  </Field>
                  <Field label="Vị trí cánh" en="Blade position">
                    <QuickPick value={l.pos} onChange={(v) => updateLock(l.id, { pos: v })} options={["A", "B", "C"]} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2 pr-6">
                  <Field label="Giờ KH" en="Planned time">
                    <input
                      type="time"
                      className={inputSm}
                      value={l.planned}
                      onChange={(e) => updateLock(l.id, { planned: e.target.value })}
                    />
                  </Field>
                  <Field label="Giờ thực tế" en="Actual time">
                    <input
                      type="time"
                      className={inputSm}
                      value={l.actual}
                      onChange={(e) => updateLock(l.id, { actual: e.target.value })}
                    />
                  </Field>
                </div>
                {d !== null && (
                  <div
                    className={`text-[11.5px] font-bold ${
                      d > 15 ? "text-red-600" : d > 0 ? "text-amber-600" : "text-emerald-600"
                    }`}
                  >
                    {d > 0 ? `Trễ / Delay: ${d} phút` : d < 0 ? `Sớm / Early: ${-d} phút` : "Đúng giờ / On time"}
                  </div>
                )}
                <Field label="Ghi chú" en="Notes">
                  <input className={inputSm} value={l.notes} onChange={(e) => updateLock(l.id, { notes: e.target.value })} />
                </Field>
              </RowCard>
            );
          })}
          <AddButton label="Thêm lần khóa / Add lock cycle" onClick={addLock} />
        </SectionCard>

        <SectionCard
          title="3. Phát hiện trong ngày"
          en="Findings today"
          open={open.findings}
          onToggle={() => toggle("findings")}
          tint={findingCount > 0 ? "#7A2E2E" : NAVY}
          badge={<span className="text-[11px] text-white/70 font-mono">{findingCount}</span>}
        >
          {rep.findings.map((f) => (
            <RowCard key={f.id} onDelete={() => delFinding(f.id)}>
              <Field label="Khu vực" en="Area">
                <input
                  className={inputSm}
                  placeholder="Cánh A ngoài"
                  value={f.area}
                  onChange={(e) => updateFinding(f.id, { area: e.target.value })}
                />
              </Field>
              <Field label="Mô tả phát hiện" en="Finding description">
                <textarea
                  rows={2}
                  className={inputSm}
                  placeholder="mòn mép vào, lộ composite đoạn 12,4–18,7m"
                  value={f.desc}
                  onChange={(e) => updateFinding(f.id, { desc: e.target.value })}
                />
              </Field>
              <Field label="Mức độ 1–5" en="Severity">
                <QuickPick
                  value={f.severity}
                  onChange={(v) => updateFinding(f.id, { severity: v })}
                  options={["1", "2", "3", "4", "5"]}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2 pr-6">
                <Field label="Ảnh" en="Photo ref.">
                  <input
                    className={inputSm}
                    placeholder="WTG05-BL-A-014"
                    value={f.photo}
                    onChange={(e) => updateFinding(f.id, { photo: e.target.value })}
                  />
                </Field>
                <Field label="Giờ báo" en="Time notified">
                  <input
                    type="time"
                    className={inputSm}
                    value={f.time}
                    onChange={(e) => updateFinding(f.id, { time: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Đã báo OEM" en="OEM notified">
                <QuickPick
                  value={f.oemNotified}
                  onChange={(v) => updateFinding(f.id, { oemNotified: v as YesNo })}
                  options={["Có", "Không"]}
                />
              </Field>
              <Field label="Ảnh bằng chứng" en="Evidence photos">
                <PhotoGrid
                  photos={f.photos || []}
                  onAdd={handleAddFindingPhoto(f.id)}
                  onRemove={handleRemoveFindingPhoto(f.id)}
                  onView={setLightbox}
                />
              </Field>
            </RowCard>
          ))}
          <AddButton label="Thêm phát hiện / Add finding" onClick={addFinding} />
        </SectionCard>

        <SectionCard
          title="Hình ảnh hiện trường"
          en="Site photos (general evidence)"
          open={open.photos}
          onToggle={() => toggle("photos")}
          badge={<span className="text-[11px] text-white/70 font-mono">{(rep.photos || []).length}</span>}
        >
          <p className="text-[11.5px] text-slate-500 -mt-1">
            Ảnh chung không gắn với lỗi cụ thể — điều kiện hiện trường, thời tiết, an toàn…
            <span className="block italic text-slate-400">General site evidence not tied to a specific finding.</span>
          </p>
          <PhotoGrid
            photos={rep.photos || []}
            onAdd={handleAddReportPhoto}
            onRemove={handleRemoveReportPhoto}
            onView={setLightbox}
          />
        </SectionCard>

        <SectionCard
          title="4. An toàn & sự cố"
          en="Safety & incidents — mandatory, Scope 3.1"
          open={open.safety}
          onToggle={() => toggle("safety")}
          tint={safetyIssue ? "#7A2E2E" : NAVY}
        >
          <Field label="Có nguy hiểm an toàn phát hiện trong ngày?" en="Any safety hazard found today?">
            <YesNoToggle value={rep.safety.hazard.yn} onChange={(v) => updateSafety("hazard", { yn: v })} />
          </Field>
          {rep.safety.hazard.yn === "Có" && (
            <textarea
              rows={2}
              className={inputSm}
              placeholder="mô tả và giờ đã báo site team"
              value={rep.safety.hazard.detail}
              onChange={(e) => updateSafety("hazard", { detail: e.target.value })}
            />
          )}
          <Field label="Có yêu cầu dừng máy nào cần thông báo?" en="Any shutdown requirement?">
            <YesNoToggle value={rep.safety.shutdown.yn} onChange={(v) => updateSafety("shutdown", { yn: v })} />
          </Field>
          {rep.safety.shutdown.yn === "Có" && (
            <textarea
              rows={2}
              className={inputSm}
              placeholder="trụ nào, lý do, đã báo ai lúc mấy giờ"
              value={rep.safety.shutdown.detail}
              onChange={(e) => updateSafety("shutdown", { detail: e.target.value })}
            />
          )}
          <Field label="Lỗi mức 4–5 (nặng) phát hiện hôm nay?" en="Any severity 4–5 defect today?">
            <YesNoToggle value={rep.safety.major.yn} onChange={(v) => updateSafety("major", { yn: v })} />
          </Field>
          {rep.safety.major.yn === "Có" && (
            <textarea
              rows={2}
              className={inputSm}
              placeholder="đã báo BIM và OEM ngay trong ngày chưa"
              value={rep.safety.major.detail}
              onChange={(e) => updateSafety("major", { detail: e.target.value })}
            />
          )}
        </SectionCard>

        <SectionCard title="5. So với kế hoạch" en="Progress vs plan" open={open.progress} onToggle={() => toggle("progress")}>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Trụ KH hôm nay" en="Planned today">
              <input
                className={inputSm}
                value={rep.progress.plannedToday}
                onChange={(e) => updateProgress({ plannedToday: e.target.value })}
              />
            </Field>
            <Field label="Trụ xong hôm nay" en="Actual done">
              <input
                className={inputSm}
                value={rep.progress.actualToday}
                onChange={(e) => updateProgress({ actualToday: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Lũy kế đã xong / 22" en="Cumulative done / 22">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="0"
                max="22"
                className={inputSm}
                value={rep.progress.cumulative}
                onChange={(e) => updateProgress({ cumulative: e.target.value })}
              />
              {cumulativeHint > 0 && (
                <button
                  type="button"
                  onClick={() => updateProgress({ cumulative: String(cumulativeHint) })}
                  className="shrink-0 text-[11px] font-semibold px-2.5 py-2 rounded-md bg-amber-50 border border-amber-300 text-amber-700"
                >
                  gợi ý {cumulativeHint}
                </button>
              )}
            </div>
          </Field>
          <Field label="Đúng tiến độ?" en="On schedule?">
            <QuickPick
              value={rep.progress.onSchedule}
              onChange={(v) => updateProgress({ onSchedule: v })}
              options={["Đúng tiến độ", "Chậm"]}
            />
          </Field>
        </SectionCard>

        <SectionCard title="6. Vướng mắc trong ngày" en="Issues today" open={open.issues} onToggle={() => toggle("issues")}>
          <textarea
            rows={3}
            className={inputCls}
            placeholder="gió chiều mạnh, mất khoảng 2 tiếng / robot lỗi cáp, đã thay phụ tùng dự phòng…"
            value={rep.issues}
            onChange={(e) => update({ issues: e.target.value })}
          />
        </SectionCard>

        <SectionCard title="7. Kế hoạch ngày mai" en="Tomorrow's plan" open={open.tomorrow} onToggle={() => toggle("tomorrow")}>
          <textarea
            rows={3}
            className={inputCls}
            placeholder="làm nốt T06 cánh C còn dở, sang T07 nếu kịp giờ, cần OEM có mặt 07:15"
            value={rep.tomorrow}
            onChange={(e) => update({ tomorrow: e.target.value })}
          />
        </SectionCard>

        <SectionCard title="Ký xác nhận" en="Sign-off" open={open.sign} onToggle={() => toggle("sign")}>
          <Field label="Người lập báo cáo (MB Wind)" en="Prepared by">
            <input className={inputCls} value={rep.signPrepared} onChange={(e) => update({ signPrepared: e.target.value })} />
          </Field>
          <Field label="Đại diện OEM (GE)" en="OEM rep.">
            <input className={inputCls} value={rep.signOEM} onChange={(e) => update({ signOEM: e.target.value })} />
          </Field>
          <Field label="Đại diện Site / BIM (nếu có mặt)" en="Site / BIM rep. (if present)">
            <input className={inputCls} value={rep.signSite} onChange={(e) => update({ signSite: e.target.value })} />
          </Field>
        </SectionCard>
      </main>

      <footer className="fixed bottom-0 inset-x-0 text-white z-20" style={{ background: NAVY_DARK }}>
        <div className="max-w-md mx-auto px-3.5 py-2.5 flex gap-2">
          <button
            onClick={copyText}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 font-bold text-[13px]"
            style={{ background: AMBER, color: NAVY_DARK }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Đã sao chép / Copied" : "Sao chép báo cáo / Copy"}
          </button>
          <Link
            href={`/reports/${rep.id}/print`}
            target="_blank"
            className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 px-3.5 font-bold text-[13px] border border-white/30 text-white"
          >
            <FileText size={16} />
            PDF
          </Link>
        </div>
      </footer>

      <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}
