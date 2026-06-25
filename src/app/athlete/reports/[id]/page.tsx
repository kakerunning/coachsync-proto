import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLang } from "@/lib/get-lang";
import { t } from "@/lib/translations";
import { AppNav } from "@/components/AppNav";
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

  const lang = await getLang();
  const tr = t[lang];

  const { id } = await params;
  const report = await prisma.weeklyReport.findUnique({
    where: { id },
    include: {
      sessions: {
        orderBy: { date: "asc" },
        include: {
          results: { orderBy: [{ setIndex: "asc" }, { segmentIndex: "asc" }] },
        },
      },
    },
  });

  if (!report || report.athleteId !== dbUser.id) notFound();

  const weekLabel = formatWeekRange(report.weekStart);

  return (
    <>
      <AppNav name={dbUser.name} role="ATHLETE" homeHref="/athlete" />
      <div className="border-b border-zinc-100 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between">
          <Link
            href="/athlete"
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {tr.backToDashboard}
          </Link>
          <Link
            href={`/athlete/reports/${report.id}/view`}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {tr.viewMode}
          </Link>
        </div>
      </div>
      <main className="min-h-screen bg-zinc-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <ReportEditor
            lang={lang}
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
              results: s.results.map((r) => ({
                id: r.id,
                setIndex: r.setIndex,
                segmentIndex: r.segmentIndex,
                distanceM: r.distanceM,
                timeSec: r.timeSec,
                isDnf: r.isDnf,
                note: r.note,
              })),
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
