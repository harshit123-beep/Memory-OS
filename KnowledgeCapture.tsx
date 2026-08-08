'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  CheckCircle, 
  User, 
  Brain, 
  AlertTriangle,
  HelpCircle,
  Cpu,
  BadgeAlert,
  Compass
} from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
}

interface CoverageData {
  score: number;
  percentage: string;
  covered_topics: string[];
  pending_topics: string[];
  suggested_questions: string[];
}

interface KnowledgeCaptureProps {
  sessionId: string;
  setSessionId: (id: string) => void;
  onFinishInterview: (sessionId: string) => void;
}

export default function KnowledgeCapture({
  sessionId,
  setSessionId,
  onFinishInterview
}: KnowledgeCaptureProps) {
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  // Chat States
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Coverage Stats
  const [coverage, setCoverage] = useState<CoverageData>({
    score: 0.0,
    percentage: '0%',
    covered_topics: [],
    pending_topics: ['DevOps Pipelines', 'DB Backup Schemes', 'S3 Configuration', 'Access Keys'],
    suggested_questions: ['Which cloud servers handle deployment?', 'Are credentials stored under desks?']
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empRole.trim()) return;

    setIsStarting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const res = await fetch(`${baseUrl}/interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_name: empName, employee_role: empRole }),
      });

      if (!res.ok) throw new Error('Failed to start interview.');

      const data = await res.json();
      setSessionId(data.session_id);
      setMessages([{ role: 'assistant', content: data.message }]);
    } catch (err) {
      alert('Error initializing session: ' + err);
    } finally {
      setIsStarting(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isSending || !sessionId) return;

    const userText = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsSending(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const res = await fetch(`${baseUrl}/interview/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: userText }),
      });

      if (!res.ok) throw new Error('Failed to post message.');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      
      if (data.coverage) {
        setCoverage({
          score: data.coverage.coverage_score || 0.0,
          percentage: `${Math.round((data.coverage.coverage_score || 0) * 100)}%`,
          covered_topics: data.coverage.covered_topics || [],
          pending_topics: data.coverage.pending_topics || [],
          suggested_questions: data.coverage.suggested_questions || []
        });
      }

      if (data.is_complete) {
        setTimeout(() => {
          onFinishInterview(sessionId);
        }, 1500);
      }

    } catch (err) {
      alert('Failed sending chat: ' + err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col justify-center">
      <AnimatePresence mode="wait">
        {!sessionId ? (
          // Launch setup form
          <motion.div
            key="setup-form"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="max-w-md w-full mx-auto p-8 bg-[#18181B] border border-[#2A2A2F] rounded-2xl space-y-6 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-transparent pointer-events-none" />
            <div className="text-center space-y-2 relative">
              <div className="mx-auto w-11 h-11 bg-[#3B82F6]/10 rounded-xl text-[#3B82F6] flex items-center justify-center">
                <Brain className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-base font-extrabold text-white">Knowledge Capture Session</h3>
              <p className="text-zinc-500 text-xs">Begin exit chat to transfer systems configuration and workarounds.</p>
            </div>

            <form onSubmit={startSession} className="space-y-4 relative">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Employee Name</label>
                <input 
                  type="text" 
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="e.g. Sarah Chen"
                  className="w-full bg-[#09090B] border border-[#2A2A2F] focus:border-[#3B82F6] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Employee Role</label>
                <input 
                  type="text" 
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  placeholder="e.g. Senior Data Analyst"
                  className="w-full bg-[#09090B] border border-[#2A2A2F] focus:border-[#3B82F6] rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none transition-colors"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isStarting}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:bg-[#2A2A2F] text-white rounded-lg text-xs font-bold transition-all transform active:scale-95 shadow-lg shadow-[#3B82F6]/10"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deploying AI Interview Agent...</span>
                  </>
                ) : (
                  <span>Launch Session</span>
                )}
              </button>
            </form>
          </motion.div>
        ) : (
          // Split chat panel
          <motion.div
            key="chat-workspace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-0"
          >
            {/* Cursor Chat (Left side, 8 cols) */}
            <div className="lg:col-span-8 flex flex-col bg-[#18181B] border border-[#2A2A2F] rounded-2xl overflow-hidden h-full shadow-2xl">
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#2A2A2F] flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_8px_#22C55E]" />
                  <div>
                    <h3 className="text-xs font-bold text-white tracking-tight">Capture Chat Console</h3>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{sessionId}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => onFinishInterview(sessionId)}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#3B82F6]/10 hover:bg-[#3B82F6] hover:text-white text-[#3B82F6] border border-[#3B82F6]/25 rounded-lg text-xs font-bold transition-all duration-300"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Finalize & Extract</span>
                </button>
              </div>

              {/* Chat Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
                {messages.map((msg, i) => {
                  const isAssistant = msg.role === 'assistant';
                  return (
                    <div 
                      key={i} 
                      className={`flex items-start space-x-4 max-w-2xl ${!isAssistant ? 'ml-auto flex-row-reverse space-x-reverse' : ''}`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isAssistant ? 'bg-[#3B82F6]/10 text-[#3B82F6]' : 'bg-[#2A2A2F]/50 text-zinc-300'}`}>
                        {isAssistant ? <Brain className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div className={`p-4 rounded-xl text-xs leading-relaxed border ${
                        isAssistant 
                          ? 'bg-[#09090B]/40 border-[#2A2A2F] text-zinc-200' 
                          : 'bg-[#3B82F6] border-[#3B82F6]/10 text-white'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })}

                {isSending && (
                  <div className="flex items-start space-x-4 max-w-xl">
                    <div className="p-2 rounded-xl shrink-0 bg-[#3B82F6]/10 text-[#3B82F6]">
                      <Brain className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="p-4 bg-[#09090B]/20 border border-[#2A2A2F] rounded-xl flex items-center space-x-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">AI Reasoning...</span>
                      <Loader2 className="w-3.5 h-3.5 text-[#3B82F6] animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={sendMessage} className="p-4 border-t border-[#2A2A2F] bg-[#09090B]/30">
                <div className="flex items-center space-x-3 bg-[#09090B] border border-[#2A2A2F] focus-within:border-[#3B82F6] rounded-xl px-4 py-3 transition-colors shadow-inner">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isSending}
                    placeholder="Provide information on system passwords, workarounds, or servers..."
                    className="flex-1 bg-transparent text-xs text-white focus:outline-none focus:ring-0 placeholder-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isSending}
                    className="p-1.5 bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:bg-[#2A2A2F] disabled:text-zinc-600 text-white rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Sidebar Context Details (Right, 4 cols) */}
            <div className="lg:col-span-4 bg-[#18181B] border border-[#2A2A2F] rounded-2xl p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
              
              <div className="space-y-6">
                {/* Employee Details Panel */}
                <div className="space-y-2 pb-4 border-b border-[#2A2A2F]">
                  <h4 className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Active Handover</h4>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white leading-none">{empName || 'Sarah Chen'}</h4>
                    <span className="text-[10px] font-semibold text-[#3B82F6]">{empRole || 'Senior Data Analyst'}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-400">
                    <span>Session Progress</span>
                    <span className="text-[#3B82F6]">{coverage.percentage}</span>
                  </div>
                  <div className="w-full bg-[#09090B] h-1.5 rounded-full overflow-hidden border border-[#2A2A2F]">
                    <div 
                      className="bg-[#3B82F6] h-full transition-all duration-500 ease-out" 
                      style={{ width: coverage.percentage }}
                    />
                  </div>
                </div>

                {/* Covered domains */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5 text-[#22C55E] text-[10px] font-bold uppercase tracking-wider">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Covered Scope</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {coverage.covered_topics.length > 0 ? (
                      coverage.covered_topics.map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-[9px] font-bold bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded">
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500 italic">Conversing to scan scope...</span>
                    )}
                  </div>
                </div>

                {/* Suggested follow-ups */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-1.5 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Suggested Questions</span>
                  </div>
                  <div className="space-y-2">
                    {coverage.suggested_questions.map((q, idx) => (
                      <div key={idx} className="p-3 bg-[#09090B]/30 border border-[#2A2A2F] rounded-xl flex items-start space-x-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span className="text-zinc-400 text-[10px] leading-relaxed">{q}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent Reasoning Status indicator */}
              <div className="pt-4 border-t border-[#2A2A2F] flex items-center space-x-2.5 text-[10px] text-zinc-500">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#22C55E]" />
                <span>AI Interview Agent Online</span>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
