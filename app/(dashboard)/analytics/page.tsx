"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, MetricCard } from "@/components/ui";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
function apiGet(path: string) {
  return fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.json());
}

interface Overview {
  totals: { messages: number; costNTD: number; toolExecs: number; avgDailyMsgs: number };
  errorRate: number;
  activeSessions: number;
  daily: { date: string; messages: number; tokens: number; cost: number }[];
  reviewBreakdown: Record<string, number>;
}
interface AgentStat {
  id: string; name: string; role: string; workspaceName: string;
  conversations: number; errors: number; errorRate: number; status: string;
}
interface Retention {
  totalUsers: number; newUsers: number; returningUsers: number;
  loyalUsers: number; retentionRate: number;
}
interface CostForecast {
  monthToDate: number; dailyAverage: number; forecast: number;
  daysRemaining: number;
  dailyData: { date: string; costNTD: number }[];
}

const DAYS_OPTIONS = [7, 14, 30, 90];

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const fetchOverview  = useCallback(() => apiGet(`/api/analytics/overview?days=${days}`),  [days]);
  const fetchAgents    = useCallback(() => apiGet(`/api/analytics/agents?days=${days}`),    [days]);
  const fetchRetention = useCallback(() => apiGet(`/api/analytics/retention?days=${days}`), [days]);
  const fetchForecast  = useCallback(() => apiGet("/api/analytics/cost-forecast"),          []);

  const { data: overview  } = useApi<Overview>(fetchOverview,  [days]);
  const { data: agents    } = useApi<AgentStat[]>(fetchAgents, [days]);
  const { data: retention } = useApi<Retention>(fetchRetention,[days]);
  const { data: forecast  } = useApi<CostForecast>(fetchForecast, []);

  const chartColor = "#BA7517";

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-gray-500">期間：</span>
        {DAYS_OPTIONS.map(d => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-3 py-1 text-[12px] rounded-lg border transition-colors ${days === d ? "bg-brand-400 text-white border-brand-400" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"}`}>
            {d} 天
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2.5">
        <MetricCard label="訊息總量"    value={overview?.totals.messages.toLocaleString() ?? "—"} sub={`日均 ${overview?.totals.avgDailyMsgs ?? 0}`} />
        <MetricCard label="Token 成本"  value={`NT$${overview?.totals.costNTD.toLocaleString() ?? "—"}`} sub="本期間合計" />
        <MetricCard label="Tool 失敗率" value={`${overview?.errorRate ?? 0}%`} subColor={overview && overview.errorRate > 5 ? "red" : "green"} sub={overview && overview.errorRate > 5 ? "高於正常水準" : "正常"} />
        <MetricCard label="活躍 Sessions" value={overview?.activeSessions ?? "—"} sub="最近 24 小時" />
      </div>

      {/* Message trend + cost trend */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardTitle>每日訊息量趨勢</CardTitle>
          {overview?.daily?.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={overview.daily}>
                <defs>
                  <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={chartColor} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize:10, fill:"#9ca3af" }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"0.5px solid #e5e7eb" }} />
                <Area type="monotone" dataKey="messages" stroke={chartColor} strokeWidth={2} fill="url(#msgGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="h-44 flex items-center justify-center text-[12px] text-gray-400">載入中...</div>}
        </Card>

        <Card>
          <CardTitle>每日費用（NT$）</CardTitle>
          {forecast?.dailyData?.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={forecast.dailyData} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize:10, fill:"#9ca3af" }} tickFormatter={d => d.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:10, fill:"#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:"0.5px solid #e5e7eb" }} formatter={(v) => [`NT$${v}`, "費用"]} />
                <Bar dataKey="costNTD" fill={chartColor} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-44 flex items-center justify-center text-[12px] text-gray-400">載入中...</div>}
        </Card>
      </div>

      {/* Agent performance + retention */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardTitle>Agent 效能排行</CardTitle>
          {agents?.length ? (
            <table className="w-full">
              <thead><tr className="border-b border-gray-50">
                {["Agent","對話數","失敗率","狀態"].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-gray-400 pb-2 pr-3 uppercase tracking-wide">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {agents.slice(0,6).map(a => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="py-2 pr-3">
                      <p className="text-[13px] font-medium">{a.name}</p>
                      <p className="text-[10px] text-gray-400">{a.workspaceName}</p>
                    </td>
                    <td className="py-2 pr-3 text-[13px] text-gray-600">{a.conversations.toLocaleString()}</td>
                    <td className="py-2 pr-3">
                      <span className={`text-[12px] font-medium ${a.errorRate > 5 ? "text-red-500" : "text-green-600"}`}>
                        {a.errorRate}%
                      </span>
                    </td>
                    <td className="py-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${a.status === "ENABLED" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {a.status === "ENABLED" ? "啟用" : "停用"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="text-[12px] text-gray-400 py-6 text-center">載入中...</p>}
        </Card>

        <div className="space-y-3">
          {/* Retention */}
          <Card>
            <CardTitle>用戶回訪率（{days} 天）</CardTitle>
            {retention ? (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {[
                  { label:"總用戶數",  value:retention.totalUsers,     color:"text-gray-900" },
                  { label:"新用戶",    value:retention.newUsers,        color:"text-blue-600" },
                  { label:"回訪用戶",  value:retention.returningUsers,  color:"text-green-600" },
                  { label:"高黏著用戶",value:retention.loyalUsers,      color:"text-brand-600" },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] text-gray-400">{s.label}</p>
                    <p className={`text-[20px] font-medium mt-0.5 ${s.color}`}>{s.value.toLocaleString()}</p>
                  </div>
                ))}
                <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                  <p className="text-[11px] text-gray-400">回訪率</p>
                  <p className="text-[24px] font-medium text-brand-600">{retention.retentionRate}%</p>
                  <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-400 rounded-full" style={{ width:`${Math.min(retention.retentionRate,100)}%` }} />
                  </div>
                </div>
              </div>
            ) : <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p>}
          </Card>

          {/* Cost forecast */}
          <Card>
            <CardTitle>本月費用預測</CardTitle>
            {forecast ? (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label:"本月累計", value:`NT$${forecast.monthToDate.toLocaleString()}` },
                  { label:"日均費用", value:`NT$${forecast.dailyAverage.toLocaleString()}` },
                  { label:"預測月費", value:`NT$${forecast.forecast.toLocaleString()}` },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[11px] text-gray-400">{s.label}</p>
                    <p className="text-[15px] font-medium mt-0.5">{s.value}</p>
                  </div>
                ))}
                <p className="col-span-3 text-[11px] text-gray-400">距本月結束還有 {forecast.daysRemaining} 天</p>
              </div>
            ) : <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p>}
          </Card>
        </div>
      </div>

      {/* Review breakdown */}
      {overview?.reviewBreakdown && Object.keys(overview.reviewBreakdown).length > 0 && (
        <Card>
          <CardTitle>審核佇列分佈（{days} 天）</CardTitle>
          <div className="flex gap-4">
            {Object.entries(overview.reviewBreakdown).map(([status, count]) => {
              const colors: Record<string, string> = {
                PENDING:"bg-amber-50 text-amber-700", APPROVED:"bg-green-50 text-green-700",
                REJECTED:"bg-red-50 text-red-600",   EDITED:"bg-blue-50 text-blue-700", TIMEOUT:"bg-gray-100 text-gray-500",
              };
              const labels: Record<string, string> = {
                PENDING:"待審核", APPROVED:"已核准", REJECTED:"已拒絕", EDITED:"改稿發送", TIMEOUT:"已超時",
              };
              return (
                <div key={status} className={`flex-1 rounded-lg p-3 ${colors[status] ?? "bg-gray-50 text-gray-600"}`}>
                  <p className="text-[11px] font-medium">{labels[status] ?? status}</p>
                  <p className="text-[22px] font-medium mt-0.5">{count}</p>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
