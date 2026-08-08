'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert, 
  BookOpen, 
  Tag, 
  User, 
  Cpu
} from 'lucide-react';

interface QACard {
  question: string;
  answer: string;
  confidence_score: number;
  confidence_percentage: string;
  confidence_reason: string;
  citations: string[];
  related_topics: string[];
  used_sources: string[];
  loading?: boolean;
}

interface AskMemoryOSProps {
  onSelectTopic: (topic: string) => void;
}

export default function AskMemoryOS({ onSelectTopic }: AskMemoryOSProps) {
  const [queryInput, setQueryInput] = useState('');
  const [exchanges, setExchanges] = useState<QACard[]>([
    {
      question: 'Initialize System Search',
      answer: 'Hello! I am your Enterprise QA Agent. Ask anything about database backups, server credentials, access permissions, or AWS rotation procedures. I will answer using verified organizational memory with cited documentation.',
      confidence_score: 1.0,
      confidence_percentage: '100%',
      confidence_reason: 'System initialization message.',
      citations: [],
      related_topics: ['DevOps Deployments', 'Database Backups', 'AWS Secrets Manager', 'Credentials policy'],
      used_sources: []
    }
  ]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent, customQuery?: string) => {
    e.preventDefault();
    const queryText = (customQuery || queryInput).trim();
    if (!queryText || isSearching) return;

    setQueryInput('');
    setIsSearching(true);

    const newExchangeIndex = exchanges.length;
    setExchanges(prev => [
      ...prev,
      {
        question: queryText,
        answer: '',
        confidence_score: 0.0,
        confidence_percentage: '0%',
        confidence_reason: '',
        citations: [],
        related_topics: [],
        used_sources: [],
        loading: true
      }
    ]);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const res = await fetch(`${baseUrl}/query?query=${encodeURIComponent(queryText)}`);
      if (!res.ok) throw new Error('Search request failed.');

      const data = await res.json();

      setExchanges(prev => {
        const updated = [...prev];
        updated[newExchangeIndex] = {
          question: queryText,
          answer: data.answer,
          confidence_score: data.confidence_score,
          confidence_percentage: data.confidence_percentage,
          confidence_reason: data.confidence_reason,
          citations: data.citations || [],
          related_topics: data.related_topics || [],
          used_sources: data.used_sources || [],
          loading: false
        };
        return updated;
      });

    } catch (err) {
      setExchanges(prev => {
        const updated = [...prev];
        updated[newExchangeIndex] = {
          question: queryText,
          answer: 'Error: Failed to reach backend. Make sure your local FastAPI dev server is running on port 8000.',
          confidence_score: 0.0,
          confidence_percentage: '0%',
          confidence_reason: 'Connection error.',
          citations: [],
          related_topics: [],
          used_sources: [],
          loading: false
        };
        return updated;
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getConfidenceBadgeColor = (score: number) => {
    if (score >= 0.8) return 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]';
    if (score >= 0.5) return 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]';
    return 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]';
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col justify-between">
      {/* Search Exchanges Stream */}
      <div className="flex-1 overflow-y-auto space-y-8 pr-2 pb-6">
        {exchanges.map((exchange, idx) => (
          <div key={idx} className="space-y-4">
            
            {/* User message bubble */}
            {idx > 0 && (
              <div className="flex items-center space-x-3 max-w-xl ml-auto flex-row-reverse space-x-reverse">
                <div className="p-2.5 rounded-xl bg-[#2A2A2F]/50 text-zinc-300 border border-[#2A2A2F]">
                  <User className="w-4 h-4" />
                </div>
                <div className="bg-[#3B82F6] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md">
                  {exchange.question}
                </div>
              </div>
            )}

            {/* Answer Card */}
            <div className="flex items-start space-x-4 max-w-3xl mr-auto">
              <div className="p-2.5 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] shrink-0 border border-[#3B82F6]/15">
                <Cpu className="w-4 h-4" />
              </div>

              <div className="bg-[#18181B] border border-[#2A2A2F] rounded-2xl p-6 flex-1 space-y-4 shadow-xl">
                {exchange.loading ? (
                  <div className="flex items-center space-x-3 text-zinc-400 py-1">
                    <Loader2 className="w-4 h-4 text-[#3B82F6] animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Querying vector space...</span>
                  </div>
                ) : (
                  <>
                    {idx > 0 && (
                      <div className="flex items-center justify-between pb-3 border-b border-[#2A2A2F]">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Response Payload</span>
                        <div className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${getConfidenceBadgeColor(exchange.confidence_score)}`}>
                          {exchange.confidence_score >= 0.8 ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                          <span>{exchange.confidence_percentage} Trust</span>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-zinc-200 leading-relaxed font-semibold">
                      {exchange.answer}
                    </p>

                    {(exchange.confidence_reason && idx > 0) && (
                      <div className="text-[11px] text-zinc-400 leading-relaxed bg-[#09090B]/40 border border-[#2A2A2F] p-3 rounded-lg">
                        <span className="font-bold text-zinc-300">Auditing explanation: </span>
                        {exchange.confidence_reason}
                      </div>
                    )}

                    {exchange.citations.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Reference Citations</span>
                        <div className="flex flex-wrap gap-2">
                          {exchange.citations.map((src, i) => (
                            <div key={i} className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#09090B] border border-[#2A2A2F] rounded-md text-xs text-zinc-300">
                              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                              <span className="font-semibold text-[10px]">{src}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {exchange.related_topics.length > 0 && (
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Explore Domain</span>
                        <div className="flex flex-wrap gap-1.5">
                          {exchange.related_topics.map((tag, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setQueryInput(tag);
                                onSelectTopic(tag);
                              }}
                              className="flex items-center space-x-1.5 px-2 py-0.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/15 rounded-md text-[9px] font-bold text-[#3B82F6] transition-colors"
                            >
                              <span>{tag}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Floating Query input bar */}
      <form onSubmit={(e) => handleSearch(e)} className="border-t border-[#2A2A2F] bg-[#09090B] pt-4 pb-2">
        <div className="flex items-center space-x-3 bg-[#18181B] border border-[#2A2A2F] focus-within:border-[#3B82F6] rounded-xl px-4 py-3 transition-all duration-300 shadow-2xl">
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            disabled={isSearching}
            placeholder="Search database backups, master keys, AWS policies..."
            className="flex-1 bg-transparent text-xs text-white focus:outline-none focus:ring-0 placeholder-zinc-600"
          />
          <button
            type="submit"
            disabled={!queryInput.trim() || isSearching}
            className="p-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 disabled:bg-[#2A2A2F] disabled:text-zinc-600 text-white rounded-lg transition-all transform active:scale-95 shadow-lg shadow-[#3B82F6]/15"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
