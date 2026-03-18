"use client";
import { useState } from "react";
import { Card, CardTitle, Btn } from "@/components/ui";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path: string, body: object) {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

type OpResult = { ok: boolean; message: string; detail?: object } | null;

interface BulkOpConfig {
  id:      string;
  title:   string;
  desc:    string;
  icon:    string;
  danger?: boolean;
  fields:  { key: string; label: string; type: string; default: string | number; placeholder?: string }[];
  endpoint:string;
}

const OPERATIONS: BulkOpConfig[] = [
  {
    id:       "copy-workspace",
    title:    "複製 Workspace",
    desc:     "將現有 Workspace 的 Agents、Tools、Skills 設定複製到新客戶",
    icon:     "📋",
    fields:   [
      { key:"sourceId",  label:"來源 Workspace ID", type:"text", default:"", placeholder:"ws-..." },
      { key:"newName",   label:"新 Workspace 名稱",  type:"text", default:"", placeholder:"電商客服" },
      { key:"newClient", label:"客戶名稱",            type:"text", default:"", placeholder:"客戶 D" },
    ],
    endpoint: "/api/bulk/workspace/copy",
  },
  {
    id:       "clear-logs",
    title:    "清理舊 Logs",
    desc:     "刪除指定天數以前的 Log 紀錄，釋放儲存空間",
    icon:     "🗑",
    danger:   true,
    fields:   [
      { key:"workspaceId",   label:"Workspace ID",  type:"text",   default:"", placeholder:"ws-..." },
      { key:"olderThanDays", label:"清除幾天前的紀錄", type:"number", default:90  },
    ],
    endpoint: "/api/bulk/logs/clear",
  },
  {
    id:       "auto-approve-reviews",
    title:    "批量自動核准審核",
    desc:     "自動核准超過指定時數、且不含高風險關鍵字的待審核項目",
    icon:     "✓",
    fields:   [
      { key:"workspaceId",    label:"Workspace ID",     type:"text",   default:"", placeholder:"ws-..." },
      { key:"olderThanHours", label:"超過幾小時未審核", type:"number", default:24  },
    ],
    endpoint: "/api/bulk/review/auto-approve",
  },
  {
    id:       "toggle-tools",
    title:    "批量工具開關",
    desc:     "一次啟用或停用多個 Tools",
    icon:     "🔧",
    fields:   [
      { key:"workspaceId", label:"Workspace ID",  type:"text",  default:"", placeholder:"ws-..." },
      { key:"toolIds",     label:"Tool IDs（逗號分隔）",type:"text", default:"", placeholder:"tool-1,tool-2" },
      { key:"enabled",     label:"啟用(1) / 停用(0)", type:"number", default:1 },
    ],
    endpoint: "/api/bulk/tools/toggle",
  },
];

export default function BulkPage() {
  const [activeOp,  setActiveOp]  = useState<BulkOpConfig | null>(null);
  const [formVals,  setFormVals]  = useState<Record<string, string | number>>({});
  const [running,   setRunning]   = useState(false);
  const [result,    setResult]    = useState<OpResult>(null);

  function selectOp(op: BulkOpConfig) {
    setActiveOp(op);
    setResult(null);
    setFormVals(Object.fromEntries(op.fields.map(f => [f.key, f.default])));
  }

  async function run() {
    if (!activeOp) return;
    if (activeOp.danger && !confirm(`確定執行「${activeOp.title}」？此操作不可復原。`)) return;
    setRunning(true); setResult(null);
    try {
      // Process fields — convert toolIds comma string to array
      const body: Record<string, unknown> = { ...formVals };
      if ("toolIds" in body && typeof body.toolIds === "string") {
        body.toolIds = (body.toolIds as string).split(",").map(s => s.trim()).filter(Boolean);
      }
      if ("enabled" in body) body.enabled = body.enabled === 1 || body.enabled === "1";

      const data = await apiFetch(activeOp.endpoint, body);
      setResult({ ok: true, message: "操作完成", detail: data });
    } catch (e) {
      setResult({ ok: false, message: (e as Error).message });
    } finally { setRunning(false); }
  }

  return (
    <div className="space-y-4">
      {/* Warning */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <span className="text-amber-500 text-[16px] shrink-0 mt-0.5">⚠</span>
        <p className="text-[12px] text-amber-700 leading-relaxed">
          批量操作會同時影響多筆資料。危險操作（紅色標示）執行前請先備份，
          並確認操作範圍正確。建議在非尖峰時段執行。
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Op list */}
        <div className="space-y-2">
          {OPERATIONS.map(op => (
            <div key={op.id}
              onClick={() => selectOp(op)}
              className={`bg-white border rounded-xl p-4 cursor-pointer transition-colors ${
                activeOp?.id === op.id ? "border-brand-400" :
                op.danger ? "border-red-100 hover:border-red-200" : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-[22px]">{op.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium">{op.title}</p>
                    {op.danger && <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-medium">危險</span>}
                  </div>
                  <p className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{op.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Op form */}
        <Card>
          {activeOp ? (
            <>
              <CardTitle>{activeOp.icon} {activeOp.title}</CardTitle>
              <div className="space-y-3">
                {activeOp.fields.map(field => (
                  <div key={field.key}>
                    <label className="text-[12px] text-gray-500 block mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      value={formVals[field.key] ?? ""}
                      onChange={e => setFormVals(v => ({ ...v, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-brand-400"
                    />
                  </div>
                ))}

                {result && (
                  <div className={`rounded-xl px-4 py-3 text-[13px] border ${result.ok ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-600"}`}>
                    <p className="font-medium">{result.ok ? "✓" : "✕"} {result.message}</p>
                    {result.detail && (
                      <pre className="text-[11px] mt-1.5 font-mono opacity-80 whitespace-pre-wrap">
                        {JSON.stringify(result.detail, null, 2)}
                      </pre>
                    )}
                  </div>
                )}

                <Btn
                  variant={activeOp.danger ? "danger" : "primary"}
                  onClick={run}
                  className="w-full justify-center"
                >
                  {running ? "執行中..." : `執行：${activeOp.title}`}
                </Btn>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <p className="text-[28px] mb-2">⚙️</p>
              <p className="text-[13px] text-gray-400">點選左側選擇批量操作</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
