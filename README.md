# 🧠 MemoryOS — Autonomous Organizational Memory Safeguard

> **Capture. Validate. Preserve. Secure.**
>
> MemoryOS is an AI-native organizational memory platform that prevents critical knowledge loss when employees leave an organization. Using autonomous AI agents, security validation, and semantic retrieval, MemoryOS transforms fragmented tribal knowledge into secure, searchable, citation-backed documentation.
>
> Built for **Google AI Hackathon 2026**.

---

## 🌟 Overview

Every employee carries invaluable operational knowledge—deployment procedures, undocumented configurations, troubleshooting techniques, and institutional expertise.

Unfortunately, much of this disappears during employee transitions.

**MemoryOS** solves this challenge through an intelligent multi-agent workflow that:

- Conducts adaptive AI-powered exit interviews
- Extracts undocumented operational knowledge
- Detects security and compliance issues
- Generates structured SOPs automatically
- Stores knowledge inside a semantic vector database
- Enables citation-backed enterprise Q&A

The result is an organizational memory that never leaves with employees.

---

# ✨ Core Features

## 💬 Dynamic Agentic Exit Interviews

A role-aware AI interviewer powered by **Google Gemini** dynamically adapts its questions based on the employee's responses.

Instead of static forms, the interview continuously identifies missing knowledge, uncovers undocumented workflows, and explores operational dependencies.

---

## 🛡️ Enkrypt AI Prompt Security Gateway

Every prompt is routed through an active security gateway before reaching external LLMs.

The gateway automatically detects and blocks:

- API Keys
- Database credentials
- Personally Identifiable Information (PII)
- Prompt Injection attacks
- Sensitive organizational secrets

This ensures confidential enterprise data never leaves trusted boundaries.

---

## ⚠️ Compliance & Validation Audit Engine

Extracted knowledge is automatically reviewed by a validation agent.

The engine identifies:

- insecure configurations
- plaintext credentials
- policy violations
- missing documentation
- operational risks

Potential issues are surfaced before knowledge becomes part of the organization's permanent memory.

---

## 📄 AI SOP & Runbook Generator

MemoryOS converts validated interview data into beautifully structured documentation.

Generated artifacts include:

- Standard Operating Procedures (SOPs)
- Technical Runbooks
- Knowledge Base Articles
- Operational Documentation

All formatted in clean Markdown for easy publishing.

---

## 🔎 Semantic RAG Knowledge Assistant

Validated organizational knowledge is indexed inside **Qdrant Vector Database** using **Vertex AI embeddings**.

Employees can ask natural language questions through a ChatGPT-style interface and receive:

- Citation-backed answers
- Source document references
- Semantic retrieval
- High-context responses

No hallucinated documentation.

Only trusted organizational knowledge.

---

## ✨ Modern Glassmorphic Operations Console

MemoryOS features a premium enterprise interface including:

- 🌌 Animated DotField particle system
- 🕸️ Interactive WebThreads visualization
- 🌑 Dark-first glassmorphism
- ⚡ Real-time AI workflow telemetry
- 🎨 Smooth Framer Motion animations

Designed to feel like a futuristic AI operating system.

---

# 🏗️ System Architecture

```
                 Employee
                     │
                     ▼
         Agentic Exit Interview
          (Google Gemini Agent)
                     │
                     ▼
         Enkrypt Security Gateway
                     │
                     ▼
        Compliance Validation Agent
                     │
                     ▼
      Knowledge Extraction Pipeline
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
   SOP Generator          Vector Embeddings
                                │
                                ▼
                          Qdrant Database
                                │
                                ▼
                   Citation-backed RAG Assistant
```

---

# 🛠️ Tech Stack

## Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- HTML5 Canvas

---

## Backend

- Python 3.12
- FastAPI
- Uvicorn
- SQLAlchemy
- LangGraph

---

## AI & Machine Learning

- Google Gemini 1.5 Flash
- Vertex AI `text-embedding-004`
- Google GenAI SDK

---

## Database & Security

- Qdrant Vector Database
- Enkrypt AI Guardrails

---

# 🚀 Quick Start

## 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd MemoryOS
```

---

## 2️⃣ Backend Setup

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment.

### Windows

```powershell
.\.venv\Scripts\activate
```

### Linux / macOS

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 3️⃣ Frontend Setup

Navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open:

```
http://localhost:3001
```

---

# 📂 Project Structure

```
MemoryOS
│
├── backend
│   ├── app
│   │   ├── agents
│   │   │   └── interview_agent.py
│   │   │
│   │   ├── prompts
│   │   │   └── interview_prompt.md
│   │   │
│   │   ├── services
│   │   │   └── rag.py
│   │   │
│   │   └── main.py
│   │
│   └── requirements.txt
│
├── frontend
│   └── src
│       ├── app
│       │   └── dashboard
│       │       └── page.tsx
│       │
│       └── components
│           └── DotField.tsx
│
└── README.md
```

---

# 📌 Key Components

| Component | Purpose |
|------------|----------|
| `main.py` | FastAPI entry point and REST API endpoints |
| `interview_agent.py` | Conducts dynamic AI exit interviews |
| `interview_prompt.md` | Defines interview strategy and security prompts |
| `rag.py` | Handles embeddings, vector storage, and semantic retrieval |
| `dashboard/page.tsx` | Main operational dashboard |
| `DotField.tsx` | Interactive particle-field visualization |

---

# 🎯 Why MemoryOS?

Organizations lose millions each year because critical operational knowledge exists only in employees' minds.

MemoryOS transforms that invisible knowledge into a secure, searchable, and continuously accessible organizational asset through autonomous AI agents, security validation, and semantic retrieval.

Instead of replacing human expertise, MemoryOS ensures it is never lost.

---

# 🚀 Built With

- ❤️ Google AI
- ⚡ FastAPI
- ▲ Next.js
- 🧠 Gemini
- 🔍 Qdrant
- 🛡️ Enkrypt AI

---

## 📜 License

This project was created for the **Google AI Hackathon 2026** and is intended for educational and demonstration purposes.
