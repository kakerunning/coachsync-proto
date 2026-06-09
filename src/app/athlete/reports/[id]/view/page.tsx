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
            {report.sessions.map((session) => {
              const setIndices = [
                ...new Set(session.results.map((r) => r.setIndex)),
              ].sort((a, b) => a - b);

              return (
                <div key={session.id} className="rounded-xl border p-4 space-y-3">
                  <h3 className="font-medium text-sm">
                    {session.date.toISOString().substring(0, 10)}
                  </h3>
                  {session.menuText && (
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {session.menuText}
                    </pre>
                  )}
                  {setIndices.length > 0 && (
                    <div className="space-y-3 border-t pt-3">
                      <p className="text-xs font-medium text-muted-foreground">Results</p>
                      {setIndices.map((setIndex) => {
                        const setResults = session.results
                          .filter((r) => r.setIndex === setIndex)
                          .sort((a, b) => a.segmentIndex - b.segmentIndex);
                        return (
                          <div key={setIndex} className="space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              Set {setIndex}
                            </p>
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-muted-foreground">
                                  <th className="text-left font-normal py-0.5 pr-3">Seg</th>
                                  <th className="text-right font-normal py-0.5 pr-3">Distance</th>
                                  <th className="text-right font-normal py-0.5 pr-3">Time</th>
                                  <th className="text-center font-normal py-0.5 pr-3">DNF</th>
                                  <th className="text-left font-normal py-0.5">Note</th>
                                </tr>
                              </thead>
                              <tbody>
                                {setResults.map((r) => (
                                  <tr key={r.id} className="border-t border-border/40">
                                    <td className="py-0.5 pr-3">{r.segmentIndex}</td>
                                    <td className="py-0.5 pr-3 text-right">
                                      {r.distanceM != null ? `${r.distanceM} m` : "—"}
                                    </td>
                                    <td className="py-0.5 pr-3 text-right">
                                      {r.isDnf ? "DNF" : r.timeSec != null ? `${r.timeSec} s` : "—"}
                                    </td>
                                    <td className="py-0.5 pr-3 text-center">
                                      {r.isDnf ? "✓" : ""}
                                    </td>
                                    <td className="py-0.5 text-muted-foreground">{r.note ?? ""}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
