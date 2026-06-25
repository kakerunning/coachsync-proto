"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { t, type Lang } from "@/lib/translations";

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
  lang: Lang;
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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
        {children}
      </h2>
      <div className="flex-1 border-t border-zinc-200" />
    </div>
  );
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

const inputCls =
  "h-8 w-full rounded-md border border-zinc-200 bg-transparent px-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition";

export function ReportEditor({
  lang,
  reportId,
  initialReflection,
  initialSubmittedAt,
  weekLabel,
  weekStart,
  initialSessions,
}: Props) {
  const tr = t[lang];
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
    if (!window.confirm(tr.deleteSessionConfirm)) return;
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

    if (reflectionDebounceRef.current) {
      clearTimeout(reflectionDebounceRef.current);
      reflectionDebounceRef.current = null;
      await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflection }),
      });
    }

    try {
      const res = await fetch(`/api/reports/${reportId}/submit`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError((data as { error?: string }).error ?? tr.submitError);
        return;
      }
      const data = await res.json();
      setSubmittedAt(data.submittedAt);
    } catch {
      setSubmitError(tr.networkError);
    }
  }

  const allDaysUsed = sessions.length >= 7;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-zinc-900">{tr.weeklyReport} {weekLabel}</h1>
          <StatusBadge submitted={!!submittedAt} tr={tr} />
        </div>
        <span className="text-sm text-zinc-400 min-w-[80px] text-right">
          {saveStatus === "saving" && tr.saving}
          {saveStatus === "saved" && tr.saved}
        </span>
      </div>

      {/* Training Sessions */}
      <section className="space-y-4">
        <SectionHeader>Training Sessions</SectionHeader>

        {sessions.map((session) => {
          const setIndices = [
            ...new Set(session.results.map((r) => r.setIndex)),
          ].sort((a, b) => a - b);

          return (
            <div
              key={session.id}
              className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Session header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-100">
                <input
                  type="date"
                  value={session.date}
                  min={weekMinDate}
                  max={weekMaxDate}
                  onChange={(e) =>
                    handleSessionChange(session.id, "date", e.target.value)
                  }
                  className="text-sm font-medium bg-transparent outline-none cursor-pointer text-zinc-800"
                />
                <button
                  onClick={() => handleDeleteSession(session.id)}
                  className="text-zinc-400 hover:text-red-500 transition-colors p-1 rounded"
                  aria-label={tr.deleteSessionConfirm}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Menu text */}
              <div className="px-4 pt-3 pb-3 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Menu
                </label>
                <Textarea
                  value={session.menuText}
                  onChange={(e) =>
                    handleSessionChange(session.id, "menuText", e.target.value)
                  }
                  rows={3}
                  placeholder={tr.menuPlaceholder}
                  className="resize-none text-sm"
                />
              </div>

              {/* Results */}
              <div className="border-t border-zinc-100 px-4 py-3 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                  Results
                </p>

                {setIndices.map((setIndex) => {
                  const setResults = session.results
                    .filter((r) => r.setIndex === setIndex)
                    .sort((a, b) => a.segmentIndex - b.segmentIndex);

                  return (
                    <div key={setIndex} className="space-y-1.5">
                      <p className="text-xs font-semibold text-zinc-500">
                        Set {setIndex}
                      </p>

                      {/* Scrollable results grid */}
                      <div className="overflow-x-auto -mx-1 px-1">
                        <div className="min-w-[460px] space-y-1">
                          {/* Column headers */}
                          <div className="grid grid-cols-[24px_76px_14px_80px_14px_56px_1fr_28px] gap-1.5 items-center px-0.5 mb-1">
                            <span className="text-xs text-zinc-400">#</span>
                            <span className="text-xs text-zinc-400">Dist</span>
                            <span />
                            <span className="text-xs text-zinc-400">Time</span>
                            <span />
                            <span className="text-xs text-zinc-400 text-center">DNF</span>
                            <span className="text-xs text-zinc-400">Note</span>
                            <span />
                          </div>

                          {setResults.map((result) => (
                            <div
                              key={result.id}
                              className="grid grid-cols-[24px_76px_14px_80px_14px_56px_1fr_28px] gap-1.5 items-center"
                            >
                              <span className="text-xs text-zinc-500 text-center tabular-nums">
                                {result.segmentIndex}
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
                                placeholder="—"
                                className={inputCls}
                              />
                              <span className="text-xs text-zinc-400">m</span>
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
                                placeholder="—"
                                disabled={result.isDnf}
                                className={`${inputCls} disabled:opacity-40`}
                              />
                              <span className="text-xs text-zinc-400">s</span>
                              <label className="flex items-center justify-center gap-1 text-xs cursor-pointer select-none text-zinc-600">
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
                                  className="rounded"
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
                                className={inputCls}
                              />
                              <button
                                onClick={() =>
                                  handleDeleteResult(session.id, result.id)
                                }
                                className="flex items-center justify-center text-zinc-300 hover:text-red-400 transition-colors p-1"
                                aria-label={tr.delete}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddSegment(session.id, setIndex)}
                        className="text-xs text-zinc-400 hover:text-primary transition-colors ml-6 py-0.5"
                      >
                        {tr.addSegment}
                      </button>
                    </div>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSet(session.id)}
                  className="text-xs h-7"
                >
                  {tr.addSet}
                </Button>
              </div>
            </div>
          );
        })}

        <Button
          variant="outline"
          onClick={handleAddSession}
          disabled={allDaysUsed}
          className="border-dashed w-full sm:w-auto"
        >
          {tr.addDate}
        </Button>
      </section>

      {/* Weekly Reflection */}
      <section className="space-y-3">
        <SectionHeader>{tr.weeklyReflection}</SectionHeader>
        <Textarea
          value={reflection}
          onChange={(e) => handleReflectionChange(e.target.value)}
          rows={10}
          placeholder={tr.reflectionPlaceholder}
          className="resize-none"
        />
      </section>

      {/* Submit */}
      <section className="space-y-3 border-t border-zinc-200 pt-6 pb-8">
        {confirmingSubmit ? (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-amber-800">
              {tr.confirmSubmitPrompt}
            </span>
            <div className="flex gap-2 ml-auto">
              <Button size="sm" onClick={handleSubmitConfirmed}>
                {tr.submit}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmingSubmit(false)}
              >
                {tr.cancel}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button onClick={() => setConfirmingSubmit(true)}>
              {submittedAt ? tr.resubmit : tr.submit}
            </Button>
            {submittedAt ? (
              <span className="text-xs text-emerald-600 font-medium">
                {tr.submitted} ({new Date(submittedAt).toLocaleDateString(tr.dateLocale)})
              </span>
            ) : (
              <span className="text-xs text-zinc-400">{tr.canEditAfterSubmit}</span>
            )}
          </div>
        )}
        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}
      </section>
    </div>
  );
}
