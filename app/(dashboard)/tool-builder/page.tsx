"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface CustomTool {
  id: string; name: string; displayName: string; description: string;
  trigger: string; configJson: Record<string,unknown>; inputSchema: Record<string,unknown>;
  outputFormat: string; enabled: boolean; usageCount: number; createdAt: string;
}

const TRIGGER_INFO: Record<string, { label: string; icon: string; color: string; fields: TriggerField[] }> = {
  HTTP_GET: {
    label:"HTTP GET", icon:"🌐", color:"bg-blue-50 text-blue-700",
    fields:[
      { key:"url",     label:"URL",            type:"text",  placeholder:"https://api.example.com/{{userId}}", required:true },
      { key:"headers", label:"Headers (JSON)", type:"code",  placeholder:'{"Authorization":"Bearer TOKEN"}', required:false },
    ],
  },
  HTTP_POST: {
    label:"HTTP POST", icon:"📤", color:"bg-purple-50 text-purple-700",
    fields:[
      { key:"url",          label:"URL",              type:"text", placeholder:"https://api.example.com/webhook", required:true },
      { key:"bodyTemplate", label:"Body Template (JSON)", type:"code", placeholder:'{"userId":"{{userId}}","msg":"{{text}}"}', required:false },
    ],
  },
  GOOGLE_SHEETS_READ: {
    label:"Sheets 讀取", icon:"📊", color:"bg-green-50 text-green-700",
    fields:[
      { key:"spreadsheetId", label:"Spreadsheet ID", type:"text", placeholder:"1BxiMVs0...", required:true },
      { key:"range",         label:"範圍",            type:"text", placeholder:"Sheet1!A:D", required:true },
    ],
  },
  GOOGLE_SHEETS_WRITE: {
    label:"Sheets 寫入", icon:"✏️", color:"bg-green-50 text-green-700",
    fields:[
      { key:"spreadsheetId", label:"Spreadsheet ID", type:"text", placeholder:"1BxiMVs0...", required:true },
      { key:"range",         label:"目標範圍",        type:"text", placeholder:"Sheet1!A:G", required:true },
    ],
  },
  NOTION_CREATE: {
    label:"Notion 建立頁面", icon:"📝", color:"bg-gray-100 text-gray-700",
    fields:[{ key:"databaseId", label:"Database ID", type:"text", placeholder:"abc123...", required:true }],
  },
  GMAIL_SEND: {
    label:"Gmail 發信", icon:"📧", color:"bg-red-50 text-red-600",
    fields:[
      { key:"defaultTo", label:"預設收件人",  type:"text", placeholder:"admin@example.com", required:false },
      { key:"subject",   label:"主旨模板",    type:"text", placeholder:"來自 {{agentName}} 的通知", required:true },
      { key:"body",      label:"內文模板",    type:"textarea", placeholder:"用戶 {{userId}} 說：{{text}}", required:true },
    ],
  },
  GCAL_CREATE: {
    label:"Calendar 建立行程", icon:"📅", color:"bg-blue-50 text-blue-700",
    fields:[
      { key:"summary",     label:"標題模板", type:"text",     placeholder:"{{title}}", required:true },
      { key:"description", label:"說明模板", type:"textarea", placeholder:"由 {{agentName}} 建立", required:false },
    ],
  },
  CUSTOM_FUNCTION: {
    label:"自定義函數", icon:"⚡", color:"bg-amber-50 text-amber-700",
    fields:[
      { key:"function", label:"JavaScript 函數 (input) => {}",
        type:"code", placeholder:"(input) => `已收到：${input.text}`", required:true },
    ],
  },
};

interface TriggerField {
  key: string; label: string; type: "text"|"textarea"|"code";
  placeholder: string; required: boolean;
}

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path: string, method = "GET", body?: object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  if (r.status === 204) return null;
  return r.json();
}

export default function ToolBuilderPage() {
  const [mode,        setMode]        = useState<"list"|"create"|"edit">("list");
  const [selected,    setSelected]    = useState<CustomTool | null>(null);
  const [trigger,     setTrigger]     = useState("HTTP_GET");
  const [form,        setForm]        = useState({ name:"", displayName:"", description:"", outputFormat:"text" });
  const [cfgFields,   setCfgFields]   = useState<Record<string,string>>({});
  const [testInput,   setTestInput]   = useState("{}");
  const [testResult,  setTestResult]  = useState<{ok:boolean;output:unknown;latencyMs:number;error?:string}|null>(null);
  const [saving,      setSaving]      = useState(false);
  const [testing,     setTesting]     = useState(false);
  const [deleteId,    setDeleteId]    = useState<string|null>(null);

  const fetchFn = useCallback(() => apiFetch(`/api/tool-builder?workspaceId=${WS_ID}`), []);
  const { data: tools, loading, refetch } = useApi<CustomTool[]>(fetchFn, []);

  const triggerInfo = TRIGGER_INFO[trigger];

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    setSaving(true);
    try {
      // Parse JSON fields
      let configJson: Record<string,unknown> = {};
      for (const [k, v] of Object.entries(cfgFields)) {
        if (v.trim().startsWith("{") || v.trim().startsWith("[")) {
          try { configJson[k] = JSON.parse(v); continue; } catch {}
        }
        configJson[k] = v;
      }

      if (mode === "create") {
        await apiFetch("/api/tool-builder", "POST", {
          workspaceId: WS_ID, ...form, trigger, configJson,
        });
      } else if (selected) {
        await apiFetch(`/api/tool-builder/${selected.id}`, "PATCH", {
          displayName: form.displayName, description: form.description,
          configJson, outputFormat: form.outputFormat,
        });
      }
      refetch(); setMode("list"); setSelected(null);
    } catch(e) { alert((e as Error).message); }
    finally { setSaving(false); }
  }

  async function toggleEnabled(tool: CustomTool) {
    await apiFetch(`/api/tool-builder/${tool.id}`, "PATCH", { enabled: !tool.enabled });
    refetch();
  }

  async function deleteTool(id: string) {
    await apiFetch(`/api/tool-builder/${id}`, "DELETE");
    setDeleteId(null); refetch();
  }

  async function runTest(id: string) {
    setTesting(true); setTestResult(null);
    try {
      let input: object = {};
      try { input = JSON.parse(testInput); } catch { alert("Input JSON 格式錯誤"); return; }
      const r = await apiFetch(`/api/tool-builder/${id}/test`, "POST", { input });
      setTestResult(r);
    } catch(e) { setTestResult({ ok:false, output:null, latencyMs:0, error:(e as Error).message }); }
    finally { setTesting(false); }
  }

  function startEdit(tool: CustomTool) {
    setSelected(tool);
    setMode("edit");
    setTrigger(tool.trigger);
    setForm({ name:tool.name, displayName:tool.displayName, description:tool.description, outputFormat:tool.outputFormat });
    const strCfg: Record<string,string> = {};
    for (const [k,v] of Object.entries(tool.configJson)) {
      strCfg[k] = typeof v === "object" ? JSON.stringify(v, null, 2) : String(v);
    }
    setCfgFields(strCfg);
    setTestResult(null);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          <button onClick={() => { setMode("list"); setSelected(null); }}
            className={`px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${mode==="list"?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent"}`}>
            工具列表
          </button>
          <button onClick={() => { setMode("create"); setTrigger("HTTP_GET"); setForm({name:"",displayName:"",description:"",outputFormat:"text"}); setCfgFields({}); }}
            className={`px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${mode==="create"?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent"}`}>
            + 建立工具
          </button>
        </div>
        <span className="text-[12px] text-gray-400">{tools?.length ?? 0} 個自定義工具</span>
      </div>

      {/* Tool list */}
      {mode === "list" && (
        <div className="space-y-2">
          {loading ? <p className="text-[12px] text-gray-400 py-8 text-center">載入中...</p>
          : !tools?.length ? (
            <Card>
              <div className="py-12 text-center">
                <p className="text-[32px] mb-3">🔧</p>
                <p className="text-[14px] font-medium text-gray-600 mb-1">尚無自定義工具</p>
                <p className="text-[13px] text-gray-400">點擊「建立工具」，不需寫程式即可建立 Agent 可呼叫的工具</p>
              </div>
            </Card>
          ) : tools.map(tool => {
            const info = TRIGGER_INFO[tool.trigger];
            return (
              <div key={tool.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-[20px] shrink-0 mt-0.5">{info?.icon ?? "🔧"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[14px] font-medium">{tool.displayName}</p>
                      <span className="text-[10px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{tool.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${info?.color ?? "bg-gray-100 text-gray-500"}`}>
                        {info?.label ?? tool.trigger}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 truncate">{tool.description}</p>
                    <p className="text-[11px] text-gray-400 mt-1">已使用 {tool.usageCount} 次</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleEnabled(tool)}
                      className={`w-8 h-4 rounded-full transition-colors relative ${tool.enabled ? "bg-green-400" : "bg-gray-200"}`}>
                      <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all shadow-sm ${tool.enabled ? "left-4.5 translate-x-px" : "left-0.5"}`} />
                    </button>
                    <Btn onClick={() => startEdit(tool)} className="text-[11px]">編輯</Btn>
                    <Btn onClick={() => setDeleteId(tool.id)} variant="danger" className="text-[11px]">刪除</Btn>
                  </div>
                </div>

                {/* Inline test */}
                {selected?.id === tool.id && (
                  <div className="mt-3 pt-3 border-t border-gray-50 space-y-2">
                    <div className="flex gap-2">
                      <textarea value={testInput} onChange={e => setTestInput(e.target.value)}
                        rows={2} placeholder='{"userId":"U123","text":"查詢訂單"}'
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] font-mono resize-none focus:outline-none focus:border-brand-400" />
                      <Btn onClick={() => runTest(tool.id)} className="self-start">
                        {testing ? "測試中..." : "▶ 執行"}
                      </Btn>
                    </div>
                    {testResult && (
                      <div className={`rounded-lg px-3 py-2 text-[11px] font-mono ${testResult.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{testResult.ok ? "✓ 成功" : "✕ 失敗"}</span>
                          <span className="text-gray-400">{testResult.latencyMs}ms</span>
                        </div>
                        <pre className="whitespace-pre-wrap break-all">
                          {testResult.error ?? JSON.stringify(testResult.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {selected?.id !== tool.id && (
                  <button onClick={() => { setSelected(tool); setTestInput("{}"); setTestResult(null); }}
                    className="mt-2 text-[11px] text-blue-500 hover:underline">
                    展開測試
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit form */}
      {(mode === "create" || mode === "edit") && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardTitle>{mode === "create" ? "建立新工具" : `編輯：${selected?.displayName}`}</CardTitle>
            <div className="space-y-3">
              {mode === "create" && (
                <>
                  <div>
                    <label className="text-[12px] text-gray-500 block mb-1.5">觸發類型</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {Object.entries(TRIGGER_INFO).map(([k, info]) => (
                        <button key={k} onClick={() => setTrigger(k)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left text-[12px] transition-colors ${trigger === k ? "border-brand-400 bg-amber-50 font-medium" : "border-gray-100 hover:border-gray-200"}`}>
                          <span>{info.icon}</span>{info.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] text-gray-500 block mb-1.5">工具 ID <span className="text-gray-400">（小寫英數）</span></label>
                      <input value={form.name} onChange={e => setField("name", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))}
                        placeholder="check-inventory"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] font-mono focus:outline-none focus:border-brand-400" />
                    </div>
                    <div>
                      <label className="text-[12px] text-gray-500 block mb-1.5">顯示名稱</label>
                      <input value={form.displayName} onChange={e => setField("displayName", e.target.value)}
                        placeholder="查詢庫存"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-400" />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="text-[12px] text-gray-500 block mb-1.5">工具描述 <span className="text-gray-400">（Agent 會根據此說明決定何時使用）</span></label>
                <textarea value={form.description} onChange={e => setField("description", e.target.value)}
                  rows={2} placeholder="查詢指定商品的庫存數量，需要提供商品 ID"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] resize-none focus:outline-none focus:border-brand-400" />
              </div>

              {/* Trigger-specific fields */}
              {(mode === "create" ? TRIGGER_INFO[trigger] : TRIGGER_INFO[selected?.trigger ?? "HTTP_GET"])?.fields.map(f => (
                <div key={f.key}>
                  <label className="text-[12px] text-gray-500 block mb-1.5">
                    {f.label}{f.required ? " *" : ""}
                  </label>
                  {f.type === "textarea" || f.type === "code" ? (
                    <textarea value={cfgFields[f.key] ?? ""} onChange={e => setCfgFields(c => ({ ...c, [f.key]: e.target.value }))}
                      rows={f.type === "code" ? 4 : 3}
                      placeholder={f.placeholder}
                      className={`w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] resize-none focus:outline-none focus:border-brand-400 ${f.type==="code"?"font-mono":""}`} />
                  ) : (
                    <input value={cfgFields[f.key] ?? ""} onChange={e => setCfgFields(c => ({ ...c, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-400" />
                  )}
                </div>
              ))}

              <div>
                <label className="text-[12px] text-gray-500 block mb-1.5">輸出格式</label>
                <select value={form.outputFormat} onChange={e => setField("outputFormat", e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
                  <option value="text">純文字（Agent 直接讀取）</option>
                  <option value="json">JSON（結構化資料）</option>
                  <option value="table">表格（自動格式化成 Markdown table）</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <Btn variant="primary" onClick={save} className="flex-1 justify-center">
                  {saving ? "儲存中..." : mode === "create" ? "建立工具" : "儲存變更"}
                </Btn>
                <Btn onClick={() => { setMode("list"); setSelected(null); }}>取消</Btn>
              </div>
            </div>
          </Card>

          {/* Preview / Help */}
          <Card>
            <CardTitle>使用說明</CardTitle>
            <div className="space-y-4">
              <div className={`rounded-xl p-4 border ${triggerInfo?.color?.replace("text","border")?.replace("bg-","border-")?.replace("50","100") ?? "border-gray-100"}`}>
                <p className="text-[22px] mb-2">{triggerInfo?.icon}</p>
                <p className="text-[14px] font-medium mb-1">{triggerInfo?.label}</p>
                <p className="text-[12px] text-gray-500 leading-relaxed">
                  {{
                    HTTP_GET:            "向指定 URL 發送 GET 請求，支援 {{variable}} 變數插值。適合查詢 REST API、取得商品資訊、查詢訂單狀態等。",
                    HTTP_POST:           "向指定 URL 發送 POST 請求，可自定義 Body。適合觸發 webhook、建立訂單、提交表單等。",
                    GOOGLE_SHEETS_READ:  "從 Google Sheets 讀取資料範圍。Agent 可用於查詢客戶清單、商品資訊、排班表等試算表資料。",
                    GOOGLE_SHEETS_WRITE: "在 Google Sheets 追加資料。Agent 可用於記錄對話、寫入預約、更新進度等。",
                    NOTION_CREATE:       "在 Notion Database 建立新頁面。Agent 可用於建立工單、紀錄客訴、建立會議記錄等。",
                    GMAIL_SEND:          "透過 Gmail 發送郵件。支援 {{variable}} 模板，Agent 可自動發送通知、確認信、報告等。",
                    GCAL_CREATE:         "在 Google Calendar 建立行程。Agent 可直接幫用戶預約會議、帶看、諮詢等。",
                    CUSTOM_FUNCTION:     "執行自定義 JavaScript 函數。最彈性的選項，可處理任意資料轉換邏輯。",
                  }[trigger] ?? ""}
                </p>
              </div>

              <div>
                <p className="text-[12px] font-medium text-gray-600 mb-2">變數語法</p>
                <div className="bg-gray-50 rounded-lg p-3 font-mono text-[12px] space-y-1">
                  <p className="text-gray-600">URL / 文字中使用：</p>
                  <p className="text-brand-600">{"{{userId}}"} {"{{text}}"} {"{{platform}}"}</p>
                  <p className="text-gray-600 mt-2">系統自動注入：</p>
                  <p className="text-gray-500">agentName, workspaceId, timestamp</p>
                </div>
              </div>

              <div>
                <p className="text-[12px] font-medium text-gray-600 mb-2">Agent 呼叫範例</p>
                <div className="bg-gray-900 rounded-lg p-3 text-[11px] font-mono text-green-400">
                  <p className="text-gray-500">// Agent system prompt 範例</p>
                  <p>{"若用戶詢問庫存，請呼叫 "}</p>
                  <p className="text-amber-400">{form.name || "tool-name"}</p>
                  <p>{"並傳入 productId 參數。"}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <p className="text-[15px] font-medium mb-2">確定刪除此工具？</p>
            <p className="text-[13px] text-gray-500 mb-4">此操作不可復原，Agent 若已使用此工具將無法繼續呼叫。</p>
            <div className="flex gap-2">
              <Btn variant="danger" onClick={() => deleteTool(deleteId)} className="flex-1 justify-center">刪除</Btn>
              <Btn onClick={() => setDeleteId(null)} className="flex-1 justify-center">取消</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
