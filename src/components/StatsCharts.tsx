"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

const LINE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
];

function formatTimeSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s.toFixed(1)}s`;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
}

type TimeTrendRow = Record<string, string | number>;
type VolumeRow = { week: string; volume: number };

interface StatsChartsProps {
  timeTrendData: TimeTrendRow[];
  distances: number[];
  volumeData: VolumeRow[];
}

export default function StatsCharts({
  timeTrendData,
  distances,
  volumeData,
}: StatsChartsProps) {
  const hasTimeTrend = timeTrendData.length > 0 && distances.length > 0;
  const hasVolume = volumeData.some((r) => r.volume > 0);

  return (
    <div className="space-y-10">
      {/* 距離別タイム推移 */}
      <section>
        <h2 className="text-lg font-semibold mb-1">距離別ベストタイム推移</h2>
        <p className="text-sm text-muted-foreground mb-4">
          週ごとの各距離ベストタイム（値が低いほど良い）
        </p>
        {hasTimeTrend ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={timeTrendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={formatTimeSec}
                tick={{ fontSize: 11 }}
                width={52}
              />
              <Tooltip
                formatter={(value) => [formatTimeSec(Number(value)), ""]}
                labelFormatter={(label) => `週: ${label}`}
              />
              <Legend />
              {distances.map((dist, i) => (
                <Line
                  key={dist}
                  type="monotone"
                  dataKey={`${dist}m`}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            この期間にタイム記録がありません
          </p>
        )}
      </section>

      {/* 週次ボリューム */}
      <section>
        <h2 className="text-lg font-semibold mb-1">週次走行距離</h2>
        <p className="text-sm text-muted-foreground mb-4">
          週ごとの合計走行距離（DNF含む）
        </p>
        {hasVolume ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={volumeData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `${v}m`}
                tick={{ fontSize: 11 }}
                width={52}
              />
              <Tooltip
                formatter={(value) => [`${Number(value)}m`, "走行距離"]}
                labelFormatter={(label) => `週: ${label}`}
              />
              <Bar dataKey="volume" name="走行距離" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            この期間に距離記録がありません
          </p>
        )}
      </section>
    </div>
  );
}
