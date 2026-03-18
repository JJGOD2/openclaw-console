"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle } from "@/components/ui";

interface AuditEntry {
  id: string; userId: string; action: string;
  target: string | null; detail: Record<string,unknown> | null;
  ip: string | null; createdAt: string;
  user?: { email: string; name: string | null };
}

const ACTION_COLOR: Record<string, string> = {
  "workspace.create":  "bg-green-50 text-green-700",
  "workspace.delete":  "bg-red-50 text-red-600",
  "agent.create":      "bg-blue-50 text-blue-700",
  "agent.update":      "bg-blue-50 text-blue-700",
  "agent.delete":      "bg-red-50 text-red-600",
  "secret.create":     "bg-amber-50 text-amber-700",
  "secret.delete":     "bg-red-50 text-red-600",
  "security.fix":      "bg-green-50 text-green-700",
  "gateway.push":      "bg-purple-50 text-purple-700",
  "user.login":        "bg-gray-100 text-gray-600",
  "user.create":       "bg-green-50 text-green-700",
  "review.approve":    "bg-green-50 text-green-700",
  "review.reject":     "bg-red-50 text-red-600",
  "billing.upgrade":   "bg-amber-50 text-amber-700",
};

const ACTION_LABEL: Record<string, string> = {
  "workspace.create":  "建立 Workspace",
  "workspace.update":  "更新 Workspace",
  "workspace.delete":  "刪除 Workspace",
  "workspace.backup":  "Workspace 備份",
  "workspace.restore": "Workspace 還原",
  "agent.create":      "建立 Agent",
  "agent.update":      "更新 Agent",
  "agent.delete":      "刪除 Agent",
  "channel.create":    "建立通道",
  "channel.toggle":    "切換通道狀態",
  "secret.create":     "新增 Secret",
  "secret.update":     "更新 Secret",
  "secret.delete":     "刪除 Secret",
  "security.fix":      "修正安全問題",
  "gateway.push":      "推送 Gateway Config",
  "gateway.validate":  "驗證 Gateway Config",
  "user.login":        "使用者登入",
  "user.create":       "建立使用者",
  "user.role_change":  "變更角色",
  "review.approve":    "核准審核項目",
  "review.reject":     "拒絕審核項目",
  "review.edit_send":  "改稿發送",
  "billing.upgrade":   "升級方案",
  "billing.cancel":    "取消訂閱",
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }

export default function AuditPage() {
  const [actionFilter, setActionFilter] = useState("all");
  const [expanded,     setExpanded]     = useState<string | null>(null);

  const fetchFn = useCallback(() =>
    fetch(`${BASE}/api/audit?limit=50${actionFilter !== "all" ? `&action=${actionFilter}` : ""}`,
      { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.json()),
    [actionFilter]
  );
  const { data, loading } = useApi<{ items: AuditEntry[] }>(fetchFn, [actionFilter]);

  const actionGroups = [
    { label: "全部",     value: "all" },
    { label: "Workspace", value: "workspace" },
    { label: "Agent",     value: "agent" },
    { label: "Security",  value: "secret,security" },
    { label: "Gateway",   value: "gateway" },
    { label: "使用者",    value: "user" },
    { label: "審核",      value: "review" },
    { label: "帳單",      value: "billing" },
  ];

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        {actionGroups.map(g => (
          <button key={g.value} onClick={() => setActionFilter(g.value)}
            className={`text-[12px] px-3 py-1 rounded-full border transition-colors ${actionFilter === g.value ? "bg-brand-400 text-white border-brand-400" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}>
            {g.label}
          </button>
        ))}
      </div>

      <Card>
        <CardTitle>操作紀錄</CardTitle>
        {loading ? (
          <p className="text-[12px] text-gray-400 py-8 text-center">載入中...</p>
        ) : !data?.items.length ? (
          <p className="text-[12px] text-gray-400 py-8 text-center">暫無紀錄</p>
        ) : (
          <div>
            {data.items.map((entry) => {
              const label = ACTION_LABEL[entry.action] ?? entry.action;
              const color = Object.entries(ACTION_COLOR).find(([k]) => entry.action.startsWith(k))?.[1]
                ?? "bg-gray-100 text-gray-600";
              const isExpanded = expanded === entry.id;

              return (
                <div key={entry.id}
                  className="py-3 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50 rounded-lg px-2 -mx-2"
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${color}`}>
                      {label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-mono text-gray-600 truncate">
                          {entry.user?.email ?? entry.userId}
                        </span>
                        {entry.target && (
                          <span className="text-[11px] text-gray-400 truncate">→ {entry.target}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {entry.ip && <span className="text-[10px] font-mono text-gray-400">{entry.ip}</span>}
                      <span className="text-[11px] text-gray-400">
                        {new Date(entry.createdAt).toLocaleString("zh-TW", {
                          month:"2-digit", day:"2-digit",
                          hour:"2-digit", minute:"2-digit",
                        })}
                      </span>
                      <span className="text-gray-400 text-[11px]">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </div>

                  {isExpanded && entry.detail && (
                    <div className="mt-2 ml-2">
                      <pre className="text-[11px] font-mono text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(entry.detail, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
