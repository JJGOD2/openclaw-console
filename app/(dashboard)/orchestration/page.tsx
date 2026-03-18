"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface Flow {
  id:string; name:string; description:string|null; enabled:boolean;
  runCount:number; stepsJson:Step[]; createdAt:string;
  _count:{runs:number};
}
interface Step {
  id:string; type:string; label?:string;
  agentId?:string; inputMapping?:string; outputKey?:string;
  expression?:string; trueBranch?:string; falseBranch?:string;
  reason?:string;
}
interface Run {
  id:string; status:string; inputText:string; outputText:string|null;
  stepsLog:StepLog[]; startedAt:string; endedAt:string|null;
}
interface StepLog { stepId:string; type:string; label?:string; output:unknown; error?:string; latencyMs:number; }

const STEP_COLORS:Record<string,string> = {
  AGENT_CALL:    "bg-brand-50 border-brand-200 text-brand-700",
  CONDITION:     "bg-amber-50 border-amber-200 text-amber-700",
  TRANSFORM:     "bg-blue-50 border-blue-200 text-blue-700",
  HUMAN_HANDOFF: "bg-red-50 border-red-200 text-red-600",
  END:           "bg-gray-100 border-gray-200 text-gray-500",
};
const STEP_ICON:Record<string,string> = {
  AGENT_CALL:"🤖", CONDITION:"⚡", TRANSFORM:"🔄", HUMAN_HANDOFF:"👤", END:"🏁",
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

function uid() { return Math.random().toString(36).slice(2,8); }

export default function OrchestrationPage() {
  const [mode,       setMode]       = useState<"list"|"build"|"run">("list");
  const [selected,   setSelected]   = useState<Flow|null>(null);
  const [runs,       setRuns]       = useState<Run[]>([]);
  const [steps,      setSteps]      = useState<Step[]>([{ id:uid(), type:"AGENT_CALL", label:"呼叫主 Agent", inputMapping:"{{input}}", outputKey:"result1" }]);
  const [flowName,   setFlowName]   = useState("");
  const [trigAgent,  setTrigAgent]  = useState("");
  const [testInput,  setTestInput]  = useState("");
  const [running,    setRunning]    = useState(false);
  const [runResult,  setRunResult]  = useState<{output:string;status:string;runId:string}|null>(null);
  const [saving,     setSaving]     = useState(false);

  const fetchFn = useCallback(() => apiFetch(`/api/orchestration?workspaceId=${WS_ID}`), []);
  const { data:flows, loading, refetch } = useApi<Flow[]>(fetchFn, []);

  function addStep(type:string) {
    const base:Step = { id:uid(), type, label:STEP_ICON[type]+" "+type };
    if (type==="AGENT_CALL")    Object.assign(base, { agentId:"", inputMapping:"{{output}}", outputKey:`result${steps.length+1}` });
    if (type==="CONDITION")     Object.assign(base, { expression:"context.output.includes('退款')", trueBranch:"", falseBranch:"" });
    if (type==="TRANSFORM")     Object.assign(base, { operation:"TEMPLATE", params:{template:"{{output}}"}, inputKey:"output", outputKey:"transformed" });
    if (type==="HUMAN_HANDOFF") Object.assign(base, { reason:"需要人工確認" });
    setSteps(s=>[...s, base]);
  }

  function updateStep(id:string, key:string, val:string) {
    setSteps(s=>s.map(step=>step.id===id ? {...step,[key]:val} : step));
  }
  function removeStep(id:string) { setSteps(s=>s.filter(st=>st.id!==id)); }
  function moveStep(id:string, dir:-1|1) {
    setSteps(s=>{
      const i = s.findIndex(st=>st.id===id);
      if (i+dir<0 || i+dir>=s.length) return s;
      const n=[...s]; [n[i],n[i+dir]]=[n[i+dir],n[i]]; return n;
    });
  }

  async function save() {
    if (!flowName.trim() || steps.length===0) return;
    setSaving(true);
    try {
      await apiFetch("/api/orchestration", "POST", {
        workspaceId:WS_ID, name:flowName, triggerAgentId:trigAgent||"placeholder",
        stepsJson:steps,
      });
      setMode("list"); refetch();
    } catch(e){ alert((e as Error).message); }
    finally{ setSaving(false); }
  }

  async function runFlow(flow:Flow) {
    if (!testInput.trim()) return;
    setRunning(true); setRunResult(null);
    try {
      const r = await apiFetch(`/api/orchestration/${flow.id}/run`, "POST", {
        userId:"playground_user", inputText:testInput, platform:"PLAYGROUND",
      });
      setRunResult(r);
      // Reload runs
      const runsData = await apiFetch(`/api/orchestration/${flow.id}/runs`);
      setRuns(runsData);
    } catch(e){ alert((e as Error).message); }
    finally{ setRunning(false); }
  }

  async function loadRuns(flow:Flow) {
    setSelected(flow); setMode("run"); setRunResult(null);
    const data = await apiFetch(`/api/orchestration/${flow.id}/runs`);
    setRuns(data);
  }

  const STATUS_COLOR:Record<string,string> = {
    COMPLETED:"bg-green-50 text-green-700", FAILED:"bg-red-50 text-red-600",
    RUNNING:"bg-blue-50 text-blue-700",     WAITING_HUMAN:"bg-amber-50 text-amber-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["list","build"] as const).map(m=>(
            <button key={m} onClick={()=>setMode(m)}
              className={`px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${mode===m?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent hover:border-gray-200"}`}>
              {m==="list"?"流程列表":"+ 建立新流程"}
            </button>
          ))}
        </div>
      </div>

      {/* Flow Builder */}
      {mode==="build" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-3">
            <Card>
              <CardTitle>基本設定</CardTitle>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[12px] text-gray-500 block mb-1.5">流程名稱</label>
                  <input value={flowName} onChange={e=>setFlowName(e.target.value)}
                    placeholder="例：客訴分類與轉交流程"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-400"/>
                </div>
                <div>
                  <label className="text-[12px] text-gray-500 block mb-1.5">觸發 Agent ID</label>
                  <input value={trigAgent} onChange={e=>setTrigAgent(e.target.value)}
                    placeholder="當此 Agent 收到訊息時觸發"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-brand-400"/>
                </div>
              </div>
            </Card>

            {/* Step palette */}
            <Card>
              <CardTitle>新增步驟</CardTitle>
              <div className="grid grid-cols-2 gap-1.5">
                {[["AGENT_CALL","呼叫 Agent"],["CONDITION","條件分支"],
                  ["TRANSFORM","資料轉換"],["HUMAN_HANDOFF","轉交人工"],["END","結束"]].map(([type,label])=>(
                  <button key={type} onClick={()=>addStep(type)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-[12px] text-gray-700 transition-colors border border-gray-100 text-left">
                    <span>{STEP_ICON[type]}</span>{label}
                  </button>
                ))}
              </div>
            </Card>

            <div className="flex gap-2">
              <Btn variant="primary" onClick={save} className="flex-1 justify-center">
                {saving?"儲存中...":"儲存流程"}
              </Btn>
              <Btn onClick={()=>setMode("list")}>取消</Btn>
            </div>
          </div>

          {/* Steps canvas */}
          <Card>
            <CardTitle>{steps.length} 個步驟</CardTitle>
            {steps.length===0 ? (
              <p className="text-[12px] text-gray-400 py-6 text-center">從左側新增步驟</p>
            ) : (
              <div className="space-y-2">
                {steps.map((step,i)=>(
                  <div key={step.id} className={`border rounded-xl p-3 ${STEP_COLORS[step.type]??"border-gray-200"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[14px]">{STEP_ICON[step.type]}</span>
                      <input value={step.label||""} onChange={e=>updateStep(step.id,"label",e.target.value)}
                        className="flex-1 bg-white/70 rounded px-2 py-0.5 text-[12px] font-medium focus:outline-none"/>
                      <div className="flex gap-0.5 shrink-0">
                        <button onClick={()=>moveStep(step.id,-1)} disabled={i===0}
                          className="w-5 h-5 flex items-center justify-center text-[10px] hover:bg-white/50 rounded disabled:opacity-30">↑</button>
                        <button onClick={()=>moveStep(step.id,1)} disabled={i===steps.length-1}
                          className="w-5 h-5 flex items-center justify-center text-[10px] hover:bg-white/50 rounded disabled:opacity-30">↓</button>
                        <button onClick={()=>removeStep(step.id)}
                          className="w-5 h-5 flex items-center justify-center text-[10px] hover:bg-white/50 rounded text-red-500">×</button>
                      </div>
                    </div>

                    {/* Step-specific fields */}
                    {step.type==="AGENT_CALL" && (
                      <div className="space-y-1.5">
                        <input value={step.agentId||""} onChange={e=>updateStep(step.id,"agentId",e.target.value)}
                          placeholder="Agent ID" className="w-full bg-white/70 rounded px-2 py-1 text-[11px] font-mono focus:outline-none"/>
                        <input value={step.inputMapping||""} onChange={e=>updateStep(step.id,"inputMapping",e.target.value)}
                          placeholder="輸入映射（如 {{output}}）" className="w-full bg-white/70 rounded px-2 py-1 text-[11px] font-mono focus:outline-none"/>
                        <input value={step.outputKey||""} onChange={e=>updateStep(step.id,"outputKey",e.target.value)}
                          placeholder="輸出變數名稱（如 result1）" className="w-full bg-white/70 rounded px-2 py-1 text-[11px] font-mono focus:outline-none"/>
                      </div>
                    )}
                    {step.type==="CONDITION" && (
                      <input value={step.expression||""} onChange={e=>updateStep(step.id,"expression",e.target.value)}
                        placeholder="條件表達式（如 context.output.includes('退款')）"
                        className="w-full bg-white/70 rounded px-2 py-1 text-[11px] font-mono focus:outline-none"/>
                    )}
                    {step.type==="HUMAN_HANDOFF" && (
                      <input value={step.reason||""} onChange={e=>updateStep(step.id,"reason",e.target.value)}
                        placeholder="轉交原因" className="w-full bg-white/70 rounded px-2 py-1 text-[11px] focus:outline-none"/>
                    )}
                    {step.type!=="END" && (
                      <p className="text-[10px] opacity-60 mt-1">步驟 {i+1} / {steps.length}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Flow list */}
      {mode==="list" && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardTitle>協作流程</CardTitle>
            {loading ? <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p> :
             !flows?.length ? (
              <div className="py-10 text-center">
                <p className="text-[28px] mb-2">🔗</p>
                <p className="text-[13px] text-gray-400">尚無協作流程</p>
                <p className="text-[12px] text-gray-300 mt-1">可將多個 Agent 串接，實現複雜業務邏輯</p>
              </div>
            ) : flows.map(flow=>(
              <div key={flow.id} className={`py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 cursor-pointer ${selected?.id===flow.id?"bg-amber-50":""}`}
                onClick={()=>loadRuns(flow)}>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[13px] font-medium flex-1">{flow.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${flow.enabled?"bg-green-50 text-green-700":"bg-gray-100 text-gray-500"}`}>
                    {flow.enabled?"啟用":"停用"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {(flow.stepsJson as Step[]).length} 步驟 · {flow.runCount} 次執行
                </p>
              </div>
            ))}
          </Card>

          {/* Run panel */}
          <Card className="flex flex-col">
            {selected ? (
              <>
                <CardTitle action={
                  <span className="text-[12px] text-gray-400">{selected.name}</span>
                }>
                  執行測試 & 歷史
                </CardTitle>

                <div className="flex gap-2 mb-4">
                  <input value={testInput} onChange={e=>setTestInput(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&runFlow(selected)}
                    placeholder="輸入測試訊息觸發流程..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-brand-400"/>
                  <Btn variant="primary" onClick={()=>runFlow(selected)}>
                    {running?"執行中...":"▶ 執行"}
                  </Btn>
                </div>

                {runResult && (
                  <div className={`rounded-xl p-4 border mb-4 ${runResult.status==="COMPLETED"?"bg-green-50 border-green-100":"bg-amber-50 border-amber-100"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[runResult.status]}`}>
                        {runResult.status}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">{runResult.runId.slice(0,8)}</span>
                    </div>
                    <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap">{runResult.output}</p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-2">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">執行歷史</p>
                  {runs.length===0 ? (
                    <p className="text-[12px] text-gray-400">尚無執行記錄</p>
                  ) : runs.map(run=>(
                    <div key={run.id} className="border border-gray-100 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[run.status]}`}>
                          {run.status}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(run.startedAt).toLocaleString("zh-TW")}
                        </span>
                        {run.endedAt && (
                          <span className="text-[10px] text-gray-400 ml-auto">
                            {new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime()}ms
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-600 truncate">{run.inputText}</p>
                      {run.outputText && (
                        <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{run.outputText}</p>
                      )}
                      {/* Step logs */}
                      {(run.stepsLog as StepLog[]).length>0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {(run.stepsLog as StepLog[]).map((s,i)=>(
                            <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${s.error?"border-red-200 text-red-500":"border-gray-200 text-gray-500"}`}>
                              {STEP_ICON[s.type]} {s.latencyMs}ms
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <p className="text-[28px] mb-2">🔗</p>
                <p className="text-[13px] text-gray-400">選擇左側流程測試執行</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
