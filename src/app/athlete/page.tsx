import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/api-auth";
import { getLang } from "@/lib/get-lang";
import { t, type Lang } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { AppNav } from "@/components/AppNav";

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

function StatusBadge({ submitted, lang }: { submitted: boolean; lang: Lang }) {
  return submitted ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      {t[lang].submitted}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
      {t[lang].draft}
    </span>
  );
}

export default async function AthleteDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.role !== "ATHLETE") redirect("/login");

  const lang = await getLang();
  const tr = t[lang];
  const weekStart = getWeekStart();

  const [thisWeekReport, pastReports] = await Promise.all([
    prisma.weeklyReport.findUnique({
      where: { athleteId_weekStart: { athleteId: dbUser.id, weekStart } },
    }),
    prisma.weeklyReport.findMany({
      where: { athleteId: dbUser.id },
      orderBy: { weekStart: "desc" },
      take: 5,
      select: { id: true, weekStart: true, submittedAt: true },
    }),
  ]);

  const createReport = createThisWeekReport.bind(null, dbUser.id);

  return (
    <>
      <AppNav name={dbUser.name} role="ATHLETE" homeHref="/athlete" />
      <main className="min-h-screen bg-zinc-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* This week */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
              {tr.thisWeekTraining}
            </p>
            {thisWeekReport ? (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-zinc-900">
                      {formatWeekRange(thisWeekReport.weekStart)}
                    </span>
                    <StatusBadge submitted={!!thisWeekReport.submittedAt} lang={lang} />
                  </div>
                  <Link href={`/athlete/reports/${thisWeekReport.id}/view`}>
                    <Button size="sm">{tr.open}</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-dashed border-zinc-300 p-8 text-center space-y-4">
                <p className="text-sm text-zinc-500">{tr.noReportThisWeek}</p>
                <form action={createReport}>
                  <Button type="submit">{tr.startReport}</Button>
                </form>
              </div>
            )}
          </section>

          {/* Quick actions */}
          <div>
            <Link href="/athlete/stats">
              <Button variant="outline" size="sm">
                {tr.viewStats}
              </Button>
            </Link>
          </div>

          {/* Past reports */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
              {tr.pastReports}
            </p>
            {pastReports.length === 0 ? (
              <p className="text-sm text-zinc-400 py-2">{tr.noReports}</p>
            ) : (
              <div className="bg-white rounded-xl border border-zinc-200 shadow-sm divide-y divide-zinc-100">
                {pastReports.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm text-zinc-800">
                        {formatWeekRange(r.weekStart)}
                      </span>
                      <StatusBadge submitted={!!r.submittedAt} lang={lang} />
                    </div>
                    <Link href={`/athlete/reports/${r.id}/view`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-500 hover:text-zinc-800"
                      >
                        {tr.openArrow}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

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
