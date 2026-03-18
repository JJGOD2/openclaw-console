"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface Agent { id: string; name: string; role: string; description: string; systemPrompt: string; toolBindings: { tool: { name: string; risk: string } }[]; }
interface ChatMessage { role: "user" | "assistant" | "system"; content: string; latencyMs?: number; tokens?: number; tools?: string[]; }

const BASE    = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID   = "ws-a";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path: string, method = "GET", body?: object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function PlaygroundPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [messages,      setMessages]      = useState<ChatMessage[]>([]);
  const [input,         setInput]         = useState("");
  const [sending,       setSending]       = useState(false);
  const [sessionId,     setSessionId]     = useState<string | undefined>();
  const [showPrompt,    setShowPrompt]    = useState(false);
  const [platform,      setPlatform]      = useState("PLAYGROUND");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchAgents = useCallback(() => apiFetch(`/api/playground/agents?workspaceId=${WS_ID}`), []);
  const { data: agents } = useApi<Agent[]>(fetchAgents, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || !selectedAgent || sending) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);

    setMessages(m => [...m, { role: "user", content: userMsg }]);

    try {
      const res = await apiFetch("/api/playground/chat", "POST", {
        workspaceId: WS_ID,
        agentId:     selectedAgent.id,
        message:     userMsg,
        sessionId,
        platform,
      });
      setSessionId(res.sessionId);
      setMessages(m => [...m, {
        role:      "assistant",
        content:   res.reply,
        latencyMs: res.latencyMs,
        tokens:    res.tokenEstimate,
        tools:     res.toolsUsed,
      }]);
    } catch (e) {
      setMessages(m => [...m, { role:"system", content:`錯誤：${(e as Error).message}` }]);
    } finally { setSending(false); }
  }

  async function resetSession() {
    if (!selectedAgent) return;
    await apiFetch("/api/playground/reset", "POST", { workspaceId: WS_ID, agentId: selectedAgent.id });
    setMessages([]); setSessionId(undefined);
    setMessages([{ role:"system", content:"對話已重置，開始新的對話。" }]);
  }

  function selectAgent(agent: Agent) {
    setSelectedAgent(agent);
    setMessages([{ role:"system", content:`已選擇 ${agent.name}（${agent.role}）。開始輸入測試訊息。` }]);
    setSessionId(undefined);
  }

  const PLATFORMS = ["PLAYGROUND","LINE","TELEGRAM","SLACK","DISCORD"];

  return (
    <div className="flex gap-3 h-[calc(100vh-100px)]">
      {/* Left: Agent selector */}
      <div className="w-56 shrink-0 space-y-2">
        <Card className="p-3">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">選擇 Agent</p>
          <div className="space-y-1">
            {(agents ?? []).map(a => (
              <button key={a.id} onClick={() => selectAgent(a)}
                className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${selectedAgent?.id === a.id ? "bg-amber-50 text-amber-800 font-medium" : "hover:bg-gray-50 text-gray-700"}`}>
                <p className="font-medium">{a.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{a.role}</p>
              </button>
            ))}
          </div>
        </Card>

        {selectedAgent && (
          <Card className="p-3">
            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">模擬平台</p>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[12px]">
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mt-3 mb-1.5">掛載 Tools</p>
            <div className="flex flex-wrap gap-1">
              {selectedAgent.toolBindings.map(tb => (
                <span key={tb.tool.name}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${tb.tool.risk === "HIGH" ? "bg-red-50 text-red-600 border-red-100" : "bg-gray-50 text-gray-500 border-gray-100"}`}>
                  {tb.tool.name}
                </span>
              ))}
            </div>

            <button onClick={() => setShowPrompt(!showPrompt)}
              className="text-[11px] text-blue-600 hover:underline mt-2 block">
              {showPrompt ? "隱藏" : "查看"} System Prompt
            </button>
            {showPrompt && (
              <pre className="mt-2 text-[10px] font-mono text-gray-600 bg-gray-50 rounded p-2 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                {selectedAgent.systemPrompt || "(未設定)"}
              </pre>
            )}
          </Card>
        )}
      </div>

      {/* Right: Chat */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardTitle action={
          selectedAgent && (
            <div className="flex gap-1.5">
              <Btn onClick={resetSession} className="text-[11px]">重置對話</Btn>
              {sessionId && <span className="text-[10px] font-mono text-gray-400 self-center">{sessionId.slice(0,8)}…</span>}
            </div>
          )
        }>
          {selectedAgent ? `${selectedAgent.name} — 測試沙箱` : "Agent Playground"}
        </CardTitle>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <p className="text-[32px] mb-3">🧪</p>
              <p className="text-[14px]">選擇左側 Agent 開始測試</p>
              <p className="text-[12px] mt-1 text-gray-300">對話不會觸發真實通道，完全隔離的測試環境</p>
            </div>
          ) : messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "system" ? (
                <div className="w-full text-center">
                  <span className="text-[11px] bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{m.content}</span>
                </div>
              ) : (
                <div className={`max-w-[75%] ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                  <div className={`rounded-xl px-4 py-2.5 text-[13px] leading-relaxed ${
                    m.role === "user" ? "bg-brand-400 text-white rounded-br-sm" : "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-sm"
                  }`}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                  {m.role === "assistant" && (m.latencyMs || m.tokens || m.tools?.length) ? (
                    <div className="flex gap-2 mt-1 text-[10px] text-gray-400">
                      {m.latencyMs && <span>{m.latencyMs}ms</span>}
                      {m.tokens    && <span>{m.tokens} tokens</span>}
                      {m.tools?.length ? <span>tools: {m.tools.join(", ")}</span> : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-[13px] text-gray-500">
                <span className="animate-pulse">Agent 思考中...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="pt-3 border-t border-gray-50">
          {!selectedAgent ? (
            <p className="text-[12px] text-gray-400 text-center py-2">請先選擇 Agent</p>
          ) : (
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="輸入測試訊息（Enter 送出，Shift+Enter 換行）"
                rows={2}
                disabled={sending}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] resize-none focus:outline-none focus:border-brand-400 disabled:opacity-50"
              />
              <Btn variant="primary" onClick={send} className="self-end px-4">
                {sending ? "⋯" : "送出"}
              </Btn>
            </div>
          )}
          {/* Quick test prompts */}
          {selectedAgent && messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["你好，請自我介紹", "幫我查訂單狀態", "我想退貨", "你能做什麼？"].map(t => (
                <button key={t} onClick={() => { setInput(t); }}
                  className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full transition-colors">
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
