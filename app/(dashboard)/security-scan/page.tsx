"use client";
import { useState } from "react";
import { Card, CardTitle, Btn } from "@/components/ui";

interface ScanResult {
  id:string; category:string; check:string;
  severity:"CRITICAL"|"HIGH"|"MEDIUM"|"LOW"|"INFO";
  status:"PASS"|"FAIL"|"WARN"|"SKIP";
  detail:string; fix?:string;
}
interface ScanReport {
  results:ScanResult[]; score:number; criticalCount:number; highCount:number;
}

const SEV_COLOR:Record<string,string> = {
  CRITICAL:"bg-red-600 text-white",
  HIGH:    "bg-red-100 text-red-700",
  MEDIUM:  "bg-amber-100 text-amber-700",
  LOW:     "bg-gray-100 text-gray-600",
  INFO:    "bg-blue-50 text-blue-600",
};
const STATUS_ICON:Record<string,string> = {
  PASS:"✅", FAIL:"❌", WARN:"⚠️", SKIP:"⏭",
};

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }

export default function SecurityScanPage() {
  const [scanning,  setScanning]  = useState(false);
  const [report,    setReport]    = useState<ScanReport|null>(null);
  const [filter,    setFilter]    = useState<string>("all");
  const [wsId,      setWsId]      = useState(WS_ID);

  async function runScan() {
    setScanning(true); setReport(null);
    try {
      const r = await fetch(`${BASE}/api/security-scan`, {
        method:  "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
        body:    JSON.stringify({ workspaceId: wsId }),
      });
      const data = await r.json();
      setReport(data);
    } catch(e) { alert((e as Error).message); }
    finally { setScanning(false); }
  }

  const scoreColor = !report ? "text-gray-400"
    : report.score >= 90 ? "text-green-600"
    : report.score >= 70 ? "text-amber-600"
    : "text-red-600";

  const groups = report
    ? Array.from(new Set(report.results.map(r=>r.category))).map(cat=>({
        cat,
        results: report.results.filter(r=>r.category===cat),
      }))
    : [];

  const filtered = filter==="all"
    ? groups
    : groups.map(g=>({...g, results:g.results.filter(r=>r.status===filter||r.severity===filter)}))
             .filter(g=>g.results.length>0);

  return (
    <div className="space-y-4">
      {/* Config + trigger */}
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-[12px] text-gray-500 block mb-1.5">掃描 Workspace</label>
          <select value={wsId} onChange={e=>setWsId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
            <option value="ws-a">客戶 A — 電商客服</option>
            <option value="ws-b">客戶 B — 房仲業務</option>
            <option value="ws-c">客戶 C — 醫療診所</option>
          </select>
        </div>
        <Btn variant="primary" onClick={runScan} className="px-6 py-2.5">
          {scanning
            ? <span className="flex items-center gap-2"><span className="animate-spin">⟳</span>掃描中...</span>
            : "🔍 執行安全掃描"}
        </Btn>
      </div>

      {/* Score summary */}
      {report && (
        <div className="grid grid-cols-4 gap-2.5">
          <div className="bg-white border border-gray-100 rounded-xl p-4 col-span-1 text-center">
            <p className={`text-[48px] font-medium leading-none ${scoreColor}`}>{report.score}</p>
            <p className="text-[12px] text-gray-400 mt-1">安全分數</p>
          </div>
          {[
            { label:"嚴重問題", count:report.criticalCount, color:"text-red-600", bg:"bg-red-50" },
            { label:"高危問題", count:report.highCount,     color:"text-amber-700", bg:"bg-amber-50" },
            { label:"通過檢查", count:report.results.filter(r=>r.status==="PASS").length, color:"text-green-600", bg:"bg-green-50" },
          ].map(s=>(
            <div key={s.label} className={`${s.bg} border-0 rounded-xl p-4`}>
              <p className={`text-[28px] font-medium ${s.color}`}>{s.count}</p>
              <p className="text-[12px] text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      {report && (
        <div className="flex flex-wrap gap-1.5">
          {[
            { key:"all",      label:"全部" },
            { key:"FAIL",     label:"❌ 失敗" },
            { key:"WARN",     label:"⚠️ 警告" },
            { key:"CRITICAL", label:"🔴 嚴重" },
            { key:"HIGH",     label:"🟠 高危" },
            { key:"PASS",     label:"✅ 通過" },
          ].map(f=>(
            <button key={f.key} onClick={()=>setFilter(f.key)}
              className={`text-[12px] px-3 py-1 rounded-full border transition-colors ${filter===f.key?"bg-brand-400 text-white border-brand-400":"bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Results by category */}
      {filtered.map(g=>(
        <Card key={g.cat}>
          <CardTitle>{g.cat}</CardTitle>
          <div className="space-y-0">
            {g.results.map(r=>(
              <div key={r.id} className={`py-3 border-b border-gray-50 last:border-0 ${r.status==="FAIL"?"bg-red-50/30":r.status==="WARN"?"bg-amber-50/30":""} rounded-lg px-2 -mx-2`}>
                <div className="flex items-start gap-3">
                  <span className="text-[16px] shrink-0 mt-0.5">{STATUS_ICON[r.status]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-medium">{r.check}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${SEV_COLOR[r.severity]}`}>
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">{r.detail}</p>
                    {r.fix && (
                      <p className="text-[11px] text-brand-700 mt-1 bg-brand-50 rounded px-2 py-1 inline-block">
                        ✦ {r.fix}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}

      {!report && !scanning && (
        <Card>
          <div className="py-16 text-center">
            <p className="text-[40px] mb-3">🛡️</p>
            <p className="text-[15px] font-medium text-gray-700 mb-2">進階安全掃描器</p>
            <p className="text-[13px] text-gray-400 leading-relaxed max-w-sm mx-auto">
              自動化檢查 Secrets 設定、Prompt Injection 風險、Channel 安全政策、
              Gateway 配置、Tool 審核設定等 15+ 安全項目。
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
