"use client";

import { useState } from "react";

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
    <div className="space-y-4 border-t pt-6 mt-6">
      <h2 className="font-semibold text-base">コメント</h2>

      {comments.length === 0 ? (
        <p className="text-sm text-gray-400">まだコメントはありません</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border p-3 space-y-1">
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={3}
                    className="w-full rounded border border-gray-300 p-2 text-sm resize-none outline-none focus:border-gray-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(comment.id)}
                      className="text-sm bg-gray-800 text-white px-3 py-1 rounded hover:bg-gray-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-sm text-gray-500 px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                  {comment.bodyJa && (
                    <p className="text-xs text-gray-400 italic">[JA] {comment.bodyJa}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-400">
                      {comment.author.name} ·{" "}
                      {new Date(comment.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                    {comment.author.id === coachId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(comment)}
                          className="text-xs text-blue-500 hover:underline"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          削除
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* 新規コメント入力 */}
      <div className="space-y-2">
        <textarea
          value={newBody}
          onChange={(e) => setNewBody(e.target.value)}
          rows={4}
          placeholder="コメントを入力 (ドイツ語/英語)"
          className="w-full rounded border border-gray-300 p-2 text-sm resize-none outline-none focus:border-gray-500"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          onClick={handleCreate}
          disabled={submitting || !newBody.trim()}
          className="bg-gray-800 text-white text-sm px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "送信中..." : "コメントを送信"}
        </button>
      </div>
    </div>
  );
}
