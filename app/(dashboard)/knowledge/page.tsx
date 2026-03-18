"use client";
import { useState, useCallback } from "react";
import { useApi } from "@/lib/use-api";
import { Card, CardTitle, Btn } from "@/components/ui";

interface KB {
  id:string; name:string; description:string|null;
  docCount:number; chunkCount:number; createdAt:string;
  _count?:{documents:number};
}
interface KBDoc {
  id:string; title:string; type:string; status:string;
  wordCount:number; processedAt:string|null; createdAt:string;
  _count:{chunks:number};
}
interface SearchResult { content:string; score:number; docTitle:string; }

const STATUS_COLOR:Record<string,string> = {
  PENDING:"bg-gray-100 text-gray-500", PROCESSING:"bg-amber-50 text-amber-600",
  READY:"bg-green-50 text-green-700",  FAILED:"bg-red-50 text-red-600",
};
const STATUS_LABEL:Record<string,string> = {
  PENDING:"待處理", PROCESSING:"處理中", READY:"就緒", FAILED:"失敗",
};

const BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const WS_ID = "ws-a";
function tok() { return typeof window !== "undefined" ? localStorage.getItem("oc_token") ?? "" : ""; }
async function apiFetch(path:string, method="GET", body?:object) {
  const r = await fetch(`${BASE}${path}`, {
    method, headers:{"Content-Type":"application/json",Authorization:`Bearer ${tok()}`},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text());
  if (r.status===204) return null;
  return r.json();
}

export default function KnowledgePage() {
  const [selectedKB, setSelectedKB]  = useState<KB|null>(null);
  const [view,       setView]         = useState<"kbs"|"docs"|"search">("kbs");
  const [newKBName,  setNewKBName]    = useState("");
  const [newKBDesc,  setNewKBDesc]    = useState("");
  const [docTitle,   setDocTitle]     = useState("");
  const [docType,    setDocType]      = useState("TEXT");
  const [docContent, setDocContent]   = useState("");
  const [searchQ,    setSearchQ]      = useState("");
  const [searchRes,  setSearchRes]    = useState<SearchResult[]|null>(null);
  const [searching,  setSearching]    = useState(false);
  const [saving,     setSaving]       = useState(false);
  const [msg,        setMsg]          = useState<{ok:boolean;text:string}|null>(null);

  const fetchKBs  = useCallback(() => apiFetch(`/api/knowledge?workspaceId=${WS_ID}`), []);
  const fetchDocs = useCallback(() =>
    selectedKB ? apiFetch(`/api/knowledge/${selectedKB.id}/documents`) : Promise.resolve([]),
  [selectedKB?.id]);

  const {data:kbs,  loading:kbLoading,  refetch:refetchKBs}  = useApi<KB[]>(fetchKBs,  []);
  const {data:docs, loading:docLoading, refetch:refetchDocs}  = useApi<KBDoc[]>(fetchDocs, [selectedKB?.id]);

  async function createKB() {
    if (!newKBName.trim()) return;
    setSaving(true);
    try {
      const kb = await apiFetch("/api/knowledge", "POST", {
        workspaceId:WS_ID, name:newKBName, description:newKBDesc||undefined,
      });
      setNewKBName(""); setNewKBDesc("");
      refetchKBs();
      setMsg({ok:true,text:`知識庫「${kb.name}」已建立`});
    } catch(e){setMsg({ok:false,text:(e as Error).message});}
    finally{setSaving(false);}
  }

  async function uploadDoc() {
    if (!selectedKB || !docTitle.trim() || !docContent.trim()) return;
    setSaving(true); setMsg(null);
    try {
      await apiFetch(`/api/knowledge/${selectedKB.id}/documents`, "POST", {
        title:docTitle, type:docType, content:docContent,
      });
      setDocTitle(""); setDocContent("");
      refetchDocs();
      setMsg({ok:true,text:"文件已上傳，正在處理（約 10-30 秒）"});
    } catch(e){setMsg({ok:false,text:(e as Error).message});}
    finally{setSaving(false);}
  }

  async function deleteDoc(docId:string) {
    await apiFetch(`/api/knowledge/documents/${docId}`, "DELETE");
    refetchDocs(); refetchKBs();
  }

  async function reprocess(docId:string) {
    await apiFetch(`/api/knowledge/${selectedKB!.id}/reprocess`, "POST", {docId});
    setTimeout(refetchDocs, 2000);
  }

  async function doSearch() {
    if (!selectedKB || !searchQ.trim()) return;
    setSearching(true); setSearchRes(null);
    try {
      const r = await apiFetch(`/api/knowledge/${selectedKB.id}/search`, "POST", {query:searchQ, topK:5});
      setSearchRes(r.results);
    } catch(e){setMsg({ok:false,text:(e as Error).message});}
    finally{setSearching(false);}
  }

  const DOC_TYPES = ["TEXT","MARKDOWN","FAQ","URL","FILE"];

  return (
    <div className="space-y-4">
      {/* Message */}
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-[13px] border ${msg.ok?"bg-green-50 border-green-100 text-green-700":"bg-red-50 border-red-100 text-red-600"}`}>
          {msg.ok?"✓":"✕"} {msg.text}
          <button onClick={()=>setMsg(null)} className="ml-3 opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {/* KB List */}
        <Card className="overflow-hidden">
          <CardTitle action={<Btn onClick={()=>setView("kbs")} className="text-[11px]">管理</Btn>}>
            知識庫列表
          </CardTitle>

          {view==="kbs" && (
            <div className="space-y-2 mb-3">
              <input value={newKBName} onChange={e=>setNewKBName(e.target.value)}
                placeholder="新知識庫名稱"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-brand-400"/>
              <input value={newKBDesc} onChange={e=>setNewKBDesc(e.target.value)}
                placeholder="描述（選填）"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:border-brand-400"/>
              <Btn variant="primary" onClick={createKB} className="w-full justify-center text-[12px]">
                {saving?"建立中...":"+ 建立知識庫"}
              </Btn>
            </div>
          )}

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {kbLoading ? <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p> :
             !kbs?.length ? <p className="text-[12px] text-gray-400 py-4 text-center">尚無知識庫</p> :
             kbs.map(kb=>(
              <button key={kb.id} onClick={()=>{setSelectedKB(kb);setView("docs");setSearchRes(null);}}
                className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors ${selectedKB?.id===kb.id?"border-brand-400 bg-amber-50":"border-transparent hover:bg-gray-50"}`}>
                <p className="text-[13px] font-medium">{kb.name}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {kb.docCount} 份文件 · {kb.chunkCount} chunks
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Doc manager + Search */}
        <div className="col-span-2 space-y-3">
          {selectedKB ? (
            <>
              {/* Tab bar */}
              <div className="flex gap-1.5">
                {(["docs","search"] as const).map(t=>(
                  <button key={t} onClick={()=>setView(t)}
                    className={`px-4 py-1.5 text-[13px] rounded-lg border transition-colors ${view===t?"bg-white font-medium shadow-sm border-gray-200":"text-gray-500 border-transparent hover:border-gray-200"}`}>
                    {t==="docs"?"📄 文件管理":"🔍 語意搜尋測試"}
                  </button>
                ))}
                <span className="ml-auto text-[12px] text-gray-400 self-center">
                  {selectedKB.name}
                </span>
              </div>

              {view==="docs" && (
                <div className="space-y-3">
                  {/* Upload form */}
                  <Card>
                    <CardTitle>新增文件</CardTitle>
                    <div className="space-y-2.5">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input value={docTitle} onChange={e=>setDocTitle(e.target.value)}
                            placeholder="文件標題（例：退換貨政策）"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:border-brand-400"/>
                        </div>
                        <select value={docType} onChange={e=>setDocType(e.target.value)}
                          className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-[13px]">
                          {DOC_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <textarea value={docContent} onChange={e=>setDocContent(e.target.value)}
                        rows={6} placeholder="貼上文件內容（FAQ、產品說明、規章辦法等）..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[13px] resize-none focus:outline-none focus:border-brand-400"/>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-gray-400">
                          {docContent.length} 字元 · 約 {Math.ceil(docContent.split(/\s+/).length/400)} 個 chunks
                        </p>
                        <Btn variant="primary" onClick={uploadDoc}>
                          {saving?"上傳中...":"上傳並建立索引"}
                        </Btn>
                      </div>
                    </div>
                  </Card>

                  {/* Doc list */}
                  <Card>
                    <CardTitle>{docs?.length??0} 份文件</CardTitle>
                    {docLoading ? <p className="text-[12px] text-gray-400 py-4 text-center">載入中...</p> :
                     !docs?.length ? <p className="text-[12px] text-gray-400 py-4 text-center">尚無文件，請上傳</p> :
                     docs.map(doc=>(
                      <div key={doc.id} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-medium truncate">{doc.title}</p>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLOR[doc.status]}`}>
                              {STATUS_COLOR[doc.status] && STATUS_LABEL[doc.status]}
                              {doc.status==="PROCESSING" && " ⟳"}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {doc.type} · {doc.wordCount} 字 · {doc._count.chunks} chunks
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {doc.status==="FAILED" && (
                            <Btn onClick={()=>reprocess(doc.id)} className="text-[10px]">重試</Btn>
                          )}
                          <Btn onClick={()=>deleteDoc(doc.id)} variant="danger" className="text-[10px]">刪除</Btn>
                        </div>
                      </div>
                    ))}
                  </Card>
                </div>
              )}

              {view==="search" && (
                <Card>
                  <CardTitle>語意搜尋測試</CardTitle>
                  <div className="flex gap-2 mb-4">
                    <input value={searchQ} onChange={e=>setSearchQ(e.target.value)}
                      onKeyDown={e=>e.key==="Enter"&&doSearch()}
                      placeholder="輸入測試查詢（例：退貨流程是什麼？）"
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-[13px] focus:outline-none focus:border-brand-400"/>
                    <Btn variant="primary" onClick={doSearch}>
                      {searching?"搜尋中...":"搜尋"}
                    </Btn>
                  </div>

                  {searchRes !== null && (
                    <div className="space-y-3">
                      {searchRes.length===0 ? (
                        <p className="text-[13px] text-gray-400 text-center py-4">
                          未找到相關結果（相似度低於 0.3）
                        </p>
                      ) : searchRes.map((r,i)=>(
                        <div key={i} className="border border-gray-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[12px] font-medium text-brand-600">#{i+1}</span>
                            <span className="text-[12px] text-gray-600 flex-1 truncate">{r.docTitle}</span>
                            <span className="text-[11px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-medium">
                              {(r.score*100).toFixed(0)}% 相關
                            </span>
                          </div>
                          <p className="text-[12px] text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-4">
                            {r.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              )}
            </>
          ) : (
            <Card>
              <div className="py-16 text-center">
                <p className="text-[36px] mb-3">📚</p>
                <p className="text-[14px] font-medium text-gray-600 mb-2">選擇或建立知識庫</p>
                <p className="text-[13px] text-gray-400 leading-relaxed max-w-sm mx-auto">
                  知識庫讓 Agent 可以參考您上傳的文件回答問題，支援 FAQ、產品說明、政策文件等。
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
