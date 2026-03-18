"use client";
// app/portal/page.tsx
// 客戶自助入口 — 讓終端使用者查看自己的對話紀錄
// 不需後台帳號，用 userId + workspaceId 的 token 存取
import { useState } from "react";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface PortalSession {
  id: string; platform: string; title: string | null;
  messageCount: number; lastActiveAt: string;
  messages?: { role: string; content: string; createdAt: string }[];
}

export default function CustomerPortalPage() {
  const [userId,    setUserId]    = useState("");
  const [platform,  setPlatform]  = useState("LINE");
  const [sessions,  setSessions]  = useState<PortalSession[]>([]);
  const [selected,  setSelected]  = useState<PortalSession | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [searched,  setSearched]  = useState(false);

  async function lookupSessions() {
    if (!userId.trim()) return;
    setLoading(true); setError(""); setSelected(null);
    try {
      // Public portal endpoint (rate-limited, no auth required)
      const r = await fetch(`${BASE}/portal/sessions?userId=${encodeURIComponent(userId)}&platform=${platform}`);
      if (!r.ok) throw new Error("找不到對話紀錄");
      const data = await r.json();
      setSessions(data.sessions ?? []);
      setSearched(true);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function loadMessages(session: PortalSession) {
    const r = await fetch(`${BASE}/portal/sessions/${session.id}`);
    const d = await r.json();
    setSelected({ ...session, messages: d.messages });
  }

  const PLATFORM_DISPLAY: Record<string, string> = {
    LINE:"LINE", TELEGRAM:"Telegram", SLACK:"Slack", DISCORD:"Discord", WHATSAPP:"WhatsApp",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="MyWrapper Technologies"
            className="h-14 w-auto object-contain mx-auto mb-3" />
          <h1 className="text-[22px] font-medium">我的對話紀錄</h1>
          <p className="text-[14px] text-gray-500 mt-1">輸入您的 LINE / Telegram User ID 查詢歷史對話</p>
        </div>

        {/* Lookup form */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-gray-500 block mb-1.5">通道</label>
              <div className="flex gap-2">
                {Object.keys(PLATFORM_DISPLAY).map(p => (
                  <button key={p} onClick={() => setPlatform(p)}
                    className={`px-3 py-1.5 text-[12px] rounded-lg border transition-colors ${platform === p ? "bg-amber-500 text-white border-amber-500" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    {PLATFORM_DISPLAY[p]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[12px] text-gray-500 block mb-1.5">
                {platform === "LINE" ? "LINE User ID（Uxxxxxxxxx）" : `${PLATFORM_DISPLAY[platform]} User ID`}
              </label>
              <input value={userId} onChange={e => setUserId(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lookupSessions()}
                placeholder={platform === "LINE" ? "U1234567890abcdef..." : "輸入 User ID..."}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-amber-400" />
            </div>
            {error && <p className="text-[12px] text-red-500">{error}</p>}
            <button onClick={lookupSessions} disabled={loading || !userId.trim()}
              className="w-full bg-amber-500 text-white rounded-xl py-2.5 text-[14px] font-medium hover:bg-amber-600 transition-colors disabled:opacity-50">
              {loading ? "查詢中..." : "查詢對話紀錄"}
            </button>
          </div>
        </div>

        {/* Sessions list */}
        {searched && sessions.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <p className="text-[32px] mb-2">💬</p>
            <p className="text-[14px] text-gray-500">找不到對話紀錄</p>
            <p className="text-[12px] text-gray-400 mt-1">請確認 User ID 和通道是否正確</p>
          </div>
        )}

        {sessions.length > 0 && !selected && (
          <div className="space-y-2">
            <p className="text-[12px] text-gray-500 px-1">找到 {sessions.length} 段對話</p>
            {sessions.map(s => (
              <button key={s.id} onClick={() => loadMessages(s)}
                className="w-full bg-white border border-gray-100 rounded-xl p-4 text-left hover:border-gray-200 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[14px] font-medium">{s.title ?? "(對話 " + s.id.slice(0,6) + ")"}</p>
                  <span className="text-[11px] text-gray-400">
                    {new Date(s.lastActiveAt).toLocaleDateString("zh-TW")}
                  </span>
                </div>
                <p className="text-[12px] text-gray-400">{s.messageCount} 則訊息 · {s.platform}</p>
              </button>
            ))}
          </div>
        )}

        {/* Conversation detail */}
        {selected && (
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-[18px]">←</button>
              <p className="text-[14px] font-medium flex-1">{selected.title ?? "對話紀錄"}</p>
              <p className="text-[12px] text-gray-400">{selected.messageCount} 則訊息</p>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {selected.messages?.filter(m => m.role !== "SYSTEM").map((m, i) => (
                <div key={i} className={`flex ${m.role === "USER" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed ${
                    m.role === "USER"
                      ? "bg-amber-500 text-white rounded-br-sm"
                      : "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                    <p className={`text-[10px] mt-1 ${m.role === "USER" ? "text-amber-200" : "text-gray-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString("zh-TW", { hour:"2-digit", minute:"2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[11px] text-gray-400 mt-6">
          Powered by MyWrapper Technologies
        </p>
      </div>
    </div>
  );
}
