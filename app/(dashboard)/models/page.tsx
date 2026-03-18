"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface ModelInfo {
  id: string; provider: string; name: string;
  contextWindow: number; inputCostPer1k: number; outputCostPer1k: number;
  speed: string; recommended: boolean; description: string;
}
interface ModelConfig {
  modelId: string; maxTokens: number; temperature: number; topP: number | null;
  modelInfo: ModelInfo | null;
}

const SPEED_BADGE: Record<string, string> = {
  fast:      "bg-green-50 text-green-700",
  balanced:  "bg-blue-50 text-blue-700",
  powerful:  "bg-purple-50 text-purple-700",
};
const SPEED_LABEL: Record<string, string> = { fast:"快速", balanced:"均衡", powerful:"強大" };

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";

function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path: string, method = "GET", body?: object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function ModelsPage() {
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null);
  const [maxTokens,     setMaxTokens]     = useState(1024);
  const [temperature,   setTemperature]   = useState(0.7);
  const [saving,        setSaving]        = useState(false);
  const [msg,           setMsg]           = useState<{ok:boolean;text:string}|null>(null);

  const fetchCatalog = useCallback(() => apiFetch("/api/models/catalog"), []);
  const fetchConfig  = useCallback(() => apiFetch(`/api/models/config?workspaceId=${WS_ID}`), []);

  const { data: catalog } = useApi<ModelInfo[]>(fetchCatalog, []);
  const { data: current, refetch } = useApi<ModelConfig>(fetchConfig, []);

  // Sync state from current config
  useState(() => {
    if (current) {
      setMaxTokens(current.maxTokens);
      setTemperature(current.temperature);
      if (current.modelInfo) setSelectedModel(current.modelInfo);
    }
  });

  async function save() {
    if (!selectedModel) return;
    setSaving(true); setMsg(null);
    try {
      await apiFetch("/api/models/config", "POST", {
        workspaceId: WS_ID,
        modelId:     selectedModel.id,
        maxTokens,
        temperature,
      });
      setMsg({ ok:true, text:"模型設定已儲存" });
      refetch();
    } catch(e) { setMsg({ ok:false, text:(e as Error).message }); }
    finally { setSaving(false); }
  }

  // Cost estimation
  const monthlyMsgs = 10000;
  const avgIn  = 500;
  const avgOut = 200;

  return (
    <div className="space-y-4">
      {/* Catalog */}
      <div className="grid grid-cols-3 gap-3">
        {(catalog ?? []).map(m => (
          <div key={m.id}
            onClick={() => setSelectedModel(m)}
            className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors ${
              selectedModel?.id === m.id
                ? "border-brand-400 ring-2 ring-brand-100"
                : "border-gray-100 hover:border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-[14px] font-medium">{m.name}</p>
              {m.recommended && (
                <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-medium">
                  推薦
                </span>
              )}
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-3">{m.description}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SPEED_BADGE[m.speed]}`}>
                {SPEED_LABEL[m.speed]}
              </span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {(m.contextWindow / 1000).toFixed(0)}k context
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 text-[11px] text-gray-400 space-y-0.5">
              <p>輸入：${m.inputCostPer1k}/1k tokens</p>
              <p>輸出：${m.outputCostPer1k}/1k tokens</p>
              <p className="font-medium text-gray-600 mt-1">
                ≈ NT${Math.round(
                  ((monthlyMsgs * avgIn  / 1000) * m.inputCostPer1k +
                   (monthlyMsgs * avgOut / 1000) * m.outputCostPer1k) * 32
                ).toLocaleString()} / 萬則訊息
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Parameters */}
      {selectedModel && (
        <Card>
          <CardTitle action={
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-500">
                目前使用：{current?.modelInfo?.name ?? "（未設定）"}
              </span>
            </div>
          }>
            參數設定 — {selectedModel.name}
          </CardTitle>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Max tokens */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[12px] text-gray-500">最大輸出 Token</label>
                  <span className="text-[12px] font-mono font-medium">{maxTokens}</span>
                </div>
                <input type="range" min={64} max={8096} step={64} value={maxTokens}
                  onChange={e => setMaxTokens(Number(e.target.value))}
                  className="w-full" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>64（快速）</span><span>8096（完整）</span>
                </div>
              </div>

              {/* Temperature */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[12px] text-gray-500">Temperature（創意度）</label>
                  <span className="text-[12px] font-mono font-medium">{temperature.toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={1} step={0.1} value={temperature}
                  onChange={e => setTemperature(Number(e.target.value))}
                  className="w-full" />
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>0（精確）</span><span>1（創意）</span>
                </div>
              </div>
            </div>

            {/* Cost preview */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-[12px] font-medium text-gray-600 mb-3">費用估算（每月 {monthlyMsgs.toLocaleString()} 則）</p>
              <div className="space-y-2">
                {(catalog ?? []).map(m => {
                  const cost = Math.round(
                    ((monthlyMsgs * avgIn  / 1000) * m.inputCostPer1k +
                     (monthlyMsgs * avgOut / 1000) * m.outputCostPer1k) * 32
                  );
                  const isSelected = m.id === selectedModel.id;
                  return (
                    <div key={m.id} className={`flex justify-between text-[12px] ${isSelected ? "font-medium text-brand-600" : "text-gray-500"}`}>
                      <span>{m.name}{isSelected ? " ★" : ""}</span>
                      <span>NT${cost.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-3">*按每則 {avgIn}/{avgOut} tokens 估算</p>
            </div>
          </div>

          {msg && (
            <div className={`mt-4 rounded-xl px-4 py-3 text-[13px] border ${msg.ok ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-600"}`}>
              {msg.ok ? "✓" : "✕"} {msg.text}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <Btn variant="primary" onClick={save}>
              {saving ? "儲存中..." : "套用至 Workspace 預設"}
            </Btn>
            <p className="text-[12px] text-gray-400 self-center">
              各 Agent 可在 Agent 設定頁面覆寫此設定
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
