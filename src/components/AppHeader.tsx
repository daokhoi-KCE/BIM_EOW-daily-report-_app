import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NAVY_DARK } from "@/lib/theme";
import Image from "next/image";
import type { SaveState } from "@/components/SaveStateBadge";
import SaveStateBadge from "@/components/SaveStateBadge";

export default function AppHeader({
  title,
  subtitle,
  backHref,
  saveState,
}: {
  title: string;
  subtitle: string;
  backHref?: string;
  saveState?: SaveState;
}) {
  return (
    <header
      className="sticky top-0 z-20 text-white shadow-md"
      style={{ background: NAVY_DARK }}
    >
      <div className="px-3.5 py-2.5 flex items-center gap-2.5">
        {backHref ? (
          <Link href={backHref} className="p-1 -ml-1">
            <ArrowLeft size={20} />
          </Link>
        ) : (
          <Image
            src="/images/logo-mbwind-icon.png"
            alt=""
            width={28}
            height={28}
            className="w-7 h-7 object-contain"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[14px] leading-tight truncate">{title}</div>
          <div className="text-[10px] text-slate-400 leading-tight truncate">{subtitle}</div>
        </div>
        {saveState && <SaveStateBadge state={saveState} />}
      </div>
    </header>
  );
}
