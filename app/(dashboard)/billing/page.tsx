"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn, MetricCard } from "@/components/ui";

interface BillingStatus {
  hasBilling:   boolean;
  customerId?:  string;
  email?:       string;
  status?:      string;
  plan?:        string;
  periodEnd?:   string;
  cancelAtEnd?: boolean;
  trialEnd?:    string;
  invoices?:    { id: string; amount: number; status: string; paidAt: string | null; url: string | null }[];
}

const STATUS_COLOR: Record<string, string> = {
  TRIALING:   "bg-blue-50 text-blue-700",
  ACTIVE:     "bg-green-50 text-green-700",
  PAST_DUE:   "bg-red-50 text-red-600",
  CANCELED:   "bg-gray-100 text-gray-500",
  UNPAID:     "bg-red-50 text-red-600",
};
const STATUS_LABEL: Record<string, string> = {
  TRIALING: "試用中", ACTIVE: "訂閱中", PAST_DUE: "付款逾期", CANCELED: "已取消", UNPAID: "未付款",
};

const PLANS = [
  {
    key:"STARTER", name:"Starter", price:"NT$1,490", period:"/月",
    desc:"個人/小型團隊",
    features:["1 Workspace","3 Agents","2 通道","基本報表","社群支援"],
    color:"border-gray-200", cta:"選擇 Starter", primary:false,
  },
  {
    key:"PRO", name:"Pro", price:"NT$4,990", period:"/月",
    desc:"中小企業主力方案",
    features:["10 Workspaces","無上限 Agents","所有通道","安全中心","人工審核","整合服務","Email 支援"],
    color:"border-brand-400 ring-2 ring-brand-100", cta:"選擇 Pro", primary:true,
  },
  {
    key:"BUSINESS", name:"Business", price:"洽談", period:"",
    desc:"企業/白標",
    features:["無上限 Workspaces","白標設定","角色權限","稽核匯出","私有雲部署","SLA"],
    color:"border-gray-200", cta:"聯絡業務", primary:false,
  },
];

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";

function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path: string, method = "GET", body?: object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function BillingPage() {
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const fetchStatus = useCallback(() =>
    apiFetch(`/api/billing/status?workspaceId=${WS_ID}`), []
  );
  const { data: billing, loading, refetch } = useApi<BillingStatus>(fetchStatus, []);

  async function startCheckout(plan: string) {
    if (plan === "BUSINESS") {
      window.location.href = "mailto:contact@openclaw.example.com?subject=Business 方案詢問";
      return;
    }
    setCheckingOut(plan);
    try {
      const { url } = await apiFetch("/api/billing/checkout", "POST", {
        workspaceId: WS_ID,
        plan,
        email:       "admin@example.com",
        trialDays:   14,
      });
      window.location.href = url;
    } catch (e) {
      alert((e as Error).message);
    } finally { setCheckingOut(null); }
  }

  async function openPortal() {
    setOpeningPortal(true);
    try {
      const { url } = await apiFetch("/api/billing/portal", "POST", { workspaceId: WS_ID });
      window.location.href = url;
    } catch (e) { alert((e as Error).message); }
    finally { setOpeningPortal(false); }
  }

  return (
    <div className="space-y-4">
      {/* Current subscription */}
      {billing?.hasBilling && billing.status && (
        <Card>
          <CardTitle action={
            <Btn onClick={openPortal}>
              {openingPortal ? "開啟中..." : "管理訂閱 / 發票 →"}
            </Btn>
          }>
            目前訂閱
          </CardTitle>
          <div className="grid grid-cols-4 gap-2.5 mb-4">
            <MetricCard label="方案"   value={billing.plan ?? "—"} />
            <MetricCard label="狀態"   value={STATUS_LABEL[billing.status ?? ""] ?? billing.status ?? "—"} />
            <MetricCard label="到期日" value={billing.periodEnd ? new Date(billing.periodEnd).toLocaleDateString("zh-TW") : "—"} />
            <MetricCard label="帳單 Email" value={billing.email ?? "—"} />
          </div>

          {billing.trialEnd && new Date(billing.trialEnd) > new Date() && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-[13px] text-blue-700">
              試用期至 {new Date(billing.trialEnd).toLocaleDateString("zh-TW")}，到期後自動轉為付費方案。
            </div>
          )}
          {billing.cancelAtEnd && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-[13px] text-amber-700 mt-2">
              ⚠ 訂閱已設定在本期結束後取消，若要繼續使用請在 Stripe Portal 恢復訂閱。
            </div>
          )}

          {/* Invoices */}
          {billing.invoices && billing.invoices.length > 0 && (
            <div className="mt-4">
              <p className="text-[12px] font-medium text-gray-500 mb-2">最近發票</p>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {["日期","金額","狀態",""].map(h => (
                      <th key={h} className="text-left text-[11px] font-medium text-gray-400 pb-2 pr-4 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {billing.invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-[13px] text-gray-500">
                        {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString("zh-TW") : "—"}
                      </td>
                      <td className="py-2.5 pr-4 text-[13px] font-medium">NT${inv.amount.toLocaleString()}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${inv.status === "PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                          {inv.status === "PAID" ? "已付款" : inv.status}
                        </span>
                      </td>
                      <td className="py-2.5">
                        {inv.url && <a href={inv.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-blue-600 hover:underline">查看</a>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = billing?.plan === plan.key;
          return (
            <div key={plan.key} className={`bg-white border rounded-2xl p-6 relative ${plan.color}`}>
              {plan.key === "PRO" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-400 text-white text-[11px] font-medium px-3 py-0.5 rounded-full">
                  最受歡迎
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 bg-green-500 text-white text-[11px] font-medium px-3 py-0.5 rounded-full">
                  目前方案
                </div>
              )}
              <p className="text-[15px] font-medium">{plan.name}</p>
              <p className="text-[12px] text-gray-400 mt-0.5 mb-4">{plan.desc}</p>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-[28px] font-medium">{plan.price}</span>
                <span className="text-[13px] text-gray-400">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-[13px]">
                    <span className="text-green-500 shrink-0">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Btn
                variant={plan.primary ? "primary" : "default"}
                onClick={() => !isCurrent && startCheckout(plan.key)}
                className="w-full justify-center"
              >
                {checkingOut === plan.key ? "跳轉中..." : isCurrent ? "目前使用中" : plan.cta}
              </Btn>
            </div>
          );
        })}
      </div>

      {/* Trial CTA */}
      {!billing?.hasBilling && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-[15px] font-medium text-brand-800">14 天免費試用</p>
            <p className="text-[13px] text-brand-600 mt-0.5">無需信用卡，試用期間完整功能解鎖</p>
          </div>
          <Btn variant="primary" onClick={() => startCheckout("PRO")}>
            {checkingOut ? "跳轉中..." : "開始試用 Pro →"}
          </Btn>
        </div>
      )}
    </div>
  );
}
