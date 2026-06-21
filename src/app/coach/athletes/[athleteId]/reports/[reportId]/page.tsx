import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { ReportViewer } from "./ReportViewer";
import { CommentSection } from "./CommentSection";

export default async function CoachReportPage({
  params,
}: {
  params: Promise<{ athleteId: string; reportId: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.role !== "COACH") redirect("/login");

  const { athleteId, reportId } = await params;

  // アスリートが担当アスリートであることを確認
  const athlete = await prisma.user.findUnique({ where: { id: athleteId } });
  if (!athlete || athlete.coachId !== dbUser.id) return notFound();

  const report = await prisma.weeklyReport.findUnique({
    where: { id: reportId },
    include: {
      sessions: {
        orderBy: { date: "asc" },
        include: {
          results: {
            orderBy: [{ setIndex: "asc" }, { segmentIndex: "asc" }],
          },
        },
      },
      comments: {
        include: { author: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!report || report.athleteId !== athleteId) return notFound();

  const weekEnd = new Date(report.weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const dateRange = `${new Date(report.weekStart).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  })} – ${weekEnd.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })}`;

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/coach" className="text-sm text-gray-500 hover:underline">
          ← ダッシュボード
        </Link>
        <Link
          href={`/coach/athletes/${athleteId}/stats`}
          className="text-sm text-gray-500 hover:underline"
        >
          統計を見る →
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold">Trainingsbericht {dateRange}</h1>
        <p className="text-gray-500 text-sm mt-1">{athlete.name}</p>
        {report.submittedAt ? (
          <span className="text-xs text-green-600 font-medium">
            提出済み ({new Date(report.submittedAt).toLocaleDateString("ja-JP")})
          </span>
        ) : (
          <span className="text-xs text-yellow-600 font-medium">下書き</span>
        )}
      </div>

      <ReportViewer report={report} />
      <CommentSection
        reportId={reportId}
        coachId={dbUser.id}
        initialComments={report.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
