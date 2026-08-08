'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  Server,
  Layers,
  Database
} from 'lucide-react';

interface DocumentUploadProps {
  onUploadComplete: (filename: string) => void;
  uploadedDocsList: any[];
}

type UploadStage = 'idle' | 'uploading' | 'parsing' | 'chunking' | 'embedding' | 'indexed' | 'error';

export default function DocumentUpload({ onUploadComplete, uploadedDocsList }: DocumentUploadProps) {
  const [stage, setStage] = useState<UploadStage>('idle');
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages = [
    { key: 'uploading', label: 'Uploading file data to server...' },
    { key: 'parsing', label: 'Extracting PDF layout text...' },
    { key: 'chunking', label: 'Chunking semantic boundaries...' },
    { key: 'embedding', label: 'Generating vector space embeddings...' },
    { key: 'indexed', label: 'Qdrant DB persistent write indexed!' }
  ];

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setStage('error');
      setErrorMessage('MemoryOS requires a PDF reference document.');
      return;
    }

    setFileName(file.name);
    setStage('uploading');

    try {
      await new Promise((res) => setTimeout(res, 800));
      
      setStage('parsing');
      const formData = new FormData();
      formData.append('file', file);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const res = await fetch(`${baseUrl}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to upload document.');
      }

      setStage('chunking');
      await new Promise((res) => setTimeout(res, 900));

      setStage('embedding');
      await new Promise((res) => setTimeout(res, 800));

      setStage('indexed');
      await new Promise((res) => setTimeout(res, 800));

      setTimeout(() => {
        onUploadComplete(file.name);
      }, 1000);

    } catch (err: any) {
      setStage('error');
      setErrorMessage(err.message || 'FastAPI connection failed.');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (stage !== 'idle' && stage !== 'error') return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const getStageIdx = (current: UploadStage) => {
    const list = ['idle', 'uploading', 'parsing', 'chunking', 'embedding', 'indexed'];
    return list.indexOf(current);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-12 max-w-5xl mx-auto"
    >
      <AnimatePresence mode="wait">
        {stage === 'idle' || stage === 'error' ? (
          <div className="space-y-10">
            {/* Vercel-style Drag-and-drop Dropzone */}
            <motion.div
              key="dropzone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerSelectFile}
              className={`relative border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                isDragActive 
                  ? 'border-[#3B82F6] bg-[#3B82F6]/5 shadow-2xl shadow-[#3B82F6]/5' 
                  : 'border-[#27272A] bg-[#18181B]/50 hover:border-[#3B82F6]/40 hover:bg-[#18181B]'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={onFileSelect}
              />

              <div className={`p-4 bg-[#27272A]/50 text-zinc-400 rounded-2xl mb-6 transition-all duration-300 ${
                isDragActive ? 'text-[#3B82F6] bg-[#3B82F6]/10 scale-105' : ''
              }`}>
                <UploadCloud className="w-10 h-10" />
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">Drag and drop your PDF here</h3>
              <p className="text-zinc-500 text-xs max-w-xs mb-6 text-center leading-relaxed">
                MemoryOS parses baseline data policies. Upload standard company PDF manuals to establish rules.
              </p>

              <button 
                type="button" 
                className="px-5 py-2 bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white rounded-lg text-xs font-bold transition-all transform active:scale-95 shadow-md shadow-[#3B82F6]/10"
              >
                Browse Files
              </button>

              {stage === 'error' && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] rounded-xl flex items-center space-x-3 text-xs max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </motion.div>

            {/* Ingestion Center details under dropzone (Prevent Empty Space Feel) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4 border-t border-[#27272A]">
              
              {/* Recently Uploaded (6 cols) */}
              <div className="md:col-span-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Recently Ingested</h4>
                <div className="space-y-2">
                  {uploadedDocsList.map((doc) => (
                    <div 
                      key={doc.id}
                      className="p-4 bg-[#18181B] border border-[#27272A] rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-2 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h5 className="text-xs font-bold text-zinc-200 truncate">{doc.name}</h5>
                          <span className="text-[9px] font-mono text-zinc-500">{doc.size} | {doc.pages} pages</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[9px] font-bold rounded-full">
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics & Specs (6 cols) */}
              <div className="md:col-span-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Vector Infrastructure</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#18181B] border border-[#27272A] rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase">Embedding Model</span>
                    <p className="text-xs font-bold text-zinc-200">all-MiniLM-L6-v2</p>
                  </div>
                  <div className="p-4 bg-[#18181B] border border-[#27272A] rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase">Qdrant Vector DB</span>
                    <p className="text-xs font-bold text-zinc-200">Qdrant Local Engine</p>
                  </div>
                  <div className="p-4 bg-[#18181B] border border-[#27272A] rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase">Average Page Chunk</span>
                    <p className="text-xs font-bold text-zinc-200">1000 characters</p>
                  </div>
                  <div className="p-4 bg-[#18181B] border border-[#27272A] rounded-xl space-y-1">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase">LLM Guardrails</span>
                    <p className="text-xs font-bold text-[#22C55E]">Enkrypt AI Active</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* Pipeline Stage indicators */
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-8 bg-[#18181B] border border-[#27272A] rounded-2xl space-y-8 max-w-2xl mx-auto"
          >
            <div className="flex items-center space-x-4 p-4 bg-[#09090B]/50 border border-[#27272A] rounded-xl">
              <div className="p-2.5 bg-[#3B82F6]/10 rounded-lg text-[#3B82F6]">
                <FileText className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{fileName}</h4>
                <p className="text-[9px] text-zinc-500 font-mono mt-0.5">PENDING INGESTION PIPELINE</p>
              </div>
            </div>

            <div className="space-y-5">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Ingestion Flow</h3>
              <div className="relative pl-6 space-y-5 border-l border-[#27272A]">
                {stages.map((stg, idx) => {
                  const activeIdx = getStageIdx(stage);
                  const isDone = idx < activeIdx;
                  const isActive = idx === activeIdx;

                  return (
                    <div key={stg.key} className="relative flex items-center justify-between">
                      <div className={`absolute -left-[30px] w-3 h-3 rounded-full border border-[#18181B] transition-all duration-300 ${
                        isDone ? 'bg-[#22C55E]' : isActive ? 'bg-[#3B82F6] ring-4 ring-[#3B82F6]/15' : 'bg-[#27272A]'
                      }`} />

                      <span className={`text-xs font-semibold ${
                        isDone ? 'text-zinc-500 line-through decoration-[#27272A]' : isActive ? 'text-white font-bold' : 'text-zinc-600'
                      }`}>
                        {stg.label}
                      </span>

                      {isActive && (
                        <Loader2 className="w-3.5 h-3.5 text-[#3B82F6] animate-spin" />
                      )}
                      {isDone && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {stage === 'indexed' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-[#22C55E]/5 border border-[#22C55E]/15 text-[#22C55E] rounded-xl flex items-center space-x-3 text-xs"
              >
                <FileCheck className="w-6 h-6 shrink-0 animate-bounce" />
                <p className="font-semibold">
                  Handover manual indexed successfully. Moving to interview...
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
