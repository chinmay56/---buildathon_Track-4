import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { queryCopilot } from '../api';
import type { CopilotQueryResponse } from '../types';

// ─── Inline Markdown Renderer ─────────────────────────────────────────────────
// Handles: ### headers, **bold**, `inline code`, - bullet lists, blank-line paragraphs.
// No external dependency needed.

interface MdToken {
  type: 'h4' | 'h3' | 'h2' | 'bullet' | 'paragraph' | 'blank';
  content: string;
}

function tokenize(raw: string): MdToken[] {
  const lines = raw.split('\n');
  const tokens: MdToken[] = [];
  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (trimmed === '') {
      tokens.push({ type: 'blank', content: '' });
    } else if (/^####\s/.test(trimmed)) {
      tokens.push({ type: 'h4', content: trimmed.replace(/^####\s+/, '') });
    } else if (/^###\s/.test(trimmed)) {
      tokens.push({ type: 'h3', content: trimmed.replace(/^###\s+/, '') });
    } else if (/^##\s/.test(trimmed)) {
      tokens.push({ type: 'h2', content: trimmed.replace(/^##\s+/, '') });
    } else if (/^[-*]\s/.test(trimmed)) {
      tokens.push({ type: 'bullet', content: trimmed.replace(/^[-*]\s+/, '') });
    } else {
      tokens.push({ type: 'paragraph', content: trimmed });
    }
  }
  return tokens;
}

// Renders inline styles: **bold**, `code`
function InlineText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  // Split on **...** and `...`
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    }
    if (match[0].startsWith('**')) {
      parts.push(<strong key={key++} style={{ fontWeight: 700 }}>{match[2]}</strong>);
    } else {
      parts.push(
        <code key={key++} style={{
          fontFamily: 'monospace',
          background: 'rgba(11, 114, 231, 0.08)',
          color: '#0B72E7',
          padding: '1px 5px',
          borderRadius: '3px',
          fontSize: '0.78em'
        }}>
          {match[3]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    parts.push(<span key={key++}>{text.slice(last)}</span>);
  }
  return <>{parts}</>;
}

function MarkdownMessage({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) {
    return <span>{text}</span>;
  }

  const tokens = tokenize(text);
  // Collapse consecutive bullets into a list
  const elements: React.ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let elKey = 0;

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      elements.push(
        <ul key={elKey++} style={{ margin: '4px 0 6px 0', paddingLeft: '18px', listStyleType: 'disc' }}>
          {bulletBuffer.map((b, i) => (
            <li key={i} style={{ marginBottom: '2px', lineHeight: 1.5 }}>
              <InlineText text={b} />
            </li>
          ))}
        </ul>
      );
      bulletBuffer = [];
    }
  };

  for (const tok of tokens) {
    if (tok.type === 'bullet') {
      bulletBuffer.push(tok.content);
      continue;
    }
    flushBullets();

    if (tok.type === 'blank') {
      elements.push(<div key={elKey++} style={{ height: '6px' }} />);
    } else if (tok.type === 'h2') {
      elements.push(
        <div key={elKey++} style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--blade-text-primary)', marginBottom: '4px', marginTop: '8px', borderBottom: '1px solid var(--blade-border-subtle)', paddingBottom: '3px' }}>
          <InlineText text={tok.content} />
        </div>
      );
    } else if (tok.type === 'h3') {
      elements.push(
        <div key={elKey++} style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--blade-text-primary)', marginBottom: '3px', marginTop: '8px' }}>
          <InlineText text={tok.content} />
        </div>
      );
    } else if (tok.type === 'h4') {
      elements.push(
        <div key={elKey++} style={{ fontWeight: 600, fontSize: '0.81rem', color: '#0B72E7', marginBottom: '2px', marginTop: '6px' }}>
          <InlineText text={tok.content} />
        </div>
      );
    } else {
      elements.push(
        <p key={elKey++} style={{ margin: '2px 0', lineHeight: 1.55 }}>
          <InlineText text={tok.content} />
        </p>
      );
    }
  }
  flushBullets();
  return <div style={{ fontSize: '0.8rem' }}>{elements}</div>;
}

// ─── Component Types ──────────────────────────────────────────────────────────

interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  data?: CopilotQueryResponse;
}

interface CopilotProps {
  onInspectOrder?: (orderId: string) => void;
  onNavigateTab?: (tab: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SettlementQACopilot: React.FC<CopilotProps> = ({ onInspectOrder: _onInspectOrder }) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: "Hello! I am your **Razorpay Settlement Operations Copilot**.\n\nI can analyze multi-source transaction records, diagnose root causes of clawbacks & duplicate fees, explain merchant policy clauses, and evaluate cash liquidity risk across your ledger.\n\nTry asking a follow-up question — I remember the conversation context.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);

  // Keeps the full conversation history to send to the backend for context-aware follow-ups
  const [history, setHistory] = useState<ConversationTurn[]>([]);

  const [inputVal, setInputVal] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const suggestedQueries = [
    "Explain root cause of ord_0010",
    "What is our trapped clawback capital?",
    "Why are some cases in Human Review?",
    "Check reconciliation speed & accuracy"
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText ?? inputVal).trim();
    if (!textToSend || loading) return;

    const userMsg: MessageItem = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    // Build updated history including this new user turn
    const updatedHistory: ConversationTurn[] = [
      ...history,
      { role: 'user', content: textToSend }
    ];

    try {
      const res = await queryCopilot(textToSend, undefined, undefined, updatedHistory);

      const assistantMsg: MessageItem = {
        id: `msg_res_${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: res,
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Persist this turn in history so the next message has full context
      setHistory([
        ...updatedHistory,
        { role: 'assistant', content: res.reply }
      ]);
    } catch (err) {
      const errorMsg: MessageItem = {
        id: `msg_err_${Date.now()}`,
        sender: 'assistant',
        text: "Sorry, I encountered an error querying the settlement ledger. Please verify the backend service is active.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', gap: '12px' }}>

      {/* Top Banner */}
      <div className="blade-panel" style={{ padding: '14px 18px', borderLeft: '4px solid #0B72E7' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', background: '#EFF6FF', color: '#0B72E7' }}>
              <Bot size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--blade-text-primary)' }}>
                Settlement Q&A Copilot Agent
              </h2>
              <p style={{ fontSize: '0.73rem', color: 'var(--blade-text-muted)' }}>
                Natural language finance operations reasoning over multi-source ledger truth and policy rules
              </p>
            </div>
          </div>
          <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>
            <Sparkles size={11} /> ReAct Agent Ready
          </span>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="blade-panel" style={{
        flex: 1,
        padding: '16px 20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        background: '#FFFFFF'
      }}>
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              {!isUser && (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#0B72E7', color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '2px'
                }}>
                  <Bot size={14} />
                </div>
              )}

              <div style={{
                maxWidth: '75%',
                background: isUser ? '#0B72E7' : 'var(--blade-bg-subtle)',
                color: isUser ? '#FFFFFF' : 'var(--blade-text-primary)',
                padding: '12px 16px',
                borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                border: isUser ? 'none' : '1px solid var(--blade-border-subtle)',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
              }}>
                <MarkdownMessage text={msg.text} isUser={isUser} />

                {/* Policy Clauses */}
                {msg.data?.cited_policy_clauses && msg.data.cited_policy_clauses.length > 0 && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--blade-border-subtle)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.66rem', color: 'var(--blade-text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <BookOpen size={10} /> Policy Cited:
                    </span>
                    {msg.data.cited_policy_clauses.map((clause, idx) => (
                      <span key={idx} className="badge badge-blue" style={{ fontSize: '0.64rem' }}>
                        {clause}
                      </span>
                    ))}
                  </div>
                )}

                {/* Suggested Actions — clicking sends the action as a follow-up query */}
                {msg.data?.suggested_actions && msg.data.suggested_actions.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {msg.data.suggested_actions.map((act, idx) => (
                      <button
                        key={idx}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.68rem', background: '#FFFFFF', cursor: 'pointer' }}
                        onClick={() => handleSend(act)}
                      >
                        <span>{act}</span>
                        <ArrowRight size={10} />
                      </button>
                    ))}
                  </div>
                )}

                <div style={{
                  fontSize: '0.62rem',
                  color: isUser ? 'rgba(255, 255, 255, 0.7)' : 'var(--blade-text-subtle)',
                  marginTop: '6px',
                  textAlign: 'right'
                }}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#334155', color: '#FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginTop: '2px'
                }}>
                  <User size={14} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: '#0B72E7', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Bot size={14} />
            </div>
            <div style={{
              padding: '10px 14px',
              background: 'var(--blade-bg-subtle)',
              borderRadius: '12px 12px 12px 4px',
              border: '1px solid var(--blade-border-subtle)',
              display: 'flex', gap: '5px', alignItems: 'center'
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '6px', height: '6px', borderRadius: '50%', background: '#0B72E7',
                  animation: `copilot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Suggested Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {suggestedQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={loading}
            style={{
              padding: '5px 10px',
              borderRadius: '20px',
              background: '#FFFFFF',
              border: '1px solid var(--blade-border-subtle)',
              color: 'var(--blade-text-secondary)',
              fontSize: '0.72rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              opacity: loading ? 0.5 : 1,
              transition: 'all 0.12s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.borderColor = '#0B72E7';
                e.currentTarget.style.color = '#0B72E7';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--blade-border-subtle)';
              e.currentTarget.style.color = 'var(--blade-text-secondary)';
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="blade-panel" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="text"
          placeholder="Ask a follow-up or new question about the settlement ledger..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '0.82rem',
            color: 'var(--blade-text-primary)'
          }}
        />
        <button
          className="btn-primary"
          onClick={() => handleSend()}
          disabled={loading || !inputVal.trim()}
          style={{ padding: '6px 14px' }}
        >
          <Send size={13} />
          <span>Ask</span>
        </button>
      </div>

      {/* Bounce animation keyframes */}
      <style>{`
        @keyframes copilot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>

    </div>
  );
};
