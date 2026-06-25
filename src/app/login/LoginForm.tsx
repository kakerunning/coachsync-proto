"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";
import { LangSwitcher } from "@/components/LangSwitcher";
import { t, type Lang } from "@/lib/translations";

export function LoginForm({ lang }: { lang: Lang }) {
  const tr = t[lang];
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">CoachSync</h1>
          <LangSwitcher current={lang} />
        </div>
        <form action={formAction} className="bg-white shadow-sm rounded-xl border border-zinc-200 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">{tr.loginTitle}</h2>
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{state.error}</p>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              {tr.emailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              {tr.passwordLabel}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? tr.loggingIn : tr.loginButton}
          </button>
          <p className="text-sm text-center text-zinc-500">
            {tr.noAccount}{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              {tr.signupLink}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
