import { notFound } from "next/navigation";
import PrintToolbar from "@/components/print/PrintToolbar";
import ReportPrintView from "@/components/print/ReportPrintView";
import { getReportDraft } from "@/lib/actions/reports";

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
