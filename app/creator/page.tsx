"use client";
import Link from "next/link";
import { useState } from "react";

const tiers = [
  { name: "新手創作者", condition: "上架未滿 3 個月", pct: 65, color: "#6b7280", bg: "#f9fafb" },
  { name: "認證創作者", condition: "累計銷售 > NT$30,000", pct: 70, color: "#1a56db", bg: "#eff6ff" },
  { name: "精選創作者", condition: "平台評選，品質最高", pct: 75, color: "#7c3aed", bg: "#f5f3ff" },
  { name: "獨家創作者", condition: "只在 MyWrapper 上架", pct: 80, color: "#059669", bg: "#ecfdf5" },
];

const benefits = [
  { icon: "💰", title: "最高 80% 分潤", desc: "銷售每一筆都有分潤，月底統一撥款，透明結算。" },
  { icon: "🚀", title: "部署由我們負責", desc: "客戶採購後，我們負責雲端部署、通道串接、售後支援，你只需要開發好 Wrapper。" },
  { icon: "📊", title: "銷售數據儀表板", desc: "即時看到你的 Wrapper 被採購次數、月收入、評價，掌握市場反應。" },
  { icon: "💡", title: "許願池優先資訊", desc: "第一時間看到用戶許願需求，搶先開發市場有需求的 Wrapper。" },
  { icon: "🎯", title: "官方推薦曝光", desc: "優質 Wrapper 有機會獲得首頁精選位置，增加曝光機會。" },
  { icon: "🤝", title: "技術支援", desc: "MyWrapper 工程師提供 OpenClaw 開發文件和技術諮詢，加速開發。" },
];

const steps = [
  { num: "01", title: "填寫申請表", desc: "填寫你的基本資訊和第一個 Wrapper 的概念說明，不需要已經完成開發。" },
  { num: "02", title: "審核 & 說明會", desc: "我們會在 5 個工作天內聯絡你，安排 30 分鐘線上說明，確認合作方向。" },
  { num: "03", title: "取得開發文件", desc: "審核通過後，取得 OpenClaw SDK 和 Wrapper 開發規範，開始開發。" },
  { num: "04", title: "上架審核", desc: "Wrapper 完成後提交審核，我們確認品質和安全性後，協助上架。" },
  { num: "05", title: "開始賺錢", desc: "上架後每筆採購都有分潤，月底統一結算。達到條件自動升級等級。" },
];

export default function CreatorPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", github: "",
    background: "", wrapperIdea: "", wrapperCategory: "",
    priceModel: "", techStack: "", timeline: "", motivation: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const inputStyle: React.CSSProperties = {
    width: "100%", border: "1px solid #e5e7eb", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, boxSizing: "border-box",
    outline: "none", fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6,
  };
  const fieldStyle: React.CSSProperties = { marginBottom: 16 };

  return (
    <div style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "system-ui, -apple-system, sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/marketplace" style={{ textDecoration: "none" }}>
              <img src="/logo.png" alt="MyWrapper" style={{ height: 30, width: "auto", objectFit: "contain" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </Link>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>創作者計畫</span>
          </div>
          <Link href="/login" style={{ background: "#1a56db", color: "#fff", padding: "7px 16px", borderRadius: 8, fontSize: 13, textDecoration: "none", fontWeight: 600 }}>
            登入後台
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #0f172a, #1e3a8a)", padding: "64px 24px", color: "#fff", textAlign: "center" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: "#93c5fd", marginBottom: 12 }}>
          MyWrapper 創作者計畫
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, marginBottom: 16 }}>
          你開發 Wrapper，<br />我們幫你賣
        </h1>
        <p style={{ fontSize: 16, color: "#94a3b8", maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.8 }}>
          上架你的 OpenClaw Wrapper，每次客戶採購你都有分潤。
          部署、客服、金流全部我們處理，你只需要專注開發。
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 100, padding: "8px 20px" }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#fbbf24" }}>最高 80%</span>
          <span style={{ fontSize: 14, color: "#fde68a" }}>銷售分潤</span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

        {/* Tiers */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>分潤等級制度</h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>隨著銷售成長，自動升級等級，享有更高分潤比例。</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }}>
            {tiers.map(t => (
              <div key={t.name} style={{ background: t.bg, borderRadius: 14, padding: 20, border: `1.5px solid ${t.color}20`, textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: t.color, lineHeight: 1 }}>{t.pct}%</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#111", margin: "8px 0 4px" }}>{t.name}</div>
                <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>{t.condition}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 16px", marginTop: 16, fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
            💡 <strong style={{ color: "#374151" }}>許願池加碼：</strong>完成許願池需求的 Wrapper，前 3 個月分潤提升至 75%，票數 &gt; 50 另加 NT$5,000 獎金。
          </div>
        </div>

        {/* Benefits */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, textAlign: "center" }}>加入創作者計畫，你得到什麼</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {benefits.map(b => (
              <div key={b.title} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e5e7eb", padding: 22 }}>
                <div style={{ fontSize: 26, marginBottom: 12 }}>{b.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{b.title}</div>
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 24, textAlign: "center" }}>從申請到上架，怎麼運作</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {steps.map((s, i) => (
              <div key={s.num} style={{ display: "flex", gap: 20, paddingBottom: i < steps.length - 1 ? 24 : 0, marginBottom: i < steps.length - 1 ? 24 : 0, borderBottom: i < steps.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#eff6ff", color: "#1a56db", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 }}>{s.num}</div>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Application form */}
        <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #e5e7eb", padding: 32 }} id="apply">
          {submitted ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>申請已送出！</h2>
              <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.8, maxWidth: 480, margin: "0 auto 24px" }}>
                我們會在 5 個工作天內透過 Email 聯絡你，安排說明會並確認合作細節。
              </p>
              <Link href="/marketplace" style={{ display: "inline-block", background: "#1a56db", color: "#fff", padding: "12px 28px", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                回到 Marketplace
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>申請成為創作者</h2>
                <p style={{ fontSize: 14, color: "#6b7280" }}>填寫以下資訊，我們會在 5 個工作天內聯絡你。不需要已完成開發，有想法就可以申請。</p>
              </div>

              {/* Step indicator */}
              <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
                {["基本資訊", "Wrapper 概念", "開發計畫"].map((label, i) => (
                  <div key={label} style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, flexShrink: 0,
                      background: step > i + 1 ? "#16a34a" : step === i + 1 ? "#1a56db" : "#f0f0f0",
                      color: step >= i + 1 ? "#fff" : "#9ca3af",
                    }}>
                      {step > i + 1 ? "✓" : i + 1}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? "#111" : "#9ca3af", flex: 1 }}>{label}</span>
                    {i < 2 && <div style={{ height: 1, flex: 1, background: step > i + 1 ? "#16a34a" : "#e5e7eb" }} />}
                  </div>
                ))}
              </div>

              {/* Step 1 */}
              {step === 1 && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>姓名 *</label>
                      <input value={form.name} onChange={e => set("name", e.target.value)} placeholder="王小明" style={inputStyle} />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>Email *</label>
                      <input value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" style={inputStyle} />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>電話（選填）</label>
                      <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="0912-345-678" style={inputStyle} />
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>GitHub / 作品集連結（選填）</label>
                      <input value={form.github} onChange={e => set("github", e.target.value)} placeholder="https://github.com/yourname" style={inputStyle} />
                    </div>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>你的技術背景 *</label>
                    <textarea value={form.background} onChange={e => set("background", e.target.value)}
                      placeholder="例如：我是全端工程師，有 3 年 Node.js 經驗，做過 LINE Bot 串接..."
                      style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.6 }} />
                  </div>
                  <button onClick={() => { if (form.name && form.email && form.background) setStep(2); }}
                    style={{ background: "#1a56db", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    下一步 →
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>你想開發什麼 Wrapper？ *</label>
                    <textarea value={form.wrapperIdea} onChange={e => set("wrapperIdea", e.target.value)}
                      placeholder="例如：我想做一個餐廳訂位系統 Wrapper，讓餐廳透過 LINE 自動接受訂位、傳取餐號碼、提醒取餐..."
                      style={{ ...inputStyle, minHeight: 100, resize: "vertical", lineHeight: 1.6 }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>行業分類 *</label>
                      <select value={form.wrapperCategory} onChange={e => set("wrapperCategory", e.target.value)} style={inputStyle}>
                        <option value="">選擇分類</option>
                        {["客服", "電商", "餐飲", "醫療 / 診所", "房仲 / 租賃", "金融 / 保險", "企業內部", "教育", "其他"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div style={fieldStyle}>
                      <label style={labelStyle}>定價模式 *</label>
                      <select value={form.priceModel} onChange={e => set("priceModel", e.target.value)} style={inputStyle}>
                        <option value="">選擇模式</option>
                        <option value="monthly">月費制（每月固定收費）</option>
                        <option value="onetime">一次性買斷</option>
                        <option value="both">兩種都提供</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setStep(1)}
                      style={{ border: "1px solid #e5e7eb", background: "#fff", color: "#374151", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                      ← 上一步
                    </button>
                    <button onClick={() => { if (form.wrapperIdea && form.wrapperCategory && form.priceModel) setStep(3); }}
                      style={{ background: "#1a56db", color: "#fff", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                      下一步 →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>預計使用的技術 / 工具</label>
                    <input value={form.techStack} onChange={e => set("techStack", e.target.value)}
                      placeholder="例如：Node.js, TypeScript, LINE Messaging API, Google Sheets API"
                      style={inputStyle} />
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>預計開發時間</label>
                    <select value={form.timeline} onChange={e => set("timeline", e.target.value)} style={inputStyle}>
                      <option value="">選擇</option>
                      <option value="2weeks">2 週內</option>
                      <option value="1month">1 個月</option>
                      <option value="2months">2 個月</option>
                      <option value="unsure">還不確定</option>
                    </select>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>為什麼想加入 MyWrapper 創作者計畫？</label>
                    <textarea value={form.motivation} onChange={e => set("motivation", e.target.value)}
                      placeholder="分享你的想法..."
                      style={{ ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.6 }} />
                  </div>

                  {/* Summary */}
                  <div style={{ background: "#f9fafb", borderRadius: 12, padding: 20, marginBottom: 20, border: "1px solid #e5e7eb" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12 }}>申請摘要</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        ["姓名", form.name],
                        ["Email", form.email],
                        ["分類", form.wrapperCategory],
                        ["定價模式", { monthly: "月費制", onetime: "一次性買斷", both: "兩種都有" }[form.priceModel] || ""],
                      ].map(([k, v]) => (
                        <div key={String(k)} style={{ fontSize: 12 }}>
                          <span style={{ color: "#9ca3af" }}>{k}：</span>
                          <span style={{ color: "#111", fontWeight: 600 }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setStep(2)}
                      style={{ border: "1px solid #e5e7eb", background: "#fff", color: "#374151", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                      ← 上一步
                    </button>
                    <button onClick={() => { if (form.name && form.email) setSubmitted(true); }}
                      style={{ flex: 1, background: "#1a56db", color: "#fff", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(26,86,219,0.25)" }}>
                      送出申請
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e5e7eb", padding: "24px", background: "#fff", marginTop: 40 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <img src="/logo.png" alt="MyWrapper" style={{ height: 26, width: "auto", objectFit: "contain" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <p style={{ fontSize: 12, color: "#9ca3af" }}>© 2026 MyWrapper Technologies</p>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/marketplace" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>Marketplace</Link>
            <Link href="/landing" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>關於我們</Link>
            <Link href="/login" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>後台登入</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
