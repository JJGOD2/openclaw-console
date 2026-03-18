"use client";
// components/features/OAuthStatus.tsx
// 通用 OAuth 狀態顯示元件，用於 Integrations 頁面
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Btn } from "@/components/ui";

interface OAuthStatusData {
  exists:            boolean;
  isValid:           boolean;
  expiresAt:         string | null;
  expiresInMinutes:  number;
  needsRefresh:      boolean;
  userEmail:         string | null;
  refreshFailCount:  number;
  scope:             string;
}

interface OAuthStatusProps {
  workspaceId: string;
  provider:    "google";
  scopeKey:    "gmail" | "calendar" | "full";
  label:       string;           // e.g. "Gmail"
  onRevoked?:  () => void;
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function tok() {
  return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : "";
}

export function OAuthStatus({ workspaceId, provider, scopeKey, label, onRevoked }: OAuthStatusProps) {
  const [revoking, setRevoking] = useState(false);

  const fetchStatus = useCallback(() =>
    fetch(`${BASE}/api/oauth/${provider}/status?workspaceId=${workspaceId}&scope=${scopeKey}`, {
      headers: { Authorization: `Bearer ${tok()}` },
    }).then(r => r.json()),
    [workspaceId, provider, scopeKey]
  );
  const { data: status, loading, refetch } = useApi<OAuthStatusData>(fetchStatus, [workspaceId, scopeKey]);

  async function startAuth() {
    const res = await fetch(
      `${BASE}/api/oauth/${provider}/auth-url?workspaceId=${workspaceId}&scope=${scopeKey}`,
      { headers: { Authorization: `Bearer ${tok()}` } }
    );
    const { url } = await res.json();
    window.location.href = url;
  }

  async function revoke() {
    if (!confirm(`確定撤銷 ${label} 的 OAuth 授權？`)) return;
    setRevoking(true);
    try {
      await fetch(`${BASE}/api/oauth/${provider}/revoke`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ workspaceId, scope: scopeKey }),
      });
      refetch();
      onRevoked?.();
    } finally { setRevoking(false); }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse" />
        <span className="text-[12px] text-gray-400">檢查 {label} 授權狀態...</span>
      </div>
    );
  }

  if (!status?.exists) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-300" />
          <div>
            <p className="text-[13px] text-gray-600">{label}</p>
            <p className="text-[11px] text-gray-400">尚未授權</p>
          </div>
        </div>
        <Btn onClick={startAuth} variant="primary" className="text-[12px]">
          授權 {label} →
        </Btn>
      </div>
    );
  }

  if (!status.isValid) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <div>
            <p className="text-[13px] font-medium text-red-600">{label} — 授權已失效</p>
            <p className="text-[11px] text-red-500">
              連續換票失敗 {status.refreshFailCount} 次，請重新授權
            </p>
          </div>
        </div>
        <Btn onClick={startAuth} variant="danger" className="text-[12px]">
          重新授權
        </Btn>
      </div>
    );
  }

  const expColor =
    status.expiresInMinutes < 5   ? "text-red-500"    :
    status.expiresInMinutes < 30  ? "text-amber-600"  :
    "text-green-600";

  const expLabel =
    status.expiresInMinutes < 1   ? "即將到期" :
    status.expiresInMinutes < 60  ? `${status.expiresInMinutes} 分鐘後到期` :
    `${Math.floor(status.expiresInMinutes / 60)} 小時後到期`;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status.needsRefresh ? "bg-amber-400" : "bg-green-400"}`} />
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-medium">{label}</p>
            <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded-full font-medium">授權中</span>
            {status.needsRefresh && (
              <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">換票中</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {status.userEmail && (
              <span className="text-[11px] text-gray-400 font-mono">{status.userEmail}</span>
            )}
            <span className={`text-[11px] ${expColor}`}>{expLabel}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-1.5">
        <Btn onClick={startAuth} className="text-[11px]">重新授權</Btn>
        <Btn onClick={revoke} variant="danger" className="text-[11px]">
          {revoking ? "撤銷中..." : "撤銷"}
        </Btn>
      </div>
    </div>
  );
}

// ── All-in-one Google OAuth panel ────────────────────────────
export function GoogleOAuthPanel({ workspaceId }: { workspaceId: string }) {
  return (
    <div className="space-y-0">
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">Google 帳號授權</p>
      <div className="divide-y divide-gray-50">
        <OAuthStatus workspaceId={workspaceId} provider="google" scopeKey="gmail"    label="Gmail" />
        <OAuthStatus workspaceId={workspaceId} provider="google" scopeKey="calendar" label="Google Calendar" />
      </div>
      <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">
        授權後 access token 每 60 分鐘自動換票，不需人工介入。
        重新授權需登入 Google 帳號並同意存取權限。
      </p>
    </div>
  );
}
