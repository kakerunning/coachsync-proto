"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-center">CoachSync</h1>
        <form action={formAction} className="bg-white shadow rounded-lg p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">ログイン</h2>
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{state.error}</p>
          )}
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
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-600 text-white rounded px-3 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "ログイン中..." : "ログイン"}
          </button>
          <p className="text-sm text-center text-gray-600">
            アカウントをお持ちでない方は{" "}
            <Link href="/signup" className="text-blue-600 hover:underline">
              新規登録
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
