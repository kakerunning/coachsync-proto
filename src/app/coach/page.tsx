import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/auth";

export default async function CoachDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });

  if (!dbUser || dbUser.role !== "COACH") redirect("/login");

  return (
    <main className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">コーチダッシュボード</h1>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-600 border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
          >
            ログアウト
          </button>
        </form>
      </div>
      <p className="text-gray-600">
        Welcome, {dbUser.name} ({dbUser.role})
      </p>
      <p className="text-sm text-gray-400 mt-4">Step 4 で実装予定</p>
    </main>
  );
}
