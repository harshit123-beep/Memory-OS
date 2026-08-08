'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import DotField from '@/components/DotField';

import MemoryCenter from '@/components/MemoryCenter';
import DocumentUpload from '@/components/DocumentUpload';
import KnowledgeCapture from '@/components/KnowledgeCapture';
import ProcessingScreen from '@/components/ProcessingScreen';
import KnowledgeUnits, { KnowledgeUnit } from '@/components/KnowledgeUnits';
import DocumentationView, { GeneratedDoc } from '@/components/DocumentationView';
import AskMemoryOS from '@/components/AskMemoryOS';
import { 
  Sparkles,
  ShieldCheck,
  Zap,
  Globe,
  Database,
  Lock,
  Cpu,
  Layers,
  Search,
  Terminal
} from 'lucide-react';

type Tab = 'dashboard' | 'upload' | 'interview' | 'processing' | 'knowledge_units' | 'documentation' | 'qa' | 'settings';

export default function DashboardHome() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [sessionId, setSessionId] = useState('');
  const [employeeName, setEmployeeName] = useState('Sarah Chen');
  const [employeeRole, setEmployeeRole] = useState('Senior Data Analyst');
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Real-time backend configuration
  const [backendUrl] = useState(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1');

  // Feature pills for the Hero OS section
  const featurePills = [
    { label: 'AI Interview Agent', icon: Sparkles },
    { label: 'Knowledge Extraction', icon: Cpu },
    { label: 'Validation Engine', icon: ShieldCheck },
    { label: 'Documentation Generator', icon: Layers },
    { label: 'Enterprise Search', icon: Search }
  ];

  // Document Tracker States
  const [documents, setDocuments] = useState<any[]>([
    { id: '1', name: 'security_standards.pdf', size: '1.4 MB', pages: 8, status: 'Indexed' },
    { id: '2', name: 'billing_setup.pdf', size: '920 KB', pages: 4, status: 'Indexed' }
  ]);

  // Validated Knowledge Units list state
  const [units, setUnits] = useState<KnowledgeUnit[]>([
    {
      id: 'ku-101',
      title: 'AWS Secrets Manager Root Rotation Policy',
      category: 'Security',
      system_or_domain: 'AWS Secrets Manager',
      knowledge: 'Migrate the root master database password into AWS Secrets Manager with restricted IAM roles to enhance credential rotation.',
      importance: 'High',
      confidence: 0.95,
      source: 'Security Policy PDF',
      knowledge_type: 'Compliance Rule',
      tags: ['aws', 'secrets', 'rotation'],
      business_impact: 'Mitigates the risk of credential leakage and automates rotations.',
      status: 'Validated'
    },
    {
      id: 'ku-102',
      title: 'AWS S3 Nightly Database Backup',
      category: 'Database',
      system_or_domain: 'AWS S3',
      knowledge: 'Automated nightly SQL backups on AWS S3 are configured in collaboration with the DevOps pipeline.',
      importance: 'High',
      confidence: 0.90,
      source: 'DevOps Handover Interview',
      knowledge_type: 'Standard Procedure',
      tags: ['aws', 's3', 'backup'],
      business_impact: 'Ensures database recoverability within 24 hours of disastrous loss.',
      status: 'Validated'
    },
    {
      id: 'ku-103',
      title: 'Manual Redis Cache Reset Procedure',
      category: 'Deployment',
      system_or_domain: 'Redis Cache',
      knowledge: 'We restart Redis after deploying software changes to clear stale page resources.',
      importance: 'Medium',
      confidence: 0.85,
      source: 'Software Lead Exit Interview',
      knowledge_type: 'Best Practice',
      tags: ['redis', 'deployment', 'cache'],
      business_impact: 'Cleans cached page resources to prevent staging/production UI lags.',
      status: 'Validated'
    },
    {
      id: 'ku-104',
      title: 'Dev Database Password physical post-it note under desk',
      category: 'Security',
      system_or_domain: 'Local Server Room',
      knowledge: 'The master database passcode is written on a physical post-it note stuck under the DevOps desk.',
      importance: 'High',
      confidence: 0.40,
      source: 'DevOps Lead Exit Interview',
      knowledge_type: 'Insecure Workaround',
      tags: ['password', 'credentials', 'workaround'],
      business_impact: 'Violates basic corporate security policies. Presents critical physical breach risks.',
      status: 'Conflict Detected',
      issues: [
        'Violates Security Policy Section 4: Plaintext passwords are strictly forbidden.',
        'Presents critical physical security risk to the on-premise DevOps office.'
      ],
      recommendations: [
        'Immediately destroy the physical note.',
        'Migrate the local developer database credentials into a secure vault.'
      ]
    }
  ]);

  // Generated SOP Manuals list state
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([
    {
      id: 'doc-201',
      title: 'SQL Database Security and Management Guide',
      filepath: 'generated_docs/sql_database_security_and_management_guide.md',
      doc_type: 'Standard Operating Procedure (SOP)',
      version: '1.0.0',
      confidence: 0.90,
      status: 'Approved for Organizational Use',
      topics: ['SQL Database Security', 'Database Management', 'Password Management'],
      knowledge_unit_count: 3,
      changelog: [
        'Version 1.0.0: Initial release of SQL database backup and Secrets Manager rotation guidelines.'
      ],
      content: `# SQL Database Security and Management Guide

## Knowledge Coverage Summary
* **Topics Covered**: SQL Database Security, Database Management, Password Management
* **Knowledge Units Used**: 3
* **Related Documents Reference Count**: 0
* **Overall Document Confidence**: 0.90 (90%)

## Purpose
To provide a comprehensive guide for managing and securing SQL databases within the organization.

## Business Value
This guide ensures the security and integrity of SQL databases, preventing data loss and unauthorized access.

## Scope
All employees with access to SQL databases.

## Prerequisites
* Basic knowledge of SQL databases
* Access to SQL database management tools

## Step-by-Step Instructions
1. Automated nightly backups on AWS S3 are set up in collaboration with the DevOps team.
2. Read-only access is granted to the Tableau service account.
3. Migrate the root master password into AWS Secrets Manager with restricted IAM roles to enhance security.

## Best Practices
* Regularly review and update database security settings
* Use secure password management practices

## Warnings
* Unauthorized access to SQL databases can lead to data breaches and security risks.

## Common Mistakes
* Using weak passwords or not rotating them regularly

## Business Impact
This guide helps prevent data loss, ensures compliance with security standards, and enhances the overall security posture of the organization.

## Version Information
* **Document Version**: 1.0.0
* **Generated Date**: 2026-08-05
* **Last Updated**: 2026-08-05
* **Documentation Status**: Generated from Validated Knowledge
* **Overall Confidence Score**: 0.90

## Changelog
### Version 1.0.0
* Added SQL database security and management procedures
* Included best practices for database security and password management`
    }
  ]);

  // Dashboard Activity Timeline State
  const [activities, setActivities] = useState<any[]>([
    { id: 'act-1', type: 'upload', title: 'security_standards.pdf Ingested', details: 'Parsed baseline standards and mapped rules into Qdrant database.', time: '2 hours ago', confidence: 1.0, source: 'Admin Upload' },
    { id: 'act-2', type: 'upload', title: 'billing_setup.pdf Ingested', details: 'Added billing setup deployment files to Qdrant persistent collection.', time: '3 hours ago', confidence: 1.0, source: 'Admin Upload' },
    { id: 'act-3', type: 'doc_generated', title: 'SQL Database Guide Generated', details: 'Compiled 3 validated units into a markdown handbook on disk.', time: '4 hours ago', confidence: 0.90, source: 'Tableau SOP' },
    { id: 'act-4', type: 'validated', title: 'Validation Completed: 1 Conflict', details: 'Validation audit flagged the post-it note password workaround as Conflict Detected.', time: '4 hours ago', confidence: 0.40, source: 'DevOps Interview' }
  ]);

  // Dashboard Gaps State
  const [gaps] = useState<string[]>([
    'Undocumented DevOps procedures regarding GitLab runner credentials.',
    'Missing configuration guide for Tableau Dashboard service accounts.'
  ]);

  // Document Upload Transition
  const handleUploadComplete = (name: string) => {
    setDocuments(prev => [
      ...prev,
      { id: String(prev.length + 1), name, size: '840 KB', pages: 3, status: 'Indexed' }
    ]);
    setActivities(prev => [
      { id: `act-new-${Date.now()}`, type: 'upload', title: `${name} Ingested`, details: 'PDF uploaded and parsed successfully.', time: 'Just now', confidence: 1.0, source: 'Admin Upload' },
      ...prev
    ]);
    setActiveTab('interview');
  };

  // Interview Finish Transition
  const handleFinishInterview = (session: string) => {
    setSessionId(session);
    setActiveTab('processing');
  };

  // Processing Completed Transition
  const handleProcessingComplete = (resultData: any) => {
    const newDocId = `doc-${Date.now()}`;
    const newDoc: GeneratedDoc = {
      id: newDocId,
      title: 'Deployment Guide',
      filepath: resultData.generated_documents[0] || 'generated_docs/deployment_guide.md',
      doc_type: 'Standard Operating Procedure (SOP)',
      version: '1.0.0',
      confidence: resultData.confidence_score,
      status: 'Approved for Organizational Use',
      topics: ['Deployment', 'GitLab'],
      knowledge_unit_count: resultData.knowledge_units_extracted,
      changelog: ['Version 1.0.0: Generated from exit interview capture.'],
      content: `# Deployment Guide

## Knowledge Coverage Summary
* **Topics Covered**: Deployment, GitLab
* **Knowledge Units Used**: 1
* **Related Documents Reference Count**: 1
* **Overall Document Confidence**: ${resultData.confidence_score.toFixed(2)} (${Math.round(resultData.confidence_score * 100)}%)

## Purpose
To outline the steps for deploying software using GitLab.

## Business Value
Streamlined deployment process for efficient software releases.

## Scope
DevOps team and related systems.

## Prerequisites
* Access to GitLab

## Step-by-Step Instructions
1. The main deployment runs on GitLab.

## Best Practices
* Regularly review and update deployment scripts.

## Warnings
* Insecure deployment practices can lead to security breaches.

## Common Mistakes
* None documented.

## Business Impact
Understanding the deployment platform is crucial for managing and maintaining the organization's software releases.

## Version Information
* **Document Version**: 1.0.0
* **Generated Date**: 2026-08-05
* **Last Updated**: 2026-08-05
* **Documentation Status**: Generated from Validated Knowledge
* **Overall Confidence Score**: ${resultData.confidence_score.toFixed(2)}`
    };

    setGeneratedDocs(prev => [...prev, newDoc]);

    const newUnit: KnowledgeUnit = {
      id: `ku-${Date.now()}`,
      title: 'GitLab Deployment Best Practice',
      category: 'Deployment',
      system_or_domain: 'GitLab',
      knowledge: 'The main deployment pipeline is hosted and runs on GitLab.',
      importance: 'Medium',
      confidence: 0.80,
      source: 'DevOps Interview',
      knowledge_type: 'Best Practice',
      tags: ['gitlab', 'deployment'],
      business_impact: 'Defines the standard deployment runner target.',
      status: 'Validated'
    };
    setUnits(prev => [newUnit, ...prev]);

    setActivities(prev => [
      { id: `act-ext-${Date.now()}`, type: 'extracted', title: 'Knowledge Extracted', details: 'Extracted GitLab deployment best practice.', time: 'Just now', confidence: 0.80, source: 'GitLab Session' },
      { id: `act-val-${Date.now()}`, type: 'validated', title: 'Validation Audit Passed', details: 'GitLab deployment validated against baseline standards.', time: 'Just now', confidence: 0.80, source: 'GitLab Session' },
      { id: `act-doc-${Date.now()}`, type: 'doc_generated', title: 'Deployment Guide Published', details: 'Handover SOP written to local generated_docs folder.', time: 'Just now', confidence: 0.80, source: 'GitLab Session' },
      ...prev
    ]);

    setSessionId('');
    setActiveTab('documentation');
  };

  const renderWorkspace = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <MemoryCenter 
            documentsCount={documents.length}
            knowledgeUnitsCount={units.length}
            generatedDocsCount={generatedDocs.length}
            knowledgeHealth={96}
            gaps={gaps}
            activities={activities}
            onNavigate={(tab) => setActiveTab(tab as Tab)}
            activeTab={activeTab}
          />
        );
      case 'upload':
        return <DocumentUpload onUploadComplete={handleUploadComplete} uploadedDocsList={documents} />;
      case 'interview':
        return (
          <KnowledgeCapture 
            sessionId={sessionId}
            setSessionId={setSessionId}
            onFinishInterview={handleFinishInterview}
          />
        );
      case 'processing':
        return (
          <ProcessingScreen 
            sessionId={sessionId} 
            onProcessingComplete={handleProcessingComplete} 
          />
        );
      case 'knowledge_units':
        return <KnowledgeUnits units={units} />;
      case 'documentation':
        return <DocumentationView documents={generatedDocs} />;
      case 'qa':
        return <AskMemoryOS onSelectTopic={(topic) => setActiveTab('qa')} />;
      case 'settings':
        return (
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6 py-6"
          >
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">System Configuration</h2>
              <p className="text-zinc-500 text-xs mt-1">Properties mapping connection channels and LLM vector models.</p>
            </div>
            
            <div className="p-6 bg-[#18181B] border border-[#2A2A2F] rounded-xl space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400">FastAPI Router Endpoint</label>
                <input 
                  type="text" 
                  value={backendUrl}
                  disabled
                  className="w-full bg-[#09090B] border border-[#2A2A2F] rounded-lg px-4 py-2.5 text-xs text-zinc-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#2A2A2F] text-xs text-zinc-400">
                <div className="space-y-1">
                  <span>LLM Provider</span>
                  <p className="text-white font-semibold">Gemini 1.5 (Pro/Flash) | Groq</p>
                </div>
                <div className="space-y-1">
                  <span>Embedding Vectorizer</span>
                  <p className="text-white font-semibold">Vertex AI (text-embedding-004) | Local</p>
                </div>
                <div className="space-y-1">
                  <span>Vector Database</span>
                  <p className="text-white font-semibold">Qdrant Vector DB (Cosine)</p>
                </div>
                <div className="space-y-1">
                  <span>Audit Engine</span>
                  <p className="text-white font-semibold">LangGraph State Machine</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default:
        return <div className="text-white">Workspace loading...</div>;
    }
  };

  const renderRightPanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="space-y-3">
              <h4 className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Live Agent Feeds</h4>
              <div className="p-3.5 bg-[#18181B] border border-[#2A2A2F] rounded-xl flex items-center space-x-3 text-xs">
                <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse shadow-[0_0_8px_#22C55E]" />
                <div>
                  <h5 className="font-semibold text-zinc-200">Knowledge Base Synced</h5>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Audits index online</p>
                </div>
              </div>
              <div className="p-3.5 bg-[#18181B] border border-[#2A2A2F] rounded-xl flex items-center space-x-3 text-xs">
                <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
                <div>
                  <h5 className="font-semibold text-zinc-200">Validation System Active</h5>
                  <p className="text-[9px] text-zinc-500 mt-0.5">Logical rules compliance checks</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-4 border-t border-[#2A2A2F]">
              <h4 className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 font-mono">Qdrant DB Stats</h4>
              <div className="space-y-2 text-xs text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Vector Chunks</span>
                  <span className="font-mono text-white font-semibold">128 Chunks</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Model Type</span>
                  <span className="font-mono text-white font-semibold">SentenceTransformer</span>
                </div>
              </div>
            </div>
          </>
        );
      case 'upload':
        return (
          <>
            <h4 className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Ingestion details</h4>
            <div className="p-4 bg-[#18181B] border border-[#2A2A2F] rounded-xl space-y-3 text-xs">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Ingestion File</span>
                <span className="text-white font-semibold font-mono">PDF (.pdf)</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Vector Size</span>
                <span className="text-white font-semibold font-mono">384 dims</span>
              </div>
            </div>
          </>
        );
      default:
        return (
          <div className="space-y-3">
            <h4 className="text-[9px] uppercase font-bold tracking-widest text-zinc-500">Memory Integrity</h4>
            <div className="p-3.5 bg-[#18181B] border border-[#2A2A2F] rounded-xl flex items-center space-x-3 text-xs">
              <Zap className="w-4 h-4 text-[#3B82F6]" />
              <div>
                <h5 className="font-semibold text-zinc-200">Confidence Average</h5>
                <p className="text-[9px] text-[#22C55E] font-bold mt-0.5">88% Nominal Trust</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans antialiased relative">
      
      {/* Cinematic animated background (Orbital rings and shifting blur glows) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] border border-[#2A2A2F]/15 rounded-full animate-orbit-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-dashed border-[#2A2A2F]/10 rounded-full animate-orbit-slower" />
        
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-[#3B82F6]/5 filter blur-[90px] animate-orb-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#8B5CF6]/5 filter blur-[100px] animate-orb-slower" />

        {/* Interactive DotField canvas background */}
        <div className="absolute inset-0 z-0 opacity-80">
          <DotField
            dotRadius={1.5}
            dotSpacing={18}
            bulgeStrength={60}
            glowRadius={200}
            sparkle={true}
            waveAmplitude={0}
            gradientFrom="rgba(255, 255, 255, 0.35)"
            gradientTo="rgba(255, 255, 255, 0.15)"
            glowColor="rgba(59, 130, 246, 0.12)"
          />
        </div>
      </div>

      {/* Left narrow sidebar menu */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
      />

      {/* Main Container */}
      <div className={`flex-1 flex h-full overflow-hidden flex-col relative z-10 transition-all duration-300 ${
        isSidebarCollapsed ? 'ml-16' : 'ml-16 md:ml-56'
      }`}>
        
        {/* Dynamic Workspace Header */}
        <header className="px-8 pt-6 pb-5 border-b border-[#2A2A2F] bg-[#09090B]/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="text-[9px] font-bold uppercase tracking-widest text-[#3B82F6]">Active Memory Core</h2>
            <h1 className="text-sm font-extrabold text-white mt-1">Knowledge Operations Console</h1>
            <p className="text-zinc-500 text-[10px] mt-0.5">System Status: Operational • Qdrant Vector Base Synced</p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Memory Health</span>
              <span className="text-xs font-black text-[#22C55E] mt-0.5 block">96%</span>
            </div>
            <div className="w-px h-6 bg-[#2A2A2F]" />
            <div className="text-right">
              <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider block">Workspace Sync</span>
              <span className="text-[9px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                3 Active Guides
              </span>
            </div>
            <div className="w-px h-6 bg-[#2A2A2F]" />
            <button 
              onClick={() => setShowRightPanel(!showRightPanel)}
              className={`p-2 rounded-lg border transition-all ${
                showRightPanel 
                  ? 'bg-[#3B82F6]/10 border-[#3B82F6] text-white' 
                  : 'bg-[#18181B] border-[#2A2A2F] text-zinc-400 hover:text-white'
              }`}
              title="Toggle AI Context Panel"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* 2. Main Workspace */}
          <main className="flex-1 p-8 overflow-y-auto min-w-0 h-full">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {renderWorkspace()}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* 3. Right Context Panel */}
          <AnimatePresence>
            {showRightPanel && activeTab !== 'documentation' && activeTab !== 'processing' && (
              <motion.aside 
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 288, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="bg-[#09090B]/60 backdrop-blur-md border-l border-[#2A2A2F] p-6 space-y-6 flex flex-col shrink-0 h-full overflow-y-auto z-10 overflow-hidden"
              >
                <div className="w-60 space-y-6">
                  <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest pb-3 border-b border-[#2A2A2F] flex items-center justify-between">
                    <span>AI Context Panel</span>
                    <button onClick={() => setShowRightPanel(false)} className="text-zinc-500 hover:text-white text-[10px]">Close</button>
                  </h3>
                  {renderRightPanel()}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
