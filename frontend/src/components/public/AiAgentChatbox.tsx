// src/components/public/AiAgentChatbox.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X, Send, Bot, User as UserIcon, Loader2, Sparkles,
  AlertCircle, Trash2, Minimize2, Maximize2, RefreshCw,
  MessageSquare, ChevronDown, Copy, Check,
} from 'lucide-react';
import { ChatMessage, AiContext } from '../../types/aiAgent';
import {
  askAiAgent,
  detectIntent,
  SUGGESTED_QUESTIONS,
} from '../../services/aiAgentService';
import { buildAiContext } from '../../utils/aiContextBuilder';
import { Dispatch } from '../../types/dispatch';
import { User } from '../../types/auth';

// ═══════════════════════════════════════════════════════════
// PROPS
// ═══════════════════════════════════════════════════════════
interface AiAgentChatboxProps {
  dispatches: Dispatch[];
  allUsers: User[];
  departments?: Array<{ code: string; name: string; managerId?: string; pvtManagerId?: string }>;
  /** Có bật không (mặc định đọc từ env) */
  enabled?: boolean;
}

// ═══════════════════════════════════════════════════════════
// MARKDOWN RENDERER ĐƠN GIẢN (không cần lib)
// ═══════════════════════════════════════════════════════════
const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  const flushList = (key: string) => {
    if (listBuffer.length > 0) {
      nodes.push(
        <ul key={key} className="list-disc list-inside space-y-0.5 my-1.5 ml-1">
          {listBuffer.map((item, i) => (
            <li key={i} className="text-xs leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  const renderInline = (str: string): React.ReactNode => {
    // **bold**
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return (
          <strong key={i} className="font-bold text-slate-900">
            {p.slice(2, -2)}
          </strong>
        );
      }
      // `code`
      const codeParts = p.split(/(`[^`]+`)/g);
      return codeParts.map((cp, j) => {
        if (cp.startsWith('`') && cp.endsWith('`')) {
          return (
            <code
              key={`${i}-${j}`}
              className="px-1 py-0.5 bg-slate-100 text-red-700 rounded text-[11px] font-mono"
            >
              {cp.slice(1, -1)}
            </code>
          );
        }
        return <span key={`${i}-${j}`}>{cp}</span>;
      });
    });
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList(`list-${idx}`);
      nodes.push(<div key={`sp-${idx}`} className="h-1.5" />);
      return;
    }

    // Bullet list
    if (/^[-*•]\s+/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^[-*•]\s+/, ''));
      return;
    }

    // Numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      listBuffer.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }

    flushList(`list-${idx}`);

    // Heading
    if (/^#{1,3}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const content = trimmed.replace(/^#+\s+/, '');
      const size = level === 1 ? 'text-sm' : level === 2 ? 'text-xs' : 'text-xs';
      nodes.push(
        <div key={idx} className={`font-black text-slate-900 ${size} mt-2 mb-1`}>
          {renderInline(content)}
        </div>
      );
      return;
    }

    // Paragraph
    nodes.push(
      <p key={idx} className="text-xs leading-relaxed my-0.5">
        {renderInline(trimmed)}
      </p>
    );
  });

  flushList('list-end');
  return <>{nodes}</>;
};

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export const AiAgentChatbox: React.FC<AiAgentChatboxProps> = ({
  dispatches,
  allUsers,
  departments = [],
  enabled = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const AGENT_NAME = import.meta.env.VITE_AI_AGENT_NAME || 'Trợ lý VKS';
  const MAX_CONTEXT = Number(import.meta.env.VITE_AI_AGENT_MAX_CONTEXT_DISPATCHES) || 200;

  // ═══════════════════════════════════════════════════════
  // BUILD CONTEXT (memo — chỉ rebuild khi data thay đổi)
  // ═══════════════════════════════════════════════════════
  const aiContext: AiContext = useMemo(
    () => buildAiContext(dispatches, allUsers, departments, MAX_CONTEXT),
    [dispatches, allUsers, departments, MAX_CONTEXT]
  );

  // ═══════════════════════════════════════════════════════
  // WELCOME MESSAGE
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const { stats } = aiContext;
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content:
            `Xin chào! Tôi là **${AGENT_NAME}** 👋\n\n` +
            `Tôi có thể giúp bạn tra cứu thông tin về **${stats.total} văn bản** đang có trong hệ thống:\n` +
            `- 🚨 **${stats.quaHan}** công văn quá hạn\n` +
            `- ⏰ **${stats.sapDenHan}** công văn sắp đến hạn\n` +
            `- ✅ **${stats.hoanThanh}** công văn đã hoàn thành\n` +
            `- 📋 **${stats.chuyenDe}** chuyên đề\n\n` +
            `Bạn muốn hỏi gì?`,
          createdAt: new Date().toISOString(),
          intent: 'TONG_QUAN',
        },
      ]);
    }
  }, [isOpen, aiContext, AGENT_NAME, messages.length]);

  // ═══════════════════════════════════════════════════════
  // AUTO SCROLL
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // ═══════════════════════════════════════════════════════
  // FOCUS INPUT KHI MỞ
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, isMinimized]);

  // ═══════════════════════════════════════════════════════
  // SEND MESSAGE
  // ═══════════════════════════════════════════════════════
  const handleSend = async (questionText?: string) => {
    const question = (questionText ?? input).trim();
    if (!question || isThinking) return;

    const intent = detectIntent(question);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: question,
      createdAt: new Date().toISOString(),
      intent,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    // Placeholder assistant message
    const loadingId = `a-loading-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: loadingId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        isLoading: true,
      },
    ]);

    try {
      const { answer, error } = await askAiAgent(question, aiContext, messages);

      setMessages(prev =>
        prev.map(m => {
          if (m.id !== loadingId) return m;
          if (error) {
            return { ...m, isLoading: false, error, content: '' };
          }
          return {
            ...m,
            isLoading: false,
            content: answer,
            intent,
          };
        })
      );
    } catch (err: any) {
      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? {
                ...m,
                isLoading: false,
                error: err?.message || 'Lỗi không xác định',
              }
            : m
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // KEYBOARD: Enter để gửi, Shift+Enter xuống dòng
  // ═══════════════════════════════════════════════════════
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ═══════════════════════════════════════════════════════
  // CLEAR CHAT
  // ═══════════════════════════════════════════════════════
  const handleClear = () => {
    if (!window.confirm('Xóa toàn bộ cuộc trò chuyện?')) return;
    setMessages([]);
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 100);
  };

  // ═══════════════════════════════════════════════════════
  // COPY MESSAGE
  // ═══════════════════════════════════════════════════════
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // ═══════════════════════════════════════════════════════
  // EARLY RETURN
  // ═══════════════════════════════════════════════════════
  if (!enabled) return null;

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <>
      {/* ══════════ NÚT FLOATING ══════════ */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[55] group"
          aria-label={`Mở ${AGENT_NAME}`}
          title={`Chat với ${AGENT_NAME}`}
        >
          {/* Outer glow */}
          <span className="absolute inset-0 rounded-full bg-red-500 opacity-30 blur-xl group-hover:opacity-50 transition" />

          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20" />

          {/* Button body */}
          <span
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-2xl border-2 border-amber-400 transition-transform group-hover:scale-110 group-active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 100%)',
            }}
          >
            {/* Logo SVG — Ngôi sao vàng trên nền đỏ (biểu tượng VKS) */}
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              className="drop-shadow-lg"
            >
              {/* Ngôi sao 5 cánh vàng */}
              <path
                d="M16 3 L19.5 12.5 L29.5 13 L21.5 19 L24 29 L16 23.5 L8 29 L10.5 19 L2.5 13 L12.5 12.5 Z"
                fill="#FFD700"
                stroke="#FFF"
                strokeWidth="0.8"
                strokeLinejoin="round"
              />
              {/* Chấm sáng ở giữa */}
              <circle cx="16" cy="16" r="2" fill="#7F0E0E" />
            </svg>

            {/* Small "AI" badge */}
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-400 text-red-900 text-[9px] font-black rounded-full border-2 border-white shadow">
              AI
            </span>
          </span>

          {/* Tooltip */}
          <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none shadow-xl">
            Chat với {AGENT_NAME} ✨
          </span>
        </button>
      )}

      {/* ══════════ CHATBOX PANEL ══════════ */}
      {isOpen && (
        <div
          className={`fixed z-[55] transition-all duration-300 ${
            isMinimized
              ? 'bottom-6 right-6 w-72 h-14'
              : 'bottom-4 right-4 left-4 sm:left-auto sm:bottom-6 sm:right-6 sm:w-[420px] h-[80vh] sm:h-[640px] max-h-[85vh]'
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl border-2 border-red-900/20 overflow-hidden flex flex-col h-full w-full">
            {/* ═══ HEADER ═══ */}
            <div
              className="px-3.5 py-3 flex items-center justify-between text-white shrink-0"
              style={{
                background: 'linear-gradient(135deg, #B71C1C 0%, #7F0E0E 100%)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shadow-md border border-amber-300">
                    <Sparkles className="w-4.5 h-4.5 text-red-900" strokeWidth={2.5} />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-black text-white truncate flex items-center gap-1.5">
                    {AGENT_NAME}
                    <span className="px-1.5 py-0.5 bg-amber-400 text-red-900 text-[9px] font-black rounded">
                      AI
                    </span>
                  </div>
                  <div className="text-[10px] text-amber-100 truncate">
                    {isThinking ? '🔄 Đang tra cứu...' : '✅ Sẵn sàng trả lời'}
                  </div>
                </div>
              </div>

              {/* Header actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 rounded-lg hover:bg-white/15 transition cursor-pointer"
                  title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-3.5 h-3.5" />
                  ) : (
                    <Minimize2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 rounded-lg hover:bg-white/15 transition cursor-pointer"
                  title="Xóa cuộc trò chuyện"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/15 transition cursor-pointer"
                  title="Đóng"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* ═══ BODY ═══ */}
            {!isMinimized && (
              <>
                {/* Context badge */}
                <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-[10px] shrink-0">
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Đã nạp: {aiContext.dispatches.length} VB · {aiContext.pvtList.length} PVT · {aiContext.tpList.length} TP
                  </span>
                  <span className="text-amber-600 font-mono truncate ml-2">
                    {aiContext.todayStr}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50/50">
                  {messages.map(msg => (
                    <MessageBubble
                      key={msg.id}
                      message={msg}
                      agentName={AGENT_NAME}
                      copiedId={copiedId}
                      onCopy={handleCopy}
                      onSuggest={q => handleSend(q)}
                    />
                  ))}

                  {/* Suggested questions — chỉ hiện khi chưa hỏi gì */}
                  {messages.length <= 1 && !isThinking && (
                    <div className="pt-2">
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        Câu hỏi gợi ý
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {SUGGESTED_QUESTIONS.map((q, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSend(q)}
                            disabled={isThinking}
                            className="px-2.5 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 hover:border-red-400 hover:bg-red-50 hover:text-red-800 rounded-lg transition cursor-pointer disabled:opacity-50 text-left"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-2.5 bg-white border-t border-slate-200 shrink-0">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập câu hỏi..."
                      rows={1}
                      disabled={isThinking}
                      className="flex-1 resize-none px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 disabled:bg-slate-50 disabled:cursor-not-allowed max-h-24"
                      style={{
                        minHeight: '36px',
                        height: 'auto',
                      }}
                      onInput={e => {
                        const el = e.currentTarget;
                        el.style.height = 'auto';
                        el.style.height = Math.min(el.scrollHeight, 96) + 'px';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleSend()}
                      disabled={!input.trim() || isThinking}
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                      style={{ backgroundColor: '#B71C1C' }}
                      title="Gửi (Enter)"
                    >
                      {isThinking ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <div className="mt-1 text-[9px] text-slate-400 text-center">
                    Enter để gửi · Shift+Enter xuống dòng
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ═══════════════════════════════════════════════════════════
interface MessageBubbleProps {
  message: ChatMessage;
  agentName: string;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  onSuggest: (q: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  agentName,
  copiedId,
  onCopy,
  onSuggest,
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isUser ? (
          <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
            <UserIcon className="w-3.5 h-3.5 text-white" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center border border-amber-400/50">
            <Bot className="w-3.5 h-3.5 text-amber-300" />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`inline-block max-w-full rounded-2xl px-3 py-2 ${
            isUser
              ? 'bg-slate-700 text-white rounded-tr-sm'
              : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm shadow-sm'
          }`}
        >
          {/* Error */}
          {message.error && (
            <div className="flex items-start gap-2 text-rose-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div className="text-xs font-medium">{message.error}</div>
            </div>
          )}

          {/* Loading */}
          {message.isLoading && (
            <div className="flex items-center gap-2 text-slate-500 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="text-xs font-medium">Đang tra cứu dữ liệu...</span>
            </div>
          )}

          {/* Content */}
          {!message.isLoading && !message.error && (
            <div className={isUser ? 'text-xs leading-relaxed' : ''}>
              {isUser ? (
                <span>{message.content}</span>
              ) : (
                renderMarkdown(message.content)
              )}
            </div>
          )}
        </div>

        {/* Meta row */}
        {!message.isLoading && !message.error && (
          <div
            className={`flex items-center gap-1.5 mt-1 px-1 ${
              isUser ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <span className="text-[9px] text-slate-400">
              {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            {!isUser && message.content && (
              <button
                type="button"
                onClick={() => onCopy(message.id, message.content)}
                className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="Sao chép"
              >
                {copiedId === message.id ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AiAgentChatbox;