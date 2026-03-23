"use client";
import Link from "next/link";
import { useState } from "react";

const wrapperData: Record<string, {
  name: string; author: string; official: boolean; category: string;
  channels: string[]; price: number; setupDays: number;
  rating: number; reviews: number; deploys: number;
  badge: string | null; badgeColor: string | null;
  tagline: string; desc: string;
  highlights: string[];
  useCases: { title: string; scenario: string }[];
  requirements: string[];
  faq: { q: string; a: string }[];
  reviewList: { name: string; role: string; rating: number; comment: string }[];
}> = {
  "line-cs-pro": {
    name: "LINE 客服機器人 Pro",
    author: "MyWrapper 官方",
    official: true,
    category: "客服",
    channels: ["LINE"],
    price: 2990,
    setupDays: 1,
    rating: 4.9,
    reviews: 38,
    deploys: 124,
    badge: "熱門",
    badgeColor: "#ef4444",
    tagline: "讓 LINE 訊息 24 小時自動回覆，客服人員只需處理真正需要人的問題",
    desc: "LINE 客服機器人 Pro 是專為中小企業設計的智能客服解決方案。透過 OpenClaw 驅動，能夠自動識別客戶問題類型，提供精準回覆，並在需要時無縫轉交人工審核。",
    highlights: [
      "自動識別問題類型（訂單、退換貨、一般詢問）",
      "高風險訊息強制進入人工審核佇列",
      "連接 Google Sheets 即時查詢訂單資料",
      "支援繁中、英文雙語回覆",
      "可設定營業時間外的自動回應",
      "完整對話記錄和分析報表",
    ],
    useCases: [
      { title: "電商訂單查詢", scenario: "客戶傳送「我的訂單什麼時候到？」→ AI 自動查詢 Google Sheets 訂單資料 → 即時回覆物流狀態，不需要人工介入。" },
      { title: "退換貨申請受理", scenario: "客戶說「我想退貨」→ AI 引導填寫退貨原因和訂單編號 → 自動建立退貨申請記錄 → 通知客服人員後續處理。" },
      { title: "敏感訊息人工處理", scenario: "客戶表達強烈不滿或法律威脅 → AI 自動標記為高風險 → 進入人工審核佇列 → 由客服確認後才發送回覆。" },
    ],
    requirements: [
      "LINE Official Account（已認證或未認證皆可）",
      "LINE Messaging API 的 Channel Access Token 和 Channel Secret",
      "Google Sheets 訂單資料表（若需要訂單查詢功能）",
      "提供公司產品說明文件或 FAQ（用於設定 AI 知識庫）",
    ],
    faq: [
      { q: "我的客服人員還需要做什麼？", a: "只需要處理 AI 標記為高風險的訊息，以及客戶特別指定要找真人的情況。一般的訂單查詢、FAQ、基本諮詢 AI 都能自動處理。" },
      { q: "AI 說錯話怎麼辦？", a: "可以設定所有回覆先進審核再發送，或只有特定類型才需審核。發現 AI 說錯，直接修改知識庫，下次就會正確。" },
      { q: "可以客製化回覆風格嗎？", a: "可以。設定 AI 的語氣（正式/親切）、品牌語調、不能說的話題等，都透過後台圖形化設定，不需要碰程式碼。" },
      { q: "Google Sheets 的訂單資料需要特定格式嗎？", a: "我們會根據你的現有格式設定，不需要改變你的資料結構。串接過程由我們的客服協助完成。" },
    ],
    reviewList: [
      { name: "陳小姐", role: "電商客服主管", rating: 5, comment: "上線後訂單查詢的詢問少了 80%，客服團隊終於可以專心處理真正複雜的問題。設定過程比我想像中容易很多。" },
      { name: "王先生", role: "服飾品牌老闆", rating: 5, comment: "雙 11 前一個禮拜上線，結果促銷期間完全沒有被訊息量淹沒，AI 處理了 90% 的詢問。" },
      { name: "林小姐", role: "網路賣家", rating: 4, comment: "功能很完整，唯一建議是審核介面可以再簡單一點。整體來說很滿意，客服壓力明顯減輕。" },
    ],
  },
  "ecommerce-refund": {
    name: "電商退換貨自動處理",
    author: "ShopBot Studio",
    official: false,
    category: "電商",
    channels: ["LINE", "Telegram"],
    price: 3490,
    setupDays: 2,
    rating: 4.7,
    reviews: 22,
    deploys: 67,
    badge: "熱門",
    badgeColor: "#ef4444",
    tagline: "退換貨處理全自動化，從申請到確認不需要人工介入",
    desc: "專為電商設計的退換貨自動化 Wrapper，能夠自動受理退換貨申請、查詢訂單狀態、同步物流資訊，並在申請完成後自動發送確認通知。",
    highlights: [
      "退換貨申請全程自動引導",
      "自動查詢訂單和物流狀態",
      "申請記錄自動寫入 Google Sheets",
      "退款確認自動發送通知",
      "物流追蹤碼即時查詢",
      "支援 LINE 和 Telegram 雙通道",
    ],
    useCases: [
      { title: "退貨申請流程", scenario: "客戶說「我要退貨」→ AI 自動引導填寫訂單編號、退貨原因、商品狀況 → 自動建立退貨單 → 發送退貨地址和說明。" },
      { title: "物流查詢", scenario: "客戶問「我的包裹到哪了？」→ AI 查詢物流系統 → 回覆最新配送狀態和預計送達時間。" },
      { title: "換貨處理", scenario: "客戶申請換貨 → AI 確認庫存 → 安排換貨寄出 → 追蹤新包裹物流 → 到貨後發送確認。" },
    ],
    requirements: [
      "LINE OA 或 Telegram Bot 帳號",
      "Google Sheets 訂單管理表格",
      "物流 API 或追蹤查詢方式（可選）",
      "退換貨政策文件",
    ],
    faq: [
      { q: "退貨單會自動寫入我的系統嗎？", a: "會自動寫入 Google Sheets。若有其他 ERP 系統，可以討論客製化串接。" },
      { q: "可以設定只接受特定條件的退換貨嗎？", a: "可以設定退換貨期限、商品狀況要求、不可退商品等規則，AI 會依規則自動判斷。" },
    ],
    reviewList: [
      { name: "黃先生", role: "電商平台負責人", rating: 5, comment: "退換貨申請量佔我們客服工作的一半，現在幾乎全部自動化，省下大量人力。" },
      { name: "蔡小姐", role: "服裝品牌客服", rating: 4, comment: "功能很實用，設定過程 MyWrapper 的客服很有耐心地協助。" },
    ],
  },
};

// Fallback for unknown IDs
function getWrapper(id: string) {
  return wrapperData[id] || wrapperData["line-cs-pro"];
}

export default function WrapperDetailPage({ params }: { params: { id: string } }) {
  const w = getWrapper(params.id);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const channelColors: Record<string, string> = { LINE: "#00b900", Telegram: "#0088cc", Slack: "#4a154b", WhatsApp: "#25d366" };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/marketplace" style={{ fontSize: 13, color: "#6b7280", textDecoration: "none" }}>← Marketplace</Link>
            <span style={{ color: "#e5e7eb" }}>/</span>
            <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{w.name}</span>
          </div>
          <Link href="/login" style={{ background: "#1a56db", color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
            登入後台
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>

        {/* Left: Main content */}
        <div>
          {/* Title */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 32, marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{w.name}</h1>
                  {w.badge && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: (w.badgeColor || "#666") + "18", color: w.badgeColor || "#666", border: `1px solid ${(w.badgeColor || "#666")}30` }}>
                      {w.badge}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: w.official ? "#1a56db" : "#9ca3af", fontWeight: w.official ? 600 : 400, marginBottom: 12 }}>
                  {w.official ? "✓ " : ""}{w.author}
                </div>
                <p style={{ fontSize: 15, color: "#374151", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{w.tagline}</p>
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 20, paddingTop: 16, borderTop: "1px solid #f0f0f0", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= Math.round(w.rating) ? "#f59e0b" : "#e5e7eb" }}>★</span>)}
                <span style={{ fontSize: 14, fontWeight: 700 }}>{w.rating}</span>
                <span style={{ fontSize: 13, color: "#9ca3af" }}>({w.reviews} 評價)</span>
              </div>
              <div style={{ fontSize: 13, color: "#9ca3af" }}>🚀 {w.deploys} 次成功部署</div>
              <div style={{ display: "flex", gap: 6 }}>
                {w.channels.map(ch => (
                  <span key={ch} style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 100, background: channelColors[ch] || "#666", color: "#fff" }}>{ch}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>這個 Wrapper 能做什麼</h2>
            <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, marginBottom: 20 }}>{w.desc}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {w.highlights.map(h => (
                <div key={h} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13, color: "#374151" }}>
                  <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0, marginTop: 1 }}>✓</span>{h}
                </div>
              ))}
            </div>
          </div>

          {/* Use cases */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>實際運作情境</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {w.useCases.map((uc, i) => (
                <div key={i} style={{ background: "#f9fafb", borderRadius: 12, padding: 20, borderLeft: "3px solid #1a56db" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 8 }}>{uc.title}</div>
                  <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, margin: 0 }}>{uc.scenario}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Requirements */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>採購前你需要準備什麼</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {w.requirements.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 13, color: "#374151" }}>
                  <span style={{ background: "#eff6ff", color: "#1a56db", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  {r}
                </div>
              ))}
            </div>
            <div style={{ background: "#fef9ec", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 16px", marginTop: 16 }}>
              <p style={{ fontSize: 12, color: "#92400e", margin: 0, lineHeight: 1.6 }}>
                💡 <strong>不確定怎麼取得？</strong> 採購後我們的客服會一步一步協助你準備所有資料，不需要自己摸索。
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>常見問題</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {w.faq.map((f, i) => (
                <details key={i} style={{ border: "1px solid #f0f0f0", borderRadius: 10 }}>
                  <summary style={{ padding: "14px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", listStyle: "none" }}>
                    {f.q}
                  </summary>
                  <p style={{ padding: "0 16px 14px", fontSize: 13, color: "#555", lineHeight: 1.7, margin: 0 }}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>用戶評價</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {w.reviewList.map((r, i) => (
                <div key={i} style={{ paddingBottom: 16, borderBottom: i < w.reviewList.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", color: "#1a56db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700 }}>
                      {r.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{r.role}</div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
                      {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 12, color: i <= r.rating ? "#f59e0b" : "#e5e7eb" }}>★</span>)}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, margin: 0 }}>{r.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Purchase sidebar */}
        <div style={{ position: "sticky", top: 24, height: "fit-content" }}>
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginBottom: 16 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 32, fontWeight: 900 }}>
                NT${w.price.toLocaleString()}
                <span style={{ fontSize: 14, fontWeight: 400, color: "#9ca3af" }}>/月</span>
              </div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
                + API 費用（由你的帳號支付，後台即時監控）
              </div>
            </div>

            <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", marginBottom: 6 }}>採購包含</div>
              {["OpenClaw 雲端部署", `${w.setupDays} 天內完成串接`, "後台監控介面", "免費客服支援", "隨時調整 AI 設定"].map(item => (
                <div key={item} style={{ fontSize: 12, color: "#374151", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ color: "#16a34a" }}>✓</span>{item}
                </div>
              ))}
            </div>

            <button onClick={() => setShowContactForm(true)}
              style={{ width: "100%", background: "#1a56db", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", marginBottom: 10, boxShadow: "0 4px 12px rgba(26,86,219,0.25)" }}>
              立即採購 / 詢問
            </button>
            <button
              style={{ width: "100%", background: "#fff", color: "#374151", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              預約 Demo 說明
            </button>

            <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#9ca3af" }}>
              採購後由客服聯絡，提供串接資料後開始部署
            </div>
          </div>

          {/* Setup time */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12 }}>上線時間表</div>
            {[
              { day: "第 1 天", action: "完成採購，收到確認信" },
              { day: `第 ${w.setupDays} 天`, action: "AI 員工上線，開始服務" },
              { day: "持續", action: "後台監控、隨時調整優化" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
                <div style={{ width: 60, fontSize: 11, fontWeight: 700, color: "#1a56db", flexShrink: 0 }}>{s.day}</div>
                <div style={{ fontSize: 12, color: "#555" }}>{s.action}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact form modal */}
      {showContactForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 32, maxWidth: 480, width: "100%" }}>
            {contactSubmitted ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>收到了！</h3>
                <p style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.7 }}>
                  我們的客服會在 1 個工作天內聯絡你，確認細節並開始準備部署。
                </p>
                <button onClick={() => { setShowContactForm(false); setContactSubmitted(false); }}
                  style={{ background: "#1a56db", color: "#fff", border: "none", borderRadius: 10, padding: "10px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 20 }}>
                  關閉
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>採購 {w.name}</h3>
                  <button onClick={() => setShowContactForm(false)}
                    style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9ca3af" }}>✕</button>
                </div>
                <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 20, lineHeight: 1.6 }}>
                  填寫聯絡資訊，我們會在 1 個工作天內聯絡你，確認需求後開始部署。
                </p>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>姓名 / 公司名稱</label>
                  <input value={contactName} onChange={e => setContactName(e.target.value)}
                    placeholder="王小明 / 某某公司"
                    style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>Email</label>
                  <input value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                    placeholder="you@company.com"
                    style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>電話（選填）</label>
                  <input value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                    placeholder="0912-345-678"
                    style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 13, boxSizing: "border-box" }} />
                </div>
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    採購方案：<strong style={{ color: "#111" }}>{w.name}</strong><br />
                    月費：<strong style={{ color: "#111" }}>NT${w.price.toLocaleString()}/月</strong>
                  </div>
                </div>
                <button
                  onClick={() => { if (contactName && contactEmail) setContactSubmitted(true); }}
                  style={{ width: "100%", background: "#1a56db", color: "#fff", border: "none", borderRadius: 12, padding: "14px 0", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
                  送出採購申請
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
