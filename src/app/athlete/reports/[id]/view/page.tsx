import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLang } from "@/lib/get-lang";
import { t } from "@/lib/translations";
import { AppNav } from "@/components/AppNav";

interface PageProps {
  params: Promise<{ id: string }>;
}

function StatusBadge({ submitted, tr }: { submitted: boolean; tr: { submitted: string; draft: string } }) {
  return submitted ? (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
      {tr.submitted}
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
      {tr.draft}
    </span>
  );
}

export default async function ReportViewPage({ params }: PageProps) {
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
      comments: {
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
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
            href={`/athlete/reports/${id}`}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {tr.editMode}
          </Link>
        </div>
      </div>

      <main className="min-h-screen bg-zinc-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

          {/* Report header */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-900">
              {tr.weeklyReport} {weekLabel}
            </h1>
            <StatusBadge submitted={!!report.submittedAt} tr={tr} />
          </div>

          {/* Training Sessions */}
          {report.sessions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
                  Training Sessions
                </h2>
                <div className="flex-1 border-t border-zinc-200" />
              </div>

              {report.sessions.map((session) => {
                const setIndices = [
                  ...new Set(session.results.map((r) => r.setIndex)),
                ].sort((a, b) => a - b);

                return (
                  <div
                    key={session.id}
                    className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden"
                  >
                    <div className="px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                      <h3 className="text-sm font-semibold text-zinc-800">
                        {formatSessionDate(session.date)}
                      </h3>
                    </div>

                    <div className="px-4 py-3 space-y-4">
                      {session.menuText && (
                        <pre className="whitespace-pre-wrap text-sm font-sans text-zinc-700 leading-relaxed">
                          {session.menuText}
                        </pre>
                      )}

                      {setIndices.length > 0 && (
                        <div className="space-y-3 border-t border-zinc-100 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                            Results
                          </p>
                          {setIndices.map((setIndex) => {
                            const setResults = session.results
                              .filter((r) => r.setIndex === setIndex)
                              .sort((a, b) => a.segmentIndex - b.segmentIndex);
                            return (
                              <div key={setIndex} className="space-y-1">
                                <p className="text-xs font-semibold text-zinc-500">
                                  Set {setIndex}
                                </p>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm min-w-[340px]">
                                    <thead>
                                      <tr className="text-xs text-zinc-400 border-b border-zinc-100">
                                        <th className="text-left font-medium py-1 pr-3">Seg</th>
                                        <th className="text-right font-medium py-1 pr-3">Distance</th>
                                        <th className="text-right font-medium py-1 pr-3">Time</th>
                                        <th className="text-left font-medium py-1">Note</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {setResults.map((r) => (
                                        <tr
                                          key={r.id}
                                          className="border-b border-zinc-50 last:border-0"
                                        >
                                          <td className="py-1.5 pr-3 text-zinc-500">
                                            {r.segmentIndex}
                                          </td>
                                          <td className="py-1.5 pr-3 text-right tabular-nums text-zinc-800">
                                            {r.distanceM != null ? `${r.distanceM} m` : "—"}
                                          </td>
                                          <td className="py-1.5 pr-3 text-right tabular-nums">
                                            {r.isDnf ? (
                                              <span className="text-red-500 font-medium text-xs">DNF</span>
                                            ) : r.timeSec != null ? (
                                              <span className="text-zinc-800">{r.timeSec.toFixed(2)} s</span>
                                            ) : (
                                              <span className="text-zinc-400">—</span>
                                            )}
                                          </td>
                                          <td className="py-1.5 text-zinc-500 text-xs">
                                            {r.note ?? ""}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Weekly Reflection */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
                {tr.weeklyReflection}
              </h2>
              <div className="flex-1 border-t border-zinc-200" />
            </div>
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm px-4 py-4">
              {report.reflection ? (
                <pre className="whitespace-pre-wrap text-sm font-sans text-zinc-700 leading-relaxed">
                  {report.reflection}
                </pre>
              ) : (
                <p className="text-sm text-zinc-400">{tr.notFilled}</p>
              )}
            </div>
          </section>

          {/* Coach comments */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
                {tr.coachComments}
              </h2>
              <div className="flex-1 border-t border-zinc-200" />
            </div>
            {report.comments.length === 0 ? (
              <p className="text-sm text-zinc-400 py-2">{tr.noComments}</p>
            ) : (
              <div className="space-y-3">
                {report.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-white rounded-xl border border-zinc-200 shadow-sm px-4 py-3 space-y-2"
                  >
                    {comment.bodyJa ? (
                      <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
                        {comment.bodyJa}
                      </p>
                    ) : (
                      <p className="text-sm text-zinc-500 whitespace-pre-wrap leading-relaxed">
                        {comment.body}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400">
                      {comment.author.name} ·{" "}
                      {new Date(comment.createdAt).toLocaleDateString(tr.dateLocale)}
                    </p>
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

function formatSessionDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  });
}
