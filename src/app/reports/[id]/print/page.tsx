import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PrintToolbar from "@/components/print/PrintToolbar";
import ReportPrintView from "@/components/print/ReportPrintView";
import { getReportDraft, getReportHeader } from "@/lib/actions/reports";
import { buildExportName, EXPORT_DOC_NAME } from "@/lib/project-info";

/**
 * Tiêu đề trang quyết định tên file PDF. Thêm tên trụ và ngày để 22 báo cáo
 * ngày không tải về trùng tên và đè lên nhau.
 */
export async function generateMetadata(
  props: PageProps<"/reports/[id]/print">,
): Promise<Metadata> {
  const { id } = await props.params;
  const header = await getReportHeader(id);
  return {
    title: header ? buildExportName(header.turbines, header.date) : EXPORT_DOC_NAME,
  };
}

export default async function ReportPrintPage(props: PageProps<"/reports/[id]/print">) {
  const { id } = await props.params;
  const draft = await getReportDraft(id);
  if (!draft) notFound();

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white">
      <PrintToolbar backHref={`/reports/${id}`} />
      <ReportPrintView rep={draft} />
    </div>
  );
}
