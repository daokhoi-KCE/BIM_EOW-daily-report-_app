import Image from "next/image";
import type { FinalReportData } from "@/lib/final-report";
import { NAVY, AMBER } from "@/lib/theme";
import { SectionTitle, InfoRow } from "@/components/print/shared";
import { formatDateDMY } from "@/lib/utils";
import {
  PROJECT,
  INCLUDE_FULL_FINDINGS_MATRIX,
  INSPECTION_PERIOD,
  INSPECTORS,
  STANDARDS,
  SEVERITY_SCALE,
  DOCUMENT_CLASSIFICATION,
  buildDocumentRef,
} from "@/lib/project-info";
import DocumentFrontMatter from "@/components/final-report/DocumentFrontMatter";
import SectionFindings, { sectionAnchorId } from "@/components/final-report/SectionFindings";
import DefectMatrix from "@/components/final-report/DefectMatrix";
import FindingsMatrix from "@/components/final-report/FindingsMatrix";
import FleetMainDefects from "@/components/final-report/FleetMainDefects";
import TurbineSection, { turbineAnchorId } from "@/components/final-report/TurbineSection";

const ISSUE = "A";

/**
 * Mã commit đang chạy, để biết trang đang xem là bản nào.
 *
 * Bản production và bản preview của một nhánh dùng chung cơ sở dữ liệu nên
 * nhìn dữ liệu thì không phân biệt được; mở nhầm bản là chuyện rất dễ xảy ra.
 * Vercel đặt sẵn biến này cho mọi lần build.
 */
const BUILD_REF = (process.env.VERCEL_GIT_COMMIT_SHA ?? "local").slice(0, 7);

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

/**
 * Bản final.
 *
 * `data` là phạm vi của bản in — thường là một trụ, vì khách hàng theo dõi
 * theo từng trụ. `fleet` là dữ liệu của cả 22 trụ: phần tóm tắt và các ma
 * trận ở mục 4 luôn lấy từ đây, kể cả trong bản một trụ, để người đọc thấy
 * trụ của mình đứng ở đâu so với toàn công trường. Mục 5 trở đi chỉ nói về
 * phạm vi của `data`.
 *
 * Khi không truyền `fleet` (bản in cả dự án) thì hai phần trùng nhau.
 */
export default function FinalReportView({
  data,
  fleet,
}: {
  data: FinalReportData;
  fleet?: FinalReportData;
}) {
  const site = fleet ?? data;
  const { turbines, totals, sections } = data;
  const generatedAt = new Date().toISOString().slice(0, 10);
  const safetyCount = site.safetyFlags.length;
  const multiTurbine = turbines.length > 1;
  const docRef = buildDocumentRef(data.dateFrom, data.dateTo, turbines.length);
  const scopeLabel = multiTurbine ? `${turbines.length} WTG` : turbines[0]?.turbine ?? "—";
  const sectionsWithFindings = site.sections.filter((s) => s.findings.length > 0);
  // Trụ mà bản in này nói tới — đánh dấu trong các bảng của cả dự án.
  const scopeTurbines = turbines.map((t) => t.turbine);
  const siteHasMore = site.turbines.length > turbines.length;
  const siteMulti = site.turbines.length > 1;
  // Số phát hiện của riêng phạm vi bản in, tra theo mục 5.x — dùng cho cột
  // cuối của bảng phân bố, để đối chiếu trụ này với cả dự án trên cùng dòng.
  const scopeBySection = new Map(sections.map((g) => [g.section.id, g.findings.length]));
  // Thời gian kiểm tra là mốc của cả đợt, không phải khoảng ngày của những
  // báo cáo đang chọn — bản một trụ chỉ có đúng một ngày.
  const periodFrom = formatDateDMY(INSPECTION_PERIOD.from);
  const periodTo = formatDateDMY(INSPECTION_PERIOD.to);
  const reportDates =
    data.dateFrom === data.dateTo
      ? formatDateDMY(data.dateFrom)
      : `${formatDateDMY(data.dateFrom)} → ${formatDateDMY(data.dateTo)}`;

  return (
    <div className="max-w-[800px] mx-auto bg-white text-slate-900 px-6 py-6 print:px-0 print:py-0">
      {/* ── Dải chẩn đoán ───────────────────────────────────────────────
          Đếm thẳng trên dữ liệu vừa lấy từ Supabase, trước mọi bước lọc và
          gom nhóm. Khi báo cáo trống, dải này cho biết dữ liệu chết ở đâu:
          lấy về đã rỗng, hay lấy được nhưng gom nhóm đánh rơi. Chỉ hiện
          trên màn hình, không in ra. */}
      {(() => {
        const rawFindings = data.reports.reduce((s, r) => s + r.findings.length, 0);
        const rawPhotos = data.reports.reduce(
          (s, r) => s + r.findings.reduce((n, f) => n + (f.photos?.length ?? 0), 0),
          0,
        );
        const signedPhotos = data.reports.reduce(
          (s, r) => s + r.findings.reduce((n, f) => n + (f.photos?.filter((p) => p.url).length ?? 0), 0),
          0,
        );
        const withTurbine = data.reports.reduce(
          (s, r) => s + r.findings.filter((f) => f.turbine.trim()).length,
          0,
        );
        // Hai nhóm bị loại có chủ đích, trừ ra trước khi so.
        const expected =
          rawFindings - data.excludedBladeFindings - data.excludedUnknownTurbine;
        const healthy = rawFindings > 0 && expected === totals.findings && signedPhotos === rawPhotos;
        return (
          <div
            className={`print-hide mb-3 rounded-md border px-3 py-2 text-[11.5px] leading-relaxed ${
              healthy ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-400 bg-amber-50 text-amber-900"
            }`}
          >
            <b>Chẩn đoán dữ liệu</b> (chỉ hiện trên màn hình, không in):{" "}
            {data.reports.length} báo cáo lấy được · {rawFindings} finding thô ·{" "}
            {withTurbine} finding tự khai tên trụ · {data.excludedBladeFindings} finding khảo sát
            cánh không in · {data.excludedUnknownTurbine} finding sai tên trụ không in ·{" "}
            {totals.findings} finding vào báo cáo ·{" "}
            {signedPhotos}/{rawPhotos} ảnh ký được URL · build {BUILD_REF}
            {rawFindings === 0 && (
              <div className="font-bold mt-1">
                → Không lấy được finding nào từ CSDL. Lỗi ở khâu truy vấn hoặc phân quyền, không phải
                ở phần gom nhóm.
              </div>
            )}
            {expected > 0 && totals.findings === 0 && (
              <div className="font-bold mt-1">
                → Lấy được finding nhưng gom nhóm đánh rơi hết. Lỗi ở bước xác định tên trụ.
              </div>
            )}
            {rawPhotos > 0 && signedPhotos < rawPhotos && (
              <div className="font-bold mt-1">
                → {rawPhotos - signedPhotos} ảnh không ký được URL. Lỗi ở Supabase Storage.
              </div>
            )}
          </div>
        );
      })()}

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
        <TocLine href="#s3-information" no="3." en="Information" vi="Thông tin" />
        <div className="pl-5">
          <TocLine href="#s3-information" no="3.1" en="Site information" vi="Thông tin công trường" />
          <TocLine href="#s3-information" no="3.2" en="Turbine information" vi="Thông tin tuabin" />
        </div>
        <TocLine
          href="#s4-summary"
          no="4."
          en="Summary of the main findings — all turbines"
          vi="Tóm tắt phát hiện chính — toàn dự án"
        />
        <div className="pl-5">
          <TocLine href="#s4-summary" no="4.1" en="Summary" vi="Tóm tắt" />
          {/* Phần so sánh giữa các trụ chỉ có nghĩa khi dự án có nhiều trụ —
              luôn in kể cả trong bản một trụ, vì đó là bối cảnh chung. */}
          {siteMulti && (
            <>
              <TocLine href="#main-defects" no="4.2" en="Main defects by turbine" vi="Lỗi chính theo trụ" />
              <TocLine href="#defect-matrix" no="4.3" en="Defect matrix" vi="Ma trận lỗi OK/NG" />
              {INCLUDE_FULL_FINDINGS_MATRIX && (
                <TocLine href="#findings-matrix" no="4.4" en="Findings matrix" vi="Ma trận phát hiện" />
              )}
            </>
          )}
        </div>
        <TocLine
          href="#s5-main-findings"
          no="5."
          en={`Main findings — ${scopeLabel}`}
          vi="Chi tiết phát hiện"
        />
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
        Đợt kiểm tra được thực hiện tại hiện trường từ <b>{periodFrom}</b> đến{" "}
        <b>{periodTo}</b>, gồm <b>{site.totals.reports}</b> báo cáo kiểm tra hằng ngày trên{" "}
        <b>{site.totals.turbines}</b> tuabin, ghi nhận <b>{site.totals.findings}</b> phát hiện và{" "}
        <b>{site.totals.photos}</b> ảnh hiện trường. Công tác kiểm tra do{" "}
        <b>{INSPECTORS.map((p) => p.name).join(" và ")}</b> thực hiện.
      </p>
      <p className="text-[13.5px] leading-relaxed text-justify mt-2">
        {siteHasMore ? (
          <>
            Bản báo cáo này dành riêng cho <b>{scopeLabel}</b> ({reportDates}), với{" "}
            <b>{totals.findings}</b> phát hiện và <b>{totals.photos}</b> ảnh. Mỗi tuabin có một bản
            final riêng để tiện theo dõi. <b>Mục 4</b> giữ phần tóm tắt và các ma trận tổng hợp của
            cả <b>{site.totals.turbines}</b> trụ, giúp đối chiếu {scopeLabel} với toàn công trường;{" "}
            <b>mục 5</b> trình bày chi tiết từng phát hiện của {scopeLabel} kèm ảnh, sắp xếp theo
            cụm thiết bị.
          </>
        ) : (
          <>
            Bản báo cáo này bao phủ <b>{totals.turbines}</b> tuabin ({reportDates}) với{" "}
            <b>{totals.findings}</b> phát hiện và <b>{totals.photos}</b> ảnh. <b>Mục 4</b> tóm tắt
            và đối chiếu giữa các trụ; <b>mục 5</b> trình bày chi tiết từng phát hiện kèm ảnh, sắp
            xếp theo cụm thiết bị; mục cuối giữ cách trình bày theo từng trụ.
          </>
        )}
      </p>
      <p className="text-[11.5px] italic text-slate-500 leading-relaxed text-justify mt-2">
        The End-of-Warranty visual inspection of the {PROJECT.siteName} was carried out on site
        between {periodFrom} and {periodTo}, covering {site.totals.turbines} turbines over{" "}
        {site.totals.reports} daily reports, with {site.totals.findings} findings and{" "}
        {site.totals.photos} site photographs.{" "}
        {siteHasMore
          ? `This volume covers ${scopeLabel} (${totals.findings} findings, ${totals.photos} photographs); one volume is issued per turbine. Section 4 carries the site-wide summary and matrices for all ${site.totals.turbines} turbines so that ${scopeLabel} can be read in context, and Section 5 details every finding of ${scopeLabel} with photographs, regrouped by component and location.`
          : `Section 4 summarises and compares the turbines, Section 5 details every finding with photographs, regrouped by component and location, and the final section retains the per-turbine view.`}
      </p>

      {/* ── 2. Reference documents ────────────────────────────────────── */}
      <div id="s2-reference">
        <SectionTitle en="2. Reference documents" vi="Tài liệu tham chiếu" />
      </div>
      <table className="w-full border-collapse text-[12.5px] avoid-break">
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
        <InfoRow en="Inspection period" vi="Thời gian kiểm tra" value={`${periodFrom} → ${periodTo}`} />
        <InfoRow en="Daily reports" vi="Số báo cáo ngày" value={String(site.totals.reports)} />
        <InfoRow en="Inspectors" vi="Kỹ sư kiểm tra" value={INSPECTORS.map((p) => p.name).join(", ")} />
        <InfoRow en="Issued" vi="Ngày phát hành" value={generatedAt} />
        <InfoRow en="Report scope" vi="Phạm vi bản này" value={`${scopeLabel} — ${reportDates}`} />
      </div>
      <h4 className="text-[13px] font-bold text-slate-700 mb-1.5">
        3.2 Turbine information <span className="italic font-normal text-slate-400">/ Thông tin tuabin</span>
      </h4>
      <div className="grid grid-cols-4 gap-3.5 avoid-break">
        <InfoRow en="OEM" vi="Nhà sản xuất" value={PROJECT.oem} />
        <InfoRow en="Model" vi="Model" value={PROJECT.turbineModel} />
        <InfoRow en="Turbines surveyed" vi="Số trụ đã khảo sát" value={String(site.totals.turbines)} />
        <InfoRow
          en="Fleet size"
          vi="Tổng số trụ dự án"
          value={String(PROJECT.totalTurbines)}
        />
      </div>

      {/* ── 4. Summary ────────────────────────────────────────────────── */}
      <div id="s4-summary">
        <SectionTitle
          en="4. Summary of the main findings — all turbines"
          vi="Tóm tắt phát hiện chính — toàn dự án"
        />
      </div>
      <h4 className="text-[13px] font-bold text-slate-700 mb-2">
        4.1 Summary <span className="italic font-normal text-slate-400">/ Tóm tắt — số liệu của cả dự án</span>
      </h4>
      <div className="grid grid-cols-4 gap-2.5 avoid-break">
        <StatCard label="Turbines" labelVi="Tuabin" value={site.totals.turbines} />
        <StatCard
          label="Completed"
          labelVi="Đã xong"
          value={`${site.totals.turbinesCompleted}/${PROJECT.totalTurbines}`}
          tone="emerald"
        />
        <StatCard label="Findings" labelVi="Phát hiện" value={site.totals.findings} />
        <StatCard
          label="Critical"
          labelVi="Nghiêm trọng"
          value={site.totals.critical}
          tone={site.totals.critical > 0 ? "red" : undefined}
        />
      </div>
      <div className="grid grid-cols-4 gap-2.5 avoid-break mt-2.5">
        <StatCard label="Medium" labelVi="Trung bình" value={site.totals.medium} tone={site.totals.medium > 0 ? "amber" : undefined} />
        <StatCard label="Low" labelVi="Thấp" value={site.totals.low} tone="emerald" />
        <StatCard label="Photos" labelVi="Ảnh" value={site.totals.photos} />
        <StatCard
          label="Safety flags"
          labelVi="Sự cố an toàn"
          value={safetyCount}
          tone={safetyCount > 0 ? "red" : "emerald"}
        />
      </div>
      {siteHasMore && (
        <p className="text-[11.5px] text-slate-500 mt-2 px-0.5">
          Số liệu trên là của toàn bộ <b>{site.totals.turbines}</b> trụ. Riêng <b>{scopeLabel}</b>:{" "}
          <b>{totals.findings}</b> phát hiện ({totals.critical} nặng · {totals.medium} trung bình ·{" "}
          {totals.low} nhẹ), <b>{totals.photos}</b> ảnh — chi tiết ở mục 5.
        </p>
      )}

      <h4 className="text-[13px] font-bold text-slate-700 mt-5 mb-1.5">
        Severity scale <span className="italic font-normal text-slate-400">/ Thang mức độ</span>
      </h4>
      <div className="avoid-break">
        {SEVERITY_SCALE.map((s) => (
          <div key={s.title} className="avoid-break flex items-stretch gap-3 mb-1.5">
            {/* Dải màu bên trái, tra nhanh như bảng chú giải của tài liệu mẫu. */}
            <div className="w-[7px] shrink-0 rounded-sm" style={{ background: s.color }} />
            <div className="flex-1 py-0.5">
              <div className="text-[12.5px] font-bold" style={{ color: NAVY }}>
                {s.level !== null ? `M${s.level} — ` : ""}
                {s.title}
                <span className="font-normal italic text-slate-400"> / {s.titleVi}</span>
              </div>
              <div className="text-[11.5px] text-slate-700 leading-snug">{s.en}</div>
              <div className="text-[11px] italic text-slate-500 leading-snug">{s.vi}</div>
            </div>
          </div>
        ))}
      </div>

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
            {siteHasMore && (
              <th
                className="text-right py-1.5 px-2 border-b-2 text-[11.5px] font-bold uppercase whitespace-nowrap"
                style={{ borderColor: NAVY, color: NAVY, background: "rgba(31,53,82,0.05)" }}
              >
                {scopeLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sectionsWithFindings.map((g) => (
            <tr key={g.section.id}>
              <td className="border-b border-slate-200 py-1 px-2">
                {g.section.no} {g.section.en}
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
              {siteHasMore && (
                <td
                  className="border-b border-slate-200 py-1 px-2 text-right tabular-nums font-semibold"
                  style={{ background: "rgba(31,53,82,0.05)" }}
                >
                  <a href={`#${sectionAnchorId(g.section.id)}`} className="hover:underline">
                    {scopeBySection.get(g.section.id) || "·"}
                  </a>
                </td>
              )}
            </tr>
          ))}
          <tr style={{ background: "rgba(31,53,82,0.06)" }}>
            <td className="py-1.5 px-2 font-bold" style={{ color: NAVY }}>
              Total / Tổng cộng
            </td>
            <td className="py-1.5 px-2 text-right font-extrabold tabular-nums">{site.totals.findings}</td>
            <td className="py-1.5 px-2 text-right font-extrabold tabular-nums text-red-700">{site.totals.critical}</td>
            <td className="py-1.5 px-2 text-right font-extrabold tabular-nums text-amber-700">{site.totals.medium}</td>
            <td className="py-1.5 px-2 text-right font-extrabold tabular-nums text-slate-500">{site.totals.low}</td>
            {siteHasMore && (
              <td className="py-1.5 px-2 text-right font-extrabold tabular-nums" style={{ color: NAVY }}>
                {totals.findings}
              </td>
            )}
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
            {site.safetyFlags.map((s) => (
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

      {siteMulti && (
        <>
          <h4 id="main-defects" className="text-[13px] font-bold text-slate-700 mt-5 mb-1.5 scroll-mt-16">
            4.2 Main defects by turbine{" "}
            <span className="italic font-normal text-slate-400">/ Lỗi chính theo từng trụ</span>
          </h4>
          <FleetMainDefects turbines={site.turbines} highlight={scopeTurbines} />

          <h4 id="defect-matrix" className="text-[13px] font-bold text-slate-700 mt-5 mb-1.5 scroll-mt-16">
            4.3 Defect matrix{" "}
            <span className="italic font-normal text-slate-400">/ Ma trận lỗi — OK/NG theo trụ</span>
          </h4>
          <DefectMatrix turbines={site.turbines} highlight={scopeTurbines} />

          {INCLUDE_FULL_FINDINGS_MATRIX && (
            <>
              <h4 id="findings-matrix" className="text-[13px] font-bold text-slate-700 mt-5 mb-1.5 scroll-mt-16">
                4.4 Findings matrix{" "}
                <span className="italic font-normal text-slate-400">
                  / Ma trận phát hiện — toàn bộ các trụ
                </span>
              </h4>
              <FindingsMatrix turbines={site.turbines} highlight={scopeTurbines} />
            </>
          )}
        </>
      )}

      {/* ── 5. Main findings — phạm vi bản in ─────────────────────────── */}
      <div id="s5-main-findings">
        <SectionTitle
          en={`5. Main findings — ${scopeLabel}`}
          vi="Chi tiết phát hiện theo hạng mục"
        />
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
            <TurbineSection key={t.turbine} t={t} compact />
          ))}
        </>
      )}

      <p className="text-[10.5px] text-slate-400 mt-8 pt-2 border-t border-slate-200">
        {docRef} · Issue {ISSUE} · {DOCUMENT_CLASSIFICATION} · Tổng hợp tự động từ {totals.reports}{" "}
        báo cáo hằng ngày ({reportDates}).{" "}
        <span className="italic">Auto-generated from {totals.reports} daily reports.</span>
        {" · "}
        {/* Mã build: để phân biệt bản preview đang xem với bản production. */}
        <span className="font-mono">build {BUILD_REF}</span>
      </p>
    </div>
  );
}
