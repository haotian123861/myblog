import { useState, useRef, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "";

type ChatMsgRole = "user" | "assistant" | "system";
interface ChatMsg {
  role: ChatMsgRole;
  content: string;
}

const SYSTEM_PROMPT = "你是一个友善、乐于助人的中文AI助手。请用简洁易懂的中文回答用户的问题，回答要准确、有条理。";

type Tab = "chat" | "translate";

export default function AiChatPage() {
  // ── AI init ──
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState("");

  // ── Tab ──
  const [tab, setTab] = useState<Tab>("chat");

  // ── Chat state ──
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "system", content: SYSTEM_PROMPT },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Translate state ──
  const [transText, setTransText] = useState("");
  const [transResult, setTransResult] = useState("");
  const [transLoading, setTransLoading] = useState(false);
  const [srcLang, setSrcLang] = useState("auto");
  const [tgtLang, setTgtLang] = useState("zh");

  // ── Python backend mode ──
  const [usePyBackend, setUsePyBackend] = useState(false);
  const [pyUrl, setPyUrl] = useState("http://localhost:8080");

  // Check if server AI is configured
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "ping" }],
            stream: false,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "AI 服务不可用");
        }
        setReady(true);
      } catch (e: any) {
        const msg = e?.message || "";
        if (msg.includes("AI_API_KEY")) {
          setInitError("AI 服务未配置，请在 server/.env 中设置 AI_API_KEY");
        } else {
          setInitError("AI 服务初始化失败: " + msg);
        }
      }
    })();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const displayMessages = messages.filter((m) => m.role !== "system");

  // ── Server AI chat (streaming) ──
  const serverChat = async (msgs: ChatMsg[]) => {
    const payload = {
      messages: msgs.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    };
    const resp = await fetch(`${API_BASE}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.error || `HTTP ${resp.status}`);
    }

    const reader = resp.body?.getReader();
    if (!reader) throw new Error("流式响应不可用");

    const decoder = new TextDecoder();
    let buffer = "";
    let acc = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const dataStr = line.slice(6).trim();
        if (dataStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.content) {
            acc += parsed.content;
            setStreamingContent(acc);
          }
        } catch {
          // skip
        }
      }
    }
    return acc;
  };

  // ── Server AI chat (non-streaming) ──
  const serverChatSync = async (msgs: ChatMsg[]) => {
    const payload = {
      messages: msgs.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    };
    const resp = await fetch(`${API_BASE}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => null);
      throw new Error(err?.error || `HTTP ${resp.status}`);
    }
    const data = await resp.json();
    return data.data.text;
  };

  // ── Python backend call ──
  const pyChat = async (msgs: ChatMsg[]) => {
    const payload = {
      messages: msgs.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
    };
    const resp = await fetch(`${pyUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    return data.choices[0].message.content;
  };

  const pyTranslate = async (text: string, src: string, tgt: string) => {
    const resp = await fetch(`${pyUrl}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source_lang: src, target_lang: tgt }),
    });
    if (!resp.ok) throw new Error(await resp.text());
    const data = await resp.json();
    return data.result;
  };

  // ── Handlers ──
  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !ready) return;

    const userMsg: ChatMsg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setStreamingContent("");

    try {
      const allMsgs = [...messages, userMsg];
      const reply = usePyBackend
        ? await pyChat(allMsgs)
        : await serverChat(allMsgs);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      setStreamingContent("");
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，AI 响应出错: " + (e?.message || "未知错误") },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleTranslate = async () => {
    const text = transText.trim();
    if (!text || transLoading || !ready) return;
    setTransLoading(true);
    setTransResult("");
    try {
      const result = usePyBackend
        ? await pyTranslate(text, srcLang, tgtLang)
        : await (async () => {
            const langHint = srcLang !== "auto" ? `从${srcLang} ` : "";
            const prompt = `请${langHint}翻译成${tgtLang}。只返回翻译结果，不要解释：\n${text}`;
            const apiMessages: ChatMsg[] = [{ role: "user", content: prompt }];
            return serverChatSync(apiMessages);
          })();
      setTransResult(result);
    } catch (e: any) {
      setTransResult("翻译出错: " + (e?.message || "未知错误"));
    } finally {
      setTransLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (displayMessages.length === 0) return;
    if (!window.confirm("确定清除所有对话记录吗？")) return;
    setMessages([{ role: "system", content: SYSTEM_PROMPT }]);
    setStreamingContent("");
  };

  // ── Render ──
  return (
    <section className="section bg-color posts-expand slide-down-in">
      <div className="post-list-box post box-shadow-wrapper">
        <div className="article-wrapper bg-color">
          <section className="post-header">
            <h1 className="post-title text-lg">
              <i className="fa fa-robot mr-2" />
              AI 智能
            </h1>
            <div className="post-meta">基于 DeepSeek 的对话与翻译</div>
          </section>

          <div className="post-body" style={{ display: "flex", flexDirection: "column", minHeight: "520px" }}>
            {/* Error state */}
            {initError && (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="text-center max-w-xs">
                  <i className="fa fa-exclamation-triangle text-3xl text-rust-500 mb-3" />
                  <p className="font-serif text-ink-600 text-sm">{initError}</p>
                </div>
              </div>
            )}

            {/* Loading state */}
            {!initError && !ready && (
              <div className="flex-1 flex items-center justify-center py-16">
                <div className="text-center">
                  <i className="fa fa-spinner fa-spin text-2xl text-navy-700 mb-3" />
                  <p className="font-serif text-ink-500 text-sm">正在连接 AI 服务...</p>
                </div>
              </div>
            )}

            {ready && (
              <>
                {/* ── Tab bar ── */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1 bg-ink-50 rounded-lg p-0.5 border border-ink-200/60">
                    <button
                      onClick={() => setTab("chat")}
                      className={`px-4 py-1.5 rounded-md text-sm font-serif transition-all cursor-pointer border-none ${
                        tab === "chat"
                          ? "bg-navy-900 text-ink-50"
                          : "text-ink-500 hover:text-navy-700 bg-transparent"
                      }`}
                    >
                      <i className="fa fa-commenting mr-1.5" />对话
                    </button>
                    <button
                      onClick={() => setTab("translate")}
                      className={`px-4 py-1.5 rounded-md text-sm font-serif transition-all cursor-pointer border-none ${
                        tab === "translate"
                          ? "bg-navy-900 text-ink-50"
                          : "text-ink-500 hover:text-navy-700 bg-transparent"
                      }`}
                    >
                      <i className="fa fa-language mr-1.5" />翻译
                    </button>
                  </div>

                  {/* Backend toggle */}
                  <label className="flex items-center gap-1.5 text-xs text-ink-400 font-serif cursor-pointer select-none">
                    <span className="hidden sm:inline">Python 后端</span>
                    <span className="sm:hidden">Py</span>
                    <input
                      type="checkbox"
                      checked={usePyBackend}
                      onChange={() => setUsePyBackend(!usePyBackend)}
                      className="w-3.5 h-3.5 accent-navy-900 cursor-pointer"
                    />
                  </label>
                </div>

                {usePyBackend && (
                  <div className="mb-3 flex gap-2 items-center text-xs text-ink-500">
                    <i className="fa fa-server" />
                    <span>后端地址:</span>
                    <input
                      value={pyUrl}
                      onChange={(e) => setPyUrl(e.target.value)}
                      className="flex-1 px-2 py-1 border border-ink-200 rounded text-xs font-mono outline-none focus:border-navy-400 bg-white max-w-[240px]"
                      placeholder="http://localhost:8080"
                    />
                  </div>
                )}

                {/* ── Chat tab ── */}
                {tab === "chat" && (
                  <>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-ink-400 font-serif">
                        {displayMessages.length > 0 ? `共 ${displayMessages.length} 条消息` : "开始一段新对话"}
                      </span>
                      {displayMessages.length > 0 && (
                        <button
                          onClick={handleClear}
                          className="text-xs text-ink-400 hover:text-rust-500 bg-transparent border-none cursor-pointer font-serif flex items-center gap-1"
                        >
                          <i className="fa fa-trash" /> 清除对话
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-0.5 mb-3" style={{ maxHeight: "380px", scrollBehavior: "smooth" }}>
                      {displayMessages.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="text-center">
                            <i className="fa fa-commenting text-4xl text-ink-300 mb-3" />
                            <p className="font-serif text-ink-400 text-sm">输入问题开始对话吧</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {displayMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                msg.role === "user"
                                  ? "bg-navy-900 text-ink-50 rounded-br-sm"
                                  : "bg-ink-50 border border-ink-200/60 text-ink-700 rounded-bl-sm"
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          ))}
                          {streamingContent && (
                            <div className="flex justify-start">
                              <div className="max-w-[80%] px-4 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words bg-ink-50 border border-ink-200/60 text-ink-700 rounded-bl-sm">
                                {streamingContent}
                                <span className="inline-block w-1.5 h-4 bg-navy-700 ml-0.5 animate-pulse" />
                              </div>
                            </div>
                          )}
                          <div ref={endRef} />
                        </>
                      )}
                    </div>

                    <div className="flex gap-2 items-end bg-ink-50 border border-ink-200/60 rounded-xl p-3 mt-auto">
                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="输入你的问题... (Enter 发送, Shift+Enter 换行)"
                        rows={2}
                        disabled={!ready}
                        className="flex-1 px-3 py-2 border border-ink-200 rounded-lg text-sm font-serif text-ink-700 resize-none outline-none focus:border-navy-400 bg-white disabled:opacity-50"
                      />
                      <button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        className={`px-5 py-2 rounded-lg text-sm font-serif transition-all border-none ${
                          input.trim() && !loading
                            ? "bg-navy-900 text-ink-50 hover:bg-navy-800 cursor-pointer"
                            : "bg-ink-200 text-ink-400 cursor-not-allowed"
                        }`}
                      >
                        {loading ? <i className="fa fa-spinner fa-spin" /> : <i className="fa fa-paper-plane" />}
                      </button>
                    </div>
                  </>
                )}

                {/* ── Translate tab ── */}
                {tab === "translate" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select
                        value={srcLang}
                        onChange={(e) => setSrcLang(e.target.value)}
                        className="px-3 py-2 border border-ink-200 rounded-lg text-sm font-serif bg-white outline-none focus:border-navy-400"
                      >
                        <option value="auto">自动检测</option>
                        <option value="中文">中文</option>
                        <option value="英语">英语</option>
                        <option value="日语">日语</option>
                        <option value="法语">法语</option>
                        <option value="德语">德语</option>
                        <option value="韩语">韩语</option>
                        <option value="俄语">俄语</option>
                        <option value="西班牙语">西班牙语</option>
                      </select>
                      <button className="px-2 text-ink-400 cursor-default bg-transparent border-none">
                        <i className="fa fa-arrow-right" />
                      </button>
                      <select
                        value={tgtLang}
                        onChange={(e) => setTgtLang(e.target.value)}
                        className="px-3 py-2 border border-ink-200 rounded-lg text-sm font-serif bg-white outline-none focus:border-navy-400"
                      >
                        <option value="中文">中文</option>
                        <option value="英语">英语</option>
                        <option value="日语">日语</option>
                        <option value="法语">法语</option>
                        <option value="德语">德语</option>
                        <option value="韩语">韩语</option>
                        <option value="俄语">俄语</option>
                        <option value="西班牙语">西班牙语</option>
                      </select>
                    </div>

                    <textarea
                      value={transText}
                      onChange={(e) => setTransText(e.target.value)}
                      placeholder="输入要翻译的文本..."
                      rows={4}
                      className="w-full px-3 py-2.5 border border-ink-200 rounded-lg text-sm font-serif text-ink-700 resize-vertical outline-none focus:border-navy-400 bg-white"
                    />

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setTransText(""); setTransResult(""); }}
                        className="px-4 py-1.5 rounded-lg text-sm font-serif text-ink-500 hover:bg-ink-200 transition-all cursor-pointer border-none bg-transparent"
                      >
                        清空
                      </button>
                      <button
                        onClick={handleTranslate}
                        disabled={!transText.trim() || transLoading}
                        className={`px-5 py-1.5 rounded-lg text-sm font-serif transition-all border-none ${
                          transText.trim() && !transLoading
                            ? "bg-navy-900 text-ink-50 hover:bg-navy-800 cursor-pointer"
                            : "bg-ink-200 text-ink-400 cursor-not-allowed"
                        }`}
                      >
                        {transLoading ? <i className="fa fa-spinner fa-spin" /> : "翻译"}
                      </button>
                    </div>

                    {transResult && (
                      <div className="p-4 bg-ink-50 border border-ink-200/60 rounded-xl">
                        <div className="text-xs text-ink-400 mb-1.5 font-serif">翻译结果</div>
                        <div className="text-sm text-ink-800 leading-relaxed whitespace-pre-wrap break-words">{transResult}</div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
