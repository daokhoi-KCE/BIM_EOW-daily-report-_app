import Image from "next/image";
import type { FinalReportData } from "@/lib/final-report";
import { NAVY, AMBER } from "@/lib/theme";
import { SectionTitle, InfoRow } from "@/components/print/shared";
import { formatDateDMY } from "@/lib/utils";
import {
  PROJECT,
  INCLUDE_FULL_FINDINGS_MATRIX,
  LARGE_PHOTO_TURBINES,
  PHOTO_SIZES,
  INSPECTION_PERIOD,
  INSPECTORS,
  STANDARDS,
  SEVERITY_SCALE,
  DOCUMENT_CLASSIFICATION,
  buildDocumentRef,
} from "@/lib/project-info";
import DocumentFrontMatter from "@/components/final-report/DocumentFrontMatter";
import SectionFindings, { sectionAnchorId } from "@/components/final-report/SectionFindings";
import { SITE_PHOTOS_SECTION } from "@/lib/report-sections";
import DefectMatrix from "@/components/final-report/DefectMatrix";
import FindingsMatrix from "@/components/final-report/FindingsMatrix";
import FleetMainDefects from "@/components/final-report/FleetMainDefects";
import TurbineSection, { turbineAnchorId } from "@/components/final-report/TurbineSection";
import ReminderNote, { REMINDER_ANCHOR } from "@/components/final-report/ReminderNote";
import SitePhotosSection, { SITE_PHOTOS_ANCHOR } from "@/components/final-report/SitePhotosSection";

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
      <div className="text-[18px] font-extrabold leading-tight" style={{ color: toneColor }}>
        {value}
      </div>
      <div className="text-[9.5px] font-bold uppercase tracking-wide text-slate-600 leading-tight mt-0.5">
        {label}
      </div>
      <div className="text-[8px] italic text-slate-400 leading-tight">{labelVi}</div>
    </div>
  );
}

function TocLine({ href, no, en, vi, page }: { href: string; no: string; en: string; vi?: string; page?: string }) {
  return (
    <a href={href} className="flex items-baseline gap-2 py-[3px] group">
      <span className="text-[10.5px] text-slate-800 group-hover:underline whitespace-nowrap">
        {no} {en}
      </span>
      {vi && <span className="text-[9px] italic text-slate-400 whitespace-nowrap">/ {vi}</span>}
      <span className="flex-1 border-b border-dotted border-slate-300 translate-y-[-3px]" />
      {page && <span className="text-[9.5px] text-slate-500 tabular-nums">{page}</span>}
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
  // Chỉ in hạng mục thật sự có phát hiện. Bản một trụ chỉ động tới vài cụm
  // thiết bị, nên trước đây mười mấy hạng mục chỉ có mỗi dải tiêu đề và một
  // dòng "không ghi nhận phát hiện nào" — vừa dài vừa không thêm thông tin.
  // Hạng mục đã kiểm tra mà không có lỗi vẫn thấy được ở ma trận OK/NG 4.3.
  const printedSections = sections.filter((g) => g.findings.length > 0);

  // Cỡ ảnh mục 5, theo trụ mà bản in này nói tới. Bản gộp nhiều trụ chỉ
  // dùng cỡ lớn khi mọi trụ trong đó đều thuộc danh sách — một bản in phải
  // có cỡ ảnh thống nhất từ đầu đến cuối, không to nhỏ lẫn lộn giữa chừng.
  const photoSize =
    turbines.length > 0 && turbines.every((t) => LARGE_PHOTO_TURBINES.includes(t.turbine))
      ? PHOTO_SIZES.large
      : PHOTO_SIZES.default;
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
            className={`print-hide mb-3 rounded-md border px-3 py-2 text-[9.5px] leading-relaxed ${
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
      <div className="flex items-start justify-between gap-4 text-[8.5px] text-slate-500 pb-1.5 border-b border-slate-300">
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
            <h1 className="text-[18px] font-extrabold uppercase leading-tight" style={{ color: NAVY }}>
              End-of-Warranty Visual Inspection Report
            </h1>
            <div className="text-[10px] italic text-slate-500 leading-tight">
              Báo cáo kiểm tra trực quan hết hạn bảo hành
            </div>
            <div className="text-[10.5px] text-slate-600 mt-0.5">
              {PROJECT.siteName} — {scopeLabel} × {PROJECT.turbineModel}
            </div>
          </div>
        </div>
        <div className="mt-2 inline-block text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: NAVY, color: "white" }}>
          {DOCUMENT_CLASSIFICATION}
        </div>
      </div>
      <div className="h-[3px] mb-4" style={{ background: AMBER }} />

      <DocumentFrontMatter issue={ISSUE} issueDate={generatedAt} reportCount={totals.reports} />

      {/* ── Mục lục ───────────────────────────────────────────────────── */}
      <SectionTitle en="Table of content" vi="Mục lục" compact />
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
          {printedSections.map((g) => (
            <TocLine
              key={g.section.id}
              href={`#${sectionAnchorId(g.section.id)}`}
              no={g.section.no}
              en={g.section.en}
              page={String(g.findings.length)}
            />
          ))}
          <TocLine
            href={`#${SITE_PHOTOS_ANCHOR}`}
            no={SITE_PHOTOS_SECTION.no}
            en={SITE_PHOTOS_SECTION.en}
            vi={SITE_PHOTOS_SECTION.vi}
            page={String(data.reports.reduce((s, r) => s + (r.photos?.length ?? 0), 0))}
          />
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
        <TocLine href={`#${REMINDER_ANCHOR}`} no="" en="Reminder" vi="Lưu ý" />
      </div>

      {/* ── 1. Introduction ───────────────────────────────────────────── */}
      <div id="s1-introduction">
        <SectionTitle en="1. Introduction" vi="Giới thiệu" compact />
      </div>
      {/* Tiếng Anh đứng trước, tiếng Việt là bản tóm lược in nhỏ bên dưới —
          giống trang lưu ý pháp lý ở đầu tài liệu, và giống bộ khung báo cáo
          kiểm định gốc. Báo cáo này còn gửi cho nhà sản xuất. */}
      <p className="prose-doc text-[12px] leading-relaxed text-justify">
        The <b>{PROJECT.siteName}</b>, owned by <b>{PROJECT.owner}</b>, comprises{" "}
        {PROJECT.totalTurbines} <b>{PROJECT.turbineModel}</b> wind turbines supplied by{" "}
        {PROJECT.oem}. As the turbines reach the end of their warranty period, the owner has
        commissioned an End-of-Warranty (EOW) visual inspection to record the condition of the
        equipment in full before responsibility for maintenance passes from the manufacturer to the
        owner.
      </p>
      <p className="prose-doc text-[12px] leading-relaxed text-justify mt-2">
        The inspection was carried out on site between <b>{periodFrom}</b> and <b>{periodTo}</b>,
        producing <b>{site.totals.reports}</b> daily inspection reports across{" "}
        <b>{site.totals.turbines}</b> turbines, in which <b>{site.totals.findings}</b> findings and{" "}
        <b>{site.totals.photos}</b> site photographs were recorded. The inspection was performed by{" "}
        <b>{INSPECTORS.map((p) => p.name).join(" and ")}</b>.
      </p>
      <p className="prose-doc text-[12px] leading-relaxed text-justify mt-2">
        {siteHasMore ? (
          <>
            This volume covers <b>{scopeLabel}</b> ({reportDates}), with <b>{totals.findings}</b>{" "}
            findings and <b>{totals.photos}</b> photographs. One volume is issued for each turbine so
            that each can be followed on its own. <b>Section 4</b> carries the site-wide summary and
            the matrices for all <b>{site.totals.turbines}</b> turbines, so that {scopeLabel} can be
            read against the site as a whole; <b>Section 5</b> details every finding of {scopeLabel}{" "}
            with its photographs, regrouped by component and location.
          </>
        ) : (
          <>
            This volume covers <b>{totals.turbines}</b> turbines ({reportDates}), with{" "}
            <b>{totals.findings}</b> findings and <b>{totals.photos}</b> photographs.{" "}
            <b>Section 4</b> summarises and compares the turbines; <b>Section 5</b> details every
            finding with its photographs, regrouped by component and location; the final section
            retains the per-turbine view.
          </>
        )}
      </p>
      <p className="prose-doc text-[10px] italic text-slate-500 leading-relaxed text-justify mt-2">
        Đợt kiểm tra trực quan hết hạn bảo hành (EOW) tại {PROJECT.siteName} — chủ đầu tư{" "}
        {PROJECT.owner}, {PROJECT.totalTurbines} tuabin {PROJECT.turbineModel} của {PROJECT.oem} —
        được thực hiện tại hiện trường từ {periodFrom} đến {periodTo}, gồm {site.totals.reports} báo
        cáo kiểm tra hằng ngày trên {site.totals.turbines} tuabin, ghi nhận {site.totals.findings}{" "}
        phát hiện và {site.totals.photos} ảnh. Công tác kiểm tra do{" "}
        {INSPECTORS.map((p) => p.name).join(" và ")} thực hiện.{" "}
        {siteHasMore
          ? `Bản này dành riêng cho ${scopeLabel} (${reportDates}) với ${totals.findings} phát hiện và ${totals.photos} ảnh; mỗi tuabin có một bản final riêng. Mục 4 là phần tổng hợp của cả ${site.totals.turbines} trụ để đối chiếu, mục 5 là chi tiết từng phát hiện của ${scopeLabel} kèm ảnh, sắp xếp theo cụm thiết bị.`
          : `Bản này bao phủ ${totals.turbines} tuabin (${reportDates}) với ${totals.findings} phát hiện và ${totals.photos} ảnh. Mục 4 tóm tắt và đối chiếu giữa các trụ, mục 5 là chi tiết từng phát hiện kèm ảnh, mục cuối giữ cách trình bày theo từng trụ.`}
      </p>

      {/* ── 2. Reference documents ────────────────────────────────────── */}
      <div id="s2-reference">
        <SectionTitle en="2. Reference documents" vi="Tài liệu tham chiếu" compact />
      </div>
      <table className="w-full border-collapse text-[10.5px] avoid-break">
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
        <SectionTitle en="3. Information" vi="Thông tin" compact />
      </div>
      <h4 className="text-[11px] font-bold text-slate-700 mb-1.5">
        3.1 Site information <span className="italic font-normal text-slate-400">/ Thông tin công trường</span>
      </h4>
      <div className="grid grid-cols-4 gap-3.5 avoid-break mb-4">
        <InfoRow en="Site" vi="Công trường" value={PROJECT.siteName} compact />
        <InfoRow en="Owner" vi="Chủ đầu tư" value={PROJECT.owner} compact />
        <InfoRow en="Location" vi="Địa điểm" value={PROJECT.location} compact />
        <InfoRow en="Inspection type" vi="Loại kiểm tra" value="EOW visual" compact />
        <InfoRow en="Inspection period" vi="Thời gian kiểm tra" value={`${periodFrom} → ${periodTo}`} compact />
        <InfoRow en="Daily reports" vi="Số báo cáo ngày" value={String(site.totals.reports)} compact />
        <InfoRow en="Inspectors" vi="Kỹ sư kiểm tra" value={INSPECTORS.map((p) => p.name).join(", ")} compact />
        <InfoRow en="Issued" vi="Ngày phát hành" value={generatedAt} compact />
        <InfoRow en="Report scope" vi="Phạm vi bản này" value={`${scopeLabel} — ${reportDates}`} compact />
      </div>
      <h4 className="text-[11px] font-bold text-slate-700 mb-1.5">
        3.2 Turbine information <span className="italic font-normal text-slate-400">/ Thông tin tuabin</span>
      </h4>
      <div className="grid grid-cols-4 gap-3.5 avoid-break">
        <InfoRow en="OEM" vi="Nhà sản xuất" value={PROJECT.oem} compact />
        <InfoRow en="Model" vi="Model" value={PROJECT.turbineModel} compact />
        <InfoRow en="Turbines surveyed" vi="Số trụ đã khảo sát" value={String(site.totals.turbines)} compact />
        <InfoRow
          en="Fleet size"
          vi="Tổng số trụ dự án"
          value={String(PROJECT.totalTurbines)}
          compact
        />
      </div>

      {/* ── 4. Summary ────────────────────────────────────────────────── */}
      <div id="s4-summary">
        <SectionTitle
          en="4. Summary of the main findings — all turbines"
          vi="Tóm tắt phát hiện chính — toàn dự án"
          compact
        />
      </div>
      <h4 className="text-[11px] font-bold text-slate-700 mb-2">
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
        <p className="text-[9.5px] text-slate-500 mt-2 px-0.5">
          Số liệu trên là của toàn bộ <b>{site.totals.turbines}</b> trụ. Riêng <b>{scopeLabel}</b>:{" "}
          <b>{totals.findings}</b> phát hiện ({totals.critical} nặng · {totals.medium} trung bình ·{" "}
          {totals.low} nhẹ), <b>{totals.photos}</b> ảnh — chi tiết ở mục 5.
        </p>
      )}

      <h4 className="text-[11px] font-bold text-slate-700 mt-5 mb-1.5">
        Severity scale <span className="italic font-normal text-slate-400">/ Thang mức độ</span>
      </h4>
      <div className="avoid-break">
        {SEVERITY_SCALE.map((s) => (
          <div key={s.title} className="avoid-break flex items-stretch gap-3 mb-1.5">
            {/* Dải màu bên trái, tra nhanh như bảng chú giải của tài liệu mẫu. */}
            <div className="w-[7px] shrink-0 rounded-sm" style={{ background: s.color }} />
            <div className="flex-1 py-0.5">
              <div className="text-[10.5px] font-bold" style={{ color: NAVY }}>
                {s.level !== null ? `M${s.level} — ` : ""}
                {s.title}
                <span className="font-normal italic text-slate-400"> / {s.titleVi}</span>
              </div>
              <div className="prose-doc text-[10px] text-slate-700 leading-snug">{s.en}</div>
              <div className="prose-doc text-[10px] italic text-slate-500 leading-snug">{s.vi}</div>
            </div>
          </div>
        ))}
      </div>

      <h4 className="text-[11px] font-bold text-slate-700 mt-5 mb-1.5">
        Findings by section <span className="italic font-normal text-slate-400">/ Phân bố theo hạng mục</span>
      </h4>
      <table className="w-full border-collapse text-[10px] avoid-break">
        <thead>
          <tr style={{ background: "rgba(31,53,82,0.06)" }}>
            <th className="text-left py-1.5 px-2 border-b-2 text-[9.5px] font-bold uppercase" style={{ borderColor: NAVY, color: NAVY }}>
              Section / Hạng mục
            </th>
            {["Total", "M4-5", "M3", "M1-2"].map((h) => (
              <th
                key={h}
                className="text-right py-1.5 px-2 border-b-2 text-[9.5px] font-bold uppercase whitespace-nowrap"
                style={{ borderColor: NAVY, color: NAVY }}
              >
                {h}
              </th>
            ))}
            {siteHasMore && (
              <th
                className="text-right py-1.5 px-2 border-b-2 text-[9.5px] font-bold uppercase whitespace-nowrap"
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
                  {/* Chỉ liên kết khi bản in này thật sự có mục đó. Bảng
                      thống kê là của cả dự án, nên nhiều hạng mục có phát
                      hiện ở trụ khác mà không có ở trụ này — trỏ tới đó là
                      một liên kết chết. */}
                  {scopeBySection.get(g.section.id) ? (
                    <a href={`#${sectionAnchorId(g.section.id)}`} className="hover:underline">
                      {scopeBySection.get(g.section.id)}
                    </a>
                  ) : (
                    <span className="text-slate-400">·</span>
                  )}
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
          <div className="text-[10.5px] font-bold text-red-700 mb-1">
            {safetyCount} ngày có vấn đề an toàn{" "}
            <span className="font-normal italic">/ day(s) with safety issue(s)</span>
          </div>
          <div className="text-[10px] text-red-800 flex flex-wrap gap-x-3 gap-y-0.5">
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
          <h4 id="main-defects" className="text-[11px] font-bold text-slate-700 mt-5 mb-1.5 scroll-mt-16">
            4.2 Main defects by turbine{" "}
            <span className="italic font-normal text-slate-400">/ Lỗi chính theo từng trụ</span>
          </h4>
          <FleetMainDefects turbines={site.turbines} highlight={scopeTurbines} />

          <h4 id="defect-matrix" className="text-[11px] font-bold text-slate-700 mt-5 mb-1.5 scroll-mt-16">
            4.3 Defect matrix{" "}
            <span className="italic font-normal text-slate-400">/ Ma trận lỗi — OK/NG theo trụ</span>
          </h4>
          <DefectMatrix turbines={site.turbines} highlight={scopeTurbines} />

          {INCLUDE_FULL_FINDINGS_MATRIX && (
            <>
              <h4 id="findings-matrix" className="text-[11px] font-bold text-slate-700 mt-5 mb-1.5 scroll-mt-16">
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
          compact
        />
      </div>
      {printedSections.map((g) => (
        <SectionFindings key={g.section.id} group={g} multiTurbine={multiTurbine} photoSize={photoSize} />
      ))}
      <SitePhotosSection reports={data.reports} />

      {/* ── 6. Turbine detail ─────────────────────────────────────────── */}
      {multiTurbine && (
        <>
          <div id="s6-turbine-detail">
            <SectionTitle en="6. Turbine detail" vi="Chi tiết từng tuabin" compact />
          </div>
          {turbines.map((t) => (
            <TurbineSection key={t.turbine} t={t} compact />
          ))}
        </>
      )}

      {/* ── Lưu ý cuối báo cáo ────────────────────────────────────────── */}
      <ReminderNote issueDate={generatedAt} />

      <p className="text-[9px] text-slate-400 mt-8 pt-2 border-t border-slate-200">
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
