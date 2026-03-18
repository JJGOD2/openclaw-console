"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface Overview {
  system: {
    workspaceCount:number; userCount:number; agentCount:number;
    todayMessages:number; monthCostNTD:string; activeChains:number;
    pendingHandoffs:number; pendingReviews:number;
  };
  workspaces:{
    id:string; name:string; client:string; plan:string; status:string;
    usage:{messages:number; cost:number};
  }[];
}
interface SystemHealth {
  database:{ok:boolean};
  recentErrors:number; deadWebhooks:number;
  kb:{pending:number;failed:number};
  oauth:{expiredButValid:number};
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path:string, method="GET", body?:object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers:{"Content-Type":"application/json",Authorization:`Bearer ${tok()}`},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    if (r.status === 403) throw new Error("需要超級管理員權限");
    throw new Error(await r.text());
  }
  if (r.status === 204) return null;
  return r.json();
}

const STATUS_DOT:Record<string,string>={LIVE:"bg-green-400",SETTING:"bg-amber-400",PAUSED:"bg-gray-300",ARCHIVED:"bg-gray-200"};
const PLAN_COLOR:Record<string,string>={STARTER:"bg-gray-100 text-gray-600",PRO:"bg-brand-50 text-brand-700",BUSINESS:"bg-purple-50 text-purple-700"};

export default function SuperAdminPage() {
  const [impersonating, setImpersonating] = useState<string|null>(null);
  const [deleteTarget,  setDeleteTarget]  = useState<string|null>(null);
  const [msg,           setMsg]           = useState<{ok:boolean;text:string}|null>(null);

  const fetchOverview = useCallback(() => apiFetch("/api/super/overview"), []);
  const fetchHealth   = useCallback(() => apiFetch("/api/super/system-health"), []);

  const {data:overview, loading:ovLoading, error:ovError} = useApi<Overview>(fetchOverview, []);
  const {data:health}                                      = useApi<SystemHealth>(fetchHealth, []);

  async function impersonate(wsId:string, wsName:string) {
    setImpersonating(wsId);
    try {
      const r = await apiFetch(`/api/super/workspaces/${wsId}/impersonate`, "POST");
      setMsg({ok:true, text:`已切換至 ${r.name}（${r.client}）。操作已記錄。`});
    } catch(e){setMsg({ok:false,text:(e as Error).message});}
    finally{setImpersonating(null);}
  }

  async function deleteWorkspace(wsId:string) {
    try {
      const r = await apiFetch(`/api/super/workspaces/${wsId}`, "DELETE", {confirm:"DELETE"});
      setMsg({ok:true, text:`已刪除 ${r.deleted}`});
      setDeleteTarget(null);
    } catch(e){setMsg({ok:false,text:(e as Error).message});}
  }

  if (ovError) {
    return (
      <div className="py-16 text-center">
        <p className="text-[28px] mb-3">🔒</p>
        <p className="text-[14px] font-medium text-gray-600 mb-1">存取被拒絕</p>
        <p className="text-[13px] text-gray-400">{ovError.message}</p>
        <p className="text-[11px] text-gray-300 mt-2">此頁面需要 SUPER_ADMIN 角色</p>
      </div>
    );
  }

  const sys = overview?.system;
  const wss = overview?.workspaces ?? [];

  return (
    <div className="space-y-4">
      {/* Security warning */}
      <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
        <span className="text-[14px]">🔐</span>
        <p className="text-[12px] text-red-700">超級管理員模式 — 所有操作均記錄於 Audit Log</p>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-[13px] border ${msg.ok?"bg-green-50 border-green-100 text-green-700":"bg-red-50 border-red-100 text-red-600"}`}>
          {msg.ok?"✓":"✕"} {msg.text}
          <button onClick={()=>setMsg(null)} className="ml-3 opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* System health */}
      {health && (
        <Card>
          <CardTitle>系統健康狀態</CardTitle>
          <div className="grid grid-cols-5 gap-2">
            {[
              {label:"資料庫", value:health.database.ok?"正常":"異常", ok:health.database.ok},
              {label:"近1小時錯誤", value:String(health.recentErrors), ok:health.recentErrors<10},
              {label:"Dead Webhooks", value:String(health.deadWebhooks), ok:health.deadWebhooks===0},
              {label:"KB 待處理", value:String(health.kb.pending), ok:true},
              {label:"OAuth 過期", value:String(health.oauth.expiredButValid), ok:health.oauth.expiredButValid===0},
            ].map(s=>(
              <div key={s.label} className={`rounded-lg p-3 ${s.ok?"bg-green-50":"bg-red-50"}`}>
                <p className={`text-[11px] ${s.ok?"text-green-600":"text-red-600"}`}>{s.label}</p>
                <p className={`text-[18px] font-medium mt-0.5 ${s.ok?"text-green-700":"text-red-700"}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* KPI */}
      {sys && (
        <div className="grid grid-cols-4 gap-2.5">
          {[
            {label:"Workspaces",     value:sys.workspaceCount},
            {label:"今日訊息",       value:sys.todayMessages.toLocaleString()},
            {label:"本月費用",       value:`NT$${Number(sys.monthCostNTD).toLocaleString()}`},
            {label:"待處理（審核+交接）",value:sys.pendingReviews+sys.pendingHandoffs},
          ].map(s=>(
            <div key={s.label} className="bg-gray-100 rounded-xl px-4 py-3">
              <p className="text-[11px] text-gray-400 mb-1">{s.label}</p>
              <p className="text-[22px] font-medium">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Workspace table */}
      <Card>
        <CardTitle>所有 Workspace（{wss.length}）</CardTitle>
        {ovLoading ? <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p> : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                {["","客戶","名稱","方案","30天訊息","30天費用","操作"].map(h=>(
                  <th key={h} className="text-left text-[11px] font-medium text-gray-400 pb-2 pr-2 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wss.sort((a,b)=>b.usage.messages-a.usage.messages).map(ws=>(
                <tr key={ws.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                  <td className="py-2.5 pr-2">
                    <span className={`w-2 h-2 rounded-full inline-block ${STATUS_DOT[ws.status]??"bg-gray-300"}`}/>
                  </td>
                  <td className="py-2.5 pr-2">
                    <p className="text-[13px] font-medium">{ws.client}</p>
                  </td>
                  <td className="py-2.5 pr-2">
                    <p className="text-[12px] text-gray-500">{ws.name}</p>
                  </td>
                  <td className="py-2.5 pr-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLAN_COLOR[ws.plan]??""}`}>
                      {ws.plan}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 text-[13px]">{ws.usage.messages.toLocaleString()}</td>
                  <td className="py-2.5 pr-2 text-[13px]">NT${Math.round(ws.usage.cost).toLocaleString()}</td>
                  <td className="py-2.5">
                    <div className="flex gap-1">
                      <Btn onClick={()=>impersonate(ws.id, ws.name)} className="text-[10px] py-0.5">
                        {impersonating===ws.id?"切換中...":"切換視角"}
                      </Btn>
                      <Btn onClick={()=>setDeleteTarget(ws.id)} variant="danger" className="text-[10px] py-0.5">
                        刪除
                      </Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50}}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <p className="text-[15px] font-medium mb-2 text-red-600">⚠ 刪除 Workspace？</p>
            <p className="text-[13px] text-gray-600 mb-1">此操作不可復原，所有資料（Agent、對話、Log）將永久刪除。</p>
            <p className="text-[12px] text-gray-400 mb-4">建議先備份再刪除。</p>
            <div className="flex gap-2">
              <Btn variant="danger" onClick={()=>deleteWorkspace(deleteTarget)} className="flex-1 justify-center">確認刪除</Btn>
              <Btn onClick={()=>setDeleteTarget(null)} className="flex-1 justify-center">取消</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
