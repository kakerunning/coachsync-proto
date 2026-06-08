import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportViewPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.role !== "ATHLETE") redirect("/login");

  const { id } = await params;
  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: { sessions: { orderBy: { date: "asc" } } },
  });

  if (!report || report.athleteId !== dbUser.id) notFound();

  const weekLabel = formatWeekRange(report.weekStart);

  return (
    <main className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/athlete"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← ダッシュボードに戻る
        </Link>
        <Link
          href={`/athlete/reports/${id}`}
          className="text-sm text-primary hover:underline"
        >
          編集する →
        </Link>
      </div>

      <div className="space-y-6">
        <h1 className="text-xl font-bold">週次レポート {weekLabel}</h1>

        {/* Training Sessions */}
        {report.sessions.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-medium">Training Sessions</h2>
            {report.sessions.map((session) => (
              <div key={session.id} className="rounded-xl border p-4 space-y-2">
                <h3 className="font-medium text-sm">
                  {session.date.toISOString().substring(0, 10)}
                </h3>
                {session.menuText && (
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {session.menuText}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 週次リフレクション */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium">週次リフレクション</h2>
          {report.reflection ? (
            <pre className="whitespace-pre-wrap text-sm font-sans">
              {report.reflection}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">未記入</p>
          )}
        </div>
      </div>
    </main>
  );
}

function formatWeekRange(weekStart: Date): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return `${fmt(start)} - ${fmt(end)}`;
}
