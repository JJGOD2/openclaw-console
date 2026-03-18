"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface Segment { id:string; name:string; color:string; _count:{tags:number}; createdAt:string; }
interface Broadcast {
  id:string; name:string; message:string; platform:string; status:string;
  sentCount:number; failCount:number; totalTarget:number;
  scheduledAt:string|null; completedAt:string|null;
  segment:{name:string}|null;
}

const STATUS_COLOR:Record<string,string>={
  DRAFT:"bg-gray-100 text-gray-500", SCHEDULED:"bg-blue-50 text-blue-700",
  SENDING:"bg-amber-50 text-amber-600 animate-pulse", COMPLETED:"bg-green-50 text-green-700",
  FAILED:"bg-red-50 text-red-600", CANCELED:"bg-gray-100 text-gray-400",
};
const STATUS_LABEL:Record<string,string>={
  DRAFT:"草稿", SCHEDULED:"已排程", SENDING:"發送中", COMPLETED:"已完成",
  FAILED:"失敗", CANCELED:"已取消",
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

export default function BroadcastPage() {
  const [tab,       setTab]       = useState<"broadcast"|"segments">("broadcast");
  const [bcForm,    setBcForm]    = useState({ name:"", message:"", platform:"LINE", segmentId:"" });
  const [segForm,   setSegForm]   = useState({ name:"", color:"#BA7517" });
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState<{ok:boolean;text:string}|null>(null);

  const fetchBroadcasts = useCallback(() => apiFetch(`/api/broadcasts?workspaceId=${WS_ID}`), []);
  const fetchSegments   = useCallback(() => apiFetch(`/api/segments?workspaceId=${WS_ID}`), []);

  const {data:broadcasts, loading:bcLoading, refetch:refetchBc}   = useApi<Broadcast[]>(fetchBroadcasts, []);
  const {data:segments,   loading:segLoading,refetch:refetchSeg}  = useApi<Segment[]>(fetchSegments, []);

  async function createBroadcast() {
    if (!bcForm.name || !bcForm.message) return;
    setSaving(true); setMsg(null);
    try {
      await apiFetch("/api/broadcasts", "POST", {
        workspaceId:WS_ID, ...bcForm,
        segmentId: bcForm.segmentId || undefined,
      });
      setBcForm({name:"",message:"",platform:"LINE",segmentId:""});
      refetchBc();
      setMsg({ok:true,text:"廣播已建立（草稿狀態）"});
    } catch(e){setMsg({ok:false,text:(e as Error).message});}
    finally{setSaving(false);}
  }

  async function sendBroadcast(id:string) {
    if (!confirm("確定立即發送此廣播？")) return;
    try {
      const r = await apiFetch(`/api/broadcasts/${id}/send`, "POST");
      setMsg({ok:true,text:`開始發送，目標 ${r.totalTarget} 位用戶`});
      refetchBc();
    } catch(e){setMsg({ok:false,text:(e as Error).message});}
  }

  async function deleteBroadcast(id:string) {
    await apiFetch(`/api/broadcasts/${id}`, "DELETE");
    refetchBc();
  }

  async function createSegment() {
    if (!segForm.name) return;
    setSaving(true);
    try {
      await apiFetch("/api/segments","POST",{workspaceId:WS_ID,...segForm,rules:[]});
      setSegForm({name:"",color:"#BA7517"});
      refetchSeg();
    } finally{setSaving(false);}
  }

  async function deleteSegment(id:string) {
    await apiFetch(`/api/segments/${id}`,"DELETE");
    refetchSeg();
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-[13px] border ${msg.ok?"bg-green-50 border-green-100 text-green-700":"bg-red-50 border-red-100 text-red-600"}`}>
          {msg.ok?"✓":"✕"} {msg.text}
          <button onClick={()=>setMsg(null)} className="ml-3 opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      <div className="flex gap-1.5">
        {(["broadcast","segments"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${tab===t?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent"}`}>
            {t==="broadcast"?"📢 廣播推播":"👥 用戶分群"}
          </button>
        ))}
      </div>

      {tab==="broadcast" && (
        <div className="grid grid-cols-2 gap-3">
          {/* Create form */}
          <Card>
            <CardTitle>建立廣播</CardTitle>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] text-gray-500 block mb-1.5">廣播名稱</label>
                <input value={bcForm.name} onChange={e=>setBcForm(f=>({...f,name:e.target.value}))}
                  placeholder="例：五月優惠通知"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-400"/>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 block mb-1.5">發送訊息</label>
                <textarea value={bcForm.message} onChange={e=>setBcForm(f=>({...f,message:e.target.value}))}
                  rows={4} placeholder="輸入廣播訊息內容（支援 LINE flex message）..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[13px] resize-none focus:outline-none focus:border-brand-400"/>
                <p className="text-[10px] text-gray-400 mt-1">{bcForm.message.length} / 5000 字元</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] text-gray-500 block mb-1.5">通道</label>
                  <select value={bcForm.platform} onChange={e=>setBcForm(f=>({...f,platform:e.target.value}))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
                    {["LINE","TELEGRAM","SLACK","ALL"].map(p=><option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[12px] text-gray-500 block mb-1.5">目標分群（選填）</label>
                  <select value={bcForm.segmentId} onChange={e=>setBcForm(f=>({...f,segmentId:e.target.value}))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
                    <option value="">全部用戶</option>
                    {(segments??[]).map(s=>(
                      <option key={s.id} value={s.id}>{s.name}（{s._count.tags}人）</option>
                    ))}
                  </select>
                </div>
              </div>
              <Btn variant="primary" onClick={createBroadcast} className="w-full justify-center">
                {saving?"建立中...":"建立廣播草稿"}
              </Btn>
            </div>
          </Card>

          {/* Broadcast list */}
          <Card>
            <CardTitle>廣播列表</CardTitle>
            {bcLoading ? <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p> :
             !broadcasts?.length ? <p className="text-[12px] text-gray-400 py-6 text-center">尚無廣播</p> :
             broadcasts.map(bc=>(
              <div key={bc.id} className="py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[13px] font-medium flex-1">{bc.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[bc.status]??""}`}>
                    {STATUS_LABEL[bc.status]??bc.status}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 line-clamp-1 mb-1.5">{bc.message}</p>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <span>{bc.platform}</span>
                  {bc.segment && <span>分群：{bc.segment.name}</span>}
                  {bc.status==="COMPLETED" && (
                    <span className="text-green-600">✓ {bc.sentCount}/{bc.totalTarget}</span>
                  )}
                  <div className="ml-auto flex gap-1">
                    {bc.status==="DRAFT" && (
                      <Btn onClick={()=>sendBroadcast(bc.id)} variant="primary" className="text-[10px] py-0.5">立即發送</Btn>
                    )}
                    {["DRAFT","FAILED"].includes(bc.status) && (
                      <Btn onClick={()=>deleteBroadcast(bc.id)} variant="danger" className="text-[10px] py-0.5">刪除</Btn>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab==="segments" && (
        <div className="grid grid-cols-2 gap-3">
          {/* Create segment */}
          <Card>
            <CardTitle>建立分群</CardTitle>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] text-gray-500 block mb-1.5">分群名稱</label>
                <input value={segForm.name} onChange={e=>setSegForm(f=>({...f,name:e.target.value}))}
                  placeholder="例：VIP 用戶、流失用戶..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-400"/>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 block mb-1.5">分群顏色</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={segForm.color}
                    onChange={e=>setSegForm(f=>({...f,color:e.target.value}))}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"/>
                  <div className="flex gap-2">
                    {["#BA7517","#3b82f6","#22c55e","#ef4444","#8b5cf6"].map(c=>(
                      <button key={c} onClick={()=>setSegForm(f=>({...f,color:c}))}
                        className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                        style={{backgroundColor:c,borderColor:segForm.color===c?"black":"transparent"}}/>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 text-[12px] text-amber-700">
                💡 建立分群後，在 Webhook 接收器或 Agent 中呼叫
                <code className="bg-amber-100 px-1 mx-0.5 rounded">POST /api/segments/tags</code>
                自動將用戶加入分群
              </div>
              <Btn variant="primary" onClick={createSegment} className="w-full justify-center">
                {saving?"建立中...":"建立分群"}
              </Btn>
            </div>
          </Card>

          {/* Segment list */}
          <Card>
            <CardTitle>用戶分群</CardTitle>
            {segLoading ? <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p> :
             !segments?.length ? <p className="text-[12px] text-gray-400 py-6 text-center">尚無分群</p> :
             segments.map(seg=>(
              <div key={seg.id} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <div className="w-3 h-3 rounded-full shrink-0" style={{backgroundColor:seg.color}}/>
                <div className="flex-1">
                  <p className="text-[13px] font-medium">{seg.name}</p>
                  <p className="text-[11px] text-gray-400">{seg._count.tags} 位用戶</p>
                </div>
                <Btn onClick={()=>deleteSegment(seg.id)} variant="danger" className="text-[10px]">刪除</Btn>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
