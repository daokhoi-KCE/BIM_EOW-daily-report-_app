import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintToolbar from "@/components/print/PrintToolbar";
import FinalReportView from "@/components/final-report/FinalReportView";
import { getReportDraftsByIds } from "@/lib/actions/reports";
import { buildFinalReportData } from "@/lib/final-report";

/**
 * Trình duyệt lấy tên file PDF từ tiêu đề trang, nên tiêu đề ở đây chính là
 * tên file khi bấm Xuất PDF. Phải ghi đè tiêu đề của layout gốc
 * ("BIM EOW — Báo cáo hằng ngày"), vốn là tên của báo cáo ngày chứ không
 * phải báo cáo tổng hợp.
 */
export const metadata: Metadata = {
  title: "BIM - Final inspection",
};

export default async function FinalReportViewPage(props: PageProps<"/final-report/view">) {
  const sp = await props.searchParams;
  const raw = sp.ids;
  const ids = Array.isArray(raw) ? raw : raw ? [raw] : [];
  if (ids.length === 0) notFound();

  const reports = await getReportDraftsByIds(ids);
  if (reports.length === 0) notFound();

  const data = buildFinalReportData(reports);

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">
      <PrintToolbar backHref="/final-report" />
      <FinalReportView data={data} />
    </div>
  );
}
