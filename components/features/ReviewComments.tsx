"use client";
// Collaborative review comments panel
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";

interface Comment {
  id: string; content: string; createdAt: string;
  user: { email: string; name: string | null };
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path: string, method = "GET", body?: object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  if (r.status === 204) return null;
  return r.json();
}

export function ReviewComments({ reviewId }: { reviewId: string }) {
  const [text,    setText]    = useState("");
  const [posting, setPosting] = useState(false);

  const fetchFn = useCallback(
    () => apiFetch(`/api/review/${reviewId}/comments`),
    [reviewId]
  );
  const { data: comments, refetch } = useApi<Comment[]>(fetchFn, [reviewId]);

  async function post() {
    if (!text.trim()) return;
    setPosting(true);
    try {
      await apiFetch(`/api/review/${reviewId}/comments`, "POST", { content: text });
      setText(""); refetch();
    } finally { setPosting(false); }
  }

  async function del(id: string) {
    await apiFetch(`/api/review/comments/${id}`, "DELETE");
    refetch();
  }

  return (
    <div className="border-t border-gray-50 pt-3 mt-3">
      <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
        協作留言 {comments?.length ? `(${comments.length})` : ""}
      </p>

      <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
        {comments?.map(c => (
          <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-medium text-gray-700">
                {c.user.name ?? c.user.email.split("@")[0]}
              </span>
              <span className="text-[10px] text-gray-400">
                {new Date(c.createdAt).toLocaleTimeString("zh-TW", { hour:"2-digit", minute:"2-digit" })}
              </span>
              <button onClick={() => del(c.id)}
                className="ml-auto text-[10px] text-gray-300 hover:text-red-400 transition-colors">
                ×
              </button>
            </div>
            <p className="text-[12px] text-gray-600 leading-relaxed">{c.content}</p>
          </div>
        ))}
        {(!comments || comments.length === 0) && (
          <p className="text-[11px] text-gray-400">暫無留言</p>
        )}
      </div>

      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && post()}
          placeholder="新增協作留言... (Enter 送出)"
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:border-brand-400" />
        <button onClick={post} disabled={posting || !text.trim()}
          className="text-[12px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors">
          {posting ? "..." : "送出"}
        </button>
      </div>
    </div>
  );
}
