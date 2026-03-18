"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface PromptVersion {
  id: string; version: number; systemPrompt: string; replyStyle: string;
  changelog: string | null; isActive: boolean; createdBy: string | null; createdAt: string;
}
interface DiffResult {
  v1: PromptVersion; v2: PromptVersion;
  diff: { type: "same"|"add"|"remove"; line: string }[];
  totalChanges: number;
}

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const AGENT = "agent-aria";   // TODO: make this a prop / URL param

function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path: string, method = "GET", body?: object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function PromptHistoryPage() {
  const [selectedA, setSelectedA] = useState<PromptVersion | null>(null);
  const [selectedB, setSelectedB] = useState<PromptVersion | null>(null);
  const [diff,      setDiff]      = useState<DiffResult | null>(null);
  const [rolling,   setRolling]   = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [changelog, setChangelog] = useState("");
  const [saving,    setSaving]    = useState(false);
  const [view,      setView]      = useState<"list"|"save">("list");

  const fetchFn = useCallback(() => apiFetch(`/api/prompt-versions/${AGENT}`), []);
  const { data: versions, loading, refetch } = useApi<PromptVersion[]>(fetchFn, []);

  async function loadDiff(v1: PromptVersion, v2: PromptVersion) {
    const d = await apiFetch(`/api/prompt-versions/${AGENT}/diff/${v1.version}/${v2.version}`);
    setDiff(d); setSelectedA(v1); setSelectedB(v2);
  }

  async function rollback(version: PromptVersion) {
    if (!confirm(`確定回滾至 v${version.version}？這會建立新版本並套用舊的 Prompt。`)) return;
    setRolling(version.id);
    try {
      await apiFetch(`/api/prompt-versions/${AGENT}/rollback/${version.id}`, "POST");
      refetch(); setDiff(null);
    } finally { setRolling(null); }
  }

  async function saveNewVersion() {
    if (!newPrompt.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/api/prompt-versions/${AGENT}`, "POST", {
        systemPrompt: newPrompt, changelog: changelog || undefined,
      });
      setNewPrompt(""); setChangelog(""); setView("list"); refetch();
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <button onClick={() => setView("list")}
            className={`px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${view==="list"?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent hover:border-gray-200"}`}>
            版本歷史
          </button>
          <button onClick={() => setView("save")}
            className={`px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${view==="save"?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent hover:border-gray-200"}`}>
            儲存新版本
          </button>
        </div>
        <span className="text-[12px] text-gray-400">{versions?.length ?? 0} 個版本</span>
      </div>

      {view === "save" && (
        <Card>
          <CardTitle>儲存新 Prompt 版本</CardTitle>
          <div className="space-y-3">
            <div>
              <label className="text-[12px] text-gray-500 block mb-1.5">System Prompt</label>
              <textarea value={newPrompt} onChange={e => setNewPrompt(e.target.value)}
                rows={10} placeholder="輸入新版本的 System Prompt..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] font-mono resize-none focus:outline-none focus:border-brand-400" />
            </div>
            <div>
              <label className="text-[12px] text-gray-500 block mb-1.5">變更說明（選填）</label>
              <input value={changelog} onChange={e => setChangelog(e.target.value)}
                placeholder="例：加入退款處理流程、調整語氣更親切..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-brand-400" />
            </div>
            <Btn variant="primary" onClick={saveNewVersion} className="w-full justify-center">
              {saving ? "儲存中..." : "儲存為新版本"}
            </Btn>
          </div>
        </Card>
      )}

      {view === "list" && (
        <div className="grid grid-cols-2 gap-3">
          {/* Version list */}
          <Card className="overflow-hidden">
            <CardTitle>版本列表</CardTitle>
            {loading ? <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p> :
              !versions?.length ? <p className="text-[12px] text-gray-400 py-4 text-center">尚無版本記錄</p> : (
              <div>
                {versions.map(v => (
                  <div key={v.id} className={`py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 cursor-pointer ${selectedA?.id === v.id ? "bg-amber-50" : ""}`}
                    onClick={() => setSelectedA(v)}>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-mono font-medium text-brand-600 w-8">v{v.version}</span>
                      {v.isActive && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-medium">使用中</span>}
                      <span className="text-[11px] text-gray-400 flex-1 truncate">{v.changelog ?? "(無說明)"}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(v.createdAt).toLocaleDateString("zh-TW")}
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-2">
                      {!v.isActive && (
                        <Btn onClick={e => { e.stopPropagation(); rollback(v); }}
                          className="text-[10px] py-0.5"
                          variant="default">
                          {rolling === v.id ? "回滾中..." : "↩ 回滾至此版本"}
                        </Btn>
                      )}
                      {selectedB && selectedB.id !== v.id && (
                        <Btn onClick={e => { e.stopPropagation(); loadDiff(v, selectedB); }}
                          className="text-[10px] py-0.5">
                          比較此版本
                        </Btn>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Detail / Diff */}
          <Card className="overflow-hidden">
            {diff ? (
              <>
                <CardTitle action={
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-gray-400">{diff.totalChanges} 處變更</span>
                    <Btn onClick={() => setDiff(null)} className="text-[11px]">關閉</Btn>
                  </div>
                }>
                  v{diff.v1.version} vs v{diff.v2.version}
                </CardTitle>
                <div className="font-mono text-[11px] overflow-auto max-h-[60vh]">
                  {diff.diff.map((line, i) => (
                    <div key={i} className={`px-3 py-0.5 leading-relaxed whitespace-pre ${
                      line.type === "add"    ? "bg-green-50 text-green-700"  :
                      line.type === "remove" ? "bg-red-50 text-red-600"     :
                      "text-gray-600"
                    }`}>
                      <span className="mr-2 select-none text-gray-300">
                        {line.type === "add" ? "+" : line.type === "remove" ? "−" : " "}
                      </span>
                      {line.line || "\u00A0"}
                    </div>
                  ))}
                </div>
              </>
            ) : selectedA ? (
              <>
                <CardTitle action={
                  <Btn onClick={() => { const other = versions?.find(v => v.id !== selectedA.id); if(other) loadDiff(selectedA, other); }}
                    className="text-[11px]">
                    與最新版比較
                  </Btn>
                }>
                  v{selectedA.version} 詳情
                </CardTitle>
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">說明</p>
                    <p className="text-[13px] text-gray-600">{selectedA.changelog ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">System Prompt</p>
                    <pre className="text-[12px] font-mono text-gray-700 bg-gray-50 rounded-xl p-4 whitespace-pre-wrap leading-relaxed overflow-auto max-h-80">
                      {selectedA.systemPrompt}
                    </pre>
                  </div>
                  <div className="flex gap-3 text-[11px] text-gray-400">
                    <span>建立：{new Date(selectedA.createdAt).toLocaleString("zh-TW")}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <p className="text-[24px] mb-2">📝</p>
                <p className="text-[13px] text-gray-400">點選左側版本查看詳情</p>
                <p className="text-[11px] text-gray-300 mt-1">選兩個版本後可進行 Diff 比較</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
