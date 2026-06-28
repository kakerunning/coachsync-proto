import { redirect, notFound } from "next/navigation";
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

export default async function CoachAthleteStatsPage({
  params,
  searchParams,
}: {
  params: Promise<{ athleteId: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
  if (!dbUser || dbUser.role !== "COACH") redirect("/login");

  const lang = await getLang();
  const tr = t[lang];

  const { athleteId } = await params;

  const athlete = await prisma.user.findUnique({ where: { id: athleteId } });
  if (!athlete || athlete.coachId !== dbUser.id) return notFound();

  const { period: periodParam } = await searchParams;
  const period: Period = (["4w", "12w", "all"] as Period[]).includes(
    periodParam as Period
  )
    ? (periodParam as Period)
    : "4w";

  const periodStart = getPeriodStart(period);
  const reportFilter = {
    athleteId,
    ...(periodStart ? { weekStart: { gte: periodStart } } : {}),
  };

  const speedResults = await prisma.sessionResult.findMany({
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

  const weeklySpeedMap = new Map<string, { sum: number; count: number }>();
  for (const r of speedResults) {
    const weekKey = r.session.report.weekStart.toISOString();
    const speed = r.distanceM! / r.timeSec!;
    const cur = weeklySpeedMap.get(weekKey) ?? { sum: 0, count: 0 };
    weeklySpeedMap.set(weekKey, { sum: cur.sum + speed, count: cur.count + 1 });
  }

  const weeklyVol = new Map<string, number>();
  for (const r of volumeResults) {
    const weekKey = r.session.report.weekStart.toISOString();
    weeklyVol.set(weekKey, (weeklyVol.get(weekKey) ?? 0) + r.distanceM!);
  }

  const allWeekKeys = Array.from(
    new Set([...weeklySpeedMap.keys(), ...weeklyVol.keys()])
  ).sort();

  const avgSpeedData = allWeekKeys
    .filter((weekKey) => weeklySpeedMap.has(weekKey))
    .map((weekKey) => {
      const entry = weeklySpeedMap.get(weekKey)!;
      return {
        week: formatWeekLabel(new Date(weekKey)),
        speed: parseFloat((entry.sum / entry.count).toFixed(3)),
      };
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
      <AppNav name={dbUser.name} role="COACH" homeHref="/coach" />
      <div className="border-b border-zinc-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-10 flex items-center">
          <Link href="/coach" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
            {tr.backToDashboard}
          </Link>
        </div>
      </div>
      <main className="min-h-screen bg-zinc-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">{tr.statsTitle}</h1>
            <p className="text-sm text-zinc-500 mt-0.5">{athlete.name}</p>
          </div>

          {/* Period filter */}
          <div className="flex gap-2">
            {(["4w", "12w", "all"] as Period[]).map((p) => (
              <Link
                key={p}
                href={`/coach/athletes/${athleteId}/stats?period=${p}`}
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
            avgSpeedData={avgSpeedData}
            volumeData={volumeData}
            lang={lang}
          />
        </div>
      </main>
    </>
  );
}
