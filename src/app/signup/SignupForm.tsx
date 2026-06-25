"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "./actions";
import { LangSwitcher } from "@/components/LangSwitcher";
import { t, type Lang } from "@/lib/translations";

export function SignupForm({ lang }: { lang: Lang }) {
  const tr = t[lang];
  const [state, formAction, isPending] = useActionState(signup, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">CoachSync</h1>
          <LangSwitcher current={lang} />
        </div>
        <form action={formAction} className="bg-white shadow-sm rounded-xl border border-zinc-200 p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-zinc-900">{tr.signupTitle}</h2>
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{state.error}</p>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
              {tr.nameLabel}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition"
            />
          </div>
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
              minLength={6}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 transition"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">{tr.roleLabel}</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="role" value="ATHLETE" defaultChecked />
                {tr.athleteRole}
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="role" value="COACH" />
                {tr.coachRole}
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-zinc-900 text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? tr.creating : tr.createAccount}
          </button>
          <p className="text-sm text-center text-zinc-500">
            {tr.hasAccount}{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              {tr.loginLink}
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
