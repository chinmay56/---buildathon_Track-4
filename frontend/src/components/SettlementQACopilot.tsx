import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, BookOpen, ArrowRight } from 'lucide-react';
import { queryCopilot } from '../api';
import type { CopilotQueryResponse } from '../types';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  data?: CopilotQueryResponse;
}

interface CopilotProps {
  onInspectOrder?: (orderId: string) => void;
}

export const SettlementQACopilot: React.FC<CopilotProps> = ({ onInspectOrder }) => {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: 'welcome_1',
      sender: 'assistant',
      text: "Hello! I am your **Razorpay Settlement Operations Copilot**.\n\nI can analyze multi-source transaction records, diagnose root causes of clawbacks & duplicate fees, explain merchant policy clauses, and evaluate cash liquidity risk across your 500-batch ledger.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputVal, setInputVal] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const suggestedQueries = [
    "Explain root cause of ord_0010",
    "What is our trapped clawback capital?",
    "Why are some cases in Human Review?",
    "Check reconciliation speed & accuracy"
  ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputVal;
    if (!textToSend.trim() || loading) return;

    const userMsg: MessageItem = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      const res = await queryCopilot(textToSend);
      const assistantMsg: MessageItem = {
        id: `msg_res_${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        data: res,
      };
      setMessages(prev => [...prev, assistantMsg]);
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
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#0B72E7',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <Bot size={14} />
                </div>
              )}

              <div style={{
                maxWidth: '75%',
                background: isUser ? '#0B72E7' : 'var(--blade-bg-subtle)',
                color: isUser ? '#FFFFFF' : 'var(--blade-text-primary)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: isUser ? 'none' : '1px solid var(--blade-border-subtle)',
                fontSize: '0.8rem',
                lineHeight: 1.55,
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
              }}>
                <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>

                {/* Policy Clauses Tags */}
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

                {/* Suggested Action Buttons */}
                {msg.data?.suggested_actions && msg.data.suggested_actions.length > 0 && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {msg.data.suggested_actions.map((act, idx) => (
                      <button
                        key={idx}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '0.68rem', background: '#FFFFFF' }}
                        onClick={() => {
                          if (msg.data?.context_data?.order_id && onInspectOrder) {
                            onInspectOrder(msg.data.context_data.order_id);
                          }
                        }}
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
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {msg.timestamp}
                </div>
              </div>

              {isUser && (
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#334155',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <User size={14} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--blade-text-muted)', fontSize: '0.76rem' }}>
            <Bot size={16} className="animate-spin" color="#0B72E7" />
            <span>Copilot analyzing multi-source records and policy clauses...</span>
          </div>
        )}
      </div>

      {/* Quick Suggested Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        {suggestedQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            style={{
              padding: '5px 10px',
              borderRadius: '20px',
              background: '#FFFFFF',
              border: '1px solid var(--blade-border-subtle)',
              color: 'var(--blade-text-secondary)',
              fontSize: '0.72rem',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.12s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0B72E7';
              e.currentTarget.style.color = '#0B72E7';
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
          placeholder="Ask a question (e.g. 'Why did ord_0010 have a discrepancy?' or 'Check our float buffer')..."
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSend();
          }}
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

    </div>
  );
};
