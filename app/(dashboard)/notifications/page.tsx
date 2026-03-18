"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface Notif {
  id:string; type:string; title:string; body:string;
  url:string|null; read:boolean; createdAt:string;
}
interface Anomaly {
  id:string; workspaceId:string; type:string; metric:string;
  value:number; baseline:number; deviation:number; acknowledged:boolean; createdAt:string;
}
const TYPE_ICON:Record<string,string> = {
  ALERT:"🚨", REVIEW_PENDING:"📋", BUDGET_WARNING:"💰",
  SECURITY:"🔒", SYSTEM:"ℹ️", AB_TEST:"🧬", KB_READY:"📚",
};
const ANOMALY_COLOR:Record<string,string> = {
  COST_SPIKE:"bg-red-50 text-red-600 border-red-100",
  MESSAGE_SPIKE:"bg-amber-50 text-amber-700 border-amber-100",
  ZERO_TRAFFIC:"bg-gray-100 text-gray-600 border-gray-200",
  ERROR_RATE_SPIKE:"bg-red-50 text-red-600 border-red-100",
  LATENCY_SPIKE:"bg-amber-50 text-amber-700 border-amber-100",
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path:string, method="GET") {
  const r = await fetch(`${BASE}${path}`, {
    method, headers: { Authorization:`Bearer ${tok()}` },
  });
  if (!r.ok) throw new Error("Failed");
  if (r.status===204) return null;
  return r.json();
}

export default function NotificationsPage() {
  const [tab, setTab] = useState<"notifs"|"anomalies">("notifs");

  const fetchNotifs = useCallback(() => apiFetch("/api/notifications?limit=50"), []);
  const fetchAnomaly= useCallback(() => apiFetch("/api/notifications/anomalies"), []);

  const {data:notifData, refetch:refetchN}  = useApi<{items:Notif[]; unreadCount:number}>(fetchNotifs, []);
  const {data:anomalies, refetch:refetchA}  = useApi<Anomaly[]>(fetchAnomaly, []);

  async function markAll()  { await apiFetch("/api/notifications/read-all","POST"); refetchN(); }
  async function ackAnomaly(id:string) { await apiFetch(`/api/notifications/anomalies/${id}/ack`,"PATCH"); refetchA(); }
  async function deleteN(id:string) { await apiFetch(`/api/notifications/${id}`,"DELETE"); refetchN(); }

  const unread = notifData?.unreadCount ?? 0;
  const unackAnomaly = anomalies?.filter(a=>!a.acknowledged).length ?? 0;

  return (
    <div className="max-w-3xl space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {[
          {key:"notifs",    label:"通知",       count:unread},
          {key:"anomalies", label:"異常事件",   count:unackAnomaly},
        ].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key as "notifs"|"anomalies")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${tab===t.key?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent"}`}>
            {t.label}
            {t.count>0 && (
              <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab==="notifs" && (
        <Card>
          <CardTitle action={
            unread>0 && <Btn onClick={markAll} className="text-[11px]">全部已讀</Btn>
          }>
            通知中心 {unread>0 && <span className="text-[12px] text-gray-400 font-normal">（{unread} 則未讀）</span>}
          </CardTitle>
          {!notifData?.items.length ? (
            <div className="py-10 text-center">
              <p className="text-[28px] mb-2">🔔</p>
              <p className="text-[13px] text-gray-400">暫無通知</p>
            </div>
          ) : notifData.items.map(n=>(
            <div key={n.id} className={`flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 ${!n.read?"bg-brand-50/30":""} rounded-lg px-2 -mx-2`}>
              <span className="text-[18px] shrink-0 mt-0.5">{TYPE_ICON[n.type]??"🔔"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-[13px] flex-1 ${!n.read?"font-medium":""}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0"/>}
                </div>
                <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString("zh-TW")}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                {n.url && <a href={n.url} className="text-[11px] text-brand-600 hover:underline">查看</a>}
                <button onClick={()=>deleteN(n.id)} className="text-[11px] text-gray-400 hover:text-red-400">×</button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {tab==="anomalies" && (
        <Card>
          <CardTitle action={
            <Btn onClick={()=>apiFetch("/api/notifications/anomalies","GET").then(()=>refetchA())} className="text-[11px]">
              刷新
            </Btn>
          }>
            智能異常偵測
          </CardTitle>
          <p className="text-[12px] text-gray-400 mb-3">
            系統自動比較今日數據與 7 日滾動基準，偏差超過閾值時觸發異常事件。
          </p>
          {!anomalies?.length ? (
            <div className="py-8 text-center">
              <p className="text-[28px] mb-2">✅</p>
              <p className="text-[13px] text-gray-400">暫無異常事件</p>
            </div>
          ) : anomalies.map(a=>(
            <div key={a.id} className={`border rounded-xl p-4 mb-2 ${a.acknowledged?"opacity-50":""} ${ANOMALY_COLOR[a.type]??"border-gray-100"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-medium">
                    {a.type==="COST_SPIKE"?"💰 費用異常飆升":
                     a.type==="MESSAGE_SPIKE"?"📈 訊息量異常增加":
                     a.type==="ZERO_TRAFFIC"?"📉 流量歸零":
                     a.type==="ERROR_RATE_SPIKE"?"🚨 錯誤率飆升":
                     a.type==="LATENCY_SPIKE"?"🐌 回應變慢":a.type}
                  </p>
                  <p className="text-[12px] mt-1">
                    {a.metric} = <strong>{a.value.toFixed(1)}</strong>（基準 {a.baseline.toFixed(1)}，偏差 <strong>{a.deviation>0?"+":""}{a.deviation}%</strong>）
                  </p>
                  <p className="text-[10px] mt-1 opacity-70">
                    {new Date(a.createdAt).toLocaleString("zh-TW")} · workspace: {a.workspaceId.slice(0,8)}
                  </p>
                </div>
                {!a.acknowledged && (
                  <Btn onClick={()=>ackAnomaly(a.id)} className="text-[11px] shrink-0">已知悉</Btn>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
