import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, FileStack, Image as ImageIcon } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import DeleteReportButton from "@/components/DeleteReportButton";
import { listReports, createReportAction } from "@/lib/actions/reports";
import { signOut } from "@/app/login/actions";
import { AMBER, NAVY_DARK } from "@/lib/theme";

export default async function ReportsListPage() {
  const reports = await listReports();

  return (
    <div className="min-h-screen bg-slate-100">
      <AppHeader title="BÁO CÁO HẰNG NGÀY" subtitle="BIM Wind Farm — EOW · Daily Report" />
      <main className="px-3.5 py-4 space-y-3 max-w-md mx-auto pb-10">
        <Image
          src="/images/logo-mbwind-horizontal.png"
          alt="MB WIND"
          width={200}
          height={68}
          className="h-8 w-auto object-contain mx-auto mb-1"
          priority
        />

        <form action={createReportAction}>
          <button
            type="submit"
            className="w-full rounded-xl py-3.5 font-bold text-[14.5px] shadow-sm"
            style={{ background: AMBER, color: NAVY_DARK }}
          >
            + Tạo báo cáo hôm nay / New report
          </button>
        </form>

        {reports.length > 0 && (
          <Link
            href="/final-report"
            className="flex items-center justify-center gap-2 w-full rounded-xl py-3 font-bold text-[13.5px] border"
            style={{ borderColor: NAVY_DARK, color: NAVY_DARK }}
          >
            <FileStack size={16} />
            Báo cáo tổng hợp / Final report
          </Link>
        )}

        <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 pt-1">
          Đã lưu / Saved ({reports.length})
        </h2>

        {reports.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-10 text-center text-[13px] text-slate-500">
            Chưa có báo cáo nào.
            <br />
            No reports yet.
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-slate-300 bg-white px-3.5 py-3 flex items-center gap-2.5"
            >
              <Link href={`/reports/${r.id}`} className="flex-1 text-left min-w-0">
                <div className="font-bold text-[13.5px] text-slate-800 flex items-center gap-1.5">
                  {r.date || "—"} {r.plannedTurbines ? `· ${r.plannedTurbines}` : ""}
                  {r.hasMajor && <AlertTriangle size={13} className="text-red-600 shrink-0" />}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {r.preparedBy || "—"} · {r.findingsCount} phát hiện · lũy kế{" "}
                  {r.cumulative || "?"}/22
                  {r.photosCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 ml-1">
                      <ImageIcon size={10} className="inline" /> {r.photosCount}
                    </span>
                  )}
                </div>
              </Link>
              <DeleteReportButton id={r.id} />
            </div>
          ))
        )}

        <form action={signOut} className="pt-2 text-center">
          <button type="submit" className="text-[11.5px] font-semibold text-slate-400 hover:text-slate-600">
            Đăng xuất / Sign out
          </button>
        </form>
      </main>
    </div>
  );
}
