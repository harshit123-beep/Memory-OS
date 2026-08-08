'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  ShieldCheck, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Bookmark
} from 'lucide-react';

export interface GeneratedDoc {
  id: string;
  title: string;
  filepath: string;
  doc_type: string;
  version: string;
  confidence: number;
  status: string;
  topics: string[];
  knowledge_unit_count: number;
  content: string;
  changelog: string[];
}

interface DocumentationViewProps {
  documents: GeneratedDoc[];
}

export default function DocumentationView({ documents }: DocumentationViewProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>(documents[0]?.id || '');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const activeDoc = documents.find(d => d.id === selectedDocId) || documents[0];

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Notion-style Markdown Parser rendering elements directly in TSX
  const parseMarkdownToReact = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    
    let currentList: React.ReactNode[] = [];
    let listType: 'ol' | 'ul' | null = null;
    let listKey = 0;

    const flushList = () => {
      if (listType === 'ul') {
        elements.push(
          <ul key={`ul-${listKey++}`} className="list-disc pl-6 mb-4 space-y-2 text-zinc-300 text-xs">
            {currentList}
          </ul>
        );
      } else if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${listKey++}`} className="list-decimal pl-6 mb-4 space-y-2 text-zinc-300 text-xs">
            {currentList}
          </ol>
        );
      }
      currentList = [];
      listType = null;
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Headers
      if (trimmed.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={idx} className="text-xl font-extrabold text-white mt-6 mb-4 border-b border-[#2A2A2F] pb-2 tracking-tight">
            {trimmed.slice(2)}
          </h1>
        );
      } else if (trimmed.startsWith('## ')) {
        flushList();
        const sectionTitle = trimmed.slice(3);
        const isCollapsed = collapsedSections[sectionTitle];
        elements.push(
          <div key={idx} className="group flex items-center justify-between mt-6 mb-3 cursor-pointer select-none" onClick={() => toggleSection(sectionTitle)}>
            <h2 className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest leading-none">
              {sectionTitle}
            </h2>
            <div className="text-zinc-600 group-hover:text-[#3B82F6] transition-colors">
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </div>
        );
      } else if (trimmed.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={idx} className="text-xs font-bold text-[#3B82F6] mt-4 mb-2">
            {trimmed.slice(4)}
          </h3>
        );
      } else if (trimmed.startsWith('* ')) {
        if (listType !== 'ul') {
          flushList();
          listType = 'ul';
        }
        currentList.push(<li key={idx} className="leading-relaxed">{trimmed.slice(2)}</li>);
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (listType !== 'ol') {
          flushList();
          listType = 'ol';
        }
        const textContent = trimmed.replace(/^\d+\.\s/, '');
        currentList.push(<li key={idx} className="leading-relaxed font-semibold text-zinc-200">{textContent}</li>);
      } else if (trimmed === '') {
        flushList();
      } else {
        flushList();
        let isSectionCollapsed = false;
        for (let i = idx; i >= 0; i--) {
          const l = lines[i]?.trim();
          if (l?.startsWith('## ')) {
            const headingName = l.slice(3);
            if (collapsedSections[headingName]) {
              isSectionCollapsed = true;
            }
            break;
          }
        }

        if (!isSectionCollapsed) {
          const boldRegex = /\*\*(.*?)\*\*/g;
          const parts = [];
          let lastIndex = 0;
          let match;

          while ((match = boldRegex.exec(trimmed)) !== null) {
            if (match.index > lastIndex) {
              parts.push(trimmed.slice(lastIndex, match.index));
            }
            parts.push(<strong key={match.index} className="text-white font-bold">{match[1]}</strong>);
            lastIndex = boldRegex.lastIndex;
          }
          if (lastIndex < trimmed.length) {
            parts.push(trimmed.slice(lastIndex));
          }

          elements.push(
            <p key={idx} className="text-xs text-zinc-300 leading-relaxed mb-4">
              {parts.length > 0 ? parts : trimmed}
            </p>
          );
        }
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="h-[calc(100vh-140px)] flex">
      {/* 1. Left Document List Selector (GitBook style) */}
      <div className="w-56 border-r border-[#2A2A2F] pr-6 flex flex-col shrink-0">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Handbooks</h3>
        <div className="space-y-1.5 overflow-y-auto flex-1">
          {documents.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setSelectedDocId(doc.id)}
              className={`w-full text-left px-3.5 py-3 rounded-lg text-xs font-semibold flex items-center space-x-3 transition-colors border ${
                selectedDocId === doc.id 
                  ? 'bg-[#18181B] border-[#2A2A2F] text-white' 
                  : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-[#18181B]/40'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0 text-[#3B82F6]" />
              <span className="truncate flex-1">{doc.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Markdown Reader */}
      <div className="flex-1 px-8 overflow-y-auto min-w-0">
        {activeDoc ? (
          <div className="max-w-2xl mx-auto py-4 bg-[#18181B] border border-[#2A2A2F] rounded-2xl p-8 shadow-2xl">
            {parseMarkdownToReact(activeDoc.content)}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center border border-dashed border-[#2A2A2F] rounded-2xl p-16">
            <span className="text-zinc-500 text-xs">No generated documentation manuals found.</span>
          </div>
        )}
      </div>

      {/* 3. Right Document Metadata Context panel */}
      {activeDoc && (
        <div className="w-64 border-l border-[#2A2A2F] pl-6 flex flex-col shrink-0 justify-between">
          <div className="space-y-6 overflow-y-auto flex-1 pb-6">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Metadata Context</h3>

            {/* Confidence status */}
            <div className="p-4 bg-[#18181B] border border-[#2A2A2F] rounded-xl flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Document Trust</span>
                <h4 className="text-base font-extrabold text-white leading-none">{(activeDoc.confidence * 100).toFixed(0)}%</h4>
              </div>
              <div className="p-2 bg-[#22C55E]/10 text-[#22C55E] rounded-lg">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
            </div>

            {/* Specs */}
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Version</span>
                <span className="font-mono text-white font-bold">{activeDoc.version}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Status</span>
                <span className="text-[#22C55E] font-bold uppercase text-[10px]">{activeDoc.status}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Knowledge Units</span>
                <span className="font-mono text-white font-bold">{activeDoc.knowledge_unit_count}</span>
              </div>
            </div>

            {/* Topics */}
            <div className="space-y-2">
              <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Scope Topics</h4>
              <div className="flex flex-wrap gap-1">
                {activeDoc.topics.map((t, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-[#18181B] border border-[#2A2A2F] text-zinc-300 text-[9px] rounded font-bold">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Version log */}
            <div className="space-y-3">
              <h4 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Changelog</h4>
              <div className="space-y-2 border-l border-[#2A2A2F] pl-3 ml-1.5">
                {activeDoc.changelog && activeDoc.changelog.map((log, idx) => (
                  <div key={idx} className="relative space-y-1">
                    <div className="absolute -left-[16px] top-1.5 w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                    <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">{log}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#2A2A2F] text-[9px] text-zinc-500 font-mono flex items-center space-x-2">
            <FileText className="w-3.5 h-3.5 text-zinc-600" />
            <span className="truncate">{activeDoc.filepath}</span>
          </div>
        </div>
      )}
    </div>
  );
}
