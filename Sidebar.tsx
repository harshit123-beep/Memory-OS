'use client';

import React from 'react';
import { 
  Brain, 
  Activity, 
  FileText, 
  UserCheck, 
  Grid, 
  BookOpen, 
  MessageSquare, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab,
  isCollapsed,
  setIsCollapsed
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Memory Center', icon: Activity },
    { id: 'upload', label: 'Documents', icon: FileText },
    { id: 'interview', label: 'Knowledge Capture', icon: UserCheck },
    { id: 'knowledge_units', label: 'Knowledge Units', icon: Grid },
    { id: 'documentation', label: 'Documentation', icon: BookOpen },
    { id: 'qa', label: 'Ask MemoryOS', icon: MessageSquare },
  ];

  return (
    <aside className={`bg-[#09090B] border-r border-[#2A2A2F] flex flex-col justify-between h-screen fixed left-0 top-0 text-[#FAFAFA] z-40 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-16 md:w-56'
    }`}>
      {/* Brand logo details + Collapsible toggle */}
      <div className={`border-b border-[#2A2A2F] flex items-center h-16 transition-all duration-300 ${
        isCollapsed ? 'justify-center p-0' : 'p-4 justify-between'
      }`}>
        <div className="flex items-center space-x-3 justify-start overflow-hidden">
          <div className="p-2 bg-[#3B82F6]/10 rounded-lg text-[#3B82F6] shrink-0 shadow-inner">
            <Brain className="w-5 h-5 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="hidden md:block">
              <h1 className="font-extrabold text-sm tracking-tight text-white leading-none">MemoryOS</h1>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1 block">AI-OS</span>
            </div>
          )}
        </div>
        
        {/* Toggle button visible on desktop */}
        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            className="hidden md:flex p-1.5 hover:bg-[#18181B] rounded-lg text-zinc-500 hover:text-white transition-all border border-[#2A2A2F] hover:border-zinc-700"
            title="Collapse Sidebar"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 py-6 px-3 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center rounded-lg text-xs font-semibold tracking-tight transition-all duration-300 group relative ${
                isCollapsed 
                  ? 'justify-center px-0 py-2.5' 
                  : 'justify-center md:justify-start space-x-3.5 px-3 py-2.5'
              } ${
                isActive 
                  ? 'bg-[#18181B] text-white border border-[#2A2A2F] shadow-lg shadow-black/40' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#18181B]/40'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              {/* Soft glowing indicator inside active pill */}
              {isActive && (
                <span className="absolute left-0 w-1 top-2 bottom-2 rounded-r-full bg-[#3B82F6] shadow-[0_0_10px_#3B82F6]" />
              )}
              <Icon className={`w-4 h-4 shrink-0 transition-all duration-300 ${
                isActive ? 'scale-110 text-[#3B82F6]' : 'group-hover:scale-105'
              }`} />
              {!isCollapsed && <span className="hidden md:block truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom system settings row & Expand Toggle */}
      <div className="p-3 border-t border-[#2A2A2F] space-y-2">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all duration-300 ${
            isCollapsed 
              ? 'justify-center px-0 py-2.5' 
              : 'justify-center md:justify-start space-x-3.5 px-3 py-2.5'
          } ${
            activeTab === 'settings' 
              ? 'bg-[#18181B] text-white border border-[#2A2A2F]' 
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#18181B]/40'
          }`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span className="hidden md:block">Settings</span>}
        </button>

        {/* Expand button visible only when collapsed on desktop */}
        {isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(false)}
            className="hidden md:flex w-full justify-center py-2.5 hover:bg-[#18181B] rounded-lg text-zinc-500 hover:text-white transition-all border border-dashed border-[#2A2A2F] hover:border-zinc-700"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </aside>
  );
}
