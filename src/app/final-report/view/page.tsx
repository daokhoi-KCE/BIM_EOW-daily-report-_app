import { notFound } from "next/navigation";
import PrintToolbar from "@/components/print/PrintToolbar";
import FinalReportView from "@/components/final-report/FinalReportView";
import { getReportDraftsByIds } from "@/lib/actions/reports";
import { buildFinalReportData } from "@/lib/final-report";

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
