import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import { ReportViewer } from "./ReportViewer";
import { CommentSection } from "./CommentSection";

function StatusBadge({ submitted }: { submitted: boolean }) {
  return submitted ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      提出済み
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
      下書き
    </span>
  );
}

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
  const weekLabel = formatWeekRange(report.weekStart);

  return (
    <>
      <AppNav name={dbUser.name} role="COACH" homeHref="/coach" />
      <div className="border-b border-zinc-100 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between">
          <Link
            href="/coach"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            ← ダッシュボード
          </Link>
          <Link
            href={`/coach/athletes/${athleteId}/stats`}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            統計を見る →
          </Link>
        </div>
      </div>

      <main className="min-h-screen bg-zinc-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* Report header */}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-zinc-900">
                Trainingsbericht {weekLabel}
              </h1>
              <StatusBadge submitted={!!report.submittedAt} />
            </div>
            <p className="text-sm text-zinc-500">{athlete.name}</p>
            {report.submittedAt && (
              <p className="text-xs text-zinc-400">
                提出日: {new Date(report.submittedAt).toLocaleDateString("ja-JP")}
              </p>
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

        </div>
      </main>
    </>
  );
}

function formatWeekRange(weekStart: Date): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  const y = start.getUTCFullYear();
  const fmtShort = (d: Date) =>
    `${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
  return `${y}/${fmtShort(start)} – ${fmtShort(end)}`;
}
