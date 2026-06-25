import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLang } from "@/lib/get-lang";
import { t } from "@/lib/translations";
import StatsCharts from "@/components/StatsCharts";
import { AppNav } from "@/components/AppNav";

type Period = "4w" | "12w" | "all";

function getPeriodStart(period: Period): Date | null {
  if (period === "all") return null;
  const weeks = period === "4w" ? 4 : 12;
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - weeks * 7);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(weekStart: Date): string {
  return `${weekStart.getUTCMonth() + 1}/${weekStart.getUTCDate()}`;
}

export default async function AthleteStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.role !== "ATHLETE") redirect("/login");

  const lang = await getLang();
  const tr = t[lang];

  const { period: periodParam } = await searchParams;
  const period: Period = (["4w", "12w", "all"] as Period[]).includes(
    periodParam as Period
  )
    ? (periodParam as Period)
    : "4w";

  const periodStart = getPeriodStart(period);
  const reportFilter = {
    athleteId: dbUser.id,
    ...(periodStart ? { weekStart: { gte: periodStart } } : {}),
  };

  const trendResults = await prisma.sessionResult.findMany({
    where: {
      isDnf: false,
      timeSec: { not: null },
      distanceM: { not: null },
      session: { report: reportFilter },
    },
    select: {
      distanceM: true,
      timeSec: true,
      session: {
        select: { report: { select: { weekStart: true } } },
      },
    },
    orderBy: { session: { report: { weekStart: "asc" } } },
  });

  const volumeResults = await prisma.sessionResult.findMany({
    where: {
      distanceM: { not: null },
      session: { report: reportFilter },
    },
    select: {
      distanceM: true,
      session: {
        select: { report: { select: { weekStart: true } } },
      },
    },
  });

  const byWeekDist = new Map<string, Map<number, number>>();
  for (const r of trendResults) {
    const weekKey = r.session.report.weekStart.toISOString();
    const dist = r.distanceM!;
    const time = r.timeSec!;
    if (!byWeekDist.has(weekKey)) byWeekDist.set(weekKey, new Map());
    const distMap = byWeekDist.get(weekKey)!;
    if (!distMap.has(dist) || time < distMap.get(dist)!) {
      distMap.set(dist, time);
    }
  }

  const allDistances = new Set<number>();
  for (const r of trendResults) allDistances.add(r.distanceM!);
  const distances = Array.from(allDistances).sort((a, b) => a - b);

  const weeklyVol = new Map<string, number>();
  for (const r of volumeResults) {
    const weekKey = r.session.report.weekStart.toISOString();
    weeklyVol.set(weekKey, (weeklyVol.get(weekKey) ?? 0) + r.distanceM!);
  }

  const allWeekKeys = Array.from(
    new Set([...byWeekDist.keys(), ...weeklyVol.keys()])
  ).sort();

  const timeTrendData = allWeekKeys.map((weekKey) => {
    const distMap = byWeekDist.get(weekKey) ?? new Map();
    const label = formatWeekLabel(new Date(weekKey));
    const row: Record<string, string | number> = { week: label };
    for (const dist of distances) {
      const best = distMap.get(dist);
      if (best !== undefined) row[`${dist}m`] = best;
    }
    return row;
  });

  const volumeData = allWeekKeys.map((weekKey) => ({
    week: formatWeekLabel(new Date(weekKey)),
    volume: weeklyVol.get(weekKey) ?? 0,
  }));

  const periodLabels: Record<Period, string> = {
    "4w": tr.period4w,
    "12w": tr.period12w,
    all: tr.periodAll,
  };

  return (
    <>
      <AppNav name={dbUser.name} role="ATHLETE" homeHref="/athlete" />
      <div className="border-b border-zinc-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-10 flex items-center">
          <Link href="/athlete" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            {tr.backToDashboard}
          </Link>
        </div>
      </div>
      <main className="min-h-screen bg-zinc-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <h1 className="text-xl font-bold text-zinc-900">{tr.statsTitle}</h1>

          {/* Period filter */}
          <div className="flex gap-2">
            {(["4w", "12w", "all"] as Period[]).map((p) => (
              <Link
                key={p}
                href={`/athlete/stats?period=${p}`}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  period === p
                    ? "bg-zinc-900 text-white border-zinc-900"
                    : "border-zinc-300 text-zinc-500 hover:border-zinc-600 hover:text-zinc-800"
                }`}
              >
                {periodLabels[p]}
              </Link>
            ))}
          </div>

          <StatsCharts
            timeTrendData={timeTrendData}
            distances={distances}
            volumeData={volumeData}
          />
        </div>
      </main>
    </>
  );
}
