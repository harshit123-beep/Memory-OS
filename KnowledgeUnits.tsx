'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  HelpCircle, 
  X,
  Database,
  ExternalLink,
  Bookmark
} from 'lucide-react';

export interface KnowledgeUnit {
  id: string;
  title: string;
  category: string;
  system_or_domain: string;
  knowledge: string;
  reason?: string;
  importance: 'High' | 'Medium' | 'Low';
  confidence: number;
  source: string;
  knowledge_type: string;
  tags: string[];
  business_impact?: string;
  status: 'Validated' | 'Conflict Detected' | 'Needs Review' | 'Incomplete';
  issues?: string[];
  recommendations?: string[];
}

interface KnowledgeUnitsProps {
  units: KnowledgeUnit[];
}

export default function KnowledgeUnits({ units }: KnowledgeUnitsProps) {
  const [selectedUnit, setSelectedUnit] = useState<KnowledgeUnit | null>(null);

  const getStatusConfig = (status: KnowledgeUnit['status']) => {
    switch (status) {
      case 'Validated':
        return { bg: 'bg-[#22C55E]/10 border-[#22C55E]/20 text-[#22C55E]', icon: ShieldCheck };
      case 'Conflict Detected':
        return { bg: 'bg-[#EF4444]/10 border-[#EF4444]/20 text-[#EF4444]', icon: AlertTriangle };
      case 'Needs Review':
        return { bg: 'bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]', icon: AlertTriangle };
      default:
        return { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-500', icon: HelpCircle };
    }
  };

  const getImportanceColor = (imp: KnowledgeUnit['importance']) => {
    switch (imp) {
      case 'High': return 'text-[#EF4444] bg-[#EF4444]/10';
      case 'Medium': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-zinc-400 bg-zinc-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Audit Dashboard</h2>
          <p className="text-zinc-500 text-xs mt-1">Review extracted knowledge units, logical dependencies, and policy compliance.</p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-400 bg-[#18181B] border border-[#2A2A2F] px-3.5 py-2 rounded-lg">
          <Grid className="w-4 h-4 text-[#3B82F6]" />
          <span>{units.length} Units Found</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {units.map((unit) => {
          const statusCfg = getStatusConfig(unit.status);
          const StatusIcon = statusCfg.icon;

          return (
            <motion.div
              key={unit.id}
              layoutId={`card-container-${unit.id}`}
              onClick={() => setSelectedUnit(unit)}
              whileHover={{ y: -3 }}
              className="bg-[#18181B] border border-[#2A2A2F] hover:border-[#3B82F6]/50 rounded-xl p-5 cursor-pointer flex flex-col justify-between h-[220px] transition-all duration-200 group shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">{unit.category}</span>
                  <div className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${statusCfg.bg}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{unit.status}</span>
                  </div>
                </div>

                <h3 className="text-xs font-bold text-zinc-200 group-hover:text-[#3B82F6] line-clamp-2 transition-colors">
                  {unit.title}
                </h3>

                <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                  {unit.knowledge}
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2F] mt-2">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${getImportanceColor(unit.importance)}`}>
                  {unit.importance} Priority
                </span>
                <span className="text-[10px] text-zinc-500 font-medium font-mono">
                  Confidence: {(unit.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expand Sheet Modal Overlay */}
      <AnimatePresence>
        {selectedUnit && (
          <div className="fixed inset-0 bg-[#09090B]/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              layoutId={`card-container-${selectedUnit.id}`}
              className="bg-[#18181B] border border-[#2A2A2F] w-full max-w-2xl rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setSelectedUnit(null)}
                className="absolute right-6 top-6 p-1.5 text-zinc-400 hover:text-white bg-[#2A2A2F]/60 hover:bg-[#2A2A2F] rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#3B82F6]">
                  {selectedUnit.category}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold ${getStatusConfig(selectedUnit.status).bg}`}>
                  {selectedUnit.status}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  Confidence Score: {selectedUnit.confidence.toFixed(2)}
                </span>
              </div>

              <h2 className="text-base font-bold text-white pr-8 leading-snug">
                {selectedUnit.title}
              </h2>

              <div className="p-4 bg-[#09090B]/50 border border-[#2A2A2F] rounded-xl space-y-2">
                <h4 className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Extracted Fact</h4>
                <p className="text-xs text-zinc-200 leading-relaxed font-semibold">
                  {selectedUnit.knowledge}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1">
                  <h4 className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">System Domain</h4>
                  <div className="flex items-center space-x-2 text-xs text-zinc-300 font-bold">
                    <Database className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{selectedUnit.system_or_domain}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Fact Type</h4>
                  <span className="inline-block px-2 py-0.5 bg-[#2A2A2F] text-zinc-300 rounded text-[10px] font-bold uppercase">
                    {selectedUnit.knowledge_type}
                  </span>
                </div>

                {selectedUnit.business_impact && (
                  <div className="md:col-span-2 space-y-1">
                    <h4 className="text-[9px] uppercase font-bold tracking-wider text-zinc-500">Business Impact</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {selectedUnit.business_impact}
                    </p>
                  </div>
                )}
              </div>

              {/* Audit Warnings */}
              {(selectedUnit.issues && selectedUnit.issues.length > 0) && (
                <div className="p-4 bg-[#EF4444]/5 border border-[#EF4444]/15 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-[#EF4444] font-bold text-[10px] uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Policy Auditing Voids Caught</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#EF4444]/90 leading-relaxed">
                    {selectedUnit.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Remediations */}
              {(selectedUnit.recommendations && selectedUnit.recommendations.length > 0) && (
                <div className="p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-amber-500 font-bold text-[10px] uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>System Recovery Recommendations</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-[11px] text-amber-500/90 leading-relaxed">
                    {selectedUnit.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t border-[#2A2A2F] flex items-center justify-between text-[10px] text-zinc-500 font-semibold">
                <span className="flex items-center space-x-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-zinc-600" />
                  <span>Interview Session Source: {selectedUnit.source}</span>
                </span>
                <span className="flex items-center space-x-1 text-[#3B82F6]">
                  <span>Audited successfully</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
