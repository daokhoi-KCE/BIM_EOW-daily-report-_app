import Image from "next/image";
import LoginForm from "./LoginForm";
import { NAVY } from "@/lib/theme";

export default async function LoginPage(props: PageProps<"/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-300 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/images/logo-mbwind-horizontal.png"
            alt="MB WIND"
            width={200}
            height={68}
            className="h-10 w-auto object-contain"
            priority
          />
          <div className="text-center">
            <div className="font-bold text-[14.5px]" style={{ color: NAVY }}>
              BÁO CÁO CÔNG VIỆC HẰNG NGÀY
            </div>
            <div className="text-[11px] text-slate-500 italic">
              Daily Work Report — BIM Wind Farm EOW
            </div>
          </div>
        </div>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
