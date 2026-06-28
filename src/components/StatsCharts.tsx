"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";
import { t, type Lang } from "@/lib/translations";

type AvgSpeedRow = { week: string; speed: number };
type VolumeRow = { week: string; volume: number };

interface StatsChartsProps {
  avgSpeedData: AvgSpeedRow[];
  volumeData: VolumeRow[];
  lang: Lang;
}

export default function StatsCharts({
  avgSpeedData,
  volumeData,
  lang,
}: StatsChartsProps) {
  const tr = t[lang];
  const hasAvgSpeed = avgSpeedData.length > 0;
  const hasVolume = volumeData.some((r) => r.volume > 0);

  return (
    <div className="space-y-10">
      {/* Weekly average speed */}
      <section>
        <h2 className="text-lg font-semibold mb-1">{tr.avgSpeedTitle}</h2>
        <p className="text-sm text-muted-foreground mb-4">{tr.avgSpeedDesc}</p>
        {hasAvgSpeed ? (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={avgSpeedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `${Number(v).toFixed(2)}`}
                tick={{ fontSize: 11 }}
                width={52}
                domain={["auto", "auto"]}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(2)} m/s`, tr.speedLabel]}
                labelFormatter={(label) => `${tr.weekLabel} ${label}`}
              />
              <Line
                type="monotone"
                dataKey="speed"
                name={tr.speedLabel}
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {tr.noAvgSpeed}
          </p>
        )}
      </section>

      {/* Weekly volume */}
      <section>
        <h2 className="text-lg font-semibold mb-1">{tr.weeklyVolumeTitle}</h2>
        <p className="text-sm text-muted-foreground mb-4">{tr.weeklyVolumeDesc}</p>
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
                formatter={(value) => [`${Number(value)}m`, tr.distanceLabel]}
                labelFormatter={(label) => `${tr.weekLabel} ${label}`}
              />
              <Bar dataKey="volume" name={tr.distanceLabel} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground py-8 text-center">
            {tr.noVolume}
          </p>
        )}
      </section>
    </div>
  );
}
