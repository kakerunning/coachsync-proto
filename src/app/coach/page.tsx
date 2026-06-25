import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLang } from "@/lib/get-lang";
import { t } from "@/lib/translations";
import { AppNav } from "@/components/AppNav";

function StatusBadge({ submitted, tr }: { submitted: boolean; tr: { submitted: string; draft: string } }) {
  return submitted ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      {tr.submitted}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
      {tr.draft}
    </span>
  );
}

export default async function CoachDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });

  if (!dbUser || dbUser.role !== "COACH") redirect("/login");

  const lang = await getLang();
  const tr = t[lang];

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
    <>
      <AppNav name={dbUser.name} role="COACH" homeHref="/coach" />
      <main className="min-h-screen bg-zinc-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          <section>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">
              {tr.myAthletes}
            </p>

            {athletes.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-zinc-300 p-8 text-center">
                <p className="text-sm text-zinc-400">{tr.noAthletes}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {athletes.map((athlete) => {
                  const latest = athlete.reports[0];
                  const initials = athlete.name
                    .split(/\s+/)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={athlete.id}
                      className="bg-white rounded-xl border border-zinc-200 shadow-sm p-5"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-semibold text-sm shrink-0">
                          {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-zinc-900">{athlete.name}</p>
                          <p className="text-xs text-zinc-400 truncate">{athlete.email}</p>

                          {latest ? (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-zinc-500">
                                {formatWeekRange(latest.weekStart)}
                              </span>
                              <StatusBadge submitted={!!latest.submittedAt} tr={tr} />
                            </div>
                          ) : (
                            <p className="text-xs text-zinc-400 mt-2">{tr.noReport}</p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                          {latest && (
                            <Link
                              href={`/coach/athletes/${athlete.id}/reports/${latest.id}`}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {tr.viewReport}
                            </Link>
                          )}
                          <Link
                            href={`/coach/athletes/${athlete.id}/stats`}
                            className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            {tr.statsArrow}
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
