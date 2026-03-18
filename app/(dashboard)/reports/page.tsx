"use client";
// app/(dashboard)/reports/page.tsx — AI-powered client report generator
import { useState } from "react";
import { Card, CardTitle, Btn } from "@/components/ui";

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }

interface ReportData {
  workspaceId: string;
  period:      string;
  totalMessages:number; totalTokens:number; totalCostNTD:number;
  avgDailyMessages:number; peakDay:string; peakMessages:number;
  reviewStats:{ pending:number; approved:number; rejected:number };
  topPlatform:string;
  uptimePct:number;
  incidents:number;
}

export default function ReportsPage() {
  const [wsId,      setWsId]      = useState(WS_ID);
  const [period,    setPeriod]    = useState("30");
  const [generating,setGenerating]= useState(false);
  const [report,    setReport]    = useState<string|null>(null);
  const [data,      setData]      = useState<ReportData|null>(null);
  const [format,    setFormat]    = useState<"markdown"|"html">("markdown");

  async function generate() {
    setGenerating(true); setReport(null);

    try {
      // 1. Gather data
      const [analyticsR, slaR] = await Promise.all([
        fetch(`${BASE}/api/analytics/overview?workspaceId=${wsId}&days=${period}`, {
          headers: { Authorization:`Bearer ${tok()}` },
        }).then(r=>r.json()),
        fetch(`${BASE}/api/sla/report?workspaceId=${wsId}&days=${period}`, {
          headers: { Authorization:`Bearer ${tok()}` },
        }).then(r=>r.ok ? r.json() : null),
      ]);

      const reportData: ReportData = {
        workspaceId:      wsId,
        period:           `最近 ${period} 天`,
        totalMessages:    analyticsR.totals?.messages ?? 0,
        totalTokens:      analyticsR.totals?.inputTokens + analyticsR.totals?.outputTokens ?? 0,
        totalCostNTD:     analyticsR.totals?.costNTD ?? 0,
        avgDailyMessages: analyticsR.totals?.avgDailyMsgs ?? 0,
        peakDay:          analyticsR.daily?.[0]?.date ?? "—",
        peakMessages:     Math.max(...(analyticsR.daily?.map((d: {messages:number})=>d.messages)??[0])),
        reviewStats:      {
          pending:  analyticsR.reviewBreakdown?.PENDING  ?? 0,
          approved: analyticsR.reviewBreakdown?.APPROVED ?? 0,
          rejected: analyticsR.reviewBreakdown?.REJECTED ?? 0,
        },
        topPlatform:      "LINE",
        uptimePct:        slaR?.uptimePct ?? 100,
        incidents:        slaR?.incidents?.length ?? 0,
      };
      setData(reportData);

      // 2. Call Claude to generate report narrative
      const prompt = `你是一名專業的 AI 客服顧問，請根據以下數據為客戶撰寫月度服務報告。
報告應使用繁體中文，語氣專業但易讀，包含執行摘要、關鍵指標、值得注意的趨勢、以及下月建議。

數據：
- 統計期間：${reportData.period}
- 總訊息量：${reportData.totalMessages.toLocaleString()} 則
- 每日平均：${reportData.avgDailyMessages} 則
- 最高單日：${reportData.peakMessages} 則（${reportData.peakDay}）
- API 費用：NT$${reportData.totalCostNTD.toFixed(0)}
- 審核統計：核准 ${reportData.reviewStats.approved}、拒絕 ${reportData.reviewStats.rejected}
- 系統可用率：${reportData.uptimePct}%
- 事故次數：${reportData.incidents} 次

請輸出格式：${format === "markdown" ? "Markdown" : "HTML"}`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method:  "POST",
        headers: {
          "Content-Type":      "application/json",
          "anthropic-version": "2023-06-01",
          // In production, this proxy call should go through your backend to protect API key
        },
        body: JSON.stringify({
          model:      "claude-haiku-4-5-20251001",
          max_tokens: 2000,
          messages:   [{ role:"user", content:prompt }],
        }),
      });

      // Fallback: generate static report if Claude call fails
      let narrative = "";
      if (response.ok) {
        const d = await response.json();
        narrative = d.content?.[0]?.text ?? "";
      }

      if (!narrative) {
        narrative = generateStaticReport(reportData, format);
      }

      setReport(narrative);
    } catch(e) {
      setReport(generateStaticReport(data!, format));
    } finally {
      setGenerating(false);
    }
  }

  function generateStaticReport(d: ReportData, fmt: string): string {
    if (!d) return "";
    const md = `# AI 客服服務月報

**統計期間**：${d.period}  
**產生日期**：${new Date().toLocaleDateString("zh-TW")}

---

## 執行摘要

本期 AI 客服系統共處理 **${d.totalMessages.toLocaleString()} 則**訊息，每日平均 **${d.avgDailyMessages} 則**，系統可用率維持在 **${d.uptimePct}%**。

## 關鍵指標

| 指標 | 數值 |
|------|------|
| 總訊息量 | ${d.totalMessages.toLocaleString()} 則 |
| 每日平均 | ${d.avgDailyMessages} 則 |
| 尖峰單日 | ${d.peakMessages} 則 |
| API 費用 | NT$${Number(d.totalCostNTD).toFixed(0)} |
| 系統可用率 | ${d.uptimePct}% |

## 人工審核統計

- 核准發送：${d.reviewStats.approved} 筆
- 拒絕退回：${d.reviewStats.rejected} 筆

## 下月建議

1. 繼續監控尖峰時段流量，考慮預先調整速率限制
2. 定期檢視人工審核拒絕原因，優化 Prompt 減少需審核比例
3. 確保 Secrets 未到期，避免服務中斷

---
*本報告由 MyWrapper Technologies 自動產生*`;
    return fmt === "markdown" ? md : `<html><body style="font-family:sans-serif;max-width:720px;margin:40px auto;line-height:1.7">
  ${md.replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g,'<br>')}
</body></html>`;
  }

  function download() {
    if (!report) return;
    const ext  = format === "markdown" ? "md" : "html";
    const blob = new Blob([report], { type:"text/plain;charset=utf-8" });
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = `openclaw-report-${wsId.slice(0,6)}-${new Date().toISOString().slice(0,10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function copy() {
    if (report) navigator.clipboard.writeText(report);
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Config */}
      <Card>
        <CardTitle>報告設定</CardTitle>
        <div className="space-y-4">
          <div>
            <label className="text-[12px] text-gray-500 block mb-1.5">Workspace</label>
            <select value={wsId} onChange={e=>setWsId(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
              <option value="ws-a">客戶 A — 電商客服</option>
              <option value="ws-b">客戶 B — 房仲業務</option>
              <option value="ws-c">客戶 C — 醫療診所</option>
            </select>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 block mb-1.5">統計期間</label>
            <select value={period} onChange={e=>setPeriod(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
              {[["7","最近 7 天"],["14","最近 2 週"],["30","最近 30 天"],["90","最近季度"]].map(([v,l])=>(
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[12px] text-gray-500 block mb-1.5">輸出格式</label>
            <div className="flex gap-2">
              {(["markdown","html"] as const).map(f=>(
                <button key={f} onClick={()=>setFormat(f)}
                  className={`flex-1 py-2 rounded-lg border text-[13px] transition-colors ${format===f?"border-brand-400 bg-amber-50 font-medium":"border-gray-200 hover:border-gray-300"}`}>
                  {f==="markdown"?"Markdown (.md)":"HTML (.html)"}
                </button>
              ))}
            </div>
          </div>

          {data && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">收集到的數據</p>
              {[
                ["訊息總量", `${data.totalMessages.toLocaleString()} 則`],
                ["日均訊息", `${data.avgDailyMessages} 則`],
                ["API 費用", `NT$${Number(data.totalCostNTD).toFixed(0)}`],
                ["可用率",   `${data.uptimePct}%`],
              ].map(([k,v])=>(
                <div key={k} className="flex justify-between text-[12px]">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          )}

          <Btn variant="primary" onClick={generate} className="w-full justify-center py-3">
            {generating
              ? <span className="flex items-center gap-2"><span className="animate-spin">⟳</span>AI 撰寫中...</span>
              : "✦ 產生月度報告"}
          </Btn>
        </div>
      </Card>

      {/* Report preview */}
      <Card className="flex flex-col">
        <CardTitle action={
          report && (
            <div className="flex gap-1.5">
              <Btn onClick={copy} className="text-[11px]">複製</Btn>
              <Btn onClick={download} variant="primary" className="text-[11px]">下載</Btn>
            </div>
          )
        }>
          報告預覽
        </CardTitle>
        {!report ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <p className="text-[32px] mb-3">📋</p>
            <p className="text-[14px] font-medium text-gray-600 mb-1">點擊「產生月度報告」</p>
            <p className="text-[12px] text-gray-400">AI 將自動根據數據撰寫專業報告</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            {format==="markdown" ? (
              <pre className="text-[12px] font-mono text-gray-700 whitespace-pre-wrap leading-relaxed p-1">
                {report}
              </pre>
            ) : (
              <iframe
                srcDoc={report}
                className="w-full h-full min-h-[500px] border-0 rounded-lg"
                title="Report Preview"
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
