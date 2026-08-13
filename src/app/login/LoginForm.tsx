"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";
import { NAVY, NAVY_DARK, AMBER } from "@/lib/theme";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    signIn,
    null,
  );

  return (
    <form action={action} className="space-y-3.5">
      <input type="hidden" name="next" value={next} />
      <label className="block">
        <span className="block text-[12.5px] font-semibold text-slate-700 mb-1">
          Email
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className={inputCls}
          placeholder="ban@bimwind.vn"
        />
      </label>
      <label className="block">
        <span className="block text-[12.5px] font-semibold text-slate-700 mb-1">
          Mật khẩu / Password
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className={inputCls}
        />
      </label>

      {state?.error && (
        <p className="text-[12.5px] font-semibold text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl py-3 font-bold text-[14.5px] shadow-sm disabled:opacity-60"
        style={{ background: AMBER, color: NAVY_DARK }}
      >
        {pending ? "Đang đăng nhập… / Signing in…" : "Đăng nhập / Sign in"}
      </button>
      <p className="text-[11px] text-slate-400 text-center" style={{ color: NAVY }}>
        BIM Wind Farm — EOW Daily Report
      </p>
    </form>
  );
}
