from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


# ==========================================
# Extraction / Knowledge Schema Definitions
# ==========================================

class KnowledgeUnitSchema(BaseModel):
    """Pydantic model representing an enriched structured unit of extracted institutional knowledge."""
    title: str = Field(..., description="Short descriptive title of the knowledge unit")
    category: str = Field(..., description="The context category, e.g. Deployment, Security, HR, Finance, Operations")
    system_or_domain: str = Field(..., description="The primary software system or business domain affected")
    knowledge: str = Field(..., description="The core actionable knowledge, workflow, or instruction")
    reason: Optional[str] = Field(default=None, description="The rationale or reason why this knowledge is important")
    importance: str = Field(..., description="Significance level of this knowledge: High, Medium, or Low")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Extraction confidence score from 0.0 to 1.0")
    source: Optional[str] = Field(default=None, description="Origin references, such as transcript session or document name")
    knowledge_type: str = Field(..., description="Type of knowledge: Procedure, Dependency, Best Practice, Risk, Troubleshooting, Lesson Learned, Policy, Operational Tip")
    tags: List[str] = Field(default_factory=list, description="Descriptive metadata tags for indexing")
    affected_systems: List[str] = Field(default_factory=list, description="List of systems, databases, or departments impacted")
    keywords: List[str] = Field(default_factory=list, description="A list of core search keywords for filtering")
    business_impact: str = Field(..., description="Description of the business value or risk mitigation of this knowledge")


class ExtractionResponseSchema(BaseModel):
    """Pydantic model representing the list of extracted knowledge units returned by the LLM."""
    knowledge_units: List[KnowledgeUnitSchema] = Field(..., description="The list of individual, non-duplicate institutional knowledge units.")


class ValidationReportSchema(BaseModel):
    """Pydantic model representing a validation report auditing an individual extracted Knowledge Unit."""
    knowledge_unit_id: int = Field(..., description="The unique database ID of the evaluated Knowledge Unit")
    validation_status: str = Field(..., description="Audit status: Validated, Needs Review, Incomplete, Conflict Detected")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Audit confidence score from 0.0 to 1.0 based on consistency and detail")
    issues: List[str] = Field(default_factory=list, description="List of identified issues, gaps, or clarity concerns")
    recommendations: List[str] = Field(default_factory=list, description="Actionable recommendations for consolidation, correction, or review")
    missing_information: List[str] = Field(default_factory=list, description="Missing technical or operational context required")
    potential_conflicts: List[str] = Field(default_factory=list, description="Specific details of contradictions detected with reference documentation")
    requires_follow_up: bool = Field(..., description="True if this knowledge unit requires employee clarification")
    follow_up_questions: List[str] = Field(default_factory=list, description="Actionable follow-up questions to resolve gaps or contradictions")
    verification_status: str = Field(..., description="Overall verification result, e.g. Pass, Fail, Pending")


class ValidationResponseSchema(BaseModel):
    """Pydantic model representing the list of validation reports returned by the LLM."""
    validation_reports: List[ValidationReportSchema] = Field(..., description="The list of validation audits for each knowledge unit.")


class CitationSchema(BaseModel):
    """Pydantic model representing a RAG search result citation reference."""
    source: str = Field(..., description="Source origin, e.g. document name or interview session ID")
    content: str = Field(..., description="Actual text segment cited from the source")
    location: Optional[str] = Field(
        default=None, 
        description="Document page number, row offset, or chat message index"
    )


# ==========================================
# API Request / Response Schema Definitions
# ==========================================

class HealthCheckResponse(BaseModel):
    """Pydantic response model for /health endpoint."""
    status: str
    database: str
    groq: str
    chromadb: str
    app: str


class DocumentUploadResponse(BaseModel):
    """Pydantic response model for document uploads."""
    document_id: int
    session_id: Optional[str]
    filename: str
    page_count: int
    processing_status: str
    message: str


class InterviewStartRequest(BaseModel):
    """Pydantic request payload for starting a new exit interview session."""
    employee_name: str
    employee_role: str
    session_id: Optional[str] = None  # If not provided, backend generates one


class InterviewStartResponse(BaseModel):
    """Pydantic response payload when initiating an interview session."""
    session_id: str
    message: str
    current_stage: str


class InterviewMessageRequest(BaseModel):
    """Pydantic request payload when submitting an interview user response."""
    session_id: str
    message: str


class KnowledgeTrackerSchema(BaseModel):
    """Internal knowledge tracking metadata for Interview Agent reasoning."""
    covered_topics: List[str] = Field(..., description="List of topics successfully explored so far.")
    remaining_topics: List[str] = Field(..., description="Topics that still require exploration.")
    important_findings: List[str] = Field(..., description="Key institutional findings or risks uncovered.")
    knowledge_gaps: List[str] = Field(..., description="Identified areas where operational details are missing.")

class InterviewTurnSchema(BaseModel):
    """Pydantic model representing structured output from LLM for an interview turn."""
    response: str = Field(..., description="The next interviewer question or response statement.")
    is_finished: bool = Field(..., description="True if the interview has reached its natural conclusion.")
    internal_tracker: KnowledgeTrackerSchema = Field(..., description="Internal state representing current knowledge coverage status.")

class InterviewMessageResponse(BaseModel):
    """Pydantic response payload after processing an interview exchange."""
    session_id: str
    response: str
    conversation_history: List[Dict[str, Any]]
    current_stage: str
    is_finished: bool


class ProcessRequest(BaseModel):
    """Pydantic request payload for starting post-interview processing."""
    session_id: str


class ProcessResponse(BaseModel):
    """Pydantic response payload for processing results."""
    session_id: str
    stage: str
    confidence_score: float
    knowledge_units_extracted: int
    validation_status: str
    generated_documents: List[str]


class QueryResponse(BaseModel):
    """Pydantic response payload for QA / RAG endpoint."""
    query: str
    answer: str
    citations: List[CitationSchema]


class GeneratedDocumentSchema(BaseModel):
    """Pydantic model representing structured sections of a generated corporate document."""
    title: str = Field(..., description="Document title")
    doc_type: str = Field(..., description="Document type, e.g. Standard Operating Procedure (SOP), Runbook, etc.")
    purpose: str = Field(..., description="Specific purpose of the document")
    business_value: str = Field(..., description="Value to corporate operations")
    scope: str = Field(..., description="Applicable boundaries or users")
    prerequisites: List[str] = Field(default_factory=list, description="Actions or dependencies required beforehand")
    instructions: List[str] = Field(default_factory=list, description="Step-by-step instructions or procedures")
    best_practices: List[str] = Field(default_factory=list, description="Do's and guidelines for better performance")
    warnings: List[str] = Field(default_factory=list, description="Crucial alerts or risks to avoid")
    common_mistakes: List[str] = Field(default_factory=list, description="Pitfalls usually encountered by employees")
    business_impact: str = Field(..., description="Description of the business value or risk mitigation")
    related_documents: List[str] = Field(default_factory=list, description="References to official documents without IDs")
    knowledge_sources: List[str] = Field(default_factory=list, description="Source attributions like interviews or PDFs")
    version: str = Field(default="1.0.0", description="Document version")
    status: str = Field(default="Generated from Validated Knowledge", description="Document approval status")
    topics: List[str] = Field(default_factory=list, description="Main topics covered in this document")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Overall confidence level derived from sources")
    changelog: List[str] = Field(default_factory=list, description="List of changes introduced in this version")


class DocumentationResponseSchema(BaseModel):
    """Pydantic model wrapping the list of generated structured documents."""
    documents: List[GeneratedDocumentSchema] = Field(..., description="The list of compiled corporate documents.")


class QAResponseSchema(BaseModel):
    """Structured response for Enterprise QA queries."""
    answer: str = Field(..., description="Concise and technically accurate answer text")
    confidence_score: float = Field(..., description="Numerical confidence score (0.0 - 1.0)")
    confidence_percentage: str = Field(..., description="Confidence percentage string, e.g. '94%'")
    confidence_reason: str = Field(..., description="Explanation of confidence assessment")
    citations: List[str] = Field(default_factory=list, description="Human-readable citation strings")
    related_topics: List[str] = Field(default_factory=list, description="Recommended follow-up topics")
    used_sources: List[str] = Field(default_factory=list, description="Sources accessed during RAG")
