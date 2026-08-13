import { notFound } from "next/navigation";
import ReportEditor from "@/components/ReportEditor";
import { getReportDraft, getCumulativeHint } from "@/lib/actions/reports";

export default async function ReportEditPage(props: PageProps<"/reports/[id]">) {
  const { id } = await props.params;

  const [draft, cumulativeHint] = await Promise.all([
    getReportDraft(id),
    getCumulativeHint(),
  ]);

  if (!draft) notFound();

  return <ReportEditor initialDraft={draft} cumulativeHint={cumulativeHint} />;
}
