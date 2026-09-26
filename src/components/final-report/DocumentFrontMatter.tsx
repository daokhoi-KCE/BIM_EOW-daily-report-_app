import { NAVY } from "@/lib/theme";
import {
  PROJECT,
  INSPECTORS,
  APPROVERS,
  CLASSIFICATION_KEY,
  DOCUMENT_CLASSIFICATION,
} from "@/lib/project-info";

function DocHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="avoid-break text-[13px] font-bold uppercase tracking-wide mt-6 mb-2"
      style={{ color: NAVY }}
    >
      {children}
    </h2>
  );
}

export default function DocumentFrontMatter({
  issue,
  issueDate,
  reportCount,
}: {
  issue: string;
  issueDate: string;
  reportCount: number;
}) {
  return (
    <section className="page-break-after">
      <DocHeading>Notice to third parties</DocHeading>
      <p className="text-[11px] leading-relaxed text-slate-700 text-justify">
        This report was prepared by the inspection team of {PROJECT.owner} and is based on visual
        inspection carried out on site, together with information provided by others, both verbal and
        written. The inspection team has assumed that the information provided is complete and correct.
        While the information, data and opinions contained herein are believed to be reliable under the
        conditions and subject to the limitations set out in this report, no guarantee is given as to
        their accuracy. This report records the condition observed on the dates of inspection only and
        does not constitute a warranty of the future condition or performance of the equipment. Use of
        this report by any party other than the intended recipient or its affiliates is at that
        party&apos;s own risk.
      </p>
      <p className="text-[10.5px] italic leading-relaxed text-slate-500 text-justify mt-1.5">
        Báo cáo do đội kiểm tra của {PROJECT.owner} lập, dựa trên kiểm tra trực quan tại hiện trường
        cùng thông tin do các bên liên quan cung cấp. Báo cáo chỉ ghi nhận tình trạng quan sát được tại
        thời điểm kiểm tra, không phải là cam kết về tình trạng hay hiệu suất thiết bị về sau.
      </p>

      <DocHeading>Key to document classification</DocHeading>
      <table className="w-full border-collapse text-[11.5px]">
        <tbody>
          {CLASSIFICATION_KEY.map((c) => {
            const active = c.level === DOCUMENT_CLASSIFICATION;
            return (
              <tr key={c.level} className={active ? "font-bold" : ""}>
                <td
                  className="py-1 pr-3 align-top whitespace-nowrap"
                  style={{ color: active ? NAVY : "#64748B" }}
                >
                  {c.level}
                  {active && " ◀"}
                </td>
                <td className="py-1 align-top text-slate-700">
                  {c.meaning}
                  <span className="block text-[10px] italic text-slate-400">{c.meaningVi}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-[11px] mt-2" style={{ color: NAVY }}>
        <b>This document is classified: {DOCUMENT_CLASSIFICATION}</b>
      </p>

      <DocHeading>Document contributors</DocHeading>
      <table className="w-full border-collapse text-[12px] avoid-break">
        <thead>
          <tr>
            <th
              className="border px-2.5 py-1.5 text-center text-[11.5px] font-bold uppercase tracking-wide"
              style={{ borderColor: NAVY, color: NAVY, background: "rgba(31,53,82,0.06)" }}
            >
              Inspectors
              <span className="block text-[9.5px] italic font-normal normal-case text-slate-500">
                Kỹ sư kiểm tra
              </span>
            </th>
            <th
              className="border px-2.5 py-1.5 text-center text-[11.5px] font-bold uppercase tracking-wide"
              style={{ borderColor: NAVY, color: NAVY, background: "rgba(31,53,82,0.06)" }}
            >
              Approved by
              <span className="block text-[9.5px] italic font-normal normal-case text-slate-500">
                Người phê duyệt
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2.5 py-2.5 text-center align-top" style={{ borderColor: NAVY }}>
              {INSPECTORS.map((p) => (
                <div key={p.name} className="mb-2 last:mb-0">
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-[10.5px] text-slate-500">
                    {p.role} <span className="italic">/ {p.roleVi}</span>
                  </div>
                </div>
              ))}
            </td>
            <td className="border px-2.5 py-2.5 text-center align-top" style={{ borderColor: NAVY }}>
              {APPROVERS.map((p, i) => (
                <div key={i}>
                  <div className="font-semibold text-slate-900 min-h-[18px]">
                    {p.name || <span className="text-slate-300">—</span>}
                  </div>
                  <div className="text-[10.5px] text-slate-500">
                    {p.role} <span className="italic">/ {p.roleVi}</span>
                  </div>
                </div>
              ))}
            </td>
          </tr>
        </tbody>
      </table>

      <DocHeading>Document history</DocHeading>
      <table className="w-full border-collapse text-[12px] avoid-break">
        <thead>
          <tr>
            {["Issue", "Date", "Summary"].map((h) => (
              <th
                key={h}
                className="border px-2.5 py-1.5 text-center text-[11.5px] font-bold uppercase tracking-wide"
                style={{ borderColor: NAVY, color: NAVY, background: "rgba(31,53,82,0.06)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-2.5 py-1.5 text-center" style={{ borderColor: NAVY }}>
              {issue}
            </td>
            <td className="border px-2.5 py-1.5 text-center" style={{ borderColor: NAVY }}>
              {issueDate}
            </td>
            <td className="border px-2.5 py-1.5" style={{ borderColor: NAVY }}>
              Initial issue — consolidated from {reportCount} daily inspection reports
              <span className="block text-[10px] italic text-slate-400">
                Phát hành lần đầu — tổng hợp từ {reportCount} báo cáo kiểm tra hằng ngày
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
