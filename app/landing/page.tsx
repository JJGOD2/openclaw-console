"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const stats = [
  { value: "7+", label: "支援通道", sub: "LINE · Telegram · Slack · Discord · WhatsApp · SMS · 語音" },
  { value: "47", label: "資料表架構", sub: "完整企業級資料模型" },
  { value: "78+", label: "API 端點", sub: "完整後端服務覆蓋" },
  { value: "14", label: "排程任務", sub: "自動化背景工作" },
];

const features = [
  {
    icon: "🤖",
    title: "多 Agent 圖形化管理",
    pain: "傳統方式需要工程師修改設定檔才能調整 AI 行為，業務等工程、工程忙救火。",
    solution: "圖形化介面直接設定 System Prompt、Tool 綁定。非技術人員 5 分鐘內建立或調整 Agent。",
    tags: ["System Prompt 編輯器", "Prompt 版本控制", "A/B 測試", "多模型切換"],
  },
  {
    icon: "📱",
    title: "7 大通道一站管理",
    pain: "客戶在哪裡服務就要在哪裡，但同時維護 7 個平台的 webhook 技術門檻極高。",
    solution: "統一介面管理所有通道。同一個 Agent 同時服務多個通道，訊息格式自動轉換。",
    tags: ["LINE OA", "Telegram Bot", "Slack", "Discord", "WhatsApp", "SMS", "語音"],
  },
  {
    icon: "👁",
    title: "人工審核流程",
    pain: "AI 有時會幻覺，在客服場景說錯資訊可能造成客訴甚至法律風險。",
    solution: "AI 先起草回覆，人工審核確認後才發送。可設定特定情境自動通過，高風險操作需把關。",
    tags: ["AI 草稿 → 人工確認", "審核協作留言", "自動通過規則", "即時通知"],
  },
  {
    icon: "🛡",
    title: "企業級安全治理",
    pain: "AI 客服系統掌握大量用戶對話，一旦洩漏或被注入攻擊，後果嚴重。",
    solution: "Prompt 注入偵測、AES-256-GCM 加密儲存、Circuit Breaker 熔斷、完整 Audit Log。",
    tags: ["Prompt 注入防護", "AES-256 加密", "Audit Log", "Circuit Breaker"],
  },
  {
    icon: "📊",
    title: "成本與用量監控",
    pain: "AI API 費用容易失控，多個客戶共用時很難追蹤哪個 Workspace 燒了多少錢。",
    solution: "每個 Workspace 獨立計費，Token 即時追蹤，月度費用預測，超標自動告警。AI 自動產生客戶月報。",
    tags: ["Token 追蹤", "費用預測", "超標告警", "AI 客戶報告"],
  },
  {
    icon: "🧠",
    title: "知識庫 RAG 整合",
    pain: "通用 AI 不了解你的產品政策。每次在 Prompt 塞大量文件，浪費 Token 效果又差。",
    solution: "上傳文件自動向量化，對話時智能檢索相關段落注入上下文。回答更準確、費用更低。",
    tags: ["文件向量化", "語意搜尋", "自動注入上下文", "多知識庫管理"],
  },
  {
    icon: "⛓",
    title: "Agent Chain 鏈式協作",
    pain: "複雜任務靠單一 AI 往往不夠，翻譯、分析、決策、執行需要多個 Agent 協作。",
    solution: "視覺化 Chain 編輯器串接多個 Agent，支援串行、並行、條件分支，輸出統一答案。",
    tags: ["串行 / 並行執行", "條件分支", "結果合併", "視覺化編輯"],
  },
  {
    icon: "🔗",
    title: "Google / Notion 整合",
    pain: "AI 對話產生的資訊停留在聊天室，無法融入既有工作流程，造成資料孤島。",
    solution: "對話紀錄自動同步 Google Sheets，預約寫入 Calendar，查詢 Notion 資料庫。",
    tags: ["Google Sheets", "Google Calendar", "Gmail", "Notion"],
  },
];

const plans = [
  {
    name: "Starter", price: "NT$1,490", period: "/月",
    desc: "個人 / 小型團隊起步使用", highlight: false,
    items: ["1 個 Workspace", "3 個 Agent", "LINE + Telegram 通道", "基本 Log & 成本報表", "社群支援"],
    cta: "免費試用 14 天",
  },
  {
    name: "Pro", price: "NT$4,990", period: "/月",
    desc: "中小企業主力方案", highlight: true, badge: "最受歡迎",
    items: ["最多 10 個 Workspace", "無上限 Agent", "所有 7 大通道", "人工審核流程", "知識庫 RAG", "Google / Notion 整合", "告警通知", "Email 支援"],
    cta: "立即開始",
  },
  {
    name: "Business", price: "洽談", period: "",
    desc: "企業客戶，無上限擴展", highlight: false,
    items: ["無上限 Workspace", "白標 / 自訂網域", "多角色權限管理", "Agent Chain 協作", "私有雲部署", "API & Webhook 開放", "專屬導入顧問", "SLA 保障"],
    cta: "聯絡業務",
  },
];

const faqs = [
  { q: "不懂程式碼可以用嗎？", a: "可以。MyWrapper 的核心設計就是讓非技術人員能管理 AI 客服。建立 Agent、設定通道、審核訊息全圖形化操作，不需碰程式碼。技術設定部分由我們協助完成。" },
  { q: "支援哪些 AI 模型？", a: "預設使用 Claude 3.5 Sonnet，可切換 Claude Haiku（速度快）或 Claude Opus（最高品質）。透過 OpenRouter 也可使用 GPT-4、Gemini 等模型。" },
  { q: "資料安全性如何保障？", a: "所有 API Key 以 AES-256-GCM 加密儲存。每次設定變更有 Audit Log 記錄。Sender Allowlist 只接受指定用戶。Prompt 注入偵測防範惡意攻擊。" },
  { q: "可以多人協作管理嗎？", a: "支援多角色權限。可設定 Admin（完整控制）、Operator（日常操作）、Reviewer（只能審核訊息）等角色，適合團隊分工。" },
  { q: "LINE Official Account 怎麼串接？", a: "在 MyWrapper 後台取得 Webhook URL，貼到 LINE Developers Console 即可。我們提供詳細教學，通常 30 分鐘內完成。" },
  { q: "提供免費試用嗎？", a: "Starter 方案 14 天免費試用，不需信用卡。Pro 以上請聯絡業務安排一對一 Demo，我們會根據你的業務場景提供建議。" },
];

function DashboardMockup() {
  const agents = [
    { name:"客服 Aria", initials:"AR", channel:"LINE OA · 電商", status:"啟用", msgs:847, color:"#dbeafe", tcolor:"#1d4ed8" },
    { name:"業務 Rex",  initials:"RX", channel:"Telegram · 房仲", status:"啟用", msgs:312, color:"#ede9fe", tcolor:"#6d28d9" },
    { name:"診所 Luna", initials:"LU", channel:"LINE OA · 診所",  status:"待機", msgs:156, color:"#d1fae5", tcolor:"#065f46" },
  ];
  const logs = [
    { type:"CHAT",   msg:"[LINE] user_882 → Aria：訂單 #20240918 查詢 → 回覆已發送" },
    { type:"TOOL",   msg:"[Telegram] Rex → calendar-book：預約帶看 2026-03-20 成功" },
    { type:"REVIEW", msg:"[LINE] 待審核：租金糾紛處理方式，等待人工確認" },
    { type:"SYSTEM", msg:"Gateway health check passed · 回應時間 142ms" },
  ];
  const logColor: Record<string,{bg:string,text:string}> = {
    CHAT:{bg:"#dbeafe",text:"#1e40af"},
    TOOL:{bg:"#d1fae5",text:"#065f46"},
    REVIEW:{bg:"#fef3c7",text:"#92400e"},
    SYSTEM:{bg:"#f3f4f6",text:"#6b7280"},
  };
  return (
    <div style={{background:"#fff",borderRadius:16,border:"1px solid #f0f0f0",boxShadow:"0 20px 60px rgba(0,0,0,0.08)",overflow:"hidden"}}>
      <div style={{background:"#f9fafb",borderBottom:"1px solid #f0f0f0",padding:"10px 16px",display:"flex",alignItems:"center",gap:8}}>
        <div style={{display:"flex",gap:5}}>
          {["#f87171","#fbbf24","#34d399"].map(c=><div key={c} style={{width:10,height:10,borderRadius:"50%",background:c}}/>)}
        </div>
        <div style={{flex:1,background:"#fff",borderRadius:6,height:22,display:"flex",alignItems:"center",padding:"0 10px",border:"1px solid #e5e7eb"}}>
          <span style={{fontSize:10,color:"#9ca3af"}}>console.mywrapper.ai/dashboard</span>
        </div>
      </div>
      <div style={{display:"flex"}}>
        <div style={{width:130,background:"#f9fafb",borderRight:"1px solid #f0f0f0",padding:12}}>
          {["總覽","Workspace","Agent","通道","工具","安全","Log","用量","分析"].map((item,i)=>(
            <div key={item} style={{padding:"6px 8px",borderRadius:8,fontSize:11,marginBottom:2,background:i===0?"#1a56db":"transparent",color:i===0?"#fff":"#6b7280",cursor:"pointer"}}>
              {item}
            </div>
          ))}
        </div>
        <div style={{flex:1,padding:16}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
            {[["今日訊息","1,247","↑ 18%","#16a34a"],["本月費用","NT$2,840","預算剩 64%","#2563eb"],["Tool 呼叫","18,247","本月累計","#6b7280"],["待審核","3 則","需要處理","#d97706"]].map(([l,v,s,c])=>(
              <div key={String(l)} style={{background:"#f9fafb",borderRadius:12,padding:12}}>
                <div style={{fontSize:9,color:"#9ca3af",marginBottom:4}}>{l}</div>
                <div style={{fontSize:18,fontWeight:700,lineHeight:1}}>{v}</div>
                <div style={{fontSize:9,color:String(c),marginTop:4}}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <div style={{fontSize:9,fontWeight:600,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Agent 狀態</div>
              {agents.map(a=>(
                <div key={a.name} style={{display:"flex",alignItems:"center",gap:10,background:"#f9fafb",borderRadius:10,padding:"8px 10px",marginBottom:6}}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:a.color,color:a.tcolor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,flexShrink:0}}>
                    {a.initials}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:10,fontWeight:600,marginBottom:1}}>{a.name}</div>
                    <div style={{fontSize:9,color:"#9ca3af"}}>{a.channel} · {a.msgs} 則</div>
                  </div>
                  <span style={{fontSize:8,padding:"2px 6px",borderRadius:20,fontWeight:500,background:a.status==="啟用"?"#d1fae5":"#f3f4f6",color:a.status==="啟用"?"#065f46":"#6b7280"}}>
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
            <div>
              <div style={{fontSize:9,fontWeight:600,color:"#9ca3af",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>即時 Log</div>
              {logs.map((log,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,background:"#f9fafb",borderRadius:10,padding:"7px 10px",marginBottom:6}}>
                  <span style={{fontSize:8,padding:"2px 5px",borderRadius:4,fontWeight:600,background:logColor[log.type].bg,color:logColor[log.type].text,flexShrink:0,marginTop:1}}>
                    {log.type}
                  </span>
                  <div style={{fontSize:9,color:"#6b7280",lineHeight:1.5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{log.msg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewMockup() {
  return (
    <div style={{background:"#fff",borderRadius:16,border:"1px solid #f0f0f0",padding:16}}>
      <div style={{fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>人工審核佇列</div>
      {[
        { user:"user_882", platform:"LINE", risk:"low",  msg:"我訂單付款後沒收到確認信，這樣算成立嗎？", draft:"您好！訂單付款成功後系統會在 5 分鐘內發送確認信，請先確認垃圾郵件匣。" },
        { user:"user_445", platform:"Telegram", risk:"high", msg:"你們公司詐騙！我要告你們！退款！", draft:"非常抱歉造成您的不便。請您告訴我訂單編號，我立刻協助您處理退款申請。" },
      ].map((item,i)=>(
        <div key={i} style={{border:"1px solid #f0f0f0",borderRadius:12,padding:12,marginBottom:i===0?10:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <span style={{fontSize:9,background:"#dbeafe",color:"#1e40af",padding:"2px 8px",borderRadius:20,fontWeight:600}}>{item.platform}</span>
            <span style={{fontSize:10,color:"#6b7280"}}>{item.user}</span>
            <span style={{marginLeft:"auto",fontSize:9,padding:"2px 8px",borderRadius:20,fontWeight:600,background:item.risk==="high"?"#fee2e2":"#d1fae5",color:item.risk==="high"?"#dc2626":"#065f46"}}>
              {item.risk==="high"?"高風險":"低風險"}
            </span>
          </div>
          <div style={{background:"#f9fafb",borderRadius:8,padding:"6px 8px",marginBottom:6}}>
            <div style={{fontSize:8,color:"#9ca3af",marginBottom:2}}>用戶訊息</div>
            <div style={{fontSize:10,color:"#374151"}}>{item.msg}</div>
          </div>
          <div style={{background:"#eff6ff",borderRadius:8,padding:"6px 8px",marginBottom:8}}>
            <div style={{fontSize:8,color:"#93c5fd",marginBottom:2}}>AI 草稿</div>
            <div style={{fontSize:10,color:"#374151"}}>{item.draft}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            {[["✓ 核准發送","#16a34a","#fff"],["✎ 編輯","#fff","#374151"],["✕ 拒絕","#fff","#dc2626"]].map(([label,bg,color])=>(
              <button key={String(label)} style={{flex:1,background:String(bg),color:String(color),border:`1px solid ${String(bg)==="#fff"?"#e5e7eb":"transparent"}`,borderRadius:8,padding:"5px 0",fontSize:9,fontWeight:600,cursor:"pointer"}}>
                {label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnalyticsMockup() {
  const bars = [65,80,45,90,72,88,55,95,70,85,60,78];
  const max = Math.max(...bars);
  return (
    <div style={{background:"#fff",borderRadius:16,border:"1px solid #f0f0f0",padding:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:1}}>訊息量趨勢（近 12 日）</div>
        <span style={{fontSize:10,color:"#16a34a",fontWeight:600}}>↑ 23% 本月</span>
      </div>
      <div style={{display:"flex",alignItems:"flex-end",gap:4,height:80,marginBottom:8}}>
        {bars.map((h,i)=>(
          <div key={i} style={{flex:1,height:`${h/max*100}%`,borderRadius:"4px 4px 0 0",background:h===max?"#1a56db":"#dbeafe",transition:"height .3s"}}/>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginTop:12}}>
        {[["總訊息","14,832"],["平均回應","1.2s"],["滿意度","94.7%"]].map(([l,v])=>(
          <div key={String(l)} style={{background:"#f9fafb",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
            <div style={{fontSize:15,fontWeight:700}}>{v}</div>
            <div style={{fontSize:9,color:"#9ca3af",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{minHeight:"100vh",background:"#fff",color:"#111",fontFamily:"system-ui, -apple-system, sans-serif"}}>

      {/* Nav */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:50,
        transition:"all .3s",
        background:scrolled?"rgba(255,255,255,0.97)":"transparent",
        backdropFilter:scrolled?"blur(12px)":"none",
        borderBottom:scrolled?"1px solid #f0f0f0":"none",
        boxShadow:scrolled?"0 1px 20px rgba(0,0,0,0.06)":"none",
      }}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <img src="/logo.png" alt="MyWrapper Technologies" style={{height:34,width:"auto",objectFit:"contain"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none"}} />
          <div style={{display:"flex",alignItems:"center",gap:32}}>
            {[["功能","#features"],["示意圖","#demo"],["定價","#pricing"],["FAQ","#faq"]].map(([label,href])=>(
              <a key={String(label)} href={String(href)} style={{fontSize:14,color:"#6b7280",textDecoration:"none",transition:"color .2s"}}
                onMouseEnter={e=>(e.target as HTMLElement).style.color="#111"}
                onMouseLeave={e=>(e.target as HTMLElement).style.color="#6b7280"}>
                {label}
              </a>
            ))}
          </div>
          <Link href="/login" style={{background:"#1a56db",color:"#fff",fontSize:13,padding:"8px 20px",borderRadius:12,fontWeight:500,textDecoration:"none",transition:"background .2s"}}
            onMouseEnter={e=>(e.target as HTMLElement).style.background="#1d4ed8"}
            onMouseLeave={e=>(e.target as HTMLElement).style.background="#1a56db"}>
            登入後台
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{paddingTop:120,paddingBottom:80,paddingLeft:24,paddingRight:24,maxWidth:1120,margin:"0 auto"}}>
        <div style={{textAlign:"center",maxWidth:720,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#eff6ff",color:"#1d4ed8",fontSize:12,padding:"6px 16px",borderRadius:100,border:"1px solid #bfdbfe",marginBottom:24}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:"#3b82f6",display:"inline-block"}}/>
            台灣首選 AI 客服管理平台
          </div>
          <h1 style={{fontSize:52,fontWeight:700,lineHeight:1.1,letterSpacing:-1,marginBottom:20,margin:"0 0 20px"}}>
            AI 客服，<span style={{color:"#1a56db"}}>讓人放心</span>交給你
          </h1>
          <p style={{fontSize:17,color:"#6b7280",lineHeight:1.7,marginBottom:36,maxWidth:580,margin:"0 auto 36px"}}>
            不用碰程式碼。圖形化管理多個客戶的 AI Agent、多通道接入、人工審核、成本監控。把 AI 從工程師工具，變成業務團隊敢用的企業控制台。
          </p>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,flexWrap:"wrap"}}>
            <Link href="/login" style={{background:"#1a56db",color:"#fff",padding:"12px 28px",borderRadius:12,fontSize:15,fontWeight:600,textDecoration:"none",boxShadow:"0 4px 14px rgba(26,86,219,0.3)"}}>
              免費試用 14 天
            </Link>
            <a href="#demo" style={{border:"1px solid #e5e7eb",color:"#374151",padding:"12px 28px",borderRadius:12,fontSize:15,textDecoration:"none",background:"#fff"}}>
              看 Demo →
            </a>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"center",gap:24,marginTop:28}}>
            {["無需信用卡","14 天免費試用","隨時取消","台灣在地支援"].map(t=>(
              <span key={t} style={{fontSize:13,color:"#9ca3af",display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:"#16a34a"}}>✓</span>{t}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginTop:64}}>
          {stats.map(s=>(
            <div key={s.value} style={{textAlign:"center",padding:"20px 16px",background:"#f9fafb",borderRadius:20,border:"1px solid #f0f0f0"}}>
              <div style={{fontSize:40,fontWeight:800,color:"#1a56db",lineHeight:1}}>{s.value}</div>
              <div style={{fontSize:14,fontWeight:600,marginTop:6}}>{s.label}</div>
              <div style={{fontSize:11,color:"#9ca3af",marginTop:4,lineHeight:1.5}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Demo */}
      <section id="demo" style={{padding:"80px 24px",background:"linear-gradient(to bottom, #f9fafb, #fff)"}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:48}}>
            <h2 style={{fontSize:36,fontWeight:700,marginBottom:12}}>一個後台，掌控全局</h2>
            <p style={{fontSize:15,color:"#6b7280",maxWidth:480,margin:"0 auto"}}>
              從訊息量、費用、Agent 狀態到即時 Log，所有資訊都在同一個畫面。
            </p>
          </div>
          <DashboardMockup />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginTop:24}}>
            <div>
              <h3 style={{fontSize:18,fontWeight:600,marginBottom:6}}>人工審核介面</h3>
              <p style={{fontSize:13,color:"#6b7280",marginBottom:16}}>AI 草稿 → 人工確認 → 一鍵發送，高風險訊息自動標記。</p>
              <ReviewMockup />
            </div>
            <div>
              <h3 style={{fontSize:18,fontWeight:600,marginBottom:6}}>數據分析報表</h3>
              <p style={{fontSize:13,color:"#6b7280",marginBottom:16}}>訊息量趨勢、回應時間、滿意度，一鍵匯出客戶月報。</p>
              <AnalyticsMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{padding:"80px 24px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:56}}>
          <h2 style={{fontSize:36,fontWeight:700,marginBottom:12}}>為什麼選擇 MyWrapper？</h2>
          <p style={{fontSize:15,color:"#6b7280",maxWidth:480,margin:"0 auto"}}>
            每個功能都是針對真實業務痛點設計，不是為了功能而功能。
          </p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {features.map(f=>(
            <div key={f.title} style={{padding:24,borderRadius:20,border:"1px solid #f0f0f0",background:"#fff",transition:"all .2s",cursor:"default"}}
              onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="#bfdbfe";(e.currentTarget as HTMLDivElement).style.background="#eff6ff"}}
              onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor="#f0f0f0";(e.currentTarget as HTMLDivElement).style.background="#fff"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:16}}>
                <div style={{fontSize:28,flexShrink:0}}>{f.icon}</div>
                <div style={{flex:1}}>
                  <h3 style={{fontSize:15,fontWeight:700,marginBottom:10}}>{f.title}</h3>
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#ef4444",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>業務痛點</div>
                    <p style={{fontSize:12,color:"#6b7280",lineHeight:1.6}}>{f.pain}</p>
                  </div>
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#1a56db",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>MyWrapper 的解法</div>
                    <p style={{fontSize:12,color:"#374151",lineHeight:1.6}}>{f.solution}</p>
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {f.tags.map(tag=>(
                      <span key={tag} style={{fontSize:10,background:"#f3f4f6",color:"#6b7280",padding:"2px 8px",borderRadius:100}}>{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{padding:"80px 24px",background:"#f9fafb"}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <div style={{textAlign:"center",marginBottom:56}}>
            <h2 style={{fontSize:36,fontWeight:700,marginBottom:12}}>上線只需要 4 個步驟</h2>
            <p style={{fontSize:15,color:"#6b7280"}}>Done-for-You 方案由我們全程協助，你只需要提供業務資訊。</p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
            {[
              {step:"01",title:"建立 Workspace",desc:"為每個客戶建立獨立工作空間，設定品牌名稱、方案、成員權限。",time:"5 分鐘"},
              {step:"02",title:"設定 Agent",desc:"定義 AI 角色、System Prompt、工具，上傳知識庫文件。",time:"30 分鐘"},
              {step:"03",title:"串接通道",desc:"把 LINE OA、Telegram Bot 等平台的 Webhook 指向 MyWrapper。",time:"15 分鐘"},
              {step:"04",title:"上線監控",desc:"設定告警、審核流程、費用預算，開始接收真實訊息。",time:"隨時"},
            ].map(s=>(
              <div key={s.step} style={{background:"#fff",borderRadius:20,border:"1px solid #f0f0f0",padding:24}}>
                <div style={{fontSize:36,fontWeight:800,color:"#e5e7eb",marginBottom:16}}>{s.step}</div>
                <h3 style={{fontSize:15,fontWeight:700,marginBottom:8}}>{s.title}</h3>
                <p style={{fontSize:12,color:"#6b7280",lineHeight:1.6,marginBottom:16}}>{s.desc}</p>
                <span style={{fontSize:11,background:"#eff6ff",color:"#1a56db",padding:"4px 12px",borderRadius:100,fontWeight:600}}>{s.time}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{padding:"80px 24px",maxWidth:1120,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:56}}>
          <h2 style={{fontSize:36,fontWeight:700,marginBottom:12}}>清楚定價，按需選擇</h2>
          <p style={{fontSize:15,color:"#6b7280"}}>所有方案均提供 14 天免費試用，隨時可升級，不綁約</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20,marginBottom:20}}>
          {plans.map(plan=>(
            <div key={plan.name} style={{
              borderRadius:20,border:`1px solid ${plan.highlight?"#93c5fd":"#f0f0f0"}`,
              padding:28,position:"relative",display:"flex",flexDirection:"column",
              background:plan.highlight?"#f0f7ff":"#fff",
              boxShadow:plan.highlight?"0 8px 30px rgba(26,86,219,0.12)":"none",
            }}>
              {"badge" in plan && plan.badge && (
                <div style={{position:"absolute",top:-14,left:"50%",transform:"translateX(-50%)",background:"#1a56db",color:"#fff",fontSize:11,fontWeight:700,padding:"4px 16px",borderRadius:100,whiteSpace:"nowrap"}}>
                  {plan.badge}
                </div>
              )}
              <div style={{marginBottom:24}}>
                <div style={{fontSize:16,fontWeight:700}}>{plan.name}</div>
                <div style={{fontSize:12,color:"#9ca3af",marginTop:2,marginBottom:16}}>{plan.desc}</div>
                <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                  <span style={{fontSize:36,fontWeight:800}}>{plan.price}</span>
                  <span style={{fontSize:14,color:"#9ca3af"}}>{plan.period}</span>
                </div>
              </div>
              <ul style={{listStyle:"none",padding:0,margin:"0 0 24px",flex:1}}>
                {plan.items.map(item=>(
                  <li key={item} style={{display:"flex",alignItems:"flex-start",gap:10,fontSize:13,color:"#374151",marginBottom:10}}>
                    <span style={{color:"#1a56db",flexShrink:0,marginTop:1}}>✓</span>{item}
                  </li>
                ))}
              </ul>
              <Link href="/login" style={{
                display:"block",textAlign:"center",padding:"12px 0",borderRadius:12,fontSize:14,fontWeight:600,textDecoration:"none",
                background:plan.highlight?"#1a56db":"transparent",
                color:plan.highlight?"#fff":"#374151",
                border:plan.highlight?"none":"1px solid #e5e7eb",
              }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
        <div style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",borderRadius:20,padding:32,display:"flex",alignItems:"center",justifyContent:"space-between",gap:24,color:"#fff"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:22}}>🚀</span>
              <span style={{fontSize:18,fontWeight:700}}>Done-for-You 導入版</span>
            </div>
            <p style={{fontSize:13,color:"#94a3b8",maxWidth:500,lineHeight:1.6}}>
              安裝部署、初始設定、Prompt 建置、Channel 串接、教育訓練、上線後 1 個月支援，一次搞定。適合沒有技術團隊的企業。
            </p>
          </div>
          <div style={{textAlign:"center",flexShrink:0}}>
            <div style={{fontSize:26,fontWeight:800,marginBottom:4}}>NT$15,000 起</div>
            <div style={{fontSize:11,color:"#64748b",marginBottom:16}}>一次性導入費 + 月維護費</div>
            <Link href="mailto:contact@mywrapper.ai" style={{display:"inline-block",background:"#fff",color:"#1e293b",fontWeight:700,padding:"10px 24px",borderRadius:12,fontSize:13,textDecoration:"none"}}>
              立即詢問
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{padding:"80px 24px",background:"#f9fafb"}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <h2 style={{fontSize:36,fontWeight:700,textAlign:"center",marginBottom:48}}>常見問題</h2>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {faqs.map(f=>(
              <details key={f.q} style={{background:"#fff",border:"1px solid #f0f0f0",borderRadius:16,overflow:"hidden"}}>
                <summary style={{padding:"16px 24px",fontSize:14,fontWeight:600,cursor:"pointer",listStyle:"none",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  {f.q}
                  <span style={{color:"#9ca3af",fontSize:11}}>▼</span>
                </summary>
                <p style={{padding:"0 24px 20px",fontSize:13,color:"#6b7280",lineHeight:1.7,margin:0}}>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{padding:"80px 24px"}}>
        <div style={{maxWidth:720,margin:"0 auto",textAlign:"center",background:"linear-gradient(135deg,#1a56db,#1e40af)",borderRadius:28,padding:64,color:"#fff"}}>
          <h2 style={{fontSize:34,fontWeight:700,marginBottom:12}}>準備好讓 AI 開始工作了嗎？</h2>
          <p style={{fontSize:15,color:"#bfdbfe",marginBottom:32,lineHeight:1.7}}>
            14 天免費試用，不需信用卡。<br/>或聯絡我們安排一對一 Demo，了解如何適配你的業務。
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <Link href="/login" style={{background:"#fff",color:"#1a56db",fontWeight:700,padding:"12px 28px",borderRadius:14,fontSize:15,textDecoration:"none",boxShadow:"0 4px 14px rgba(0,0,0,0.15)"}}>
              免費試用 14 天
            </Link>
            <Link href="mailto:contact@mywrapper.ai" style={{border:"1px solid rgba(255,255,255,0.4)",color:"#fff",padding:"12px 28px",borderRadius:14,fontSize:15,textDecoration:"none",fontWeight:500}}>
              預約 Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{borderTop:"1px solid #f0f0f0",padding:"32px 24px"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <img src="/logo.png" alt="MyWrapper" style={{height:28,width:"auto",objectFit:"contain"}} onError={(e)=>{(e.target as HTMLImageElement).style.display="none"}} />
          <p style={{fontSize:12,color:"#9ca3af"}}>© 2026 MyWrapper Technologies · Powered by Claude AI</p>
          <div style={{display:"flex",gap:24}}>
            <Link href="/login" style={{fontSize:12,color:"#9ca3af",textDecoration:"none"}}>後台登入</Link>
            <Link href="mailto:contact@mywrapper.ai" style={{fontSize:12,color:"#9ca3af",textDecoration:"none"}}>聯絡我們</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
