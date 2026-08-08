'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, 
  Loader2, 
  Cpu, 
  ShieldCheck, 
  FileCode, 
  BrainCircuit, 
  TrendingUp 
} from 'lucide-react';

interface ProcessingScreenProps {
  sessionId: string;
  onProcessingComplete: (data: any) => void;
}

type StepStatus = 'pending' | 'active' | 'completed';

interface PipelineStep {
  key: string;
  label: string;
  sub: string;
  icon: React.ComponentType<any>;
}

export default function ProcessingScreen({
  sessionId,
  onProcessingComplete
}: ProcessingScreenProps) {
  const [steps, setSteps] = useState<Record<string, StepStatus>>({
    interview: 'completed',
    extraction: 'pending',
    validation: 'pending',
    documentation: 'pending',
    updated: 'pending'
  });

  const pipeline: PipelineStep[] = [
    { key: 'interview', label: 'Interview Finished', sub: 'Chat log captured', icon: BrainCircuit },
    { key: 'extraction', label: 'Knowledge Extraction', sub: 'Parsing JSON knowledge units', icon: Cpu },
    { key: 'validation', label: 'Knowledge Validation', sub: 'Auditing duplication & security conflicts', icon: ShieldCheck },
    { key: 'documentation', label: 'Documentation Compile', sub: 'Generating Markdown manuals', icon: FileCode },
    { key: 'updated', label: 'Memory Base Synced', sub: 'Updated local search vectors', icon: TrendingUp }
  ];

  useEffect(() => {
    let active = true;

    const triggerProcess = async () => {
      // 1. Kick off visual timers to show steps progress
      if (active) setSteps(prev => ({ ...prev, extraction: 'active' }));
      await new Promise(res => setTimeout(res, 2000));
      
      if (active) setSteps(prev => ({ ...prev, extraction: 'completed', validation: 'active' }));
      await new Promise(res => setTimeout(res, 2500));

      if (active) setSteps(prev => ({ ...prev, validation: 'completed', documentation: 'active' }));

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${baseUrl}/process`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) throw new Error('Backend failed to process session.');

        const resultData = await response.json();

        // 3. Fast-forward the visual status checks to completed on success
        if (active) {
          setSteps({
            interview: 'completed',
            extraction: 'completed',
            validation: 'completed',
            documentation: 'completed',
            updated: 'active'
          });
          
          await new Promise(res => setTimeout(res, 1200));
          
          setSteps(prev => ({ ...prev, updated: 'completed' }));
          
          await new Promise(res => setTimeout(res, 1000));
          
          // Complete and pass back data
          onProcessingComplete(resultData);
        }

      } catch (err) {
        alert('Pipeline processing crash: ' + err);
        // Fallback reset on error
        if (active) {
          setSteps({
            interview: 'completed',
            extraction: 'pending',
            validation: 'pending',
            documentation: 'pending',
            updated: 'pending'
          });
        }
      }
    };

    triggerProcess();

    return () => {
      active = false;
    };
  }, [sessionId]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto py-12 space-y-8"
    >
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">AI Handover Pipeline Running</h2>
        <p className="text-slate-400 text-sm">Compiling extracted transcripts, auditing, and publishing organizational manuals.</p>
        <div className="inline-block px-3 py-1 bg-[#4285F4]/10 text-[#4285F4] rounded-full text-xs font-mono font-semibold tracking-wider uppercase mt-4">
          Session ID: {sessionId}
        </div>
      </div>

      {/* Main Checklist Card */}
      <div className="p-8 bg-[#151B2D] border border-[#20293D] rounded-2xl space-y-8 shadow-xl">
        <div className="space-y-6">
          {pipeline.map((step, idx) => {
            const status = steps[step.key];
            const StepIcon = step.icon;
            
            const isCompleted = status === 'completed';
            const isActive = status === 'active';

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#4285F4]/5 border-[#4285F4]/30 shadow-md shadow-[#4285F4]/5' 
                    : isCompleted 
                      ? 'bg-[#20293D]/20 border-[#20293D]/60' 
                      : 'bg-transparent border-transparent'
                }`}
              >
                <div className="flex items-center space-x-4">
                  {/* Step status icon */}
                  <div className={`p-2.5 rounded-xl border transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-[#22C55E]/15 border-[#22C55E]/20 text-[#22C55E]' 
                      : isActive 
                        ? 'bg-[#4285F4]/15 border-[#4285F4]/20 text-[#4285F4]' 
                        : 'bg-[#20293D] border-[#20293D] text-slate-500'
                  }`}>
                    <StepIcon className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className={`text-sm font-semibold transition-colors duration-300 ${
                      isActive ? 'text-white' : isCompleted ? 'text-slate-400' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </h4>
                    <p className={`text-xs mt-0.5 transition-colors duration-300 ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {step.sub}
                    </p>
                  </div>
                </div>

                {/* Right side check status */}
                <div>
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center text-white">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-[#4285F4] animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-[#20293D]" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
