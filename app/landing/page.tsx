"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

// ── Data ──────────────────────────────────────────────────────

const pains = [
  {
    emoji: "😓",
    before: "LINE 訊息要手動回，一天幾百則根本回不完",
    after: "AI 員工 24 小時自動回覆，你只需要審核高風險的那幾則",
  },
  {
    emoji: "😰",
    before: "請顧問架 AI 客服，花了幾十萬，3 個月後還在開會",
    after: "MyWrapper 圖形化設定，當天建立 Agent、當天上線",
  },
  {
    emoji: "😤",
    before: "AI 說錯話，客訴來了才知道，已經來不及",
    after: "所有 AI 回覆先進審核佇列，你確認後才發送",
  },
  {
    emoji: "💸",
    before: "API 費用每月帳單都嚇一跳，不知道哪裡燒錢",
    after: "每個客戶獨立計費追蹤，Token 即時監控，超標自動告警",
  },
  {
    emoji: "🤯",
    before: "5 個客戶、7 個通道，設定散落在各個地方，改一個要找半天",
    after: "所有 Workspace、Agent、通道，一個後台管理到底",
  },
  {
    emoji: "😩",
    before: "AI 不懂我的產品，回答雞同鴨講，客戶越用越不滿意",
    after: "上傳產品文件、FAQ、政策，AI 自動學習，回答準確率大幅提升",
  },
];

const industries = [
  {
    icon: "🛒",
    name: "電商 / 零售",
    pains: [
      "每天幾百則訂單查詢、物流催件、退換貨，客服人員光這些就佔掉 70% 的時間，還要被客人罵說回太慢。",
      "雙 11、週年慶一到，訊息量暴增 5 倍，臨時找工讀生來不及教，只能讓客人乾等。",
    ],
    solutions: [
      "AI 員工自動識別客人的問題類型，訂單查詢、物流狀況、退換貨申請，每一類都有對應的標準回答，再也不需要人工複製貼上。",
      "連接你的 Google Sheets 訂單資料表，客人問「我的訂單到哪了？」AI 直接查資料庫回覆，比人工快 10 倍。",
      "促銷期間流量再大，AI 照樣秒回，不需要加人、不需要加班，成本固定。",
    ],
    agent: "客服 Aria — 電商版",
    metrics: ["↓ 80% 客服工作量", "↑ 秒級回覆率", "= 3 天上線"],
  },
  {
    icon: "🏠",
    name: "房仲 / 租賃",
    pains: [
      "客人半夜在 LINE 問「這間還有嗎？」、「可以降價嗎？」，隔天早上才看到，人已經去別家了。成交機會就這樣溜走。",
      "預約帶看時間要來回確認、改時間、再確認，一個客人要傳 10 幾則，占掉業務大量精力。",
    ],
    solutions: [
      "AI 員工 24 小時在線，客人凌晨 2 點問，AI 立刻回。基本問題先回答，有意願的客人自動留資料，你早上起來已經有熱門潛在客戶等你聯絡。",
      "連接 Google Calendar，客人選好時段，帶看行程自動新增到你的行事曆，不需要來回確認，業務時間省下來去跑更多案件。",
      "常見問題 FAQ、坪數格局、租金行情，AI 都能回，讓客人先了解，你去跑的都是真正有意願的。",
    ],
    agent: "業務 Rex — 房仲版",
    metrics: ["↓ 60% 預約往返", "↑ 3x 潛在客戶回覆", "= 1 天上線"],
  },
  {
    icon: "🏥",
    name: "診所 / 醫療",
    pains: [
      "護理師要顧診間、要打電話確認、要接掛號電話、要回 LINE，一個人同時做 4 件事，出錯在所難免，工作人員也很累。",
      "每天重複跟不同病患解釋同樣的注意事項、費用說明、準備項目，花了大量時間在可以自動化的事情上。",
    ],
    solutions: [
      "LINE 官方帳號自動接受掛號、查詢可預約時段、取消和改約，24 小時不打烊，護理師不用再守著電話。",
      "術前注意事項、衛教說明、提醒訊息，設定一次自動發出，每個病患都收到一致正確的資訊，不會因為忙碌而漏掉。",
      "看診前一天自動發提醒，減少爽約率；看診後自動發問卷，收集病患回饋。",
    ],
    agent: "診所 Luna — 醫療版",
    metrics: ["↓ 70% 電話詢問量", "↓ 爽約率", "= 2 天上線"],
  },
  {
    icon: "💰",
    name: "金融 / 保險",
    pains: [
      "客戶問保單內容、理賠流程、保費試算，業務員要翻資料查好久，客戶等得不耐煩，成交率直接下降。",
      "合規問題讓人緊張：AI 如果說錯一句話，可能涉及不實招攬，但全靠人工又忙不過來。",
    ],
    solutions: [
      "AI 員工先回答常見問題、篩選有意願的潛在客戶，業務員只需要接手真正有意願、有需求的人，不用再花時間應付完全沒有概念的詢問。",
      "所有 AI 回覆強制進入人工審核，業務員確認後才發送，絕對不會有合規風險。敏感話題（如保證獲利、理賠保證）系統自動標記攔截。",
      "客戶資料、需求記錄自動整理到 Google Sheets，業務員可以清楚追蹤每個潛在客戶的狀態。",
    ],
    agent: "金融業務 Fin — 保險版",
    metrics: ["↑ 業務員效率 3x", "= 零合規風險", "= 2 天上線"],
  },
  {
    icon: "🏢",
    name: "企業內部",
    pains: [
      "HR 每天被問同樣的問題：「請假怎麼申請？」、「加班費怎麼算？」、「健檢可以自選嗎？」每個人問一遍，HR 快崩潰了。",
      "新人 onboarding 要花大量時間帶，公司文件散落在 Email、Notion、共用硬碟，新人根本找不到，只好一直問同事。",
    ],
    solutions: [
      "員工用 LINE 或 Slack 直接問 AI，請假規定、福利說明、報帳流程、IT 設備申請，全部秒回，HR 終於可以專心做有價值的事。",
      "連接 Notion 知識庫，所有公司文件一次整合，新人問 AI 就找得到，不用再麻煩同事。文件更新後 AI 自動同步，永遠回答最新版本。",
    ],
    agent: "內部助理 HR Bot",
    metrics: ["↓ 90% 重複性問答", "↑ 員工自助率", "= 1 天上線"],
  },
  {
    icon: "📦",
    name: "客服外包商",
    pains: [
      "接了 10 個客戶，每個客戶的 LINE、Telegram 各自獨立設定，光是管理設定就讓人頭痛，還要個別報告。",
      "客戶每個月要月報，光是整理對話量、回覆率、常見問題分析就要花 2 天，根本是在幫客戶做苦工。",
    ],
    solutions: [
      "一個後台管理所有客戶的 Workspace，每個客戶獨立設定、獨立帳單、獨立 AI 員工，但你只需要看一個畫面，效率直接翻倍。",
      "AI 自動產生每月報告：對話量統計、熱門問題分類、費用明細、回覆率趨勢，一鍵發送給每位客戶，2 天的工作變成 5 分鐘。",
      "接更多客戶不需要等比例增加人力，AI 員工數量隨需擴充，你的利潤空間越來越大。",
    ],
    agent: "多租戶管理中心",
    metrics: ["↓ 60% 管理成本", "= 月報自動化", "↑ 可接客戶數"],
  },
];

const steps = [
  {
    num: "01",
    time: "5 分鐘",
    title: "建立你的 AI 員工",
    desc: "輸入 AI 的名字、角色、個性、回覆風格。上傳你的產品說明、FAQ、政策文件。不需要寫程式，不需要懂 AI。",
    detail: "就像填寫員工入職表格一樣簡單。",
    color: "#eff6ff",
    accent: "#1a56db",
  },
  {
    num: "02",
    time: "15 分鐘",
    title: "連接你的通道",
    desc: "把 LINE Official Account、Telegram Bot 的 Webhook 網址複製貼上到 MyWrapper。完成。",
    detail: "我們提供逐步圖文教學，不會卡關。",
    color: "#f0fdf4",
    accent: "#16a34a",
  },
  {
    num: "03",
    time: "當天",
    title: "測試並上線",
    desc: "在 Playground 直接跟你的 AI 員工對話，確認回答符合預期。滿意了就開啟通道，開始服務真實用戶。",
    detail: "上線後隨時可以調整，不需要重新部署。",
    color: "#fefce8",
    accent: "#ca8a04",
  },
  {
    num: "04",
    time: "持續",
    title: "監督與優化",
    desc: "即時看到每一則對話、每一個 AI 回覆。發現不好的回答，直接修改 Prompt，下次就會更好。",
    detail: "AI 員工的每個行為都在你的掌控之中。",
    color: "#fdf4ff",
    accent: "#9333ea",
  },
];

const monitoring = [
  {
    icon: "💬",
    title: "每一則對話都看得到",
    desc: "完整的對話記錄，知道用戶說什麼、AI 怎麼回，哪裡說得好、哪裡需要改進。",
  },
  {
    icon: "⚡",
    title: "高風險訊息自動攔截",
    desc: "客訴、法律糾紛、敏感內容，系統自動標記進入審核佇列，等你確認後才發送。",
  },
  {
    icon: "📊",
    title: "即時數據儀表板",
    desc: "訊息量、回覆率、Token 費用、滿意度評分，全部即時顯示，一眼掌握 AI 工作狀況。",
  },
  {
    icon: "🔔",
    title: "超標自動告警",
    desc: "費用超過預算、錯誤率升高、訊息量異常，第一時間通知你，不用一直盯著後台。",
  },
  {
    icon: "📋",
    title: "月度報告自動產生",
    desc: "AI 自動整理本月對話統計、費用明細、常見問題分析，一鍵產生客戶報告。",
  },
  {
    icon: "🔍",
    title: "Log 全程追蹤",
    desc: "每一個 AI 行為、每一次工具呼叫、每一次通道連線都有完整日誌，問題發生時馬上找到原因。",
  },
];

const plans = [
  {
    name: "Starter",
    price: "NT$1,490",
    period: "/月",
    highlight: false,
    desc: "小型團隊，快速驗證",
    items: ["1 個 Workspace", "3 個 AI 員工", "LINE + Telegram", "基本監控報表", "社群支援"],
    cta: "免費試用 14 天",
  },
  {
    name: "Pro",
    price: "NT$4,990",
    period: "/月",
    highlight: true,
    badge: "最受歡迎",
    desc: "中小企業主力方案",
    items: ["10 個 Workspace", "無上限 AI 員工", "7 大通道全開", "人工審核流程", "知識庫 RAG", "Google / Notion 整合", "費用告警通知"],
    cta: "立即開始",
  },
  {
    name: "Business",
    price: "洽談",
    period: "",
    highlight: false,
    desc: "企業 / 外包商專案",
    items: ["無上限 Workspace", "多角色權限管理", "白標自訂網域", "AI Chain 協作", "私有雲部署", "API 開放串接", "專屬顧問 + SLA"],
    cta: "聯絡業務",
  },
];

const faqs = [
  {
    q: "完全不懂技術，可以自己設定嗎？",
    a: "可以。MyWrapper 的設計原則就是「業務人員自己會用」。建立 AI 員工、設定通道、調整 Prompt、審核訊息，全程圖形化介面，沒有任何步驟需要寫程式。技術串接部分我們提供逐步教學，或可選擇 Done-for-You 方案由我們代為設定。",
  },
  {
    q: "AI 如果說錯話怎麼辦？",
    a: "這正是我們設計「人工審核流程」的原因。你可以設定 AI 的每一則回覆都先進入審核佇列，由你確認後才發送。也可以設定低風險問題自動通過、高風險問題（如退款、法律相關）必須人工確認。你有完全的控制權。",
  },
  {
    q: "設定完要多久才能上線服務客戶？",
    a: "最快當天。建立 AI 員工約 5-10 分鐘，連接 LINE OA 約 15 分鐘，在 Playground 測試確認後就可以開啟。Done-for-You 方案通常 3 個工作天完成全部設定。",
  },
  {
    q: "LINE、Telegram 以外還支援哪些通道？",
    a: "目前支援 LINE Official Account、Telegram Bot、Slack、Discord、WhatsApp Business、Twilio SMS、Twilio 語音通話，共 7 個通道。同一個 AI 員工可以同時服務多個通道。",
  },
  {
    q: "費用怎麼計算？AI 的 API 費用包含在內嗎？",
    a: "MyWrapper 的月費是平台服務費。AI 呼叫的 API 費用（OpenRouter / Anthropic）需要另外申請 API Key 並自行承擔，MyWrapper 提供詳細的 Token 用量追蹤和費用監控，讓你清楚掌控每一分錢。",
  },
  {
    q: "我有多個客戶要管理，可以嗎？",
    a: "這正是 Workspace 設計的核心功能。每個客戶一個獨立 Workspace，資料完全隔離，獨立帳單追蹤，獨立設定 AI 員工和通道。Pro 方案最多 10 個，Business 方案無上限，月報告可以自動產生發送給每位客戶。",
  },
];

// ── Components ────────────────────────────────────────────────

function Nav({ scrolled }: { scrolled: boolean }) {
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      transition: "all .25s",
      background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      borderBottom: scrolled ? "1px solid #f0f0f0" : "none",
      boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src="/logo.png" alt="MyWrapper" style={{ height: 36, width: "auto", objectFit: "contain" }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {[["痛點", "#pain"], ["適用情境", "#industry"], ["如何運作", "#how"], ["定價", "#pricing"]].map(([l, h]) => (
            <a key={String(l)} href={String(h)} style={{ fontSize: 14, color: "#555", textDecoration: "none" }}>{l}</a>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/login" style={{ border: "1px solid #e5e7eb", color: "#374151", padding: "8px 18px", borderRadius: 10, fontSize: 13, textDecoration: "none" }}>
            登入
          </Link>
          <Link href="/login" style={{ background: "#1a56db", color: "#fff", padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            免費試用 14 天
          </Link>
        </div>
      </div>
    </nav>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 100, border: "1px solid #bfdbfe", marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>
      {children}
    </div>
  );
}

function DashMockup() {
  return (
    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", overflow: "hidden" }}>
      {/* Browser chrome */}
      <div style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#f87171", "#fbbf24", "#34d399"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
        </div>
        <div style={{ flex: 1, background: "#fff", borderRadius: 6, height: 22, display: "flex", alignItems: "center", padding: "0 10px", border: "1px solid #e5e7eb" }}>
          <span style={{ fontSize: 10, color: "#9ca3af" }}>console.mywrapper.ai</span>
        </div>
      </div>
      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div style={{ width: 130, background: "#f9fafb", borderRight: "1px solid #f0f0f0", padding: 12, flexShrink: 0 }}>
          {[["總覽", true], ["AI 員工", false], ["通道", false], ["審核佇列", false], ["監控", false], ["用量", false]].map(([name, active]) => (
            <div key={String(name)} style={{ padding: "7px 10px", borderRadius: 8, fontSize: 11, marginBottom: 3, background: active ? "#1a56db" : "transparent", color: active ? "#fff" : "#6b7280", fontWeight: active ? 600 : 400 }}>
              {String(name)}
            </div>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
            {[["今日回覆", "1,247", "↑ AI 處理 94%", "#16a34a"], ["待人工審核", "3 則", "需要你確認", "#d97706"], ["本月 AI 費用", "NT$840", "預算剩 72%", "#2563eb"], ["客戶滿意度", "96.2%", "本月評分", "#7c3aed"]].map(([l, v, s, c]) => (
              <div key={String(l)} style={{ background: "#f9fafb", borderRadius: 12, padding: 12 }}>
                <div style={{ fontSize: 9, color: "#9ca3af", marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{v}</div>
                <div style={{ fontSize: 9, color: String(c), marginTop: 4 }}>{s}</div>
              </div>
            ))}
          </div>
          {/* Agent list */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>AI 員工狀態</div>
            {[
              { name: "客服 Aria", ch: "LINE OA · 電商", msgs: 847, ok: true, initials: "AR", bg: "#dbeafe", tc: "#1d4ed8" },
              { name: "業務 Rex", ch: "Telegram · 房仲", msgs: 312, ok: true, initials: "RX", bg: "#ede9fe", tc: "#6d28d9" },
              { name: "診所 Luna", ch: "LINE OA · 診所", msgs: 156, ok: false, initials: "LU", bg: "#d1fae5", tc: "#065f46" },
            ].map(a => (
              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: 10, background: "#f9fafb", borderRadius: 10, padding: "8px 12px", marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: a.bg, color: a.tc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{a.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: 9, color: "#9ca3af" }}>{a.ch} · {a.msgs} 則</div>
                </div>
                <span style={{ fontSize: 8, padding: "3px 8px", borderRadius: 20, fontWeight: 600, background: a.ok ? "#d1fae5" : "#f3f4f6", color: a.ok ? "#065f46" : "#6b7280" }}>
                  {a.ok ? "工作中" : "待機"}
                </span>
              </div>
            ))}
          </div>
          {/* Review queue preview */}
          <div style={{ background: "#fffbeb", borderRadius: 10, padding: 10, border: "1px solid #fde68a" }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>⚡ 3 則待審核訊息</div>
            {[
              { user: "user_882", msg: "我要申請退款，你們的產品有問題", risk: "high" },
              { user: "user_445", msg: "請問明天 14:00 可以帶看嗎？", risk: "low" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: i === 0 ? "none" : "1px solid #fde68a" }}>
                <span style={{ fontSize: 8, padding: "2px 6px", borderRadius: 4, fontWeight: 600, background: item.risk === "high" ? "#fee2e2" : "#d1fae5", color: item.risk === "high" ? "#dc2626" : "#065f46", flexShrink: 0 }}>
                  {item.risk === "high" ? "高風險" : "低風險"}
                </span>
                <span style={{ fontSize: 10, color: "#374151" }}>{item.msg}</span>
                <div style={{ display: "flex", gap: 4, marginLeft: "auto", flexShrink: 0 }}>
                  <button style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 8, fontWeight: 600, cursor: "pointer" }}>核准</button>
                  <button style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 4, padding: "3px 8px", fontSize: 8, cursor: "pointer" }}>編輯</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeIndustry, setActiveIndustry] = useState(0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const ind = industries[activeIndustry];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#111", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>

      <Nav scrolled={scrolled} />

      {/* ── Hero ── */}
      <section style={{ paddingTop: 110, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#eff6ff", color: "#1d4ed8", fontSize: 12, fontWeight: 600, padding: "6px 16px", borderRadius: 100, border: "1px solid #bfdbfe", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
            台灣首選 AI 員工管理平台
          </div>
          <h1 style={{ fontSize: 46, fontWeight: 800, lineHeight: 1.15, letterSpacing: -1, marginBottom: 20 }}>
            雇一個 AI 員工，<br />
            <span style={{ color: "#1a56db" }}>今天就能上班</span>
          </h1>
          <p style={{ fontSize: 17, color: "#555", lineHeight: 1.8, marginBottom: 12, maxWidth: 580, margin: "0 auto 12px" }}>
            不用請工程師、不用懂 AI、不用等 3 個月。
          </p>
          <p style={{ fontSize: 17, color: "#555", lineHeight: 1.8, marginBottom: 36, maxWidth: 580, margin: "0 auto 36px" }}>
            填寫角色設定、上傳你的產品資料、連接 LINE 或 Telegram，<br />
            <strong style={{ color: "#111" }}>AI 員工當天就能開始服務你的客戶。</strong>
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/login" style={{ background: "#1a56db", color: "#fff", padding: "14px 32px", borderRadius: 12, fontSize: 16, fontWeight: 700, textDecoration: "none", boxShadow: "0 4px 20px rgba(26,86,219,0.3)" }}>
              免費試用 14 天
            </Link>
            <a href="#how" style={{ border: "1px solid #e5e7eb", color: "#374151", padding: "14px 32px", borderRadius: 12, fontSize: 16, textDecoration: "none" }}>
              看看怎麼運作 →
            </a>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 24 }}>
            {["不需要工程師", "當天上線", "隨時可調整", "你全程掌控"].map(t => (
              <span key={t} style={{ fontSize: 13, color: "#9ca3af", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>✓</span>{t}
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard preview */}
        <div style={{ marginTop: 64, boxShadow: "0 32px 80px rgba(26,86,219,0.12)", borderRadius: 20 }}>
          <DashMockup />
        </div>
      </section>

      {/* ── Pain points ── */}
      <section id="pain" style={{ padding: "96px 24px", background: "#0f172a", color: "#fff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(239,68,68,0.15)", color: "#fca5a5", fontSize: 12, fontWeight: 600, padding: "6px 16px", borderRadius: 100, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>
              你是否也有這些問題
            </div>
            <h2 style={{ fontSize: 38, fontWeight: 800, marginBottom: 12 }}>現在的痛點</h2>
            <p style={{ fontSize: 16, color: "#94a3b8" }}>你不孤單。這些問題我們都看到了，也都解決了。</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {pains.map((p, i) => (
              <div key={i} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                {/* Before */}
                <div style={{ background: "rgba(239,68,68,0.1)", padding: 20, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>{p.emoji}</span>
                    <div>
                      <div style={{ fontSize: 10, color: "#fca5a5", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>現在的狀況</div>
                      <p style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}>{p.before}</p>
                    </div>
                  </div>
                </div>
                {/* After */}
                <div style={{ background: "rgba(26,86,219,0.12)", padding: 20 }}>
                  <div style={{ fontSize: 10, color: "#93c5fd", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>用 MyWrapper 之後</div>
                  <p style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.6 }}>{p.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industry use cases ── */}
      <section id="industry" style={{ padding: "96px 24px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionLabel>對號入座</SectionLabel>
            <h2 style={{ fontSize: 38, fontWeight: 800, marginBottom: 12 }}>你的行業遇到的問題，都有適合的 Wrapper</h2>
            <p style={{ fontSize: 16, color: "#6b7280" }}>選一個最像你的情況，看看其他人怎麼用 MyWrapper 解決的。</p>
          </div>

          {/* Industry tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap", justifyContent: "center" }}>
            {industries.map((ind, i) => (
              <button key={i} onClick={() => setActiveIndustry(i)}
                style={{
                  padding: "10px 20px", borderRadius: 100, fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all .2s",
                  background: activeIndustry === i ? "#1a56db" : "#fff",
                  color: activeIndustry === i ? "#fff" : "#374151",
                  border: activeIndustry === i ? "1px solid #1a56db" : "1px solid #e5e7eb",
                  boxShadow: activeIndustry === i ? "0 4px 14px rgba(26,86,219,0.2)" : "none",
                }}>
                {ind.icon} {ind.name}
              </button>
            ))}
          </div>

          {/* Industry detail */}
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 360 }}>
              {/* Left: pains */}
              <div style={{ padding: 40, background: "#fff8f8", borderRight: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>
                  {ind.icon} {ind.name} 的典型痛點
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {ind.pains.map((pain, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ color: "#ef4444", fontSize: 16, flexShrink: 0, marginTop: 1 }}>✕</span>
                      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{pain}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Right: solutions */}
              <div style={{ padding: 40 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1a56db", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>
                  MyWrapper 的解法
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
                  {ind.solutions.map((sol, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <span style={{ color: "#16a34a", fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7 }}>{sol}</p>
                    </div>
                  ))}
                </div>
                {/* AI agent showcase */}
                <div style={{ background: "#f0f7ff", borderRadius: 12, padding: "14px 18px", marginBottom: 20, border: "1px solid #bfdbfe" }}>
                  <div style={{ fontSize: 10, color: "#3b82f6", fontWeight: 700, marginBottom: 4 }}>推薦 AI 員工設定</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e40af" }}>{ind.agent}</div>
                </div>
                {/* Metrics */}
                <div style={{ display: "flex", gap: 12 }}>
                  {ind.metrics.map((m, i) => (
                    <div key={i} style={{ flex: 1, background: "#f9fafb", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>{m}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel>有多簡單</SectionLabel>
            <h2 style={{ fontSize: 38, fontWeight: 800, marginBottom: 12 }}>從零到 AI 員工上班，最快當天</h2>
            <p style={{ fontSize: 16, color: "#6b7280" }}>不需要工程師，不需要培訓，不需要等待。</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
            {steps.map(s => (
              <div key={s.num} style={{ borderRadius: 20, border: "1px solid #f0f0f0", overflow: "hidden" }}>
                <div style={{ background: s.color, padding: "24px 24px 20px" }}>
                  <div style={{ fontSize: 44, fontWeight: 900, color: s.accent, opacity: 0.2, lineHeight: 1, marginBottom: 8 }}>{s.num}</div>
                  <div style={{ display: "inline-block", background: s.accent, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100, marginBottom: 12 }}>
                    {s.time}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{s.title}</h3>
                </div>
                <div style={{ padding: "20px 24px 24px", background: "#fff" }}>
                  <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, marginBottom: 12 }}>{s.desc}</p>
                  <p style={{ fontSize: 12, color: s.accent, fontWeight: 600 }}>{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Monitoring ── */}
      <section style={{ padding: "96px 24px", background: "#0f172a", color: "#fff" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(26,86,219,0.2)", color: "#93c5fd", fontSize: 12, fontWeight: 600, padding: "6px 16px", borderRadius: 100, marginBottom: 20, textTransform: "uppercase", letterSpacing: 1 }}>
              AI 員工監督機制
            </div>
            <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 12 }}>AI 員工每天在做什麼，你一清二楚</h2>
            <p style={{ fontSize: 16, color: "#94a3b8" }}>雇了 AI 員工不代表放棄控制。MyWrapper 給你全程透明的監督工具。</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {monitoring.map(m => (
              <div key={m.title} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 28, transition: "all .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(26,86,219,0.15)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(147,197,253,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
                <div style={{ fontSize: 28, marginBottom: 16 }}>{m.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: "#f1f5f9" }}>{m.title}</h3>
                <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ padding: "96px 24px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel>方案定價</SectionLabel>
            <h2 style={{ fontSize: 38, fontWeight: 800, marginBottom: 12 }}>清楚定價，按需選擇</h2>
            <p style={{ fontSize: 16, color: "#6b7280" }}>所有方案 14 天免費試用，不需信用卡，隨時可取消</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 20 }}>
            {plans.map(plan => (
              <div key={plan.name} style={{
                borderRadius: 20, border: `${plan.highlight ? 2 : 1}px solid ${plan.highlight ? "#1a56db" : "#e5e7eb"}`,
                padding: 32, display: "flex", flexDirection: "column", position: "relative",
                background: plan.highlight ? "#fff" : "#fff",
                boxShadow: plan.highlight ? "0 8px 40px rgba(26,86,219,0.15)" : "none",
              }}>
                {"badge" in plan && plan.badge && (
                  <div style={{ position: "absolute", top: -16, left: "50%", transform: "translateX(-50%)", background: "#1a56db", color: "#fff", fontSize: 11, fontWeight: 700, padding: "5px 18px", borderRadius: 100, whiteSpace: "nowrap" }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 18, fontWeight: 800 }}>{plan.name}</div>
                  <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 2, marginBottom: 16 }}>{plan.desc}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 38, fontWeight: 900 }}>{plan.price}</span>
                    <span style={{ fontSize: 15, color: "#9ca3af" }}>{plan.period}</span>
                  </div>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", flex: 1 }}>
                  {plan.items.map(item => (
                    <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#374151", marginBottom: 12 }}>
                      <span style={{ color: "#1a56db", flexShrink: 0, fontWeight: 700 }}>✓</span>{item}
                    </li>
                  ))}
                </ul>
                <Link href="/login" style={{
                  display: "block", textAlign: "center", padding: "14px 0", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none",
                  background: plan.highlight ? "#1a56db" : "transparent",
                  color: plan.highlight ? "#fff" : "#374151",
                  border: plan.highlight ? "none" : "1px solid #e5e7eb",
                  boxShadow: plan.highlight ? "0 4px 14px rgba(26,86,219,0.25)" : "none",
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          {/* Done for you */}
          <div style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", borderRadius: 20, padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, color: "#fff" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>🚀</span>
                <span style={{ fontSize: 20, fontWeight: 800 }}>Done-for-You 導入版</span>
              </div>
              <p style={{ fontSize: 14, color: "#94a3b8", maxWidth: 520, lineHeight: 1.7 }}>
                什麼都不用做。告訴我們你的業務，我們幫你完成所有設定：
                部署、AI 員工設定、通道串接、知識庫建立、教育訓練，3 個工作天上線。
              </p>
            </div>
            <div style={{ textAlign: "center", flexShrink: 0 }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}>NT$15,000 起</div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>一次性導入費</div>
              <Link href="mailto:contact@mywrapper.ai" style={{ display: "inline-block", background: "#fff", color: "#1e293b", fontWeight: 700, padding: "12px 28px", borderRadius: 12, fontSize: 14, textDecoration: "none" }}>
                立即詢問
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: "96px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 740, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <SectionLabel>常見問題</SectionLabel>
            <h2 style={{ fontSize: 38, fontWeight: 800 }}>你可能想問的問題</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {faqs.map(f => (
              <details key={f.q} style={{ background: "#f9fafb", border: "1px solid #f0f0f0", borderRadius: 16, overflow: "hidden" }}>
                <summary style={{ padding: "18px 24px", fontSize: 15, fontWeight: 600, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {f.q}
                  <span style={{ color: "#9ca3af", fontSize: 11, flexShrink: 0, marginLeft: 16 }}>▼</span>
                </summary>
                <p style={{ padding: "0 24px 22px", fontSize: 14, color: "#555", lineHeight: 1.8, margin: 0 }}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section style={{ padding: "80px 24px", background: "#f9fafb" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", background: "linear-gradient(135deg, #1a56db, #1e40af)", borderRadius: 28, padding: "72px 48px", color: "#fff" }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, marginBottom: 16 }}>
            你的 AI 員工，<br />今天就能上班
          </h2>
          <p style={{ fontSize: 16, color: "#bfdbfe", marginBottom: 36, lineHeight: 1.8 }}>
            14 天免費試用，不需信用卡。<br />
            今天建立 Agent，明天就可以自動回覆客戶。
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/login" style={{ background: "#fff", color: "#1a56db", fontWeight: 800, padding: "14px 32px", borderRadius: 14, fontSize: 16, textDecoration: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
              免費試用 14 天
            </Link>
            <Link href="mailto:contact@mywrapper.ai" style={{ border: "1px solid rgba(255,255,255,0.4)", color: "#fff", padding: "14px 32px", borderRadius: 14, fontSize: 16, textDecoration: "none", fontWeight: 500 }}>
              預約 Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #f0f0f0", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <img src="/logo.png" alt="MyWrapper" style={{ height: 30, width: "auto", objectFit: "contain" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p style={{ fontSize: 12, color: "#9ca3af" }}>© 2026 MyWrapper Technologies · Powered by Claude AI</p>
          <div style={{ display: "flex", gap: 24 }}>
            <Link href="/login" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>後台登入</Link>
            <Link href="mailto:contact@mywrapper.ai" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>聯絡我們</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
