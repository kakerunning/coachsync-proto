"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type SaveStatus = "idle" | "saving" | "saved";

interface SessionData {
  id: string;
  date: string; // YYYY-MM-DD (UTC)
  menuText: string;
}

interface Props {
  reportId: string;
  initialReflection: string;
  initialSubmittedAt: string | null;
  weekLabel: string;
  weekStart: string; // ISO string
  initialSessions: SessionData[];
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

  // 週の min/max 日付 (YYYY-MM-DD)
  const weekMinDate = weekStart.substring(0, 10);
  const weekMaxDate = (() => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + 6);
    return d.toISOString().substring(0, 10);
  })();

  // 週内で未使用の最初の日を返す (なければ null)
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

        {sessions.map((session) => (
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
            <CardContent>
              <Textarea
                value={session.menuText}
                onChange={(e) =>
                  handleSessionChange(session.id, "menuText", e.target.value)
                }
                rows={4}
                placeholder="メニューを入力 (例: 2× (200m–200m–400m))"
              />
            </CardContent>
          </Card>
        ))}

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
