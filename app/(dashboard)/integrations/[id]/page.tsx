"use client";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardTitle, Btn } from "@/components/ui";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }

// ── Integration definitions ───────────────────────────────────
const INTEGRATIONS: Record<string, IntegrationDef> = {
  "line": {
    name: "LINE Official Account", color: "#06C755", icon: "L",
    description: "接收 LINE 訊息並由 Agent 自動回覆，支援 allowlist 過濾與人工審核流程。",
    docUrl: "/docs/line-webhook",
    secrets: [
      { key:"LINE_CHANNEL_SECRET",        label:"Channel Secret",         type:"password", hint:"LINE Developers Console → Channel Secret" },
      { key:"LINE_CHANNEL_ACCESS_TOKEN",  label:"Channel Access Token",   type:"password", hint:"LINE Developers Console → Channel Access Token（長效 token）" },
    ],
    webhookPattern: "/webhook/line/{workspaceId}/{channelBindingId}",
    steps: [
      "在 LINE Developers Console 建立 Messaging API Channel",
      "複製 Channel Secret 和 Channel Access Token 填入下方",
      "儲存後複製 Webhook URL，貼入 LINE Developers Console",
      "點擊 Verify 確認連線",
      "在 Channels 頁面建立 Channel Binding 並指定預設 Agent",
    ],
  },
  "telegram": {
    name: "Telegram Bot", color: "#26A5E4", icon: "T",
    description: "建立 Telegram Bot 接收用戶訊息，由 Agent 自動回覆。",
    secrets: [
      { key:"TELEGRAM_BOT_TOKEN", label:"Bot Token", type:"password", hint:"向 @BotFather 取得 Token" },
    ],
    webhookPattern: "/webhook/telegram/{workspaceId}/{channelBindingId}",
    steps: [
      "向 Telegram @BotFather 建立新 Bot，取得 Token",
      "填入 Bot Token 並儲存",
      "複製 Webhook URL 後執行 setWebhook API：\ncurl -F \"url=YOUR_WEBHOOK_URL\" https://api.telegram.org/bot{TOKEN}/setWebhook",
    ],
  },
  "sheets": {
    name: "Google Sheets", color: "#34A853", icon: "G",
    description: "讀取和寫入 Google 試算表，可用於記錄對話紀錄、同步客戶資料。",
    secrets: [
      { key:"GOOGLE_SERVICE_ACCOUNT_JSON", label:"Service Account JSON", type:"textarea", hint:"Google Cloud Console → Service Accounts → 建立 Key (JSON)" },
    ],
    steps: [
      "在 Google Cloud Console 建立 Service Account",
      "下載 JSON Key 並貼入下方",
      "在目標 Google Sheet 分享給 Service Account Email（編輯者權限）",
      "確認整合狀態後即可在 Agent Tools 中使用",
    ],
  },
  "notion": {
    name: "Notion", color: "#000000", icon: "N",
    description: "整合 Notion Database，Agent 可搜尋、新增頁面、記錄對話紀錄。",
    secrets: [
      { key:"NOTION_API_TOKEN", label:"Integration Token", type:"password", hint:"Notion → 設定 → 整合 → 建立新整合 → 複製 Secret Token" },
    ],
    steps: [
      "在 Notion 設定中建立新的 Internal Integration",
      "複製 Integration Token 填入下方",
      "在目標 Notion Database 頁面點選 Connect to → 選擇你的整合",
      "確認後即可使用",
    ],
  },
  "gmail": {
    name: "Gmail", color: "#EA4335", icon: "G",
    description: "AI 草稿、發送郵件、讀取收件箱摘要，適合行政助理 Agent 使用。",
    secrets: [
      { key:"GMAIL_OAUTH_TOKEN", label:"OAuth Access Token", type:"password", hint:"透過 Google OAuth 2.0 取得 access_token（需要 gmail.modify scope）" },
    ],
    steps: [
      "在 Google Cloud Console 設定 OAuth 2.0，啟用 Gmail API",
      "完成授權流程後，複製 access_token 填入下方",
      "（注意：access_token 有效期 1 小時，建議搭配 refresh_token 自動更新）",
    ],
  },
  "gcal": {
    name: "Google Calendar", color: "#4285F4", icon: "C",
    description: "建立與讀取日曆行程，Agent 可直接預約會議、帶看時間。",
    secrets: [
      { key:"GCAL_OAUTH_TOKEN", label:"OAuth Access Token", type:"password", hint:"與 Gmail 共用 Service Account，需要 calendar scope" },
    ],
    steps: [
      "在 Google Cloud Console 啟用 Google Calendar API",
      "設定 OAuth 2.0 並授予 calendar.events 權限",
      "複製 access_token 填入下方",
    ],
  },
};

interface IntegrationDef {
  name: string; color: string; icon: string; description: string;
  docUrl?: string;
  secrets: { key: string; label: string; type: "text"|"password"|"textarea"; hint: string }[];
  webhookPattern?: string;
  steps: string[];
}

export default function IntegrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const def     = INTEGRATIONS[id as string];

  const [secrets,  setSecrets]  = useState<Record<string,string>>({});
  const [wsId,     setWsId]     = useState("ws-a");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [step,     setStep]     = useState(0);
  const [testMsg,  setTestMsg]  = useState<{ok:boolean;msg:string}|null>(null);

  if (!def) return (
    <div className="py-16 text-center">
      <p className="text-[15px] text-gray-400">找不到整合：{id}</p>
      <Btn onClick={() => router.back()} className="mt-4">← 返回</Btn>
    </div>
  );

  async function saveSecrets() {
    setSaving(true); setSaved(false);
    for (const [name, value] of Object.entries(secrets)) {
      if (!value.trim()) continue;
      await fetch(`${BASE}/api/secrets`, {
        method: "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
        body: JSON.stringify({ workspaceId: wsId, name, value }),
      });
    }
    setSaving(false); setSaved(true); setStep(s => s + 1);
  }

  async function testIntegration() {
    setTestMsg(null);
    try {
      const endpoints: Record<string,string> = {
        sheets: `/api/integrations/sheets/read`,
        notion: `/api/integrations/notion/search`,
        gmail:  `/api/integrations/gmail/unread`,
        gcal:   `/api/integrations/gcal/events`,
      };
      const ep = endpoints[id as string];
      if (!ep) { setTestMsg({ ok:true, msg:"Webhook 通道不需額外測試，直接在 LINE/Telegram 傳訊確認。" }); return; }

      const r = await fetch(`${BASE}${ep}?workspaceId=${wsId}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      if (r.ok) setTestMsg({ ok:true, msg:"整合連線測試成功 ✓" });
      else      setTestMsg({ ok:false, msg:`連線失敗：${r.status}` });
    } catch (e) {
      setTestMsg({ ok:false, msg:(e as Error).message });
    }
  }

  const webhookUrl = def.webhookPattern
    ? `${BASE}${def.webhookPattern.replace("{workspaceId}", wsId).replace("{channelBindingId}", "BINDING_ID")}`
    : null;

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Btn onClick={() => router.back()} className="text-[12px]">← 返回</Btn>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[14px] font-bold"
          style={{ backgroundColor: def.color }}>
          {def.icon}
        </div>
        <div>
          <h1 className="text-[16px] font-medium">{def.name}</h1>
          <p className="text-[12px] text-gray-400">{def.description}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {["填入憑證","確認連線","設定完成"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium transition-colors ${
              i < step ? "bg-green-500 text-white" : i === step ? "bg-brand-400 text-white" : "bg-gray-100 text-gray-400"
            }`}>{i < step ? "✓" : i + 1}</div>
            <span className={`text-[12px] ${i === step ? "text-gray-900 font-medium" : "text-gray-400"}`}>{s}</span>
            {i < 2 && <div className="w-8 h-px bg-gray-200" />}
          </div>
        ))}
      </div>

      {/* Setup guide */}
      <Card>
        <CardTitle>設定步驟</CardTitle>
        <ol className="space-y-2">
          {def.steps.map((s, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-medium shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{s}</p>
            </li>
          ))}
        </ol>
      </Card>

      {/* Workspace selector */}
      <Card>
        <CardTitle>目標 Workspace</CardTitle>
        <select value={wsId} onChange={e => setWsId(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
          <option value="ws-a">客戶 A — 電商客服</option>
          <option value="ws-b">客戶 B — 房仲業務</option>
          <option value="ws-c">客戶 C — 醫療診所</option>
        </select>
      </Card>

      {/* Secrets form */}
      <Card>
        <CardTitle>憑證設定</CardTitle>
        <div className="space-y-3">
          {def.secrets.map((s) => (
            <div key={s.key}>
              <label className="text-[12px] text-gray-500 block mb-1">
                {s.label}
                <span className="text-[10px] text-gray-300 ml-2">{s.hint}</span>
              </label>
              {s.type === "textarea" ? (
                <textarea value={secrets[s.key] ?? ""} onChange={e => setSecrets(p => ({ ...p, [s.key]: e.target.value }))}
                  rows={5} placeholder={`貼上 ${s.label}...`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[12px] font-mono resize-none focus:outline-none focus:border-brand-400" />
              ) : (
                <input type={s.type} value={secrets[s.key] ?? ""} onChange={e => setSecrets(p => ({ ...p, [s.key]: e.target.value }))}
                  placeholder={`輸入 ${s.label}...`}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-400" />
              )}
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Btn variant="primary" onClick={saveSecrets} className="flex-1 justify-center">
              {saving ? "儲存中..." : saved ? "✓ 已儲存" : "儲存憑證"}
            </Btn>
          </div>
        </div>
      </Card>

      {/* Webhook URL display */}
      {webhookUrl && (
        <Card>
          <CardTitle>Webhook URL</CardTitle>
          <p className="text-[12px] text-gray-500 mb-2">
            將以下 URL 貼入 {def.name} 的 Webhook 設定，並將 <code className="bg-gray-100 px-1 rounded text-[11px]">BINDING_ID</code> 替換為 Channels 頁面的 Binding ID。
          </p>
          <div className="bg-gray-900 rounded-lg p-3 flex items-center gap-2 group">
            <code className="flex-1 text-[11px] text-green-400 font-mono break-all">{webhookUrl}</code>
            <button onClick={() => navigator.clipboard.writeText(webhookUrl)}
              className="text-[10px] text-gray-500 hover:text-white shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              複製
            </button>
          </div>
        </Card>
      )}

      {/* Test connection */}
      <Card>
        <CardTitle>測試連線</CardTitle>
        <div className="flex items-center gap-3">
          <Btn onClick={testIntegration}>測試連線</Btn>
          {testMsg && (
            <span className={`text-[12px] ${testMsg.ok ? "text-green-600" : "text-red-500"}`}>
              {testMsg.msg}
            </span>
          )}
        </div>
      </Card>
    </div>
  );
}
