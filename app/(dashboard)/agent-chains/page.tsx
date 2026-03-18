"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface AgentChain {
  id:string; name:string; description:string|null;
  enabled:boolean; runCount:number; createdAt:string;
  stepsJson:{id:string;type:string;label:string;agentId?:string;agentIds?:string[]}[];
  _count:{runs:number};
}
interface ChainRun {
  id:string; userId:string; status:string;
  input:string; output:string|null; errorMsg:string|null;
  startedAt:string; completedAt:string|null;
}

const STEP_TYPE_COLOR:Record<string,string>={
  AGENT_INVOKE:"bg-brand-50 text-brand-700", TRANSFORM:"bg-purple-50 text-purple-700",
  CONDITION:"bg-amber-50 text-amber-700",    PARALLEL:"bg-blue-50 text-blue-700",
  MERGE:"bg-green-50 text-green-700",
};
const STEP_TYPE_LABEL:Record<string,string>={
  AGENT_INVOKE:"Agent", TRANSFORM:"轉換", CONDITION:"條件", PARALLEL:"並行", MERGE:"合併",
};

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path:string, method="GET", body?:object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers:{"Content-Type":"application/json",Authorization:`Bearer ${tok()}`},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  if (r.status===204) return null;
  return r.json();
}

const CHAIN_TEMPLATES = [
  {
    name:"翻譯 + 客服回覆",
    description:"先翻譯用戶語言，再用繁中 Agent 回覆",
    stepsJson:[
      {id:"s1",type:"AGENT_INVOKE",label:"翻譯 Agent",agentId:"",prompt:"請將以下文字翻譯成繁體中文："},
      {id:"s2",type:"AGENT_INVOKE",label:"客服 Agent",agentId:""},
    ],
  },
  {
    name:"多角度分析（並行）",
    description:"同時讓多個 Agent 從不同角度分析，再合併結論",
    stepsJson:[
      {id:"s1",type:"PARALLEL",label:"並行分析",agentIds:["",""]},
      {id:"s2",type:"MERGE",label:"合併結論",agentId:"",mergePrompt:"請整合以上分析，提供最終建議："},
    ],
  },
  {
    name:"提取 + 寫入試算表",
    description:"Agent 提取關鍵資訊後，格式化存入 Google Sheets",
    stepsJson:[
      {id:"s1",type:"AGENT_INVOKE",label:"資訊提取",agentId:"",prompt:"請從以下對話中提取：姓名、電話、需求（以 JSON 格式回傳）："},
      {id:"s2",type:"TRANSFORM",label:"格式轉換",transformFn:"(input) => { try { const d=JSON.parse(input); return [d.name,d.phone,d.need].join(','); } catch { return input; } }"},
    ],
  },
];

export default function AgentChainsPage() {
  const [selected,  setSelected]  = useState<AgentChain|null>(null);
  const [runs,      setRuns]      = useState<ChainRun[]>([]);
  const [testInput, setTestInput] = useState("");
  const [testResult,setTestResult]= useState<{output:string;status:string;durationMs:number}|null>(null);
  const [running,   setRunning]   = useState(false);
  const [creating,  setCreating]  = useState(false);
  const [form,      setForm]      = useState({name:"",description:"",stepsJson:"[]"});

  const fetchFn = useCallback(() => apiFetch(`/api/chains?workspaceId=${WS_ID}`), []);
  const {data:chains, loading, refetch} = useApi<AgentChain[]>(fetchFn, []);

  async function loadRuns(chain:AgentChain) {
    setSelected(chain);
    const r = await apiFetch(`/api/chains/${chain.id}/runs`);
    setRuns(r);
    setTestResult(null);
  }

  async function runTest() {
    if (!selected || !testInput.trim()) return;
    setRunning(true); setTestResult(null);
    try {
      const r = await apiFetch(`/api/chains/${selected.id}/run`, "POST", {
        workspaceId:WS_ID, input:testInput, platform:"PLAYGROUND",
      });
      setTestResult(r);
      const updatedRuns = await apiFetch(`/api/chains/${selected.id}/runs`);
      setRuns(updatedRuns);
    } catch(e){ setTestResult({output:"",status:"failed",durationMs:0}); }
    finally{ setRunning(false); }
  }

  async function createFromTemplate(tmpl: typeof CHAIN_TEMPLATES[0]) {
    await apiFetch("/api/chains","POST",{
      workspaceId:WS_ID, name:tmpl.name,
      description:tmpl.description, stepsJson:tmpl.stepsJson,
    });
    refetch();
  }

  async function createCustom() {
    if (!form.name) return;
    setCreating(true);
    try {
      let steps:object[];
      try { steps = JSON.parse(form.stepsJson); } catch { alert("Steps JSON 格式錯誤"); return; }
      await apiFetch("/api/chains","POST",{
        workspaceId:WS_ID, name:form.name,
        description:form.description||undefined, stepsJson:steps,
      });
      setForm({name:"",description:"",stepsJson:"[]"});
      refetch();
    } finally{setCreating(false);}
  }

  async function toggleEnabled(chain:AgentChain) {
    await apiFetch(`/api/chains/${chain.id}`,"PATCH",{enabled:!chain.enabled});
    refetch();
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {/* Chain list */}
        <Card className="col-span-1 overflow-hidden">
          <CardTitle>{chains?.length??0} 個 Chain</CardTitle>

          {/* Templates */}
          <div className="mb-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">快速範本</p>
            <div className="space-y-1">
              {CHAIN_TEMPLATES.map(t=>(
                <button key={t.name} onClick={()=>createFromTemplate(t)}
                  className="w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                  <p className="text-[12px] font-medium">{t.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-50 pt-3">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">已建立的 Chains</p>
            {loading ? <p className="text-[12px] text-gray-400 py-2 text-center">載入中...</p> :
             !chains?.length ? <p className="text-[12px] text-gray-400 py-2 text-center">尚無 Chain</p> :
             chains.map(chain=>(
              <div key={chain.id}
                onClick={()=>loadRuns(chain)}
                className={`py-2.5 px-2 -mx-2 rounded-lg cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-0 ${selected?.id===chain.id?"bg-amber-50":""}`}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[13px] font-medium flex-1">{chain.name}</p>
                  <button onClick={e=>{e.stopPropagation();toggleEnabled(chain);}}
                    className={`w-7 h-4 rounded-full transition-colors relative ${chain.enabled?"bg-green-400":"bg-gray-200"}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${chain.enabled?"right-0.5":"left-0.5"}`}/>
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {chain.stepsJson.map((s,i)=>(
                    <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${STEP_TYPE_COLOR[s.type]??""}`}>
                      {STEP_TYPE_LABEL[s.type]??s.type}
                    </span>
                  ))}
                  <span className="text-[10px] text-gray-400 ml-auto">{chain._count.runs} 次執行</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Detail + test */}
        <div className="col-span-2 space-y-3">
          {selected ? (
            <>
              {/* Step visualizer */}
              <Card>
                <CardTitle>{selected.name}</CardTitle>
                <div className="flex items-center gap-2 overflow-x-auto py-2">
                  {selected.stepsJson.map((step,i)=>(
                    <div key={step.id} className="flex items-center gap-2 shrink-0">
                      <div className="text-center">
                        <div className={`rounded-xl px-4 py-3 border text-center ${STEP_TYPE_COLOR[step.type]??"bg-gray-50 text-gray-600"}`}
                          style={{minWidth:"100px",borderColor:"transparent"}}>
                          <p className="text-[10px] font-medium uppercase tracking-wide opacity-70">
                            {STEP_TYPE_LABEL[step.type]??step.type}
                          </p>
                          <p className="text-[13px] font-medium mt-0.5">{step.label}</p>
                          {step.agentId && <p className="text-[10px] opacity-60 mt-1 font-mono">{step.agentId.slice(0,8)}…</p>}
                        </div>
                      </div>
                      {i < selected.stepsJson.length-1 && (
                        <div className="text-gray-300 text-[18px] shrink-0">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Test panel */}
              <Card>
                <CardTitle action={
                  <span className="text-[12px] text-gray-400">{runs.length} 筆執行記錄</span>
                }>
                  測試執行
                </CardTitle>
                <div className="flex gap-2 mb-3">
                  <textarea value={testInput} onChange={e=>setTestInput(e.target.value)}
                    rows={3} placeholder="輸入測試文字，例如：用戶說的話..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] resize-none focus:outline-none focus:border-brand-400"/>
                  <Btn variant="primary" onClick={runTest} className="self-start">
                    {running?"執行中...":"▶ 執行"}
                  </Btn>
                </div>

                {testResult && (
                  <div className={`rounded-xl p-4 mb-3 ${testResult.status==="done"?"bg-green-50 border border-green-100":"bg-red-50 border border-red-100"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[12px] font-medium ${testResult.status==="done"?"text-green-700":"text-red-600"}`}>
                        {testResult.status==="done"?"✓ 執行完成":"✕ 執行失敗"}
                      </span>
                      <span className="text-[11px] text-gray-500">{testResult.durationMs}ms</span>
                    </div>
                    {testResult.output && (
                      <pre className="text-[12px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {testResult.output}
                      </pre>
                    )}
                  </div>
                )}

                {/* Recent runs */}
                {runs.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">近期執行</p>
                    <div className="space-y-0">
                      {runs.slice(0,5).map(run=>(
                        <div key={run.id} className="py-2 border-b border-gray-50 last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${run.status==="done"?"bg-green-50 text-green-700":run.status==="failed"?"bg-red-50 text-red-600":"bg-amber-50 text-amber-700"}`}>
                              {run.status}
                            </span>
                            <span className="text-[11px] text-gray-500 flex-1 truncate">{run.input.slice(0,50)}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(run.startedAt).toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Card>
              <div className="py-16 text-center">
                <p className="text-[32px] mb-3">⛓</p>
                <p className="text-[14px] font-medium text-gray-600 mb-1">選擇或建立 Agent Chain</p>
                <p className="text-[13px] text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Chain 讓多個 Agent 串行或並行協作，完成複雜的多步驟任務。
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
