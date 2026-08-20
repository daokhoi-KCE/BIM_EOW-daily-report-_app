import { AlertTriangle, FileStack } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import SelectAllToggle from "@/components/final-report/SelectAllToggle";
import { listReports } from "@/lib/actions/reports";
import { AMBER, NAVY_DARK } from "@/lib/theme";

export default async function FinalReportSelectPage() {
  const reports = await listReports();

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader
        title="BÁO CÁO TỔNG HỢP"
        subtitle="Chọn báo cáo hằng ngày để tổng hợp / Select daily reports"
        backHref="/"
      />
      <main className="px-3.5 py-4 space-y-3 max-w-md mx-auto pb-10">
        {reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-[13px] text-slate-500">
            Chưa có báo cáo nào để tổng hợp.
            <br />
            No reports available yet.
          </div>
        ) : (
          <form action="/final-report/view" method="GET" className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-300 bg-white px-3.5 py-2.5">
              <SelectAllToggle />
              <span className="text-[11px] text-slate-400">{reports.length} báo cáo / reports</span>
            </div>

            <div className="space-y-2">
              {reports.map((r) => (
                <label
                  key={r.id}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-300 bg-white px-3.5 py-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name="ids"
                    value={r.id}
                    defaultChecked
                    className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13.5px] text-slate-800 flex items-center gap-1.5">
                      {r.date || "—"} {r.plannedTurbines ? `· ${r.plannedTurbines}` : ""}
                      {r.hasMajor && <AlertTriangle size={13} className="text-red-600 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {r.preparedBy || "—"} · {r.findingsCount} phát hiện · lũy kế {r.cumulative || "?"}/22
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-[14.5px] shadow-sm"
              style={{ background: AMBER, color: NAVY_DARK }}
            >
              <FileStack size={17} />
              Tạo báo cáo tổng hợp / Generate final report
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
