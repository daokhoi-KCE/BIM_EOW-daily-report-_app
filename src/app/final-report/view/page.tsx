import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintToolbar from "@/components/print/PrintToolbar";
import FinalReportView from "@/components/final-report/FinalReportView";
import { getFleetOverview, getReportDraftsByIds, getReportHeader } from "@/lib/actions/reports";
import { buildFinalReportData } from "@/lib/final-report";
import { buildExportName, EXPORT_DOC_NAME } from "@/lib/project-info";
import { normalizeTurbineLabel } from "@/lib/turbine-label";

function idsFrom(raw: string | string[] | undefined): string[] {
  return Array.isArray(raw) ? raw : raw ? [raw] : [];
}

/**
 * Trình duyệt lấy tên file PDF từ tiêu đề trang, nên tiêu đề ở đây chính là
 * tên file khi bấm Xuất PDF. Phải ghi đè tiêu đề của layout gốc
 * ("BIM EOW — Báo cáo hằng ngày"), vốn là tên của báo cáo ngày.
 *
 * Xuất lần lượt từng trụ là cách làm thực tế — chọn cả 22 trụ một lúc là 388
 * MB ảnh trên một trang. Nên khi chỉ có một trụ, tên file phải kèm tên trụ,
 * nếu không 22 lần tải về đều cùng một tên và đè lên nhau.
 */
export async function generateMetadata(
  props: PageProps<"/final-report/view">,
): Promise<Metadata> {
  const sp = await props.searchParams;
  const ids = idsFrom(sp.ids);
  if (ids.length !== 1) return { title: EXPORT_DOC_NAME };

  const header = await getReportHeader(ids[0]);
  return {
    title: header ? buildExportName(normalizeTurbineLabel(header.turbines), header.date) : EXPORT_DOC_NAME,
  };
}

export default async function FinalReportViewPage(props: PageProps<"/final-report/view">) {
  const sp = await props.searchParams;
  const ids = idsFrom(sp.ids);
  if (ids.length === 0) notFound();

  // Bản final của một trụ vẫn phải mang theo phần tổng hợp của cả dự án, nên
  // ngoài báo cáo đang chọn (có ảnh) còn cần dữ liệu tóm tắt của mọi báo cáo.
  const [reports, fleetReports] = await Promise.all([
    getReportDraftsByIds(ids),
    getFleetOverview(),
  ]);
  if (reports.length === 0) notFound();

  const data = buildFinalReportData(reports);
  const fleet = buildFinalReportData(fleetReports);

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">
      <PrintToolbar backHref="/final-report" />
      <FinalReportView data={data} fleet={fleet} />
    </div>
  );
}
