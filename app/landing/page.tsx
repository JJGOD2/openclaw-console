import Link from "next/link";

const features = [
  { icon:"🏢", title:"多租戶 Workspace",    desc:"每個客戶獨立設定、獨立 secrets、獨立 logs，互不干擾" },
  { icon:"🤖", title:"圖形化 Agent 管理",   desc:"不需碰 CLI，直接在介面設定 System Prompt、Tools、通道" },
  { icon:"📱", title:"多通道支援",           desc:"LINE、Telegram、Slack、Discord、Teams 一站管理" },
  { icon:"🔒", title:"安全治理",             desc:"Gateway Bind 檢查、Sender Allowlist、Secrets 加密、Security Audit" },
  { icon:"👁", title:"人工審核流程",         desc:"AI 草稿 → 人工確認 → 發送，高風險操作不自動觸發" },
  { icon:"📊", title:"成本 & 用量儀表板",   desc:"Token 追蹤、每日費用報告、超標告警，不再有帳單驚喜" },
  { icon:"🔗", title:"Google Sheets / Notion", desc:"對話紀錄自動同步、資料讀寫，打通現有工作流程" },
  { icon:"⚙️", title:"Gateway Config 推送", desc:"DB 狀態自動組裝 JSON5，驗證後一鍵推送至 MyWrapper Gateway" },
];

const plans = [
  {
    name:    "Starter",
    price:   "NT$1,490",
    period:  "/月",
    desc:    "個人 / 小型團隊起步使用",
    color:   "border-gray-200",
    badge:   null,
    items: [
      "1 個 Workspace",
      "3 個 Agent",
      "2 個通道（LINE + Telegram）",
      "基本 Log & 成本報表",
      "Skills 開關",
      "社群支援",
    ],
    cta: "免費試用 14 天",
    ctaStyle: "border border-gray-200 text-gray-700 hover:bg-gray-50",
  },
  {
    name:    "Pro",
    price:   "NT$4,990",
    period:  "/月",
    desc:    "中小企業主力方案",
    color:   "border-brand-400 ring-2 ring-brand-100",
    badge:   "最受歡迎",
    items: [
      "最多 10 個 Workspace",
      "無上限 Agent",
      "所有通道",
      "安全中心 & Audit",
      "人工審核流程",
      "Google Sheets / Notion 整合",
      "告警通知",
      "Email 支援",
    ],
    cta:      "立即開始",
    ctaStyle: "bg-brand-400 text-white hover:bg-brand-600",
  },
  {
    name:    "Business",
    price:   "洽談",
    period:  "",
    desc:    "企業客戶，無上限擴展",
    color:   "border-gray-200",
    badge:   null,
    items: [
      "無上限 Workspace",
      "白標 / 自訂網域",
      "多角色權限",
      "審核流程 & 稽核匯出",
      "私有雲 Docker 部署",
      "API & Webhook 開放",
      "專屬導入顧問",
      "SLA 保障",
    ],
    cta:      "聯絡業務",
    ctaStyle: "border border-gray-200 text-gray-700 hover:bg-gray-50",
  },
];

const faqs = [
  { q:"需要自己架 MyWrapper Gateway 嗎？", a:"是的，MyWrapper Technologies 是管理層，需要你自行或由我們協助部署 MyWrapper Gateway。Done-for-you 方案包含完整部署服務。" },
  { q:"支援哪些 Claude 模型？",            a:"預設使用 Claude Sonnet，可在 Agent 設定中切換。費用按照 Anthropic API 用量計算，本平台另計服務費。" },
  { q:"可以白標嗎？",                        a:"Business 方案支援完整白標，包括品牌名稱、Logo、主色、自訂網域、隱藏「Powered by」標示。" },
  { q:"資料安全性如何保障？",               a:"Secrets 以 AES-256-GCM 加密儲存，Gateway 預設 loopback-only，Sender Allowlist 過濾，每次設定變更均有 Audit Log。" },
  { q:"提供免費試用嗎？",                    a:"Starter 方案提供 14 天免費試用，Pro 以上請聯絡業務安排 Demo。" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900" style={{ fontFamily:"system-ui, sans-serif" }}>

      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 h-14 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#BA7517] rounded-md flex items-center justify-center text-white text-[12px] font-bold">OC</div>
          <span className="font-medium text-[15px]">MyWrapper Technologies</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#features"  className="text-[13px] text-gray-500 hover:text-gray-900">功能</a>
          <a href="#pricing"   className="text-[13px] text-gray-500 hover:text-gray-900">定價</a>
          <a href="#faq"       className="text-[13px] text-gray-500 hover:text-gray-900">FAQ</a>
          <Link href="/login"
            className="bg-[#BA7517] text-white text-[13px] px-4 py-1.5 rounded-lg hover:bg-[#854F0B] transition-colors">
            登入後台
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-[12px] px-3 py-1 rounded-full border border-amber-100 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          台灣 AI 客服管理平台
        </div>
        <h1 className="text-[40px] font-medium leading-tight mb-4 tracking-tight">
          把 AI 客服從工程師工具<br />
          <span style={{ color:"#BA7517" }}>變成企業敢用的控制台</span>
        </h1>
        <p className="text-[16px] text-gray-500 max-w-2xl mx-auto leading-relaxed mb-8">
          不用碰 CLI，不用手改 JSON5。圖形化管理多個客戶的 AI Agent、
          通道連接、安全設定、成本報表，直接接 LINE / Telegram / Slack。
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/login"
            className="bg-[#BA7517] text-white px-6 py-2.5 rounded-lg text-[14px] font-medium hover:bg-[#854F0B] transition-colors">
            免費試用 14 天
          </Link>
          <a href="#features"
            className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-[14px] hover:bg-gray-50 transition-colors">
            查看功能 →
          </a>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-6 mt-10 text-[12px] text-gray-400">
          <span>🏪 電商客服</span>
          <span>🏠 房仲業務</span>
          <span>🏥 醫療診所</span>
          <span>🏢 企業內部</span>
          <span>📊 客服外包商</span>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 overflow-hidden">
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[["今日訊息量","1,247","↑ 18%"],["本月成本","NT$2,840","預算剩 64%"],["Tool 呼叫","18,247","工具執行次數"],["Active WS","3 / 5","方案使用中"]].map(([l,v,s]) => (
                <div key={l} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[11px] text-gray-400">{l}</p>
                  <p className="text-[20px] font-medium mt-0.5">{v}</p>
                  <p className="text-[11px] text-green-600 mt-0.5">{s}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[["客服 Aria","LINE OA · 電商","啟用","text-green-600"],["業務 Rex","Telegram · 房仲","啟用","text-green-600"],["診所 Luna","LINE OA · 診所","待機","text-amber-600"]].map(([n,d,s,c]) => (
                <div key={n} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-[11px] font-medium">
                      {(n as string).slice(3,5)}
                    </div>
                    <p className="text-[13px] font-medium">{n}</p>
                    <span className={`text-[10px] ml-auto font-medium ${c}`}>{s}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-[28px] font-medium text-center mb-2">完整功能，開箱即用</h2>
        <p className="text-[14px] text-gray-500 text-center mb-10">從設定到營運，所有工具都在同一個地方</p>
        <div className="grid grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
              <div className="text-[24px] mb-2">{f.icon}</div>
              <p className="text-[13px] font-medium mb-1">{f.title}</p>
              <p className="text-[12px] text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-[28px] font-medium text-center mb-2">清楚定價，按需選擇</h2>
          <p className="text-[14px] text-gray-500 text-center mb-10">所有方案均提供 14 天免費試用，隨時可升級</p>
          <div className="grid grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div key={plan.name}
                className={`bg-white rounded-2xl border p-6 relative ${plan.color}`}>
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#BA7517] text-white text-[11px] font-medium px-3 py-0.5 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <p className="text-[15px] font-medium">{plan.name}</p>
                <p className="text-[12px] text-gray-400 mt-0.5 mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-[30px] font-medium">{plan.price}</span>
                  <span className="text-[13px] text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[13px]">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className={`block text-center py-2.5 rounded-lg text-[13px] font-medium transition-colors ${plan.ctaStyle}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          {/* Done for you */}
          <div className="mt-6 bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-between">
            <div>
              <p className="text-[15px] font-medium">Done-for-You 導入版 🚀</p>
              <p className="text-[13px] text-gray-500 mt-0.5">
                安裝部署 + 初始設定 + Prompt 建置 + Channel 串接 + 教育訓練，一次搞定
              </p>
            </div>
            <div className="text-right shrink-0 ml-6">
              <p className="text-[18px] font-medium">NT$15,000 起</p>
              <p className="text-[12px] text-gray-400">一次性導入費 + 月維護費</p>
              <Link href="mailto:contact@openclaw.example.com"
                className="inline-block mt-2 bg-gray-900 text-white text-[12px] px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">
                立即詢問
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-2xl mx-auto px-6 py-16">
        <h2 className="text-[28px] font-medium text-center mb-10">常見問題</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="group border border-gray-100 rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-[14px] font-medium list-none hover:bg-gray-50">
                {f.q}
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="px-5 pb-4 text-[13px] text-gray-500 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#BA7517] py-14 text-center text-white">
        <h2 className="text-[26px] font-medium mb-2">準備好讓 AI 開始為你工作了嗎？</h2>
        <p className="text-[14px] text-amber-100 mb-6">14 天免費試用，無需信用卡</p>
        <Link href="/login"
          className="inline-block bg-white text-[#BA7517] font-medium px-6 py-2.5 rounded-lg text-[14px] hover:bg-amber-50 transition-colors">
          免費試用 14 天
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-[12px] text-gray-400">
          © 2026 MyWrapper Technologies · Powered by Claude AI
          {" · "}
          <Link href="/login" className="hover:underline">後台登入</Link>
        </p>
      </footer>
    </div>
  );
}
