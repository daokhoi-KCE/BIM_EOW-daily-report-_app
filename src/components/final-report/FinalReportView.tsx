import Image from "next/image";
import type { FinalReportData } from "@/lib/final-report";
import { NAVY, AMBER } from "@/lib/theme";
import { SectionTitle, InfoRow } from "@/components/print/shared";
import {
  PROJECT,
  INSPECTORS,
  STANDARDS,
  MANUALS,
  SEVERITY_SCALE,
  DOCUMENT_CLASSIFICATION,
  buildDocumentRef,
} from "@/lib/project-info";
import DocumentFrontMatter from "@/components/final-report/DocumentFrontMatter";
import SectionFindings, { sectionAnchorId } from "@/components/final-report/SectionFindings";
import FindingsMatrix from "@/components/final-report/FindingsMatrix";
import TurbineSection, { turbineAnchorId } from "@/components/final-report/TurbineSection";

const ISSUE = "A";

function StatCard({
  label,
  labelVi,
  value,
  tone,
}: {
  label: string;
  labelVi: string;
  value: string | number;
  tone?: "red" | "amber" | "emerald";
}) {
  const toneColor =
    tone === "red" ? "#B91C1C" : tone === "amber" ? "#B45309" : tone === "emerald" ? "#047857" : NAVY;
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

function TocLine({ href, no, en, vi, page }: { href: string; no: string; en: string; vi?: string; page?: string }) {
  return (
    <a href={href} className="flex items-baseline gap-2 py-[3px] group">
      <span className="text-[12.5px] text-slate-800 group-hover:underline whitespace-nowrap">
        {no} {en}
      </span>
      {vi && <span className="text-[10.5px] italic text-slate-400 whitespace-nowrap">/ {vi}</span>}
      <span className="flex-1 border-b border-dotted border-slate-300 translate-y-[-3px]" />
      {page && <span className="text-[11.5px] text-slate-500 tabular-nums">{page}</span>}
    </a>
  );
}

export default function FinalReportView({ data }: { data: FinalReportData }) {
  const { turbines, totals, sections } = data;
  const generatedAt = new Date().toISOString().slice(0, 10);
  const safetyCount = data.safetyFlags.length;
  const multiTurbine = turbines.length > 1;
  const docRef = buildDocumentRef(data.dateFrom, data.dateTo, turbines.length);
  const scopeLabel = multiTurbine ? `${turbines.length} WTG` : turbines[0]?.turbine ?? "—";
  const sectionsWithFindings = sections.filter((s) => s.findings.length > 0);

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-900 px-6 py-6 print:px-0 print:py-0">
      {/* ── Dòng đầu trang, lặp lại kiểu tài liệu kiểm định ────────────── */}
      <div className="flex items-start justify-between gap-4 text-[10px] text-slate-500 pb-1.5 border-b border-slate-300">
        <div>
          <div className="font-semibold text-slate-700">
            {PROJECT.siteName} — {PROJECT.inspectionType} — {scopeLabel}
          </div>
          <div>Ref. No.: {docRef}</div>
        </div>
        <div className="text-right whitespace-nowrap">
          <div>Issue: {ISSUE}</div>
          <div>Status: Final</div>
        </div>
      </div>

      {/* ── Bìa ───────────────────────────────────────────────────────── */}
      <div className="pt-4 pb-3 mb-1" style={{ borderBottom: `4px solid ${NAVY}` }}>
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
              End-of-Warranty Visual Inspection Report
            </h1>
            <div className="text-[12px] italic text-slate-500 leading-tight">
              Báo cáo kiểm tra trực quan hết hạn bảo hành
            </div>
            <div className="text-[12.5px] text-slate-600 mt-0.5">
              {PROJECT.siteName} — {scopeLabel} × {PROJECT.turbineModel}
            </div>
          </div>
        </div>
        <div className="mt-2 inline-block text-[10.5px] font-bold px-2 py-0.5 rounded" style={{ background: NAVY, color: "white" }}>
          {DOCUMENT_CLASSIFICATION}
        </div>
      </div>
      <div className="h-[3px] mb-4" style={{ background: AMBER }} />

      <DocumentFrontMatter issue={ISSUE} issueDate={generatedAt} reportCount={totals.reports} />

      {/* ── Mục lục ───────────────────────────────────────────────────── */}
      <SectionTitle en="Table of content" vi="Mục lục" />
      <div className="avoid-break">
        <TocLine href="#s1-introduction" no="1." en="Introduction" vi="Giới thiệu" />
        <TocLine href="#s2-reference" no="2." en="Reference documents" vi="Tài liệu tham chiếu" />
        <div className="pl-5">
          <TocLine href="#s2-reference" no="2.1" en="Standards" vi="Tiêu chuẩn" />
          <TocLine href="#s2-reference" no="2.2" en="Manuals and documentation" vi="Tài liệu kỹ thuật" />
        </div>
        <TocLine href="#s3-information" no="3." en="Information" vi="Thông tin" />
        <div className="pl-5">
          <TocLine href="#s3-information" no="3.1" en="Site information" vi="Thông tin công trường" />
          <TocLine href="#s3-information" no="3.2" en="Turbine information" vi="Thông tin tuabin" />
        </div>
        <TocLine href="#s4-summary" no="4." en="Summary of the main findings" vi="Tóm tắt phát hiện chính" />
        <div className="pl-5">
          <TocLine href="#s4-summary" no="4.1" en="Summary" vi="Tóm tắt" />
          <TocLine href="#findings-matrix" no="4.2" en="Findings matrix" vi="Ma trận phát hiện" />
        </div>
        <TocLine href="#s5-main-findings" no="5." en="Main findings" vi="Chi tiết phát hiện" />
        <div className="pl-5">
          {sections.map((g) => (
            <TocLine
              key={g.section.id}
              href={`#${sectionAnchorId(g.section.id)}`}
              no={g.section.no}
              en={g.section.en}
              page={String(g.findings.length)}
            />
          ))}
        </div>
        {multiTurbine && (
          <>
            <TocLine href="#s6-turbine-detail" no="6." en="Turbine detail" vi="Chi tiết từng tuabin" />
            <div className="pl-5 grid grid-cols-2 gap-x-6">
              {turbines.map((t) => (
                <TocLine
                  key={t.turbine}
                  href={`#${turbineAnchorId(t.turbine)}`}
                  no=""
                  en={t.turbine}
                  page={String(t.findings.length)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── 1. Introduction ───────────────────────────────────────────── */}
      <div id="s1-introduction">
        <SectionTitle en="1. Introduction" vi="Giới thiệu" />
      </div>
      <p className="text-[13.5px] leading-relaxed text-justify">
        Dự án <b>{PROJECT.siteName}</b> do <b>{PROJECT.owner}</b> làm chủ đầu tư, gồm{" "}
        {PROJECT.totalTurbines} tuabin gió <b>{PROJECT.turbineModel}</b> của {PROJECT.oem}. Khi các
        tuabin đến hạn kết thúc thời gian bảo hành, chủ đầu tư tổ chức đợt kiểm tra trực quan
        End-of-Warranty (EOW) nhằm ghi nhận đầy đủ tình trạng thiết bị trước thời điểm chuyển giao
        trách nhiệm bảo trì từ nhà sản xuất sang chủ đầu tư.
      </p>
      <p className="text-[13.5px] leading-relaxed text-justify mt-2">
        Báo cáo này tổng hợp <b>{totals.reports}</b> báo cáo kiểm tra hằng ngày lập từ{" "}
        <b>{data.dateFrom || "—"}</b> đến <b>{data.dateTo || "—"}</b>, bao phủ{" "}
        <b>{totals.turbines}</b> tuabin với tổng cộng <b>{totals.findings}</b> phát hiện và{" "}
        <b>{totals.photos}</b> ảnh hiện trường. Toàn bộ phát hiện được sắp xếp lại theo cụm thiết bị
        (mục 5) để tiện đối chiếu giữa các trụ, và giữ nguyên cách trình bày theo từng trụ ở mục
        cuối. Công tác kiểm tra do{" "}
        <b>{INSPECTORS.map((p) => p.name).join(" và ")}</b> thực hiện tại hiện trường.
      </p>
      <p className="text-[11.5px] italic text-slate-500 leading-relaxed text-justify mt-2">
        This report consolidates {totals.reports} daily inspection reports issued between{" "}
        {data.dateFrom || "—"} and {data.dateTo || "—"}, covering {totals.turbines} turbines with a
        total of {totals.findings} findings and {totals.photos} site photographs, recorded during the
        End-of-Warranty visual inspection of the {PROJECT.siteName}. Findings are regrouped by
        component and location in Section 5 to allow comparison across turbines; the per-turbine view
        is retained in the final section.
      </p>

      {/* ── 2. Reference documents ────────────────────────────────────── */}
      <div id="s2-reference">
        <SectionTitle en="2. Reference documents" vi="Tài liệu tham chiếu" />
      </div>
      <h4 className="text-[13px] font-bold text-slate-700 mb-1.5">
        2.1 Standards <span className="italic font-normal text-slate-400">/ Tiêu chuẩn</span>
      </h4>
      <table className="w-full border-collapse text-[12.5px] avoid-break mb-4">
        <tbody>
          {STANDARDS.map((s) => (
            <tr key={s.ref}>
              <td className="border-b border-slate-200 py-1.5 pr-3 align-top font-semibold whitespace-nowrap" style={{ color: NAVY }}>
                {s.ref}
              </td>
              <td className="border-b border-slate-200 py-1.5 align-top text-slate-700">{s.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4 className="text-[13px] font-bold text-slate-700 mb-1.5">
        2.2 Manuals and documentation{" "}
        <span className="italic font-normal text-slate-400">/ Tài liệu kỹ thuật</span>
      </h4>
      <table className="w-full border-collapse text-[12.5px] avoid-break">
        <tbody>
          {MANUALS.map((m) => (
            <tr key={m.ref}>
              <td className="border-b border-slate-200 py-1.5 pr-3 align-top font-semibold whitespace-nowrap" style={{ color: NAVY }}>
                {m.ref}
              </td>
              <td className="border-b border-slate-200 py-1.5 align-top text-slate-700">{m.title}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── 3. Information ────────────────────────────────────────────── */}
      <div id="s3-information">
        <SectionTitle en="3. Information" vi="Thông tin" />
      </div>
      <h4 className="text-[13px] font-bold text-slate-700 mb-1.5">
        3.1 Site information <span className="italic font-normal text-slate-400">/ Thông tin công trường</span>
      </h4>
      <div className="grid grid-cols-4 gap-3.5 avoid-break mb-4">
        <InfoRow en="Site" vi="Công trường" value={PROJECT.siteName} />
        <InfoRow en="Owner" vi="Chủ đầu tư" value={PROJECT.owner} />
        <InfoRow en="Location" vi="Địa điểm" value={PROJECT.location} />
        <InfoRow en="Inspection type" vi="Loại kiểm tra" value="EOW visual" />
        <InfoRow
          en="Period"
          vi="Giai đoạn"
          value={data.dateFrom && data.dateTo ? `${data.dateFrom} → ${data.dateTo}` : ""}
        />
        <InfoRow en="Daily reports" vi="Số báo cáo ngày" value={String(totals.reports)} />
        <InfoRow en="Inspectors" vi="Kỹ sư kiểm tra" value={INSPECTORS.map((p) => p.name).join(", ")} />
        <InfoRow en="Issued" vi="Ngày phát hành" value={generatedAt} />
      </div>
      <h4 className="text-[13px] font-bold text-slate-700 mb-1.5">
        3.2 Turbine information <span className="italic font-normal text-slate-400">/ Thông tin tuabin</span>
      </h4>
      <div className="grid grid-cols-4 gap-3.5 avoid-break">
        <InfoRow en="OEM" vi="Nhà sản xuất" value={PROJECT.oem} />
        <InfoRow en="Model" vi="Model" value={PROJECT.turbineModel} />
        <InfoRow en="Turbines in scope" vi="Số trụ khảo sát" value={String(totals.turbines)} />
        <InfoRow
          en="Fleet size"
          vi="Tổng số trụ dự án"
          value={String(PROJECT.totalTurbines)}
        />
      </div>

      {/* ── 4. Summary ────────────────────────────────────────────────── */}
      <div id="s4-summary">
        <SectionTitle en="4. Summary of the main findings" vi="Tóm tắt phát hiện chính" />
      </div>
      <h4 className="text-[13px] font-bold text-slate-700 mb-2">
        4.1 Summary <span className="italic font-normal text-slate-400">/ Tóm tắt</span>
      </h4>
      <div className="grid grid-cols-4 gap-2.5 avoid-break">
        <StatCard label="Turbines" labelVi="Tuabin" value={totals.turbines} />
        <StatCard
          label="Completed"
          labelVi="Đã xong"
          value={`${totals.turbinesCompleted}/${PROJECT.totalTurbines}`}
          tone="emerald"
        />
        <StatCard label="Findings" labelVi="Phát hiện" value={totals.findings} />
        <StatCard
          label="Critical"
          labelVi="Nghiêm trọng"
          value={totals.critical}
          tone={totals.critical > 0 ? "red" : undefined}
        />
      </div>
      <div className="grid grid-cols-4 gap-2.5 avoid-break mt-2.5">
        <StatCard label="Medium" labelVi="Trung bình" value={totals.medium} tone={totals.medium > 0 ? "amber" : undefined} />
        <StatCard label="Low" labelVi="Thấp" value={totals.low} tone="emerald" />
        <StatCard label="Photos" labelVi="Ảnh" value={totals.photos} />
        <StatCard
          label="Safety flags"
          labelVi="Sự cố an toàn"
          value={safetyCount}
          tone={safetyCount > 0 ? "red" : "emerald"}
        />
      </div>

      <h4 className="text-[13px] font-bold text-slate-700 mt-5 mb-1.5">
        Severity scale <span className="italic font-normal text-slate-400">/ Thang mức độ</span>
      </h4>
      <table className="w-full border-collapse text-[12px] avoid-break">
        <tbody>
          {SEVERITY_SCALE.map((s) => (
            <tr key={s.level}>
              <td className="border-b border-slate-200 py-1 pr-3 align-top font-bold whitespace-nowrap" style={{ color: NAVY }}>
                M{s.level}
              </td>
              <td className="border-b border-slate-200 py-1 align-top text-slate-700">
                {s.en} <span className="italic text-slate-400">/ {s.vi}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 className="text-[13px] font-bold text-slate-700 mt-5 mb-1.5">
        Findings by section <span className="italic font-normal text-slate-400">/ Phân bố theo hạng mục</span>
      </h4>
      <table className="w-full border-collapse text-[12px] avoid-break">
        <thead>
          <tr style={{ background: "rgba(31,53,82,0.06)" }}>
            <th className="text-left py-1.5 px-2 border-b-2 text-[11.5px] font-bold uppercase" style={{ borderColor: NAVY, color: NAVY }}>
              Section / Hạng mục
            </th>
            {["Total", "M4-5", "M3", "M1-2"].map((h) => (
              <th
                key={h}
                className="text-right py-1.5 px-2 border-b-2 text-[11.5px] font-bold uppercase whitespace-nowrap"
                style={{ borderColor: NAVY, color: NAVY }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sectionsWithFindings.map((g) => (
            <tr key={g.section.id}>
              <td className="border-b border-slate-200 py-1 px-2">
                <a href={`#${sectionAnchorId(g.section.id)}`} className="hover:underline">
                  {g.section.no} {g.section.en}
                </a>
              </td>
              <td className="border-b border-slate-200 py-1 px-2 text-right font-semibold tabular-nums">
                {g.findings.length}
              </td>
              <td className="border-b border-slate-200 py-1 px-2 text-right tabular-nums text-red-700 font-semibold">
                {g.critical || ""}
              </td>
              <td className="border-b border-slate-200 py-1 px-2 text-right tabular-nums text-amber-700">
                {g.medium || ""}
              </td>
              <td className="border-b border-slate-200 py-1 px-2 text-right tabular-nums text-slate-500">
                {g.low || ""}
              </td>
            </tr>
          ))}
          <tr style={{ background: "rgba(31,53,82,0.06)" }}>
            <td className="py-1.5 px-2 font-bold" style={{ color: NAVY }}>
              Total / Tổng cộng
            </td>
            <td className="py-1.5 px-2 text-right font-extrabold tabular-nums">{totals.findings}</td>
            <td className="py-1.5 px-2 text-right font-extrabold tabular-nums text-red-700">{totals.critical}</td>
            <td className="py-1.5 px-2 text-right font-extrabold tabular-nums text-amber-700">{totals.medium}</td>
            <td className="py-1.5 px-2 text-right font-extrabold tabular-nums text-slate-500">{totals.low}</td>
          </tr>
        </tbody>
      </table>

      {safetyCount > 0 && (
        <div className="avoid-break rounded-md border-2 border-red-600 bg-red-50 px-3 py-2.5 mt-3">
          <div className="text-[12.5px] font-bold text-red-700 mb-1">
            ⚠ {safetyCount} ngày có vấn đề an toàn{" "}
            <span className="font-normal italic">/ day(s) with safety issue(s)</span>
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

      {multiTurbine && (
        <>
          <h4 id="findings-matrix" className="text-[13px] font-bold text-slate-700 mt-5 mb-1.5 scroll-mt-16">
            4.2 Findings matrix{" "}
            <span className="italic font-normal text-slate-400">/ Ma trận phát hiện</span>
          </h4>
          <FindingsMatrix turbines={turbines} />
        </>
      )}

      {/* ── 5. Main findings ──────────────────────────────────────────── */}
      <div id="s5-main-findings">
        <SectionTitle en="5. Main findings" vi="Chi tiết phát hiện theo hạng mục" />
      </div>
      {sections.map((g) => (
        <SectionFindings key={g.section.id} group={g} multiTurbine={multiTurbine} />
      ))}

      {/* ── 6. Turbine detail ─────────────────────────────────────────── */}
      {multiTurbine && (
        <>
          <div id="s6-turbine-detail">
            <SectionTitle en="6. Turbine detail" vi="Chi tiết từng tuabin" />
          </div>
          {turbines.map((t) => (
            <TurbineSection key={t.turbine} t={t} />
          ))}
        </>
      )}

      <p className="text-[10.5px] text-slate-400 mt-8 pt-2 border-t border-slate-200">
        {docRef} · Issue {ISSUE} · {DOCUMENT_CLASSIFICATION} · Tổng hợp tự động từ {totals.reports}{" "}
        báo cáo hằng ngày ({data.dateFrom} → {data.dateTo}).{" "}
        <span className="italic">Auto-generated from {totals.reports} daily reports.</span>
      </p>
    </div>
  );
}
