"use client";
// components/features/NotificationBell.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useApi } from "@/lib/use-api";
import { Bell } from "lucide-react";

interface Notif {
  id:string; type:string; title:string; body:string;
  url:string|null; read:boolean; createdAt:string;
}
const TYPE_ICON:Record<string,string> = {
  ALERT:"🚨", REVIEW_PENDING:"📋", BUDGET_WARNING:"💰",
  SECURITY:"🔒", SYSTEM:"ℹ️", AB_TEST:"🧬", KB_READY:"📚",
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path:string, method="GET") {
  const r = await fetch(`${BASE}${path}`, {
    method, headers:{ Authorization:`Bearer ${tok()}` },
  });
  if (!r.ok) throw new Error("Failed");
  if (r.status===204) return null;
  return r.json();
}

export function NotificationBell() {
  const [open,     setOpen]     = useState(false);
  const panelRef   = useRef<HTMLDivElement>(null);
  const fetchFn    = useCallback(() => apiFetch("/api/notifications?limit=20"), []);
  const { data, refetch } = useApi<{ items:Notif[]; unreadCount:number }>(fetchFn, []);

  const unread = data?.unreadCount ?? 0;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Poll every 30s
  useEffect(() => {
    const t = setInterval(refetch, 30_000);
    return () => clearInterval(t);
  }, [refetch]);

  async function markRead(id:string, url:string|null) {
    await apiFetch(`/api/notifications/${id}/read`, "PATCH");
    refetch();
    if (url) window.location.href = url;
  }

  async function markAll() {
    await apiFetch("/api/notifications/read-all", "POST");
    refetch();
  }

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(o=>!o)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 transition-colors">
        <Bell size={15} strokeWidth={1.8}/>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <p className="text-[13px] font-medium">通知</p>
            {unread > 0 && (
              <button onClick={markAll}
                className="text-[11px] text-brand-600 hover:underline">
                全部標為已讀
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!data?.items.length ? (
              <div className="py-8 text-center">
                <p className="text-[20px] mb-1">🔔</p>
                <p className="text-[12px] text-gray-400">暫無通知</p>
              </div>
            ) : data.items.map(n=>(
              <div key={n.id}
                onClick={()=>markRead(n.id, n.url)}
                className={`px-4 py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read?"bg-brand-50/40":""}`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-[16px] shrink-0 mt-0.5">{TYPE_ICON[n.type]??"🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-[12px] leading-tight flex-1 ${!n.read?"font-medium":""}`}>{n.title}</p>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0"/>}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(n.createdAt).toLocaleString("zh-TW",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"})}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-2 border-t border-gray-50">
            <button onClick={()=>{setOpen(false);window.location.href="/notifications";}}
              className="w-full text-[12px] text-center text-brand-600 hover:underline py-1">
              查看全部通知 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
