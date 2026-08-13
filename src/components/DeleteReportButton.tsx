"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteReport } from "@/lib/actions/reports";
import { useRouter } from "next/navigation";

export default function DeleteReportButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [hidden, setHidden] = useState(false);
  const router = useRouter();

  if (hidden) return null;

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Xóa báo cáo này? / Delete this report?")) return;
        setHidden(true);
        startTransition(async () => {
          await deleteReport(id);
          router.refresh();
        });
      }}
      className="text-slate-300 hover:text-red-600 p-1.5 disabled:opacity-50"
    >
      <Trash2 size={16} />
    </button>
  );
}
