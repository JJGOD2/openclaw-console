"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface HealthService {
  service: string; status: string; latencyMs: number | null;
  errorMessage: string | null; checkedAt: string | null;
}
interface HealthOverview { overallStatus: string; services: HealthService[]; }
interface SLAReport {
  uptimePct: number; avgLatencyMs: number; p95LatencyMs: number;
  totalChecks: number; slaGrade: string;
  incidents: { start: string; end: string; duration: number; service: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  HEALTHY:"bg-green-50 text-green-700", DEGRADED:"bg-amber-50 text-amber-700",
  DOWN:"bg-red-50 text-red-600", UNKNOWN:"bg-gray-100 text-gray-500",
};
const STATUS_DOT: Record<string, string> = {
  HEALTHY:"bg-green-400", DEGRADED:"bg-amber-400", DOWN:"bg-red-400", UNKNOWN:"bg-gray-300",
};
const SERVICE_LABEL: Record<string, string> = {
  "claude-api":"Claude API", "database":"PostgreSQL", "gateway":"OpenClaw Gateway",
  "line-api":"LINE API", "telegram-api":"Telegram API",
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";

function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
function apiFetch(path: string, method = "GET") {
  return fetch(`${BASE}${path}`, { method, headers: { Authorization:`Bearer ${tok()}` } }).then(r => r.json());
}

export default function SLAPage() {
  const [checking, setChecking] = useState(false);
  const [days, setDays] = useState(30);

  const fetchHealth = useCallback(() => apiFetch(`/api/sla/health?workspaceId=${WS_ID}`), []);
  const fetchReport = useCallback(() => apiFetch(`/api/sla/report?workspaceId=${WS_ID}&days=${days}`), [days]);

  const { data: health, loading: healthLoading, refetch: refetchHealth } = useApi<HealthOverview>(fetchHealth, []);
  const { data: report, loading: reportLoading }                         = useApi<SLAReport>(fetchReport, [days]);

  async function triggerCheck() {
    setChecking(true);
    try { await apiFetch(`/api/sla/check?workspaceId=${WS_ID}`, "POST"); refetchHealth(); }
    finally { setChecking(false); }
  }

  const gradeColor: Record<string, string> = { A:"text-green-600", B:"text-blue-600", C:"text-amber-600", D:"text-red-600" };

  return (
    <div className="space-y-4">
      {/* Overall status banner */}
      <div className={`rounded-xl border p-4 flex items-center gap-3 ${
        health?.overallStatus === "HEALTHY"  ? "bg-green-50 border-green-100" :
        health?.overallStatus === "DEGRADED" ? "bg-amber-50 border-amber-100" :
        "bg-red-50 border-red-100"
      }`}>
        <div className={`w-3 h-3 rounded-full shrink-0 ${STATUS_DOT[health?.overallStatus ?? "UNKNOWN"]} ${health?.overallStatus === "HEALTHY" ? "animate-pulse" : ""}`} />
        <div className="flex-1">
          <p className="text-[14px] font-medium">
            {health?.overallStatus === "HEALTHY"  ? "所有服務運行正常" :
             health?.overallStatus === "DEGRADED" ? "部分服務效能降低" : "服務異常，請檢查"}
          </p>
          <p className="text-[12px] text-gray-500 mt-0.5">
            {health?.services.filter(s => s.checkedAt).length > 0
              ? `上次檢查：${new Date(health!.services[0].checkedAt!).toLocaleString("zh-TW")}`
              : "尚未執行健康檢查"}
          </p>
        </div>
        <Btn onClick={triggerCheck}>{checking ? "檢查中..." : "立即檢查"}</Btn>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Service status */}
        <Card>
          <CardTitle>服務狀態</CardTitle>
          {healthLoading ? <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p> : (
            <div className="space-y-0">
              {health?.services.map(s => (
                <div key={s.service} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[s.status]}`} />
                  <div className="flex-1">
                    <p className="text-[13px] font-medium">{SERVICE_LABEL[s.service] ?? s.service}</p>
                    {s.errorMessage && <p className="text-[11px] text-red-500 mt-0.5">{s.errorMessage}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.latencyMs !== null && (
                      <span className={`text-[11px] font-mono ${s.latencyMs > 2000 ? "text-amber-600" : "text-gray-400"}`}>
                        {s.latencyMs}ms
                      </span>
                    )}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[s.status]}`}>
                      {s.status === "HEALTHY" ? "正常" : s.status === "DEGRADED" ? "降速" : s.status === "DOWN" ? "異常" : "未知"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* SLA report */}
        <Card>
          <CardTitle action={
            <div className="flex gap-1">
              {[7, 30, 90].map(d => (
                <button key={d} onClick={() => setDays(d)}
                  className={`text-[11px] px-2 py-0.5 rounded border ${days === d ? "bg-brand-400 text-white border-brand-400" : "border-gray-200 text-gray-500"}`}>
                  {d}天
                </button>
              ))}
            </div>
          }>
            SLA 報告
          </CardTitle>
          {reportLoading ? <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p> :
           !report ? <p className="text-[12px] text-gray-400 py-4 text-center">資料不足，請先執行健康檢查</p> : (
            <div className="space-y-4">
              {/* Grade + uptime */}
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className={`text-[48px] font-medium leading-none ${gradeColor[report.slaGrade]}`}>
                    {report.slaGrade}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">SLA 等級</p>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[12px] mb-1">
                    <span className="text-gray-500">可用率</span>
                    <span className="font-medium">{report.uptimePct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{ width:`${report.uptimePct}%` }} />
                  </div>
                </div>
              </div>

              {/* Latency stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label:"平均延遲", value:`${report.avgLatencyMs}ms` },
                  { label:"P95 延遲", value:`${report.p95LatencyMs}ms` },
                  { label:"檢查次數", value:report.totalChecks.toLocaleString() },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-[11px] text-gray-400">{s.label}</p>
                    <p className="text-[16px] font-medium mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Incidents */}
              {report.incidents.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                    事故紀錄（{report.incidents.length} 次）
                  </p>
                  {report.incidents.map((inc, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0 text-[12px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <span className="text-gray-600">{SERVICE_LABEL[inc.service] ?? inc.service}</span>
                      <span className="text-gray-400">{new Date(inc.start).toLocaleDateString("zh-TW")}</span>
                      <span className="text-amber-600 ml-auto">{inc.duration} 分鐘</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
