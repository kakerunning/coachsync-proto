import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { logout } from "@/lib/auth";
import { getWeekStart } from "@/lib/api-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

async function createThisWeekReport(athleteId: string) {
  "use server";
  const weekStart = getWeekStart();
  const report = await prisma.weeklyReport.upsert({
    where: { athleteId_weekStart: { athleteId, weekStart } },
    update: {},
    create: { athleteId, weekStart, reflection: "" },
  });
  redirect(`/athlete/reports/${report.id}`);
}

export default async function AthleteDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.role !== "ATHLETE") redirect("/login");

  const weekStart = getWeekStart();

  const [thisWeekReport, pastReports] = await Promise.all([
    prisma.weeklyReport.findUnique({
      where: { athleteId_weekStart: { athleteId: dbUser.id, weekStart } },
    }),
    prisma.weeklyReport.findMany({
      where: { athleteId: dbUser.id },
      orderBy: { weekStart: "desc" },
      take: 5,
      select: {
        id: true,
        weekStart: true,
        submittedAt: true,
      },
    }),
  ]);

  const createReport = createThisWeekReport.bind(null, dbUser.id);

  return (
    <main className="min-h-screen bg-background p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">アスリートダッシュボード</h1>
        <form action={logout}>
          <Button variant="outline" size="sm" type="submit">
            ログアウト
          </Button>
        </form>
      </div>

      <p className="text-muted-foreground mb-6">
        Welcome, {dbUser.name} ({dbUser.role})
      </p>

      <div className="mb-6">
        <Link href="/athlete/stats">
          <Button variant="outline" size="sm">統計・グラフを見る →</Button>
        </Link>
      </div>

      {/* 今週のレポート */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>今週のレポート</CardTitle>
        </CardHeader>
        <CardContent>
          {thisWeekReport ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {formatWeekRange(thisWeekReport.weekStart)}
                </span>
                {thisWeekReport.submittedAt ? (
                  <Badge>提出済み</Badge>
                ) : (
                  <Badge variant="secondary">下書き</Badge>
                )}
              </div>
              <Link href={`/athlete/reports/${thisWeekReport.id}/view`}>
                <Button size="sm">開く</Button>
              </Link>
            </div>
          ) : (
            <form action={createReport}>
              <Button type="submit">今週のレポートを開始</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* 過去のレポート */}
      <Card>
        <CardHeader>
          <CardTitle>過去のレポート</CardTitle>
        </CardHeader>
        <CardContent>
          {pastReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              まだレポートがありません
            </p>
          ) : (
            <ul className="space-y-2">
              {pastReports.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{formatWeekRange(r.weekStart)}</span>
                    {r.submittedAt ? (
                      <Badge>提出済み</Badge>
                    ) : (
                      <Badge variant="secondary">下書き</Badge>
                    )}
                  </div>
                  <Link href={`/athlete/reports/${r.id}/view`}>
                    <Button variant="outline" size="sm">
                      開く
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
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
