"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Btn } from "@/components/ui";

interface CheckItem {
  id:       string;
  title:    string;
  desc:     string;
  href?:    string;
  done:     boolean;
  required: boolean;
}

const INITIAL_STEPS: CheckItem[] = [
  { id:"ws",       title:"建立 Workspace",                 desc:"設定客戶名稱、方案、Gateway URL",             href:"/workspaces",       done:true,  required:true  },
  { id:"secrets",  title:"設定 Anthropic API Key",          desc:"在 Security → Secrets 新增 ANTHROPIC_API_KEY", href:"/security",         done:false, required:true  },
  { id:"agent",    title:"建立第一個 Agent",                desc:"設定名稱、角色、System Prompt",                href:"/agents",           done:false, required:true  },
  { id:"channel",  title:"連接通道（LINE / Telegram）",     desc:"在 Channels 新增通道並綁定 Agent",             href:"/channels",         done:false, required:true  },
  { id:"gateway",  title:"驗證並推送 Gateway Config",       desc:"在 Gateway 頁面確認設定並推送",                href:"/gateway",          done:false, required:true  },
  { id:"security", title:"修正安全稽核問題",                desc:"Security 頁面確保無 FAIL 項目",                href:"/security",         done:false, required:true  },
  { id:"test",     title:"傳送測試訊息",                    desc:"直接傳訊給 Bot 確認自動回覆正常",               done:false,               required:true  },
  { id:"template", title:"設定客製化 Prompt 模板",          desc:"模板中心建立業務專屬回覆模板",                  href:"/templates",        done:false, required:false },
  { id:"review",   title:"啟用人工審核流程",                desc:"高風險工具設定 requireApproval",                href:"/tools",            done:false, required:false },
  { id:"alert",    title:"設定告警規則",                    desc:"建立至少一條 Error 告警通知",                   href:"/alerts",           done:false, required:false },
  { id:"usage",    title:"確認 Usage 儀表板正常",           desc:"Usage 頁面確認有資料",                         href:"/usage",            done:false, required:false },
  { id:"backup",   title:"執行首次備份",                    desc:"Workspaces 頁面點擊備份",                      href:"/workspaces",       done:false, required:false },
];

export default function OnboardingPage() {
  const [items,  setItems]  = useState<CheckItem[]>(INITIAL_STEPS);
  const [wsName, setWsName] = useState("客戶 A — 電商客服");
  const router = useRouter();

  const required  = items.filter(i => i.required);
  const optional  = items.filter(i => !i.required);
  const doneCount = items.filter(i => i.done).length;
  const reqDone   = required.filter(i => i.done).length;
  const pct       = Math.round((doneCount / items.length) * 100);

  function toggle(id: string) {
    setItems(p => p.map(i => i.id === id ? { ...i, done: !i.done } : i));
  }

  function goTo(item: CheckItem) {
    toggle(item.id);
    if (item.href) router.push(item.href);
  }

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-[16px] font-medium">導入清單</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">{wsName}</p>
          </div>
          <div className="text-right">
            <p className="text-[28px] font-medium text-brand-600">{pct}%</p>
            <p className="text-[11px] text-gray-400">{doneCount}/{items.length} 完成</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-brand-400 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }} />
        </div>

        {reqDone === required.length && (
          <div className="mt-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5 flex items-center gap-2">
            <span className="text-green-500 text-[16px]">🎉</span>
            <div>
              <p className="text-[13px] font-medium text-green-700">必要步驟已全部完成！</p>
              <p className="text-[12px] text-green-600">Workspace 已可正式上線，繼續完成選填項目以提升體驗。</p>
            </div>
          </div>
        )}
      </div>

      {/* Required steps */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-medium">必要步驟 <span className="text-gray-400 font-normal">({reqDone}/{required.length})</span></h3>
          <span className="text-[11px] text-red-500 font-medium">上線前必須完成</span>
        </div>
        <div className="space-y-0">
          {required.map((item, idx) => (
            <CheckRow key={item.id} item={item} idx={idx} onToggle={toggle} onGo={goTo} />
          ))}
        </div>
      </Card>

      {/* Optional steps */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-medium">建議步驟 <span className="text-gray-400 font-normal">({optional.filter(i=>i.done).length}/{optional.length})</span></h3>
          <span className="text-[11px] text-gray-400">選填，提升服務品質</span>
        </div>
        <div className="space-y-0">
          {optional.map((item, idx) => (
            <CheckRow key={item.id} item={item} idx={idx + required.length} onToggle={toggle} onGo={goTo} />
          ))}
        </div>
      </Card>

      {/* Quick actions */}
      <Card>
        <h3 className="text-[13px] font-medium mb-3">快速操作</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label:"複製此 Workspace 到新客戶",  icon:"📋", href:"/workspaces" },
            { label:"匯出設定備份",                icon:"💾", href:"/workspaces" },
            { label:"邀請協作成員",                icon:"👥", href:"/permissions" },
            { label:"預覽 Gateway Config",         icon:"⚙️", href:"/gateway" },
          ].map(a => (
            <button key={a.label} onClick={() => router.push(a.href)}
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
              <span className="text-[16px]">{a.icon}</span>
              <span className="text-[12px] text-gray-700">{a.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function CheckRow({ item, idx, onToggle, onGo }: {
  item: CheckItem; idx: number;
  onToggle: (id: string) => void;
  onGo:     (item: CheckItem) => void;
}) {
  return (
    <div className={`flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 ${item.done ? "opacity-60" : ""}`}>
      <button onClick={() => onToggle(item.id)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
          item.done ? "bg-green-500 border-green-500 text-white" : "border-gray-300 hover:border-brand-400"
        }`}>
        {item.done && <span className="text-[10px]">✓</span>}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-[13px] font-medium ${item.done ? "line-through text-gray-400" : ""}`}>
          <span className="text-gray-300 mr-1.5 text-[11px]">{idx + 1}.</span>
          {item.title}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
      </div>
      {item.href && !item.done && (
        <Btn onClick={() => onGo(item)} className="shrink-0 text-[11px]">前往 →</Btn>
      )}
    </div>
  );
}
