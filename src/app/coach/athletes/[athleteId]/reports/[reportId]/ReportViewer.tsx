"use client";

import { useState } from "react";

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

export function ReportViewer({ report }: { report: Report }) {
  const [showDe, setShowDe] = useState(true);

  return (
    <div className="space-y-6">
      {/* 言語切替トグル */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">表示言語:</span>
        <button
          onClick={() => setShowDe(false)}
          className={`text-sm px-3 py-1 rounded border ${
            !showDe
              ? "bg-gray-800 text-white border-gray-800"
              : "text-gray-600 border-gray-300 hover:bg-gray-100"
          }`}
        >
          原文
        </button>
        <button
          onClick={() => setShowDe(true)}
          className={`text-sm px-3 py-1 rounded border ${
            showDe
              ? "bg-gray-800 text-white border-gray-800"
              : "text-gray-600 border-gray-300 hover:bg-gray-100"
          }`}
        >
          Deutsch
        </button>
      </div>

      {/* トレーニングセッション */}
      {report.sessions.length === 0 ? (
        <p className="text-gray-400 text-sm">セッションなし</p>
      ) : (
        report.sessions.map((session) => {
          const sets = groupBySets(session.results);
          const menuDisplay =
            showDe && session.menuTextDe ? session.menuTextDe : session.menuText;

          return (
            <div key={session.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-700">
                  {new Date(session.date).toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </h3>
                {showDe && !session.menuTextDe && session.menuText && (
                  <span className="text-xs text-orange-400">(翻訳未生成)</span>
                )}
              </div>

              <p className="text-sm whitespace-pre-wrap text-gray-800">{menuDisplay}</p>

              {sets.size > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-500">
                        <th className="px-2 py-1 border">Set</th>
                        <th className="px-2 py-1 border">Seg</th>
                        <th className="px-2 py-1 border">Dist (m)</th>
                        <th className="px-2 py-1 border">Zeit (s)</th>
                        <th className="px-2 py-1 border">DNF</th>
                        <th className="px-2 py-1 border">Notiz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(sets.entries()).map(([setIndex, segs]) =>
                        segs.map((r, i) => (
                          <tr key={r.id} className="hover:bg-gray-50">
                            {i === 0 && (
                              <td
                                className="px-2 py-1 border font-medium text-center"
                                rowSpan={segs.length}
                              >
                                {setIndex}
                              </td>
                            )}
                            <td className="px-2 py-1 border text-center">{r.segmentIndex}</td>
                            <td className="px-2 py-1 border text-right">
                              {r.distanceM ?? "—"}
                            </td>
                            <td className="px-2 py-1 border text-right">
                              {r.isDnf ? (
                                <span className="text-red-500">DNF</span>
                              ) : r.timeSec !== null ? (
                                r.timeSec.toFixed(1)
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="px-2 py-1 border text-center">
                              {r.isDnf ? "✓" : ""}
                            </td>
                            <td className="px-2 py-1 border text-gray-600">
                              {r.note ?? ""}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })
      )}

      {/* 週次リフレクション */}
      <div className="border rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-sm text-gray-700">週次リフレクション</h3>
        {showDe && !report.reflectionDe && report.reflection && (
          <span className="text-xs text-orange-400">(翻訳未生成 — 提出後に生成されます)</span>
        )}
        <p className="text-sm whitespace-pre-wrap text-gray-800">
          {showDe && report.reflectionDe ? report.reflectionDe : report.reflection || "—"}
        </p>
      </div>
    </div>
  );
}
