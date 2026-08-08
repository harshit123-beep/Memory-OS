'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  FileText, 
  Grid, 
  BookOpen, 
  AlertTriangle,
  ArrowRight,
  Upload,
  CheckCircle2,
  Database,
  ShieldCheck,
  FileCode,
  Search,
  Cpu,
  UserCheck,
  Server,
  Terminal,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'upload' | 'interview_complete' | 'extracted' | 'validated' | 'doc_generated' | 'security_warning' | 'jira_task';
  title: string;
  details: string;
  time: string;
  confidence?: number;
  source?: string;
}

interface MemoryCenterProps {
  documentsCount: number;
  knowledgeUnitsCount: number;
  generatedDocsCount: number;
  knowledgeHealth: number;
  gaps: string[];
  activities: ActivityItem[];
  onNavigate: (tab: any) => void;
  activeTab?: string;
}

export default function MemoryCenter({
  documentsCount,
  knowledgeUnitsCount,
  generatedDocsCount,
  knowledgeHealth,
  gaps,
  activities,
  onNavigate,
  activeTab = 'dashboard'
}: MemoryCenterProps) {
  
  // 1. AI Agents Monitor config
  const agents = [
    { name: 'Interview Agent', status: 'Ready', desc: 'Conducing chats', color: 'bg-[#22C55E]' },
    { name: 'Extraction Agent', status: 'Waiting', desc: 'Parsing units', color: 'bg-zinc-500' },
    { name: 'Validation Agent', status: 'Ready', desc: 'Compliance checks', color: 'bg-[#22C55E]' },
    { name: 'Documentation Agent', status: 'Ready', desc: 'SOP compiling', color: 'bg-[#22C55E]' },
    { name: 'QA Agent', status: 'Ready', desc: 'RAG search answering', color: 'bg-[#22C55E]' },
    { name: 'Security Auditor', status: 'Ready', desc: 'Scanning password logs', color: 'bg-[#22C55E]' },
    { name: 'Automation Agent', status: 'Completed', desc: 'DB migrations logger', color: 'bg-[#3B82F6]' }
  ];

  // 2. Interactive Pipeline Stages
  const pipelineStages = [
    { tab: 'upload', label: 'Upload', desc: 'PDF manual parsing' },
    { tab: 'interview', label: 'Knowledge Capture', desc: 'Employee chat interview' },
    { tab: 'processing', label: 'Knowledge Extraction', desc: 'Fact token parsing' },
    { tab: 'knowledge_units', label: 'Validation', desc: 'PII & logical rules audit' },
    { tab: 'documentation', label: 'Documentation', desc: 'Compiling handbook guides' },
    { tab: 'qa', label: 'Enterprise Search', desc: 'Cited RAG answering queries' }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return { icon: Upload, color: 'text-[#3B82F6]', bg: 'bg-[#3B82F6]/10' };
      case 'interview_complete': return { icon: UserCheck, color: 'text-cyan-500', bg: 'bg-cyan-500/10' };
      case 'extracted': return { icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'validated': return { icon: ShieldCheck, color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/10' };
      case 'doc_generated': return { icon: FileCode, color: 'text-purple-500', bg: 'bg-purple-500/10' };
      case 'security_warning': return { icon: AlertTriangle, color: 'text-[#EF4444]', bg: 'bg-[#EF4444]/10' };
      case 'jira_task': return { icon: Terminal, color: 'text-amber-500', bg: 'bg-amber-500/10' };
      default: return { icon: Database, color: 'text-zinc-500', bg: 'bg-zinc-800' };
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-10 max-w-6xl mx-auto"
    >
      
      {/* 1. Knowledge Pipeline Centerpiece */}
      <section className="bg-[#18181B]/40 backdrop-blur-md border border-[#2A2A2F] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#3B82F6]/5 via-transparent to-transparent" />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between border-b border-[#2A2A2F]/50 pb-3">
            <div className="flex items-center space-x-3">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Active Memory Pipeline</h3>
              <span className="text-[9px] text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                LangGraph Orchestrator
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">Status: Processing Handovers</span>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-3 py-1">
            {pipelineStages.map((stage, idx) => {
              const isCurrent = activeTab === stage.tab;
              return (
                <React.Fragment key={stage.tab}>
                  <button
                    onClick={() => onNavigate(stage.tab)}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-left transition-all ${
                      isCurrent 
                        ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-[#3B82F6] shadow-lg shadow-[#3B82F6]/5' 
                        : 'bg-[#09090B]/40 border-[#2A2A2F] text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    <span className="text-[9px] font-mono opacity-60">0{idx+1}</span>
                    <span className="text-xs font-bold">{stage.label}</span>
                  </button>
                  {idx < pipelineStages.length - 1 && (
                    <div className="hidden lg:block w-10 border-t border-dashed border-[#2A2A2F]" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Top Columns (Knowledge Coverage & Agent status) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Knowledge Coverage (Left, 5 cols) */}
        <div className="lg:col-span-5 bg-[#18181B]/40 backdrop-blur-md border border-[#2A2A2F] rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Knowledge Coverage</h3>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Segmented matrix of indexing completeness across ingested sources:
            </p>
          </div>

          <div className="py-6 flex items-center space-x-6">
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="40" className="stroke-zinc-800" strokeWidth="5" fill="transparent" />
                <circle 
                  cx="48" 
                  cy="48" 
                  r="40" 
                  className="stroke-[#3B82F6]" 
                  strokeWidth="5" 
                  fill="transparent" 
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * (knowledgeHealth / 100))}
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-lg font-black text-white">{knowledgeHealth}%</span>
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">Trust</span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5 text-[11px]">
              <div className="flex justify-between text-zinc-400 border-b border-[#2A2A2F] pb-1.5">
                <span>Documents Indexed</span>
                <span className="font-mono text-white font-bold">{documentsCount}</span>
              </div>
              <div className="flex justify-between text-zinc-400 border-b border-[#2A2A2F] pb-1.5">
                <span>Knowledge Units Extracted</span>
                <span className="font-mono text-white font-bold">{knowledgeUnitsCount}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>SOP Handbooks Compiled</span>
                <span className="font-mono text-white font-bold">{generatedDocsCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Agent Monitor (Right, 7 cols) */}
        <div className="lg:col-span-7 bg-[#18181B]/40 backdrop-blur-md border border-[#2A2A2F] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">AI Agent Monitor</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent) => (
              <div 
                key={agent.name}
                className="p-3.5 bg-[#09090B]/50 border border-[#2A2A2F] rounded-xl flex flex-col justify-between h-[85px]"
              >
                <div>
                  <h4 className="text-xs font-bold text-white">{agent.name}</h4>
                  <p className="text-[9px] text-zinc-500 mt-0.5 leading-none">{agent.desc}</p>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${agent.color} animate-pulse shadow-[0_0_8px_currentColor]`} />
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{agent.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 3. Live AI Activity Feed (Timeline list) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Timeline (Left, 7 cols) */}
        <div className="lg:col-span-7 bg-[#18181B]/40 backdrop-blur-md border border-[#2A2A2F] rounded-2xl p-6 shadow-xl flex flex-col">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Live AI Activity Feed</h3>
          <div className="relative border-l border-[#2A2A2F] ml-3 pl-6 space-y-6 flex-1">
            {activities.map((activity) => {
              const config = getActivityIcon(activity.type);
              const ActIcon = config.icon;
              return (
                <div key={activity.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[35px] top-0.5 p-1 rounded-full border border-[#18181B] ${config.bg} ${config.color} transition-transform group-hover:scale-105 duration-200`}>
                    <ActIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-zinc-200 group-hover:text-[#3B82F6] transition-colors">{activity.title}</h4>
                      <span className="text-[9px] text-zinc-500 font-medium">{activity.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{activity.details}</p>
                    
                    {/* Render specific citation and confidence badges for feed detail */}
                    {(activity.confidence !== undefined || activity.source) && (
                      <div className="flex items-center space-x-3 pt-1 text-[9px] font-semibold text-zinc-500">
                        {activity.confidence !== undefined && (
                          <span className="text-emerald-500 uppercase tracking-wider bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">
                            Conf: {(activity.confidence * 100).toFixed(0)}%
                          </span>
                        )}
                        {activity.source && (
                          <span className="flex items-center space-x-1">
                            <BookOpen className="w-3 h-3 text-zinc-600" />
                            <span>Source: {activity.source}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Knowledge Gaps & Validation Queue (Right, 5 cols) */}
        <div className="lg:col-span-5 bg-[#18181B]/40 backdrop-blur-md border border-[#2A2A2F] rounded-2xl p-6 shadow-xl space-y-6 font-sans">
          
          {/* Validation Queue Header */}
          <div className="flex items-center space-x-2.5 text-amber-500">
            <AlertTriangle className="w-4 h-4" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Compliance Warnings</h3>
          </div>

          <p className="text-zinc-400 text-xs leading-relaxed">
            Validation logic audited the knowledge base and caught the following compliance voids:
          </p>

          <div className="space-y-3">
            {gaps.map((gap, i) => (
              <div 
                key={i}
                className="p-3.5 bg-[#09090B]/50 border border-[#2A2A2F] rounded-xl flex items-start space-x-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <span className="text-zinc-300 text-xs leading-relaxed">{gap}</span>
              </div>
            ))}
          </div>

          {/* Infrastructure Specs */}
          <div className="pt-4 border-t border-[#2A2A2F] space-y-2">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Infrastructure status</h4>
            <div className="flex items-center space-x-2 text-[10px] text-zinc-400">
              <Server className="w-3.5 h-3.5 text-emerald-500" />
              <span>FastAPI Router active on port 8000</span>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
