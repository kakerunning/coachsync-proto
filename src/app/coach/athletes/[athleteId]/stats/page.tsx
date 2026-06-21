import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import StatsCharts from "@/components/StatsCharts";

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

  const { athleteId } = await params;

  // 担当アスリートの確認
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

  // タイム推移用: DNF=false、timeSec/distanceM 必須
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

  // ボリューム用: distanceM 必須 (DNF含む)
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

  // --- タイム推移データ処理 ---
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

  // --- ボリュームデータ処理 ---
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
    "4w": "過去4週",
    "12w": "過去12週",
    all: "全期間",
  };

  return (
    <main className="min-h-screen bg-background p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">統計・グラフ</h1>
          <p className="text-sm text-muted-foreground mt-1">{athlete.name}</p>
        </div>
        <Link
          href="/coach"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← ダッシュボード
        </Link>
      </div>

      {/* 期間フィルタ */}
      <div className="flex gap-2 mb-8">
        {(["4w", "12w", "all"] as Period[]).map((p) => (
          <Link
            key={p}
            href={`/coach/athletes/${athleteId}/stats?period=${p}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              period === p
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
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
    </main>
  );
}
