"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { NAVY_DARK, AMBER } from "@/lib/theme";

export default function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div
      className="print-hide sticky top-0 z-20 flex items-center gap-2.5 px-3.5 py-2.5 text-white shadow-md"
      style={{ background: NAVY_DARK }}
    >
      <Link href={backHref} className="p-1 -ml-1">
        <ArrowLeft size={20} />
      </Link>
      <div className="flex-1 text-[13px] font-semibold">Xem trước để in / Print preview</div>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-bold text-[12.5px]"
        style={{ background: AMBER, color: NAVY_DARK }}
      >
        <Printer size={15} />
        Xuất PDF / Export PDF
      </button>
    </div>
  );
}
