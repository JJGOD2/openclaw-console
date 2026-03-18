"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface ABTest {
  id:string; name:string; agentId:string; status:string;
  trafficSplit:number; startedAt:string|null; winner:string|null;
  variants:{id:string;label:string;systemPrompt:string;description:string|null}[];
  _count:{results:number};
}
interface ABResults {
  variants:{
    variant:{label:string;description:string|null};
    n:number; resolvedRate:number; handoffRate:number;
    avgTurns:number; avgResponseMs:number; avgRating:number|null;
  }[];
  winner:string|null; sampleSize:number;
}

const STATUS_COLOR:Record<string,string> = {
  DRAFT:"bg-gray-100 text-gray-500", RUNNING:"bg-green-50 text-green-700",
  PAUSED:"bg-amber-50 text-amber-600", COMPLETED:"bg-blue-50 text-blue-700",
};
const STATUS_LABEL:Record<string,string> = {
  DRAFT:"草稿", RUNNING:"進行中", PAUSED:"暫停", COMPLETED:"已完成",
};

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path:string, method="GET", body?:object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers:{"Content-Type":"application/json", Authorization:`Bearer ${tok()}`},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  if (r.status===204) return null;
  return r.json();
}

export default function ABTestPage() {
  const [mode,    setMode]    = useState<"list"|"create">("list");
  const [selected,setSelected]= useState<ABTest|null>(null);
  const [results, setResults] = useState<ABResults|null>(null);
  const [form,    setForm]    = useState({
    name:"", agentId:"", trafficSplit:50,
    promptA:"", descA:"", promptB:"", descB:"",
  });
  const [saving,  setSaving]  = useState(false);

  const fetchFn = useCallback(() => apiFetch(`/api/ab-tests?workspaceId=${WS_ID}`), []);
  const {data:tests, loading, refetch} = useApi<ABTest[]>(fetchFn, []);

  async function create() {
    setSaving(true);
    try {
      await apiFetch("/api/ab-tests", "POST", {
        workspaceId: WS_ID,
        name: form.name, agentId: form.agentId,
        trafficSplit: form.trafficSplit,
        variantA: { systemPrompt: form.promptA, description: form.descA||undefined },
        variantB: { systemPrompt: form.promptB, description: form.descB||undefined },
      });
      setMode("list"); refetch();
    } catch(e){ alert((e as Error).message); }
    finally{ setSaving(false); }
  }

  async function setStatus(id:string, status:string) {
    await apiFetch(`/api/ab-tests/${id}/status`, "PATCH", { status });
    refetch();
  }

  async function loadResults(test:ABTest) {
    setSelected(test);
    const r = await apiFetch(`/api/ab-tests/${test.id}/results`);
    setResults(r);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["list","create"] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)}
              className={`px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${mode===m?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent"}`}>
              {m==="list"?"測試列表":"+ 建立測試"}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-gray-400">{tests?.filter(t=>t.status==="RUNNING").length??0} 個進行中</span>
      </div>

      {mode==="create" && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardTitle>測試設定</CardTitle>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] text-gray-500 block mb-1.5">測試名稱</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}
                  placeholder="例：親切 vs 正式語氣"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-400"/>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 block mb-1.5">Agent ID</label>
                <input value={form.agentId} onChange={e=>setForm(f=>({...f,agentId:e.target.value}))}
                  placeholder="agent-..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-brand-400"/>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <label className="text-[12px] text-gray-500">流量分配 B 版本</label>
                  <span className="text-[12px] font-medium">{form.trafficSplit}%</span>
                </div>
                <input type="range" min={10} max={90} step={5} value={form.trafficSplit}
                  onChange={e=>setForm(f=>({...f,trafficSplit:Number(e.target.value)}))}
                  className="w-full"/>
                <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                  <span>A: {100-form.trafficSplit}%</span>
                  <span>B: {form.trafficSplit}%</span>
                </div>
              </div>
              <Btn variant="primary" onClick={create} className="w-full justify-center">
                {saving?"建立中...":"建立 A/B 測試"}
              </Btn>
            </div>
          </Card>
          <Card>
            <CardTitle>兩個變體的 Prompt</CardTitle>
            <div className="space-y-3">
              {(["A","B"] as const).map(v=>(
                <div key={v}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-5 h-5 rounded text-[11px] font-bold flex items-center justify-center ${v==="A"?"bg-blue-100 text-blue-700":"bg-purple-100 text-purple-700"}`}>{v}</span>
                    <input
                      value={v==="A"?form.descA:form.descB}
                      onChange={e=>setForm(f=>({...f,[`desc${v}`]:e.target.value}))}
                      placeholder={`版本 ${v} 說明`}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] focus:outline-none focus:border-brand-400"/>
                  </div>
                  <textarea
                    value={v==="A"?form.promptA:form.promptB}
                    onChange={e=>setForm(f=>({...f,[`prompt${v}`]:e.target.value}))}
                    rows={5} placeholder={`版本 ${v} System Prompt...`}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[12px] font-mono resize-none focus:outline-none focus:border-brand-400"/>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {mode==="list" && (
        <div className="grid grid-cols-2 gap-3">
          {/* Test list */}
          <Card>
            <CardTitle>A/B 測試列表</CardTitle>
            {loading ? <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p> :
             !tests?.length ? <p className="text-[12px] text-gray-400 py-6 text-center">尚無測試</p> :
             tests.map(test=>(
              <div key={test.id} className={`py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2 ${selected?.id===test.id?"bg-amber-50":""}`}
                onClick={()=>loadResults(test)}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[13px] font-medium flex-1">{test.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[test.status]}`}>
                    {STATUS_LABEL[test.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-gray-400">
                    A:{100-test.trafficSplit}% / B:{test.trafficSplit}% · {test._count.results} 筆結果
                  </p>
                  <div className="ml-auto flex gap-1">
                    {test.status==="DRAFT" && (
                      <Btn onClick={e=>{e.stopPropagation();setStatus(test.id,"RUNNING");}} className="text-[10px] py-0.5" variant="primary">啟動</Btn>
                    )}
                    {test.status==="RUNNING" && (
                      <>
                        <Btn onClick={e=>{e.stopPropagation();setStatus(test.id,"PAUSED");}} className="text-[10px] py-0.5">暫停</Btn>
                        <Btn onClick={e=>{e.stopPropagation();setStatus(test.id,"COMPLETED");}} className="text-[10px] py-0.5">結束</Btn>
                      </>
                    )}
                    {test.status==="PAUSED" && (
                      <Btn onClick={e=>{e.stopPropagation();setStatus(test.id,"RUNNING");}} className="text-[10px] py-0.5" variant="primary">繼續</Btn>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card>

          {/* Results panel */}
          <Card>
            {results && selected ? (
              <>
                <CardTitle>
                  {results.winner
                    ? `版本 ${results.winner} 獲勝 🏆`
                    : results.sampleSize < 30
                      ? `樣本不足（${results.sampleSize}/30）`
                      : "結果接近，繼續收集"}
                </CardTitle>

                {results.sampleSize < 30 && (
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4 text-[12px] text-amber-700">
                    ⚠ 統計意義需至少各 30 筆，目前 {results.sampleSize} 筆
                  </div>
                )}

                <div className="space-y-4">
                  {results.variants.map(v=>{
                    const isWinner = results.winner === v.variant.label;
                    return (
                      <div key={v.variant.label} className={`border rounded-xl p-4 ${isWinner?"border-green-300 bg-green-50":"border-gray-100"}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`w-6 h-6 rounded text-[11px] font-bold flex items-center justify-center ${v.variant.label==="A"?"bg-blue-100 text-blue-700":"bg-purple-100 text-purple-700"}`}>
                            {v.variant.label}
                          </span>
                          <p className="text-[13px] font-medium">版本 {v.variant.label}</p>
                          {isWinner && <span className="text-green-600 text-[12px]">🏆 獲勝</span>}
                          <span className="ml-auto text-[11px] text-gray-400">{v.n} 筆</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-3">{v.variant.description??""}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            {label:"解決率",    value:`${v.resolvedRate}%`,  good:v.resolvedRate>50 },
                            {label:"升級率",    value:`${v.handoffRate}%`,   good:v.handoffRate<20 },
                            {label:"平均輪次",  value:`${v.avgTurns}`,       good:v.avgTurns<5 },
                            {label:"平均回應",  value:`${v.avgResponseMs}ms`,good:v.avgResponseMs<2000},
                          ].map(m=>(
                            <div key={m.label} className="bg-white rounded-lg p-2.5">
                              <p className="text-[10px] text-gray-400">{m.label}</p>
                              <p className={`text-[16px] font-medium mt-0.5 ${m.good?"text-green-600":"text-red-500"}`}>
                                {m.value}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[28px] mb-2">🧬</p>
                <p className="text-[13px] text-gray-400">點選左側測試查看結果</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
