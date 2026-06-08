import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ReportEditor } from "./ReportEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportEditPage({ params }: PageProps) {
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

  // 他人のレポートには 404
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
          href={`/athlete/reports/${report.id}/view`}
          className="text-sm text-primary hover:underline"
        >
          閲覧モード →
        </Link>
      </div>

      <ReportEditor
        reportId={report.id}
        initialReflection={report.reflection}
        initialSubmittedAt={
          report.submittedAt ? report.submittedAt.toISOString() : null
        }
        weekLabel={weekLabel}
        weekStart={report.weekStart.toISOString()}
        initialSessions={report.sessions.map((s) => ({
          id: s.id,
          date: s.date.toISOString().substring(0, 10),
          menuText: s.menuText,
        }))}
      />
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
