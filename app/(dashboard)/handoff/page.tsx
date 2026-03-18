"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface HandoffItem {
  id:string; workspaceId:string; platform:string; userId:string;
  reason:string; summary:string; status:string; priority:number;
  assignedTo:string|null; createdAt:string; acceptedAt:string|null;
}

const REASON_LABEL:Record<string,string> = {
  USER_REQUEST:"用戶要求", HIGH_RISK:"高風險操作", COMPLEXITY:"複雜問題",
  ESCALATION:"升級處理", REVIEW_TIMEOUT:"審核逾時", AGENT_LIMIT:"超出能力",
};
const STATUS_COLOR:Record<string,string> = {
  PENDING:"bg-amber-50 text-amber-700",  ACCEPTED:"bg-blue-50 text-blue-700",
  RESOLVED:"bg-green-50 text-green-700", RETURNED:"bg-gray-100 text-gray-500",
};
const STATUS_LABEL:Record<string,string> = {
  PENDING:"待接受", ACCEPTED:"處理中", RESOLVED:"已解決", RETURNED:"已轉回 AI",
};
const PRIORITY_COLOR = (p:number) =>
  p >= 8 ? "text-red-600" : p >= 5 ? "text-amber-600" : "text-gray-500";

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

export default function HandoffPage() {
  const [selected, setSelected] = useState<HandoffItem|null>(null);
  const [filter,   setFilter]   = useState<string>("all");
  const [liveCount,setLiveCount]= useState(0);
  const evtRef = useRef<EventSource|null>(null);

  // SSE connection for real-time updates
  useEffect(() => {
    const t = tok();
    if (!t) return;
    const es = new EventSource(`${BASE}/api/handoff/sse?workspaceId=${WS_ID}&token=${t}`);
    evtRef.current = es;
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type?.startsWith("handoff.")) refetch();
    };
    return () => es.close();
  }, []);

  const fetchFn = useCallback(() =>
    apiFetch(`/api/handoff?workspaceId=${WS_ID}${filter!=="all"?`&status=${filter}`:""}`),
    [filter]
  );
  const { data, refetch } = useApi<{ items:HandoffItem[]; counts:Record<string,number> }>(fetchFn, [filter]);

  const items  = data?.items  ?? [];
  const counts = data?.counts ?? {};
  const pending = counts["PENDING"] ?? 0;

  useEffect(() => { setLiveCount(pending); }, [pending]);

  async function accept(id:string) {
    await apiFetch(`/api/handoff/${id}/accept`, "PATCH");
    refetch();
  }
  async function resolve(id:string) {
    await apiFetch(`/api/handoff/${id}/resolve`, "PATCH");
    if (selected?.id===id) setSelected(null);
    refetch();
  }
  async function returnToAI(id:string) {
    await apiFetch(`/api/handoff/${id}/return`, "PATCH");
    if (selected?.id===id) setSelected(null);
    refetch();
  }

  const FILTERS = ["all","PENDING","ACCEPTED","RESOLVED"];
  const FILTER_LABEL:Record<string,string> = {
    all:"全部", PENDING:`待接受 ${pending>0?`(${pending})`:""}`,
    ACCEPTED:"處理中", RESOLVED:"已解決",
  };

  return (
    <div className="space-y-4">
      {/* Alert banner */}
      {liveCount > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse shrink-0"/>
          <p className="text-[13px] text-red-700 font-medium">
            {liveCount} 筆待接受交接，請盡快處理
          </p>
        </div>
      )}

      <div className="flex gap-1.5">
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-3 py-1.5 text-[12px] rounded-lg border transition-colors ${filter===f?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent hover:border-gray-200"}`}>
            {FILTER_LABEL[f]??f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Queue */}
        <Card>
          <CardTitle>交接佇列</CardTitle>
          {!items.length ? (
            <div className="py-10 text-center">
              <p className="text-[24px] mb-2">🎉</p>
              <p className="text-[13px] text-gray-400">目前沒有待處理的交接</p>
            </div>
          ) : items.map(item=>(
            <div key={item.id}
              onClick={()=>setSelected(item)}
              className={`py-3 px-2 -mx-2 border-b border-gray-50 last:border-0 cursor-pointer rounded-lg hover:bg-gray-50 transition-colors ${selected?.id===item.id?"bg-amber-50":""}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[12px] font-bold ${PRIORITY_COLOR(item.priority)}`}>
                  P{item.priority}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[item.status]??""}`}>
                  {STATUS_LABEL[item.status]??item.status}
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                  {item.platform}
                </span>
                <span className="text-[10px] text-gray-400 ml-auto">
                  {new Date(item.createdAt).toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})}
                </span>
              </div>
              <p className="text-[12px] text-gray-700 font-mono truncate">{item.userId}</p>
              <p className="text-[12px] text-gray-500 mt-0.5 line-clamp-1">{item.summary}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{REASON_LABEL[item.reason]??item.reason}</p>
            </div>
          ))}
        </Card>

        {/* Detail */}
        <Card>
          {selected ? (
            <>
              <CardTitle action={
                <div className="flex gap-1.5">
                  {selected.status==="PENDING"  && <Btn variant="primary" onClick={()=>accept(selected.id)} className="text-[11px]">接受</Btn>}
                  {selected.status==="ACCEPTED" && <Btn variant="primary" onClick={()=>resolve(selected.id)} className="text-[11px]">標記解決</Btn>}
                  {selected.status==="ACCEPTED" && <Btn onClick={()=>returnToAI(selected.id)} className="text-[11px]">轉回 AI</Btn>}
                </div>
              }>
                交接詳情
              </CardTitle>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ["平台", selected.platform],
                    ["User ID", selected.userId],
                    ["原因", REASON_LABEL[selected.reason]??selected.reason],
                    ["優先級", `P${selected.priority}`],
                    ["建立時間", new Date(selected.createdAt).toLocaleString("zh-TW")],
                    ["接受時間", selected.acceptedAt ? new Date(selected.acceptedAt).toLocaleString("zh-TW") : "—"],
                  ].map(([k,v])=>(
                    <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                      <p className="text-[10px] text-gray-400">{k}</p>
                      <p className="text-[12px] font-medium mt-0.5 truncate">{v}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">
                    AI 產生的情境摘要
                  </p>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-[13px] text-amber-900 leading-relaxed">
                    {selected.summary}
                  </div>
                </div>
                {selected.assignedTo && (
                  <p className="text-[12px] text-gray-500">
                    處理人員：<code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">{selected.assignedTo}</code>
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[28px] mb-2">🙋</p>
              <p className="text-[13px] text-gray-400">點選左側交接項目查看詳情</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
