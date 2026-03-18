"use client";
// app/(dashboard)/overview/page.tsx — Cross-workspace command center
import { useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle } from "@/components/ui";

interface WorkspaceSummary {
  id:string; name:string; client:string; plan:string; status:string;
  todayMessages:number; monthCost:number; activeSessions:number;
  agentCount:number; errorRate:number; slaGrade:string|null;
}
interface Overview {
  workspaces: WorkspaceSummary[];
  totals:{ messages:number; cost:number; activeSessions:number; avgErrorRate:number };
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }

const STATUS_DOT:Record<string,string> = {
  LIVE:"bg-green-400", SETTING:"bg-amber-400", PAUSED:"bg-gray-300", ARCHIVED:"bg-gray-200",
};
const PLAN_COLOR:Record<string,string> = {
  STARTER:"bg-gray-100 text-gray-600", PRO:"bg-brand-50 text-brand-700",
  BUSINESS:"bg-purple-50 text-purple-700",
};

export default function OverviewPage() {
  const fetchFn = useCallback(async () => {
    const r = await fetch(`${BASE}/api/analytics/overview`, {
      headers: { Authorization: `Bearer ${tok()}` },
    });
    if (!r.ok) throw new Error("Failed");

    // Build cross-workspace summary from analytics endpoint
    const workspacesR = await fetch(`${BASE}/api/workspaces`, {
      headers: { Authorization: `Bearer ${tok()}` },
    });
    const workspaces = await workspacesR.json();

    // Fetch today usage per workspace
    const summaries: WorkspaceSummary[] = await Promise.all(
      workspaces.map(async (ws: { id:string; name:string; client:string; plan:string; status:string }) => {
        try {
          const [usage, health] = await Promise.all([
            fetch(`${BASE}/api/usage?workspaceId=${ws.id}&days=1`, { headers: { Authorization:`Bearer ${tok()}` } }).then(r=>r.ok?r.json():{}),
            fetch(`${BASE}/api/sla/health?workspaceId=${ws.id}`,  { headers: { Authorization:`Bearer ${tok()}` } }).then(r=>r.ok?r.json():null),
          ]);
          const sessions = await fetch(`${BASE}/api/sessions?workspaceId=${ws.id}&isActive=true&limit=1`, {
            headers: { Authorization:`Bearer ${tok()}` },
          }).then(r=>r.ok?r.json():{items:[]});

          return {
            ...ws,
            todayMessages:  usage.records?.[0]?.messages ?? 0,
            monthCost:      usage.totals?.costNTD ?? 0,
            activeSessions: sessions.items?.length ?? 0,
            agentCount:     0,
            errorRate:      0,
            slaGrade:       health?.overallStatus === "HEALTHY" ? "A" : health?.overallStatus === "DEGRADED" ? "C" : null,
          };
        } catch {
          return { ...ws, todayMessages:0, monthCost:0, activeSessions:0, agentCount:0, errorRate:0, slaGrade:null };
        }
      })
    );

    const totals = {
      messages:      summaries.reduce((s,w)=>s+w.todayMessages, 0),
      cost:          summaries.reduce((s,w)=>s+w.monthCost,     0),
      activeSessions:summaries.reduce((s,w)=>s+w.activeSessions,0),
      avgErrorRate:  0,
    };

    return { workspaces: summaries, totals };
  }, []);

  const { data, loading } = useApi<Overview>(fetchFn, []);

  if (loading) return <p className="text-[12px] text-gray-400 py-8 text-center">載入各 Workspace 資料...</p>;

  const ws = data?.workspaces ?? [];
  const t  = data?.totals;

  return (
    <div className="space-y-4">
      {/* Global stats */}
      <div className="grid grid-cols-4 gap-2.5">
        {[
          { label:"所有 Workspace", value:ws.length, sub:`${ws.filter(w=>w.status==="LIVE").length} 個上線中` },
          { label:"今日訊息總量",   value:t?.messages.toLocaleString()??0, sub:"全平台合計" },
          { label:"本月費用預估",   value:`NT$${t?.cost?.toFixed(0)??0}`, sub:"所有客戶合計" },
          { label:"進行中 Sessions",value:t?.activeSessions??0, sub:"即時對話" },
        ].map(s=>(
          <div key={s.label} className="bg-gray-100 rounded-xl px-4 py-3">
            <p className="text-[11px] text-gray-400 mb-1">{s.label}</p>
            <p className="text-[22px] font-medium">{s.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Workspace table */}
      <Card>
        <CardTitle>所有 Workspace 狀態</CardTitle>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              {["狀態","客戶","方案","今日訊息","本月費用","進行中對話","SLA"].map(h=>(
                <th key={h} className="text-left text-[11px] font-medium text-gray-400 pb-2 pr-3 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ws.sort((a,b) => b.todayMessages - a.todayMessages).map(w=>(
              <tr key={w.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${STATUS_DOT[w.status]??"bg-gray-300"}`}/>
                    <span className="text-[12px] text-gray-500">{w.status==="LIVE"?"上線":w.status==="SETTING"?"設定中":"暫停"}</span>
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <p className="text-[13px] font-medium">{w.client}</p>
                  <p className="text-[11px] text-gray-400">{w.name}</p>
                </td>
                <td className="py-3 pr-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PLAN_COLOR[w.plan]??""}`}>
                    {w.plan}
                  </span>
                </td>
                <td className="py-3 pr-3">
                  <p className="text-[13px] font-medium">{w.todayMessages.toLocaleString()}</p>
                </td>
                <td className="py-3 pr-3">
                  <p className="text-[13px]">NT${Number(w.monthCost).toFixed(0)}</p>
                </td>
                <td className="py-3 pr-3">
                  <p className="text-[13px]">{w.activeSessions}</p>
                </td>
                <td className="py-3">
                  {w.slaGrade ? (
                    <span className={`text-[13px] font-medium ${w.slaGrade==="A"?"text-green-600":w.slaGrade==="B"?"text-blue-600":"text-amber-600"}`}>
                      {w.slaGrade}
                    </span>
                  ) : <span className="text-[11px] text-gray-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
