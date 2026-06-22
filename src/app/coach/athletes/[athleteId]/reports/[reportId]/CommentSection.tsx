"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Author = { id: string; name: string; role: string };

type CommentData = {
  id: string;
  body: string;
  bodyJa: string | null;
  createdAt: string;
  author: Author;
};

interface Props {
  reportId: string;
  coachId: string;
  initialComments: CommentData[];
}

const textareaCls =
  "w-full rounded-lg border border-zinc-200 bg-transparent p-3 text-sm resize-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition placeholder:text-zinc-400";

export function CommentSection({ reportId, coachId, initialComments }: Props) {
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [newBody, setNewBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!newBody.trim()) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch(`/api/reports/${reportId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newBody }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("コメントの送信に失敗しました");
      return;
    }
    const created: CommentData = await res.json();
    setComments((prev) => [...prev, created]);
    setNewBody("");
  }

  function startEdit(comment: CommentData) {
    setEditingId(comment.id);
    setEditBody(comment.body);
    setError(null);
  }

  async function handleUpdate(commentId: string) {
    if (!editBody.trim()) return;
    setError(null);
    const res = await fetch(`/api/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editBody }),
    });
    if (!res.ok) {
      setError("編集に失敗しました");
      return;
    }
    const updated: CommentData = await res.json();
    setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    setEditingId(null);
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("このコメントを削除しますか？")) return;
    setError(null);
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok && res.status !== 204) {
      setError("削除に失敗しました");
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 whitespace-nowrap">
          コメント
        </h2>
        <div className="flex-1 border-t border-zinc-200" />
      </div>

      {/* Existing comments */}
      {comments.length === 0 ? (
        <p className="text-sm text-zinc-400 py-2">まだコメントはありません</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white rounded-xl border border-zinc-200 shadow-sm px-4 py-3 space-y-2"
            >
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className={textareaCls}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleUpdate(comment.id)}>
                      保存
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(null)}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-zinc-800 whitespace-pre-wrap leading-relaxed">
                    {comment.body}
                  </p>
                  {comment.bodyJa && (
                    <p className="text-xs text-zinc-400 italic border-t border-zinc-100 pt-2">
                      [JA] {comment.bodyJa}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-zinc-400">
                      {comment.author.name} ·{" "}
                      {new Date(comment.createdAt).toLocaleDateString("de-DE")}
                    </span>
                    {comment.author.id === coachId && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(comment)}
                          className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New comment input */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          新しいコメント
        </p>
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          rows={4}
          placeholder="コメントを入力 (ドイツ語 / 英語)"
          className={textareaCls}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button
          onClick={handleCreate}
          disabled={submitting || !newBody.trim()}
          size="sm"
        >
          {submitting ? "送信中..." : "コメントを送信"}
        </Button>
      </div>
    </div>
  );
}
