"use client";
import { useState, useCallback, useRef } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

// ── Types ─────────────────────────────────────────────────────
interface FlowNode {
  id:    string;
  type:  string;
  label: string;
  x:     number;
  y:     number;
  data:  Record<string,unknown>;
}
interface FlowEdge { from:string; to:string; label?:string; }
interface Flow {
  id:string; name:string; description:string|null;
  trigger:string; status:string;
  nodesJson:FlowNode[]; edgesJson:FlowEdge[];
  _count:{runs:number};
}

// ── Node palette ──────────────────────────────────────────────
const NODE_TYPES: Record<string,{ label:string; color:string; icon:string; desc:string }> = {
  START:        { label:"開始",     color:"#22c55e", icon:"▶",  desc:"流程進入點" },
  MESSAGE:      { label:"發送訊息", color:"#3b82f6", icon:"💬", desc:"發送固定文字" },
  CONDITION:    { label:"條件分支", color:"#f59e0b", icon:"⟨?⟩",desc:"根據條件走不同路" },
  API_CALL:     { label:"API 呼叫", color:"#8b5cf6", icon:"🌐", desc:"呼叫外部 API" },
  SET_VARIABLE: { label:"設定變數", color:"#06b6d4", icon:"📌", desc:"儲存值到流程變數" },
  AGENT_INVOKE: { label:"呼叫 AI",  color:"#BA7517", icon:"🤖", desc:"讓 Agent 回覆用戶" },
  HANDOFF:      { label:"人工交接", color:"#ef4444", icon:"🙋", desc:"轉交給人工客服" },
  END:          { label:"結束",     color:"#6b7280", icon:"⏹",  desc:"流程結束" },
};

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path:string, method="GET", body?:object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers:{"Content-Type":"application/json", Authorization:`Bearer ${tok()}`},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  if (r.status===204) return null;
  return r.json();
}

let nodeCounter = 10;
function newId() { return `node-${++nodeCounter}`; }

export default function FlowsPage() {
  const [selectedFlow, setSelectedFlow] = useState<Flow|null>(null);
  const [nodes,        setNodes]        = useState<FlowNode[]>([]);
  const [edges,        setEdges]        = useState<FlowEdge[]>([]);
  const [selected,     setSelected]     = useState<FlowNode|null>(null);
  const [connecting,   setConnecting]   = useState<string|null>(null);
  const [dragging,     setDragging]     = useState<{id:string;ox:number;oy:number}|null>(null);
  const [testMsg,      setTestMsg]      = useState("");
  const [testResult,   setTestResult]   = useState<{reply:string;done:boolean}|null>(null);
  const [testing,      setTesting]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [mode,         setMode]         = useState<"list"|"edit">("list");
  const canvasRef = useRef<SVGSVGElement>(null);

  const fetchFn = useCallback(() => apiFetch(`/api/flows?workspaceId=${WS_ID}`), []);
  const { data:flows, loading, refetch } = useApi<Flow[]>(fetchFn, []);

  // ── Load flow into editor ─────────────────────────────────
  function openFlow(flow: Flow) {
    setSelectedFlow(flow);
    setNodes(flow.nodesJson.length ? flow.nodesJson : [
      { id:"start", type:"START", label:"開始", x:80, y:200, data:{} },
      { id:"end",   type:"END",   label:"結束", x:500,y:200, data:{} },
    ]);
    setEdges(flow.edgesJson);
    setSelected(null);
    setMode("edit");
  }

  // ── Canvas mouse events ───────────────────────────────────
  function onCanvasClick(e: React.MouseEvent<SVGSVGElement>) {
    if (e.target === canvasRef.current) {
      setSelected(null);
      if (connecting) setConnecting(null);
    }
  }
  function onNodeClick(node: FlowNode, e: React.MouseEvent) {
    e.stopPropagation();
    if (connecting && connecting !== node.id) {
      setEdges(prev => [...prev.filter(e2 => e2.from !== connecting || e2.to !== node.id),
                        { from: connecting, to: node.id }]);
      setConnecting(null);
    } else {
      setSelected(node);
    }
  }
  function onNodeMouseDown(node: FlowNode, e: React.MouseEvent) {
    e.stopPropagation();
    const svg = canvasRef.current!;
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    setDragging({ id: node.id, ox: local.x - node.x, oy: local.y - node.y });
  }
  function onMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!dragging) return;
    const svg = canvasRef.current!;
    const pt  = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    setNodes(prev => prev.map(n => n.id === dragging.id
      ? { ...n, x: local.x - dragging.ox, y: local.y - dragging.oy } : n));
  }
  function onMouseUp() { setDragging(null); }

  // ── Add node ──────────────────────────────────────────────
  function addNode(type: string) {
    const id = newId();
    const info = NODE_TYPES[type];
    const newNode: FlowNode = {
      id, type, label: info.label,
      x: 80 + Math.random() * 200,
      y: 80 + Math.random() * 200,
      data: {},
    };
    setNodes(prev => [...prev, newNode]);
    setSelected(newNode);
  }

  function deleteSelected() {
    if (!selected) return;
    setNodes(prev => prev.filter(n => n.id !== selected.id));
    setEdges(prev => prev.filter(e => e.from !== selected.id && e.to !== selected.id));
    setSelected(null);
  }

  function updateNodeData(key: string, val: string) {
    if (!selected) return;
    const updated = { ...selected, data: { ...selected.data, [key]: val } };
    setSelected(updated);
    setNodes(prev => prev.map(n => n.id === selected.id ? updated : n));
  }

  // ── Save ──────────────────────────────────────────────────
  async function save() {
    if (!selectedFlow) return;
    setSaving(true);
    try {
      await apiFetch(`/api/flows/${selectedFlow.id}`, "PATCH", {
        nodesJson: nodes, edgesJson: edges,
      });
      refetch();
    } finally { setSaving(false); }
  }

  // ── Test run ──────────────────────────────────────────────
  async function runTest() {
    if (!selectedFlow) return;
    setTesting(true); setTestResult(null);
    // Auto-save first
    await apiFetch(`/api/flows/${selectedFlow.id}`, "PATCH", { nodesJson:nodes, edgesJson:edges });
    try {
      const r = await apiFetch(`/api/flows/${selectedFlow.id}/run`, "POST", {
        workspaceId: WS_ID, message: testMsg, platform: "PLAYGROUND",
      });
      setTestResult(r);
    } finally { setTesting(false); }
  }

  async function createFlow() {
    const name = prompt("流程名稱：");
    if (!name) return;
    const flow = await apiFetch("/api/flows", "POST", {
      workspaceId: WS_ID, name,
      nodesJson: [
        { id:"start", type:"START", label:"開始", x:80, y:160, data:{} },
        { id:"msg1",  type:"MESSAGE", label:"歡迎訊息", x:280, y:160, data:{ text:"您好！請問有什麼可以幫您？" } },
        { id:"agent1",type:"AGENT_INVOKE", label:"AI 回覆", x:480, y:160, data:{ agentId:"" } },
        { id:"end",   type:"END",  label:"結束", x:680, y:160, data:{} },
      ],
      edgesJson: [
        { from:"start", to:"msg1" },
        { from:"msg1",  to:"agent1" },
        { from:"agent1",to:"end" },
      ],
    });
    refetch();
    openFlow(flow);
  }

  // ── Node inspector fields ─────────────────────────────────
  const inspectorFields: Record<string, {key:string;label:string;type?:string}[]> = {
    MESSAGE:      [{ key:"text",       label:"訊息內容（支援 {{變數}}）" }],
    CONDITION:    [
      { key:"variable",  label:"變數名稱" },
      { key:"operator",  label:"運算子（equals/contains/not_empty）" },
      { key:"value",     label:"比較值" },
    ],
    SET_VARIABLE: [{ key:"key", label:"變數名稱" }, { key:"value", label:"值" }],
    API_CALL:     [
      { key:"url",       label:"URL" },
      { key:"method",    label:"方法（GET/POST）" },
      { key:"resultVar", label:"儲存結果到變數" },
    ],
    AGENT_INVOKE: [{ key:"agentId", label:"Agent ID" }],
    HANDOFF:      [
      { key:"reason",   label:"原因（USER_REQUEST/HIGH_RISK）" },
      { key:"message",  label:"交接訊息" },
      { key:"priority", label:"優先級（1-10）" },
    ],
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={()=>setMode("list")}
          className={`px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${mode==="list"?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent"}`}>
          流程列表
        </button>
        {mode==="edit" && selectedFlow && (
          <>
            <span className="text-gray-300">›</span>
            <span className="text-[13px] font-medium">{selectedFlow.name}</span>
          </>
        )}
        <div className="ml-auto flex gap-1.5">
          {mode==="list" && <Btn variant="primary" onClick={createFlow}>+ 建立流程</Btn>}
          {mode==="edit" && (
            <>
              <Btn onClick={save}>{saving?"儲存中...":"儲存"}</Btn>
              <Btn variant="primary" onClick={runTest}>{testing?"執行中...":"▶ 測試"}</Btn>
            </>
          )}
        </div>
      </div>

      {mode==="list" && (
        <div className="grid grid-cols-3 gap-3">
          {loading ? <p className="text-[12px] text-gray-400 py-8 text-center col-span-3">載入中...</p> :
           !flows?.length ? (
            <div className="col-span-3 bg-white border border-gray-100 rounded-2xl py-16 text-center">
              <p className="text-[32px] mb-3">🔀</p>
              <p className="text-[14px] font-medium text-gray-600 mb-1">尚無對話流程</p>
              <p className="text-[13px] text-gray-400 mb-4">建立視覺化流程，控制 Agent 的對話邏輯</p>
              <Btn variant="primary" onClick={createFlow}>建立第一個流程</Btn>
            </div>
           ) : flows.map(flow => {
            const statusColor = flow.status==="ACTIVE"?"bg-green-50 text-green-700":"bg-gray-100 text-gray-500";
            return (
              <div key={flow.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 cursor-pointer transition-colors"
                onClick={()=>openFlow(flow)}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-[14px] font-medium">{flow.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
                    {flow.status==="ACTIVE"?"啟用":"草稿"}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 mb-3">{flow.description??"—"}</p>
                <div className="flex items-center gap-3 text-[11px] text-gray-400">
                  <span>觸發：{flow.trigger}</span>
                  <span>{flow._count.runs} 次執行</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {mode==="edit" && (
        <div className="flex gap-3 flex-1 min-h-0">
          {/* Node palette */}
          <div className="w-40 shrink-0 space-y-1 overflow-y-auto">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1 mb-2">節點類型</p>
            {Object.entries(NODE_TYPES).map(([type, info]) => (
              <button key={type} onClick={()=>addNode(type)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg hover:border-gray-200 text-left transition-colors">
                <span className="text-[14px]">{info.icon}</span>
                <span className="text-[12px]">{info.label}</span>
              </button>
            ))}
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-gray-50 rounded-xl border border-gray-100 overflow-hidden relative">
            <svg ref={canvasRef} width="100%" height="100%"
              className="cursor-default"
              onClick={onCanvasClick}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}>

              {/* Grid dots */}
              <defs>
                <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="#d1d5db"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)"/>

              {/* Edges */}
              {edges.map((edge, i) => {
                const from = nodes.find(n=>n.id===edge.from);
                const to   = nodes.find(n=>n.id===edge.to);
                if (!from || !to) return null;
                const fx=from.x+70, fy=from.y+20;
                const tx=to.x,      ty=to.y+20;
                const mx=(fx+tx)/2;
                return (
                  <g key={i}>
                    <path d={`M${fx},${fy} C${mx},${fy} ${mx},${ty} ${tx},${ty}`}
                      stroke="#94a3b8" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)"/>
                    {edge.label && (
                      <text x={mx} y={(fy+ty)/2-6} textAnchor="middle"
                        fontSize="10" fill="#64748b">{edge.label}</text>
                    )}
                  </g>
                );
              })}

              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L9,3 z" fill="#94a3b8"/>
                </marker>
              </defs>

              {/* Nodes */}
              {nodes.map(node => {
                const info = NODE_TYPES[node.type] ?? { color:"#94a3b8", icon:"●", label:node.type };
                const isSelected = selected?.id === node.id;
                const isConnecting = connecting === node.id;
                return (
                  <g key={node.id}
                    transform={`translate(${node.x},${node.y})`}
                    onClick={e=>onNodeClick(node,e)}
                    onMouseDown={e=>onNodeMouseDown(node,e)}
                    style={{ cursor: dragging?.id===node.id ? "grabbing" : "grab" }}>
                    <rect width="140" height="40" rx="8"
                      fill="white"
                      stroke={isSelected ? info.color : isConnecting ? "#10b981" : "#e2e8f0"}
                      strokeWidth={isSelected ? 2 : 1}/>
                    <rect width="6" height="40" rx="3"
                      fill={info.color} clipPath={`inset(0 0 0 0 round 8px 0 0 8px)`}/>
                    <text x="18" y="15" fontSize="12">{info.icon}</text>
                    <text x="32" y="25" fontSize="12" fill="#374151" fontWeight="500"
                      style={{userSelect:"none"}}>{node.label}</text>

                    {/* Connect button */}
                    <circle cx="140" cy="20" r="6"
                      fill={connecting===node.id?"#10b981":"#94a3b8"}
                      onClick={e=>{e.stopPropagation();setConnecting(node.id===connecting?null:node.id);}}
                      style={{cursor:"pointer"}}/>
                  </g>
                );
              })}
            </svg>

            {/* Canvas hint */}
            <div className="absolute bottom-3 right-3 text-[10px] text-gray-400 bg-white/80 px-2 py-1 rounded-lg">
              點擊節點右側 ● 連接 | 拖曳移動節點
            </div>
          </div>

          {/* Inspector + Test */}
          <div className="w-56 shrink-0 space-y-3 overflow-y-auto">
            {/* Node inspector */}
            {selected ? (
              <Card className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[12px] font-medium">{NODE_TYPES[selected.type]?.label ?? selected.type}</p>
                  <button onClick={deleteSelected} className="text-[11px] text-red-400 hover:text-red-600">刪除</button>
                </div>
                {(inspectorFields[selected.type]??[]).map(f=>(
                  <div key={f.key} className="mb-2">
                    <label className="text-[10px] text-gray-400 block mb-1">{f.label}</label>
                    <input value={String(selected.data[f.key]??"")}
                      onChange={e=>updateNodeData(f.key, e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[12px] focus:outline-none focus:border-brand-400"/>
                  </div>
                ))}
                {!inspectorFields[selected.type]?.length && (
                  <p className="text-[11px] text-gray-400">此節點無需設定</p>
                )}
                <div className="mt-3 pt-3 border-t border-gray-50">
                  <p className="text-[10px] text-gray-400 mb-1">連接來源：{edges.filter(e=>e.to===selected.id).length} 條</p>
                  <p className="text-[10px] text-gray-400">連接去向：{edges.filter(e=>e.from===selected.id).length} 條</p>
                </div>
              </Card>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
                <p className="text-[11px] text-gray-400">點選節點查看設定</p>
              </div>
            )}

            {/* Test panel */}
            <Card className="p-3">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-2">測試流程</p>
              <textarea value={testMsg} onChange={e=>setTestMsg(e.target.value)}
                rows={2} placeholder="輸入測試訊息..."
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] resize-none focus:outline-none focus:border-brand-400 mb-2"/>
              <Btn onClick={runTest} className="w-full justify-center text-[11px]">
                {testing?"執行中...":"▶ 執行"}
              </Btn>
              {testResult && (
                <div className={`mt-2 rounded-lg px-2 py-2 text-[11px] ${testResult.done?"bg-green-50 text-green-700":"bg-blue-50 text-blue-700"}`}>
                  <p className="font-medium mb-1">{testResult.done?"✓ 流程完成":"⟳ 等待輸入"}</p>
                  <p className="whitespace-pre-wrap">{testResult.reply}</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
