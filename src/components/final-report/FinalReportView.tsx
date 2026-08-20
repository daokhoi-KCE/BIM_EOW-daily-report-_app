import Image from "next/image";
import type { FinalReportData } from "@/lib/final-report";
import { NAVY, AMBER } from "@/lib/theme";
import { SectionTitle, InfoRow } from "@/components/print/shared";
import FindingsMatrix from "@/components/final-report/FindingsMatrix";
import TurbineSection, { turbineAnchorId } from "@/components/final-report/TurbineSection";

function StatCard({ label, labelVi, value, tone }: { label: string; labelVi: string; value: string | number; tone?: "red" | "amber" | "emerald" }) {
  const toneColor = tone === "red" ? "#B91C1C" : tone === "amber" ? "#B45309" : tone === "emerald" ? "#047857" : NAVY;
  return (
    <div
      className="avoid-break rounded-md p-3 text-center"
      style={{ background: "rgba(31,53,82,0.05)", border: "1px solid rgba(31,53,82,0.15)" }}
    >
      <div className="text-[22px] font-extrabold leading-tight" style={{ color: toneColor }}>
        {value}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-600 leading-tight mt-0.5">
        {label}
      </div>
      <div className="text-[9.5px] italic text-slate-400 leading-tight">{labelVi}</div>
    </div>
  );
}

export default function FinalReportView({ data }: { data: FinalReportData }) {
  const { turbines, totals } = data;
  const generatedAt = new Date().toISOString().slice(0, 10);
  const safetyCount = data.safetyFlags.length;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-900 px-6 py-6 print:px-0 print:py-0">
      {/* ── Cover / Intro ────────────────────────────────────────── */}
      <div className="pb-3 mb-1" style={{ borderBottom: `4px solid ${NAVY}` }}>
        <div className="flex items-center gap-4">
          <Image
            src="/images/logo-mbwind-horizontal.png"
            alt="MB WIND"
            width={220}
            height={75}
            className="h-12 w-auto object-contain"
          />
          <div className="flex-1">
            <h1 className="text-[22px] font-extrabold uppercase leading-tight" style={{ color: NAVY }}>
              Consolidated EOW Inspection Report
            </h1>
            <div className="text-[12px] italic text-slate-500 leading-tight">
              Báo cáo tổng hợp — End-of-Warranty Inspection
            </div>
            <div className="text-[12.5px] text-slate-600 mt-0.5">
              BIM Wind Farm — 22 x GE Cypress 5.5-158
            </div>
          </div>
        </div>
      </div>
      <div className="h-[3px] mb-4" style={{ background: AMBER }} />

      <SectionTitle en="1. Introduction" vi="Giới thiệu" />
      <p className="text-[13.5px] leading-relaxed">
        Báo cáo này tổng hợp {totals.reports} báo cáo công việc hằng ngày từ{" "}
        <b>{data.dateFrom || "—"}</b> đến <b>{data.dateTo || "—"}</b>, bao phủ {totals.turbines} tuabin gió
        thuộc dự án BIM Wind Farm — EOW Inspection. Mục tiêu là cung cấp một bức tranh tổng quan về tiến độ
        thi công, lịch khóa/mở rotor, và toàn bộ các phát hiện (findings) được ghi nhận trong quá trình kiểm
        tra hết bảo hành (End-of-Warranty), làm cơ sở trao đổi giữa BIM Wind Power JSC, OEM (GE) và đội thi
        công tại hiện trường.
      </p>
      <p className="text-[11.5px] italic text-slate-500 leading-relaxed mt-2">
        This report consolidates {totals.reports} daily work reports from <b>{data.dateFrom || "—"}</b> to{" "}
        <b>{data.dateTo || "—"}</b>, covering {totals.turbines} wind turbines under the BIM Wind Farm EOW
        Inspection project. It summarizes construction progress, rotor lock/unlock schedules, and every
        finding recorded during the End-of-Warranty inspection, as a shared reference for BIM Wind Power
        JSC, the OEM (GE) and the on-site crew.
      </p>

      <div className="grid grid-cols-4 gap-3.5 avoid-break mt-4">
        <InfoRow en="Period" vi="Giai đoạn" value={data.dateFrom && data.dateTo ? `${data.dateFrom} → ${data.dateTo}` : ""} />
        <InfoRow en="Reports" vi="Số báo cáo" value={String(totals.reports)} />
        <InfoRow en="Turbines covered" vi="Số tuabin" value={String(totals.turbines)} />
        <InfoRow en="Generated" vi="Ngày lập" value={generatedAt} />
        <InfoRow en="Prepared by" vi="Người lập" value={data.preparedBy.join(", ")} />
        <InfoRow en="OEM rep." vi="Đại diện OEM" value={data.oemReps.join(", ")} />
        <InfoRow en="Cumulative done" vi="Lũy kế hoàn thành" value={`${totals.turbinesCompleted}/22`} />
        <InfoRow en="Total photos" vi="Tổng ảnh" value={String(totals.photos)} />
      </div>

      {/* ── Table of contents ───────────────────────────────────── */}
      <SectionTitle en="2. Table of contents" vi="Mục lục" />
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px] avoid-break">
        <a href="#overview" className="text-slate-700 hover:underline">
          1. Giới thiệu &amp; tổng quan <span className="italic text-slate-400">/ Introduction &amp; overview</span>
        </a>
        <a href="#findings-matrix" className="text-slate-700 hover:underline">
          2. Ma trận phát hiện <span className="italic text-slate-400">/ Findings matrix</span>
        </a>
        <div className="col-span-2 mt-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          3. Chi tiết từng tuabin <span className="italic font-normal normal-case text-slate-400">/ Turbine detail</span>
        </div>
        {turbines.map((t) => (
          <a
            key={t.turbine}
            href={`#${turbineAnchorId(t.turbine)}`}
            className="flex items-center justify-between gap-2 text-slate-700 hover:underline border-b border-dotted border-slate-200 py-0.5"
          >
            <span>{t.turbine}</span>
            <span className="text-[11px] text-slate-400 shrink-0">
              {t.latestPct !== null ? `${t.latestPct}%` : "—"} · {t.findings.length} phát hiện
            </span>
          </a>
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────── */}
      <SectionTitle en="Overview" vi="Tổng quan" />
      <div id="overview" className="grid grid-cols-4 gap-2.5 avoid-break">
        <StatCard label="Turbines" labelVi="Tuabin" value={totals.turbines} />
        <StatCard label="Completed" labelVi="Đã xong" value={`${totals.turbinesCompleted}/22`} tone="emerald" />
        <StatCard label="Findings" labelVi="Phát hiện" value={totals.findings} />
        <StatCard label="Critical" labelVi="Nghiêm trọng" value={totals.critical} tone={totals.critical > 0 ? "red" : undefined} />
      </div>
      <div className="grid grid-cols-4 gap-2.5 avoid-break mt-2.5">
        <StatCard label="Medium" labelVi="Trung bình" value={totals.medium} tone={totals.medium > 0 ? "amber" : undefined} />
        <StatCard label="Low" labelVi="Thấp" value={totals.low} tone="emerald" />
        <StatCard label="Photos" labelVi="Ảnh" value={totals.photos} />
        <StatCard label="Safety flags" labelVi="Sự cố an toàn" value={safetyCount} tone={safetyCount > 0 ? "red" : "emerald"} />
      </div>

      {safetyCount > 0 && (
        <div className="avoid-break rounded-md border-2 border-red-600 bg-red-50 px-3 py-2.5 mt-3">
          <div className="text-[12.5px] font-bold text-red-700 mb-1">
            ⚠ {safetyCount} ngày có vấn đề an toàn <span className="font-normal italic">/ day(s) with safety issue(s)</span>
          </div>
          <div className="text-[12px] text-red-800 flex flex-wrap gap-x-3 gap-y-0.5">
            {data.safetyFlags.map((s) => (
              <span key={s.date}>
                {s.date}
                {s.hazard && " · nguy hiểm"}
                {s.shutdown && " · dừng máy"}
                {s.major && " · lỗi M4-5"}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Findings matrix ─────────────────────────────────────── */}
      <div id="findings-matrix">
        <SectionTitle en="3. Findings matrix — all turbines" vi="Ma trận phát hiện — tất cả tuabin" />
      </div>
      <FindingsMatrix turbines={turbines} />

      {/* ── Per-turbine detail ───────────────────────────────────── */}
      <SectionTitle en="4. Turbine detail" vi="Chi tiết từng tuabin" />
      {turbines.length === 0 ? (
        <p className="text-[12px] text-slate-400 italic">No data / Không có dữ liệu</p>
      ) : (
        turbines.map((t) => <TurbineSection key={t.turbine} t={t} />)
      )}

      <p className="text-[10.5px] text-slate-400 mt-8">
        Tổng hợp tự động từ {totals.reports} báo cáo hằng ngày ({data.dateFrom} → {data.dateTo}).{" "}
        <span className="italic">Auto-generated from {totals.reports} daily reports.</span>
      </p>
    </div>
  );
}
