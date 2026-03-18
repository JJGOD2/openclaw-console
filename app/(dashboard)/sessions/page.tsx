"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface Session {
  id: string; workspaceId: string; agentId: string;
  platform: string; userId: string; title: string | null;
  isActive: boolean; messageCount: number; lastActiveAt: string; createdAt: string;
  _count: { messages: number };
  workspace: { client: string; name: string };
}
interface Message {
  id: string; role: string; content: string;
  tokenCount: number | null; createdAt: string;
}
interface SessionDetail extends Session { messages: Message[]; }

const PLATFORM_COLOR: Record<string, string> = {
  LINE:     "bg-green-50 text-green-700",
  TELEGRAM: "bg-blue-50 text-blue-700",
  SLACK:    "bg-purple-50 text-purple-700",
  DISCORD:  "bg-indigo-50 text-indigo-700",
};
const ROLE_STYLE: Record<string, string> = {
  USER:      "bg-gray-50 border-gray-100 ml-0 mr-12",
  ASSISTANT: "bg-amber-50 border-amber-100 ml-12 mr-0",
  SYSTEM:    "bg-blue-50 border-blue-100 mx-0 opacity-70",
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path: string, method = "GET") {
  const r = await fetch(`${BASE}${path}`, {
    method, headers: { Authorization: `Bearer ${tok()}` },
  });
  if (!r.ok) throw new Error(await r.text());
  if (r.status === 204) return null;
  return r.json();
}

export default function SessionsPage() {
  const [selected,   setSelected]   = useState<SessionDetail | null>(null);
  const [wsFilter,   setWsFilter]   = useState("all");
  const [platFilter, setPlatFilter] = useState("all");
  const [clearing,   setClearing]   = useState(false);
  const [clearMsg,   setClearMsg]   = useState<string | null>(null);

  const fetchFn = useCallback(() =>
    apiFetch(`/api/sessions?limit=30${wsFilter !== "all" ? `&workspaceId=${wsFilter}` : ""}${platFilter !== "all" ? `&platform=${platFilter}` : ""}`),
    [wsFilter, platFilter]
  );
  const { data, loading, refetch } = useApi<{ items: Session[]; stats: { platform: string; _count: number }[] }>(fetchFn, [wsFilter, platFilter]);

  async function loadDetail(session: Session) {
    const detail = await apiFetch(`/api/sessions/${session.id}`);
    setSelected(detail);
  }

  async function clearMemory(session: Session) {
    if (!confirm(`確定清除「${session.userId}」的對話記憶？此操作不可復原。`)) return;
    setClearing(true); setClearMsg(null);
    try {
      await apiFetch(`/api/sessions/${session.id}/messages`, "DELETE");
      setClearMsg("記憶已清除");
      setSelected(null);
      refetch();
    } catch (e) { setClearMsg((e as Error).message); }
    finally { setClearing(false); }
  }

  async function closeSession(id: string) {
    await apiFetch(`/api/sessions/${id}/close`, "POST");
    setSelected(null); refetch();
  }

  const platformStats = data?.stats ?? [];
  const totalSessions = data?.items.length ?? 0;
  const activeSessions = data?.items.filter(s => s.isActive).length ?? 0;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-5 gap-2.5">
        <div className="bg-gray-100 rounded-lg px-3.5 py-3 col-span-1">
          <p className="text-[11px] text-gray-400 mb-1">進行中 Sessions</p>
          <p className="text-[22px] font-medium text-green-600">{activeSessions}</p>
        </div>
        <div className="bg-gray-100 rounded-lg px-3.5 py-3">
          <p className="text-[11px] text-gray-400 mb-1">總 Sessions</p>
          <p className="text-[22px] font-medium">{totalSessions}</p>
        </div>
        {["LINE","TELEGRAM","SLACK"].map(p => {
          const s = platformStats.find(x => x.platform === p);
          return (
            <div key={p} className="bg-gray-100 rounded-lg px-3.5 py-3">
              <p className="text-[11px] text-gray-400 mb-1">{p}</p>
              <p className="text-[22px] font-medium">{s?._count ?? 0}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-3 h-[calc(100vh-220px)]">
        {/* Session list */}
        <Card className="flex flex-col overflow-hidden">
          <CardTitle action={
            <div className="flex gap-2">
              <select value={platFilter} onChange={e => setPlatFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[12px]">
                <option value="all">所有通道</option>
                {["LINE","TELEGRAM","SLACK","DISCORD"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          }>
            對話 Sessions
          </CardTitle>
          <div className="flex-1 overflow-y-auto -mx-4 px-4">
            {loading ? (
              <p className="text-[12px] text-gray-400 py-8 text-center">載入中...</p>
            ) : !data?.items.length ? (
              <div className="py-10 text-center">
                <p className="text-[24px] mb-2">💬</p>
                <p className="text-[13px] text-gray-400">尚無對話記錄</p>
                <p className="text-[11px] text-gray-300 mt-1">使用者透過 LINE / Telegram 傳訊後將顯示於此</p>
              </div>
            ) : (
              data.items.map(session => (
                <div key={session.id}
                  onClick={() => loadDetail(session)}
                  className={`p-3 rounded-lg mb-1.5 cursor-pointer border transition-colors ${
                    selected?.id === session.id
                      ? "border-brand-400 bg-amber-50"
                      : "border-transparent hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${PLATFORM_COLOR[session.platform] ?? "bg-gray-100 text-gray-500"}`}>
                      {session.platform}
                    </span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${session.isActive ? "bg-green-400" : "bg-gray-300"}`} />
                    <p className="text-[12px] font-mono text-gray-500 flex-1 truncate">{session.userId}</p>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {new Date(session.lastActiveAt).toLocaleTimeString("zh-TW", { hour:"2-digit", minute:"2-digit" })}
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-700 line-clamp-1">
                    {session.title ?? "(新對話)"}
                  </p>
                  <div className="flex gap-2 text-[10px] text-gray-400 mt-0.5">
                    <span>{session.workspace.client}</span>
                    <span>{session._count.messages} 則訊息</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Session detail */}
        <Card className="flex flex-col overflow-hidden">
          {selected ? (
            <>
              <CardTitle action={
                <div className="flex gap-1.5">
                  <Btn onClick={() => closeSession(selected.id)} className="text-[11px]">關閉 Session</Btn>
                  <Btn variant="danger" onClick={() => clearMemory(selected)}
                    className={`text-[11px] ${clearing ? "opacity-50" : ""}`}>
                    {clearing ? "清除中..." : "清除記憶"}
                  </Btn>
                </div>
              }>
                對話紀錄
              </CardTitle>

              {/* Session info */}
              <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-50 flex-wrap">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLOR[selected.platform] ?? "bg-gray-100 text-gray-500"}`}>
                  {selected.platform}
                </span>
                <span className="text-[12px] font-mono text-gray-500">{selected.userId}</span>
                <span className="text-[11px] text-gray-400">{selected._count.messages} 則訊息</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto ${selected.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {selected.isActive ? "進行中" : "已關閉"}
                </span>
              </div>

              {clearMsg && (
                <p className="text-[12px] text-green-600 mb-2 bg-green-50 px-3 py-2 rounded-lg border border-green-100">
                  ✓ {clearMsg}
                </p>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-2">
                {selected.messages.length === 0 ? (
                  <p className="text-[12px] text-gray-400 py-6 text-center">記憶已清除，對話將重新開始</p>
                ) : (
                  selected.messages.map((msg) => (
                    <div key={msg.id}
                      className={`border rounded-xl px-3 py-2.5 ${ROLE_STYLE[msg.role] ?? "bg-gray-50 border-gray-100"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-gray-500">
                          {msg.role === "USER" ? "用戶" : msg.role === "ASSISTANT" ? "AI" : "系統"}
                        </span>
                        {msg.tokenCount && (
                          <span className="text-[10px] text-gray-400">{msg.tokenCount} tokens</span>
                        )}
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {new Date(msg.createdAt).toLocaleTimeString("zh-TW")}
                        </span>
                      </div>
                      <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-[28px] mb-2">💬</p>
              <p className="text-[13px] text-gray-400">點選左側 Session 查看對話紀錄</p>
              <p className="text-[11px] text-gray-300 mt-1">可在此查看、清除各用戶的對話記憶</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
