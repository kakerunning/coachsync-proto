"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

type SaveStatus = "idle" | "saving" | "saved";

interface ResultData {
  id: string;
  setIndex: number;
  segmentIndex: number;
  distanceM: number | null;
  timeSec: number | null;
  isDnf: boolean;
  note: string | null;
}

interface SessionData {
  id: string;
  date: string; // YYYY-MM-DD (UTC)
  menuText: string;
  results: ResultData[];
}

interface Props {
  reportId: string;
  initialReflection: string;
  initialSubmittedAt: string | null;
  weekLabel: string;
  weekStart: string; // ISO string
  initialSessions: SessionData[];
}

function dataToResult(data: unknown): ResultData {
  const d = data as ResultData;
  return {
    id: d.id,
    setIndex: d.setIndex,
    segmentIndex: d.segmentIndex,
    distanceM: d.distanceM,
    timeSec: d.timeSec,
    isDnf: d.isDnf,
    note: d.note,
  };
}

export function ReportEditor({
  reportId,
  initialReflection,
  initialSubmittedAt,
  weekLabel,
  weekStart,
  initialSessions,
}: Props) {
  const [reflection, setReflection] = useState(initialReflection);
  const [submittedAt, setSubmittedAt] = useState<string | null>(
    initialSubmittedAt
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>(initialSessions);

  const reflectionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionDebounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const resultDebounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // 週の min/max 日付 (YYYY-MM-DD)
  const weekMinDate = weekStart.substring(0, 10);
  const weekMaxDate = (() => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + 6);
    return d.toISOString().substring(0, 10);
  })();

  function getDefaultDate(): string | null {
    const usedDates = new Set(sessions.map((s) => s.date));
    const startDate = new Date(weekStart);
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + i);
      const dateStr = d.toISOString().substring(0, 10);
      if (!usedDates.has(dateStr)) return dateStr;
    }
    return null;
  }

  function indicateSaving() {
    setSaveStatus("saving");
  }

  function indicateSaved() {
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  }

  function handleReflectionChange(value: string) {
    setReflection(value);
    indicateSaving();
    if (reflectionDebounceRef.current) clearTimeout(reflectionDebounceRef.current);
    reflectionDebounceRef.current = setTimeout(async () => {
      await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflection: value }),
      });
      indicateSaved();
    }, 1000);
  }

  async function handleAddSession() {
    const defaultDate = getDefaultDate();
    if (!defaultDate) return;

    indicateSaving();
    const res = await fetch(`/api/reports/${reportId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: defaultDate + "T00:00:00.000Z", menuText: "" }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessions((prev) => [
        ...prev,
        {
          id: data.id,
          date: (data.date as string).substring(0, 10),
          menuText: data.menuText,
          results: [],
        },
      ]);
      indicateSaved();
    }
  }

  function handleSessionChange(
    sessionId: string,
    field: "date" | "menuText",
    value: string
  ) {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, [field]: value } : s))
    );
    indicateSaving();

    const existing = sessionDebounceRef.current.get(sessionId);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(async () => {
      const body: Record<string, string> = {};
      if (field === "date") {
        body.date = value + "T00:00:00.000Z";
      } else {
        body[field] = value;
      }
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      indicateSaved();
    }, 1000);

    sessionDebounceRef.current.set(sessionId, timeout);
  }

  async function handleDeleteSession(sessionId: string) {
    if (!window.confirm("このセッションを削除しますか？")) return;
    const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  }

  async function handleAddSet(sessionId: string) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const maxSetIndex = session.results.reduce(
      (max, r) => Math.max(max, r.setIndex),
      0
    );
    const newSetIndex = maxSetIndex + 1;

    indicateSaving();
    const res = await fetch(`/api/sessions/${sessionId}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setIndex: newSetIndex,
        segmentIndex: 1,
        distanceM: null,
        timeSec: null,
        isDnf: false,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, results: [...s.results, dataToResult(data)] }
            : s
        )
      );
      indicateSaved();
    }
  }

  async function handleAddSegment(sessionId: string, setIndex: number) {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const setResults = session.results.filter((r) => r.setIndex === setIndex);
    const maxSegIndex = setResults.reduce(
      (max, r) => Math.max(max, r.segmentIndex),
      0
    );
    const newSegIndex = maxSegIndex + 1;

    indicateSaving();
    const res = await fetch(`/api/sessions/${sessionId}/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setIndex,
        segmentIndex: newSegIndex,
        distanceM: null,
        timeSec: null,
        isDnf: false,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, results: [...s.results, dataToResult(data)] }
            : s
        )
      );
      indicateSaved();
    }
  }

  async function handleDeleteResult(sessionId: string, resultId: string) {
    const res = await fetch(`/api/results/${resultId}`, { method: "DELETE" });
    if (res.ok || res.status === 204) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? { ...s, results: s.results.filter((r) => r.id !== resultId) }
            : s
        )
      );
    }
  }

  function handleResultChange(
    sessionId: string,
    resultId: string,
    field: "distanceM" | "timeSec" | "note",
    value: string
  ) {
    let parsedValue: number | null | string;
    if (field === "distanceM") {
      parsedValue = value === "" ? null : parseInt(value, 10);
      if (parsedValue !== null && isNaN(parsedValue as number)) return;
    } else if (field === "timeSec") {
      parsedValue = value === "" ? null : parseFloat(value);
      if (parsedValue !== null && isNaN(parsedValue as number)) return;
    } else {
      parsedValue = value;
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              results: s.results.map((r) =>
                r.id === resultId ? { ...r, [field]: parsedValue } : r
              ),
            }
          : s
      )
    );
    indicateSaving();

    const debounceKey = resultId + field;
    const existing = resultDebounceRef.current.get(debounceKey);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(async () => {
      await fetch(`/api/results/${resultId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: parsedValue }),
      });
      indicateSaved();
    }, 800);

    resultDebounceRef.current.set(debounceKey, timeout);
  }

  async function handleResultDnfChange(
    sessionId: string,
    resultId: string,
    isDnf: boolean
  ) {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              results: s.results.map((r) =>
                r.id === resultId ? { ...r, isDnf } : r
              ),
            }
          : s
      )
    );
    indicateSaving();
    await fetch(`/api/results/${resultId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDnf }),
    });
    indicateSaved();
  }

  async function handleSubmitConfirmed() {
    setConfirmingSubmit(false);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError((data as { error?: string }).error ?? "提出に失敗しました");
        return;
      }
      const data = await res.json();
      setSubmittedAt(data.submittedAt);
    } catch {
      setSubmitError("ネットワークエラーが発生しました");
    }
  }

  const allDaysUsed = sessions.length >= 7;

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">週次レポート {weekLabel}</h1>
          {submittedAt ? (
            <Badge>提出済み</Badge>
          ) : (
            <Badge variant="secondary">下書き</Badge>
          )}
        </div>
        <span className="text-sm text-muted-foreground h-5">
          {saveStatus === "saving" && "保存中..."}
          {saveStatus === "saved" && "保存しました"}
        </span>
      </div>

      {/* Training Sessions セクション */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Training Sessions</h2>

        {sessions.map((session) => {
          const setIndices = [
            ...new Set(session.results.map((r) => r.setIndex)),
          ].sort((a, b) => a - b);

          return (
            <Card key={session.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <input
                    type="date"
                    value={session.date}
                    min={weekMinDate}
                    max={weekMaxDate}
                    onChange={(e) =>
                      handleSessionChange(session.id, "date", e.target.value)
                    }
                    className="rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus:border-ring"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteSession(session.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    削除
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={session.menuText}
                  onChange={(e) =>
                    handleSessionChange(session.id, "menuText", e.target.value)
                  }
                  rows={4}
                  placeholder="メニューを入力 (例: 2× (200m–200m–400m))"
                />

                {/* Results セクション */}
                <div className="space-y-3 border-t pt-3">
                  <h3 className="text-sm font-medium">Results</h3>

                  {setIndices.map((setIndex) => {
                    const setResults = session.results
                      .filter((r) => r.setIndex === setIndex)
                      .sort((a, b) => a.segmentIndex - b.segmentIndex);

                    return (
                      <div key={setIndex} className="space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Set {setIndex}
                        </p>
                        {setResults.map((result) => (
                          <div
                            key={result.id}
                            className="flex flex-wrap items-center gap-2"
                          >
                            <span className="text-xs text-muted-foreground w-16 shrink-0">
                              Seg {result.segmentIndex}
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={result.distanceM ?? ""}
                              onChange={(e) =>
                                handleResultChange(
                                  session.id,
                                  result.id,
                                  "distanceM",
                                  e.target.value
                                )
                              }
                              placeholder="距離"
                              className="w-20 rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus:border-ring"
                            />
                            <span className="text-xs text-muted-foreground">m</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={result.timeSec ?? ""}
                              onChange={(e) =>
                                handleResultChange(
                                  session.id,
                                  result.id,
                                  "timeSec",
                                  e.target.value
                                )
                              }
                              placeholder="タイム"
                              disabled={result.isDnf}
                              className="w-24 rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus:border-ring disabled:opacity-50"
                            />
                            <span className="text-xs text-muted-foreground">s</span>
                            <label className="flex items-center gap-1 text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={result.isDnf}
                                onChange={(e) =>
                                  handleResultDnfChange(
                                    session.id,
                                    result.id,
                                    e.target.checked
                                  )
                                }
                              />
                              DNF
                            </label>
                            <input
                              type="text"
                              value={result.note ?? ""}
                              onChange={(e) =>
                                handleResultChange(
                                  session.id,
                                  result.id,
                                  "note",
                                  e.target.value
                                )
                              }
                              placeholder="Note"
                              className="flex-1 min-w-24 rounded border border-input bg-transparent px-2 py-1 text-sm outline-none focus:border-ring"
                            />
                            <button
                              onClick={() =>
                                handleDeleteResult(session.id, result.id)
                              }
                              className="text-destructive hover:text-destructive/80 p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddSegment(session.id, setIndex)}
                          className="text-xs h-7 pl-16"
                        >
                          + Segment を追加
                        </Button>
                      </div>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddSet(session.id)}
                    className="text-xs"
                  >
                    + Set を追加
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button
          variant="outline"
          onClick={handleAddSession}
          disabled={allDaysUsed}
        >
          + 日付を追加
        </Button>
      </div>

      {/* 週次リフレクション */}
      <div className="space-y-2">
        <label className="text-sm font-medium">週次リフレクション</label>
        <Textarea
          value={reflection}
          onChange={(e) => handleReflectionChange(e.target.value)}
          rows={10}
          placeholder="今週のトレーニングについて記入してください..."
          className="resize-none"
        />
      </div>

      {/* 提出ボタン */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          {submittedAt ? (
            <Button disabled variant="secondary">
              提出済み
            </Button>
          ) : confirmingSubmit ? (
            <>
              <span className="text-sm font-medium">本当に提出しますか?</span>
              <Button size="sm" onClick={handleSubmitConfirmed}>
                はい
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmingSubmit(false)}
              >
                いいえ
              </Button>
            </>
          ) : (
            <Button onClick={() => setConfirmingSubmit(true)}>提出する</Button>
          )}
          {!submittedAt && !confirmingSubmit && (
            <span className="text-xs text-muted-foreground">
              提出後も編集できます
            </span>
          )}
        </div>
        {submitError && (
          <p className="text-sm text-destructive">{submitError}</p>
        )}
      </div>
    </div>
  );
}
