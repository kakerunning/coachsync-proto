"use client";

import { useState } from "react";
import { t, type Lang } from "@/lib/translations";

type Result = {
  id: string;
  setIndex: number;
  segmentIndex: number;
  distanceM: number | null;
  timeSec: number | null;
  isDnf: boolean;
  note: string | null;
};

type Session = {
  id: string;
  date: string | Date;
  menuText: string;
  menuTextDe: string | null;
  results: Result[];
};

type Report = {
  reflection: string;
  reflectionDe: string | null;
  sessions: Session[];
};

function groupBySets(results: Result[]): Map<number, Result[]> {
  const map = new Map<number, Result[]>();
  for (const r of results) {
    if (!map.has(r.setIndex)) map.set(r.setIndex, []);
    map.get(r.setIndex)!.push(r);
  }
  return map;
}

function formatSessionDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

export function ReportViewer({ report, lang }: { report: Report; lang: Lang }) {
  const tr = t[lang];
  const [showDe, setShowDe] = useState(true);

  return (
    <div className="space-y-6">
      {/* Language toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400 uppercase tracking-widest font-semibold mr-1">
          {tr.language}
        </span>
        <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5">
          <button
            onClick={() => setShowDe(false)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              !showDe
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {tr.original}
          </button>
          <button
            onClick={() => setShowDe(true)}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              showDe
                ? "bg-zinc-900 text-white shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Deutsch
          </button>
        </div>
      </div>

      {/* Training sessions */}
      {report.sessions.length === 0 ? (
        <p className="text-sm text-zinc-400">{tr.noSessions}</p>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
              Training Sessions
            </h2>
            <div className="flex-1 border-t border-zinc-200" />
          </div>

          {report.sessions.map((session) => {
            const sets = groupBySets(session.results);
            const menuDisplay =
              showDe && session.menuTextDe ? session.menuTextDe : session.menuText;

            return (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                  <h3 className="text-sm font-semibold text-zinc-800">
                    {formatSessionDate(session.date)}
                  </h3>
                  {showDe && !session.menuTextDe && session.menuText && (
                    <span className="text-xs text-amber-500 font-medium">
                      {tr.translationPending}
                    </span>
                  )}
                </div>

                <div className="px-4 py-3 space-y-4">
                  <pre className="whitespace-pre-wrap text-sm font-sans text-zinc-700 leading-relaxed">
                    {menuDisplay}
                  </pre>

                  {sets.size > 0 && (
                    <div className="space-y-3 border-t border-zinc-100 pt-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                        Results
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse min-w-[380px]">
                          <thead>
                            <tr className="text-xs text-zinc-400 border-b border-zinc-200">
                              <th className="text-center font-medium px-2 py-1.5">Set</th>
                              <th className="text-center font-medium px-2 py-1.5">Seg</th>
                              <th className="text-right font-medium px-2 py-1.5">Dist (m)</th>
                              <th className="text-right font-medium px-2 py-1.5">Zeit (s)</th>
                              <th className="text-left font-medium px-2 py-1.5">Notiz</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from(sets.entries()).map(([setIndex, segs]) =>
                              segs.map((r, i) => (
                                <tr
                                  key={r.id}
                                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors"
                                >
                                  {i === 0 && (
                                    <td
                                      className="px-2 py-1.5 text-center text-xs font-semibold text-zinc-500"
                                      rowSpan={segs.length}
                                    >
                                      {setIndex}
                                    </td>
                                  )}
                                  <td className="px-2 py-1.5 text-center text-zinc-500 text-xs">
                                    {r.segmentIndex}
                                  </td>
                                  <td className="px-2 py-1.5 text-right tabular-nums text-zinc-800">
                                    {r.distanceM ?? "—"}
                                  </td>
                                  <td className="px-2 py-1.5 text-right tabular-nums">
                                    {r.isDnf ? (
                                      <span className="text-red-500 font-semibold text-xs">DNF</span>
                                    ) : r.timeSec !== null ? (
                                      <span className="text-zinc-800">{r.timeSec.toFixed(2)}</span>
                                    ) : (
                                      <span className="text-zinc-400">—</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-1.5 text-zinc-500 text-xs">
                                    {r.note ?? ""}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly reflection */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
            {tr.weeklyReflection}
          </h2>
          <div className="flex-1 border-t border-zinc-200" />
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm px-4 py-4 space-y-2">
          {showDe && !report.reflectionDe && report.reflection && (
            <p className="text-xs text-amber-500 font-medium">
              {tr.translationPendingNote}
            </p>
          )}
          <pre className="whitespace-pre-wrap text-sm font-sans text-zinc-700 leading-relaxed">
            {showDe && report.reflectionDe ? report.reflectionDe : report.reflection || "—"}
          </pre>
        </div>
      </div>
    </div>
  );
}
