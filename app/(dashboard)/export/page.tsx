"use client";
import { useState } from "react";
import { Card, CardTitle, Btn } from "@/components/ui";

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }

interface ExportConfig {
  type:     "sessions" | "usage";
  format:   "csv" | "json" | "markdown";
  platform: string;
  days:     number;
  months:   number;
}

export default function ExportPage() {
  const [cfg, setCfg] = useState<ExportConfig>({
    type:"sessions", format:"csv", platform:"all", days:30, months:3,
  });
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ok:boolean;msg:string}|null>(null);

  function set<K extends keyof ExportConfig>(k: K, v: ExportConfig[K]) {
    setCfg(c => ({ ...c, [k]: v }));
  }

  async function doExport() {
    setLoading(true); setResult(null);
    try {
      let url = `${BASE}/api/export/`;
      let filename = "";

      if (cfg.type === "sessions") {
        const params = new URLSearchParams({
          workspaceId: WS_ID,
          format:      cfg.format,
          days:        String(cfg.days),
          ...(cfg.platform !== "all" ? { platform: cfg.platform } : {}),
        });
        url += `sessions?${params}`;
        filename = `conversations-${new Date().toISOString().slice(0,10)}.${cfg.format === "markdown" ? "md" : cfg.format}`;
      } else {
        const params = new URLSearchParams({ workspaceId: WS_ID, months: String(cfg.months) });
        url += `usage?${params}`;
        filename = `usage-${cfg.months}mo.csv`;
      }

      const r = await fetch(url, { headers: { Authorization: `Bearer ${tok()}` } });
      if (!r.ok) { setResult({ ok:false, msg: await r.text() }); return; }

      const blob = await r.blob();
      const a    = document.createElement("a");
      a.href     = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
      setResult({ ok:true, msg:`${filename} 已下載` });
    } catch(e) { setResult({ ok:false, msg:(e as Error).message }); }
    finally { setLoading(false); }
  }

  const TYPE_OPTIONS: { key: ExportConfig["type"]; label: string; icon: string; desc: string }[] = [
    { key:"sessions", label:"對話紀錄", icon:"💬", desc:"所有 Session 的完整對話內容" },
    { key:"usage",    label:"用量報表", icon:"📊", desc:"每日 Token 用量與費用明細" },
  ];
  const FORMAT_OPTIONS: { key: ExportConfig["format"]; label: string; desc: string }[] = [
    { key:"csv",      label:"CSV",       desc:"Excel 可直接開啟" },
    { key:"json",     label:"JSON",      desc:"程式化處理" },
    { key:"markdown", label:"Markdown",  desc:"適合文件整理" },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardTitle>選擇匯出類型</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          {TYPE_OPTIONS.map(t => (
            <div key={t.key} onClick={() => set("type", t.key)}
              className={`border rounded-xl p-4 cursor-pointer transition-colors ${cfg.type === t.key ? "border-brand-400 bg-amber-50" : "border-gray-100 hover:border-gray-200"}`}>
              <p className="text-[22px] mb-1">{t.icon}</p>
              <p className="text-[13px] font-medium">{t.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{t.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {cfg.type === "sessions" && (
        <Card>
          <CardTitle>對話紀錄設定</CardTitle>
          <div className="space-y-4">
            <div>
              <label className="text-[12px] text-gray-500 block mb-2">匯出格式</label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map(f => (
                  <div key={f.key} onClick={() => set("format", f.key)}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${cfg.format === f.key ? "border-brand-400 bg-amber-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <p className="text-[13px] font-medium">{f.label}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] text-gray-500 block mb-1.5">通道篩選</label>
                <select value={cfg.platform} onChange={e => set("platform", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
                  <option value="all">全部通道</option>
                  {["LINE","TELEGRAM","SLACK","DISCORD","WHATSAPP"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[12px] text-gray-500 block mb-1.5">時間範圍（天）</label>
                <select value={cfg.days} onChange={e => set("days", Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
                  {[7, 14, 30, 90, 180, 365].map(d => (
                    <option key={d} value={d}>最近 {d} 天</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
      )}

      {cfg.type === "usage" && (
        <Card>
          <CardTitle>用量報表設定</CardTitle>
          <div>
            <label className="text-[12px] text-gray-500 block mb-1.5">匯出月數</label>
            <select value={cfg.months} onChange={e => set("months", Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
              {[1,2,3,6,12].map(m => <option key={m} value={m}>最近 {m} 個月</option>)}
            </select>
          </div>
        </Card>
      )}

      {result && (
        <div className={`rounded-xl px-4 py-3 text-[13px] border ${result.ok ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-600"}`}>
          {result.ok ? "✓" : "✕"} {result.msg}
        </div>
      )}

      <Btn variant="primary" onClick={doExport} className="w-full justify-center py-3">
        {loading ? "匯出中..." : `下載 ${cfg.type === "sessions" ? "對話紀錄" : "用量報表"}`}
      </Btn>
    </div>
  );
}
