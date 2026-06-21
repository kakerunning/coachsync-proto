import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/auth";

export default async function CoachDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });

  if (!dbUser || dbUser.role !== "COACH") redirect("/login");

  // 担当アスリート一覧 + 各アスリートの最新レポート
  const athletes = await prisma.user.findMany({
    where: { coachId: dbUser.id },
    include: {
      reports: {
        orderBy: { weekStart: "desc" },
        take: 1,
        select: {
          id: true,
          weekStart: true,
          submittedAt: true,
          _count: { select: { comments: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
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

      <p className="text-gray-600 mb-6">
        {dbUser.name} ({dbUser.role})
      </p>

      <h2 className="text-lg font-semibold mb-3">担当アスリート</h2>

      {athletes.length === 0 ? (
        <p className="text-gray-400 text-sm">担当アスリートがまだいません。</p>
      ) : (
        <ul className="space-y-3">
          {athletes.map((athlete) => {
            const latest = athlete.reports[0];
            return (
              <li
                key={athlete.id}
                className="border rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{athlete.name}</p>
                  <p className="text-sm text-gray-500">{athlete.email}</p>
                  {latest ? (
                    <p className="text-sm text-gray-500 mt-1">
                      最新レポート:{" "}
                      {new Date(latest.weekStart).toLocaleDateString("ja-JP")}{" "}
                      {latest.submittedAt ? (
                        <span className="text-green-600 font-medium">提出済み</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">下書き</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">レポートなし</p>
                  )}
                </div>
                <div className="flex gap-3">
                  {latest && (
                    <Link
                      href={`/coach/athletes/${athlete.id}/reports/${latest.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      レポートを見る →
                    </Link>
                  )}
                  <Link
                    href={`/coach/athletes/${athlete.id}/stats`}
                    className="text-sm text-gray-500 hover:underline"
                  >
                    統計 →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
