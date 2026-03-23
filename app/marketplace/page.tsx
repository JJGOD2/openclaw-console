"use client";
import Link from "next/link";
import { useState } from "react";

const categories = ["全部", "客服", "電商", "醫療 / 診所", "房仲 / 租賃", "金融 / 保險", "企業內部", "許願池"];

const wrappers = [
  {
    id: "line-cs-pro",
    name: "LINE 客服機器人 Pro",
    author: "MyWrapper 官方",
    official: true,
    category: "客服",
    channels: ["LINE"],
    desc: "24 小時自動回覆客戶訊息，支援訂單查詢、FAQ、轉人工，上線時間最快 1 天。",
    highlights: ["自動識別問題類型", "轉人工審核流程", "連接 Google Sheets", "多語言支援"],
    price: 2990,
    rating: 4.9,
    reviews: 38,
    deploys: 124,
    badge: "熱門",
    badgeColor: "#ef4444",
    setupDays: 1,
  },
  {
    id: "ecommerce-refund",
    name: "電商退換貨自動處理",
    author: "ShopBot Studio",
    official: false,
    category: "電商",
    channels: ["LINE", "Telegram"],
    desc: "自動受理退換貨申請、查詢訂單狀態、同步物流資訊，大幅降低客服人力成本。",
    highlights: ["退換貨申請自動化", "物流狀態即時查詢", "訂單資料庫串接", "自動發送退款確認"],
    price: 3490,
    rating: 4.7,
    reviews: 22,
    deploys: 67,
    badge: "熱門",
    badgeColor: "#ef4444",
    setupDays: 2,
  },
  {
    id: "clinic-booking",
    name: "診所線上掛號系統",
    author: "MedHelper",
    official: false,
    category: "醫療 / 診所",
    channels: ["LINE"],
    desc: "LINE 自動掛號、查詢時段、取消改約，診前提醒自動發送，減少護理師電話負擔。",
    highlights: ["掛號 / 取消 / 改約", "診前 24 小時提醒", "Google Calendar 串接", "衛教資訊自動發送"],
    price: 2490,
    rating: 4.8,
    reviews: 17,
    deploys: 43,
    badge: "精選",
    badgeColor: "#7c3aed",
    setupDays: 2,
  },
  {
    id: "real-estate-bot",
    name: "房仲業務助理",
    author: "PropBot",
    official: false,
    category: "房仲 / 租賃",
    channels: ["LINE", "Telegram"],
    desc: "潛在客戶自動接待、案件資訊查詢、帶看預約，讓業務員專注在真正有意願的客戶。",
    highlights: ["24 小時潛客接待", "帶看自動預約", "Google Calendar 串接", "客戶意願篩選"],
    price: 2990,
    rating: 4.6,
    reviews: 14,
    deploys: 38,
    badge: null,
    badgeColor: null,
    setupDays: 1,
  },
  {
    id: "insurance-lead",
    name: "保險業務潛客篩選",
    author: "FinBot Labs",
    official: false,
    category: "金融 / 保險",
    channels: ["LINE", "Telegram"],
    desc: "自動回覆保險詢問、篩選有意願客戶，所有回覆強制人工審核，零合規風險。",
    highlights: ["敏感話題自動攔截", "強制人工審核", "潛客資料自動整理", "業務員效率提升 3x"],
    price: 3990,
    rating: 4.5,
    reviews: 9,
    deploys: 21,
    badge: "新上架",
    badgeColor: "#0891b2",
    setupDays: 3,
  },
  {
    id: "hr-assistant",
    name: "企業 HR 自助助理",
    author: "MyWrapper 官方",
    official: true,
    category: "企業內部",
    channels: ["Slack", "LINE"],
    desc: "員工自助查詢請假規定、福利說明、報帳流程，連接 Notion 知識庫，HR 終於可以專心做有價值的事。",
    highlights: ["請假 / 報帳自動回覆", "Notion 知識庫連接", "新人 Onboarding 自動化", "支援 Slack / LINE"],
    price: 1990,
    rating: 4.8,
    reviews: 26,
    deploys: 89,
    badge: "官方",
    badgeColor: "#1a56db",
    setupDays: 1,
  },
];

const wishes = [
  { id: 1, title: "WhatsApp 多語言客服機器人", votes: 47, category: "客服", desc: "支援繁中、英文、日文自動切換，適合有外國客戶的電商" },
  { id: 2, title: "餐廳訂位 + 外帶預訂系統", votes: 38, category: "餐飲", desc: "LINE 自動接受訂位、外帶預訂、傳送取餐號碼" },
  { id: 3, title: "律師事務所初步法律諮詢", votes: 29, category: "法律", desc: "收集客戶基本資訊、案件類型，安排正式諮詢時間" },
  { id: 4, title: "健身房會員自助服務", votes: 24, category: "運動", desc: "課程預約、請假、會員費查詢，連接會員管理系統" },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} style={{ fontSize: 11, color: i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb" }}>★</span>
      ))}
      <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 2 }}>{rating}</span>
    </div>
  );
}

function ChannelBadge({ ch }: { ch: string }) {
  const colors: Record<string, string> = { LINE: "#00b900", Telegram: "#0088cc", Slack: "#4a154b", Discord: "#5865f2", WhatsApp: "#25d366" };
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: colors[ch] || "#6b7280", color: "#fff" }}>{ch}</span>
  );
}

export default function MarketplacePage() {
  const [activeCategory, setActiveCategory] = useState("全部");
  const [showWishForm, setShowWishForm] = useState(false);
  const [wishText, setWishText] = useState("");
  const [wishCategory, setWishCategory] = useState("");
  const [wishSubmitted, setWishSubmitted] = useState(false);

  const filtered = (activeCategory === "全部" || activeCategory === "許願池")
    ? wrappers
    : wrappers.filter(w => w.category === activeCategory);

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <Link href="/landing" style={{ textDecoration: "none" }}>
                <img src="/logo.png" alt="MyWrapper" style={{ height: 30, width: "auto", objectFit: "contain" }}
                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </Link>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>Wrapper Marketplace</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <a href="/creator" style={{ border: "1px solid #e5e7eb", color: "#374151", padding: "7px 16px", borderRadius: 8, fontSize: 13, textDecoration: "none", fontWeight: 500 }}>
                我要上架 Wrapper
              </a>
              <Link href="/login" style={{ background: "#1a56db", color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
                登入後台
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1e3a8a, #1a56db)", padding: "52px 24px", textAlign: "center", color: "#fff" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#93c5fd", marginBottom: 12 }}>
          Wrapper Marketplace
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 800, marginBottom: 12 }}>找到你需要的 AI 員工</h1>
        <p style={{ fontSize: 15, color: "#bfdbfe", maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.7 }}>
          採購 Wrapper，我們幫你部署到雲端、串接通道，最快 1 天上線。API 費用由你掌控，後台即時監控。
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {["🚀 採購後 1-3 天上線", "🛠 串接由我們協助", "📊 即時監控 API 費用"].map(t => (
            <div key={t} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 20px", fontSize: 13, color: "#e0f2fe" }}>{t}</div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28, flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{
                padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s",
                background: activeCategory === cat ? "#1a56db" : "#fff",
                color: activeCategory === cat ? "#fff" : "#374151",
                border: `1px solid ${activeCategory === cat ? "#1a56db" : "#e5e7eb"}`,
                boxShadow: activeCategory === cat ? "0 2px 8px rgba(26,86,219,0.2)" : "none",
              }}>
              {cat === "許願池" ? "💡 " + cat : cat}
            </button>
          ))}
        </div>

        {/* Wrapper grid */}
        {activeCategory !== "許願池" && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, marginBottom: 40 }}>
              {filtered.map(w => (
                <div key={w.id}
                  style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", overflow: "hidden", display: "flex", flexDirection: "column", transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; (e.currentTarget as HTMLDivElement).style.transform = "none"; }}>

                  <div style={{ padding: "20px 20px 16px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>{w.name}</h3>
                          {w.badge && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 100, background: (w.badgeColor || "#666") + "18", color: w.badgeColor || "#666", border: `1px solid ${(w.badgeColor || "#666")}30` }}>
                              {w.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: w.official ? "#1a56db" : "#9ca3af", fontWeight: w.official ? 600 : 400 }}>
                          {w.official ? "✓ " : ""}{w.author}
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 14 }}>{w.desc}</p>

                    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
                      {w.highlights.map(h => (
                        <div key={h} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#374151" }}>
                          <span style={{ color: "#16a34a", fontWeight: 700, flexShrink: 0 }}>✓</span>{h}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
                      {w.channels.map(ch => <ChannelBadge key={ch} ch={ch} />)}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <StarRating rating={w.rating} />
                      <span style={{ fontSize: 11, color: "#9ca3af" }}>({w.reviews})</span>
                      <span style={{ fontSize: 11, color: "#9ca3af", marginLeft: "auto" }}>🚀 {w.deploys} 次部署</span>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid #f0f0f0", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>
                        NT${w.price.toLocaleString()}
                        <span style={{ fontSize: 12, fontWeight: 400, color: "#9ca3af" }}>/月</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>約 {w.setupDays} 天上線</div>
                    </div>
                    <Link href={`/marketplace/${w.id}`}
                      style={{ background: "#1a56db", color: "#fff", padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                      查看詳情
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Creator CTA */}
            <div style={{ background: "linear-gradient(135deg, #0f172a, #1e293b)", borderRadius: 20, padding: "36px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, color: "#fff", marginBottom: 40 }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>你是 Wrapper 開發者嗎？</div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>上架你的 Wrapper，每次採購都有分潤</h3>
                <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>
                  創作者可獲得 <strong style={{ color: "#fbbf24" }}>70% 銷售收入</strong>。達到條件可升級至精選創作者，享 75%。
                  我們負責部署、客服、金流，你只需要專注開發好 Wrapper。
                </p>
              </div>
              <div style={{ flexShrink: 0, textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#fbbf24", marginBottom: 4 }}>70%</div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>創作者分潤比例</div>
                <a href="/creator"
                  style={{ display: "inline-block", background: "#fbbf24", color: "#0f172a", fontWeight: 800, padding: "12px 28px", borderRadius: 12, fontSize: 14, textDecoration: "none" }}>
                  申請上架 Wrapper
                </a>
              </div>
            </div>
          </>
        )}

        {/* Wish pool */}
        {(activeCategory === "許願池" || activeCategory === "全部") && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>💡 許願池</h2>
                <p style={{ fontSize: 14, color: "#6b7280" }}>找不到你需要的 Wrapper？許願給開發者看，票數高的需求優先開發。</p>
              </div>
              <button onClick={() => setShowWishForm(!showWishForm)}
                style={{ background: "#1a56db", color: "#fff", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
                + 我要許願
              </button>
            </div>

            {showWishForm && (
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", padding: 24, marginBottom: 20 }}>
                {wishSubmitted ? (
                  <div style={{ textAlign: "center", padding: "20px 0" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🎉</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>許願成功！</div>
                    <p style={{ fontSize: 13, color: "#6b7280" }}>我們會通知開發者社群，票數高的需求優先安排開發。</p>
                  </div>
                ) : (
                  <>
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>描述你需要的 Wrapper</h3>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>你需要什麼功能？</label>
                      <textarea value={wishText} onChange={e => setWishText(e.target.value)}
                        placeholder="例如：我需要一個可以自動接受餐廳訂位的 LINE 機器人，要能傳取餐號碼..."
                        style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 14px", fontSize: 13, lineHeight: 1.6, resize: "vertical", minHeight: 80, boxSizing: "border-box" }} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>行業分類</label>
                      <select value={wishCategory} onChange={e => setWishCategory(e.target.value)}
                        style={{ width: "100%", border: "1px solid #e5e7eb", borderRadius: 10, padding: "9px 14px", fontSize: 13 }}>
                        <option value="">選擇分類</option>
                        {["客服", "電商", "餐飲", "醫療", "房仲", "金融", "企業內部", "其他"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => { if (wishText.trim()) setWishSubmitted(true); }}
                      style={{ background: "#1a56db", color: "#fff", padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer" }}>
                      送出許願
                    </button>
                  </>
                )}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {wishes.map(w => (
                <div key={w.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: "18px 20px", display: "flex", alignItems: "center", gap: 20 }}>
                  <div style={{ textAlign: "center", flexShrink: 0, minWidth: 48 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#1a56db" }}>{w.votes}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>票</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{w.title}</h4>
                      <span style={{ fontSize: 10, background: "#eff6ff", color: "#1a56db", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>{w.category}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>{w.desc}</p>
                  </div>
                  <button style={{ border: "1px solid #e5e7eb", background: "#fff", color: "#374151", padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                    👍 我也需要
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", padding: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, textAlign: "center", marginBottom: 8 }}>採購後發生什麼事？</h2>
          <p style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 32 }}>你只需要採購和提供資料，其他全部我們來。</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 8, alignItems: "center", marginBottom: 16 }}>
            {[
              { num: "1", title: "選擇採購", desc: "找到適合的 Wrapper，完成付款", isStep: true },
              { num: "→", title: "", desc: "", isStep: false },
              { num: "2", title: "提供資料", desc: "LINE Token、公司資訊、產品說明", isStep: true },
              { num: "→", title: "", desc: "", isStep: false },
              { num: "3", title: "客服串接", desc: "我們協助部署、設定、測試", isStep: true },
            ].map((s, i) => s.isStep ? (
              <div key={i} style={{ background: "#f9fafb", borderRadius: 14, padding: "20px 16px", textAlign: "center" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a56db", color: "#fff", fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>{s.num}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ) : (
              <div key={i} style={{ textAlign: "center", fontSize: 20, color: "#d1d5db" }}>→</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { num: "4", title: "1-3 天上線", desc: "AI 員工開始在你的通道服務客戶" },
              { num: "5", title: "即時監控", desc: "後台看對話、費用、效果，隨時調整" },
            ].map(s => (
              <div key={s.num} style={{ background: "#f9fafb", borderRadius: 14, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1a56db", color: "#fff", fontSize: 16, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.num}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "24px", background: "#fff", marginTop: 40 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <img src="/logo.png" alt="MyWrapper" style={{ height: 26, width: "auto", objectFit: "contain" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p style={{ fontSize: 12, color: "#9ca3af" }}>© 2026 MyWrapper Technologies</p>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/landing" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>關於我們</Link>
            <a href="/creator" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>創作者申請</Link>
            <Link href="/login" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>後台登入</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
