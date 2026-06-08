"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "./actions";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signup, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">CoachSync</h1>
        <form action={formAction} className="bg-white shadow rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">新規登録</h2>
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{state.error}</p>
          )}
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-gray-700">
              名前
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">ロール</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="role" value="ATHLETE" defaultChecked />
                アスリート
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" name="role" value="COACH" />
                コーチ
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 text-white rounded px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "登録中..." : "アカウントを作成"}
          </button>
          <p className="text-sm text-center text-gray-600">
            すでにアカウントをお持ちの方は{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              ログイン
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
