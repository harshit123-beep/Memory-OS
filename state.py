from typing import TypedDict, List, Dict, Any, Optional


class MemoryState(TypedDict, total=False):
    """The LangGraph state tracker for MemoryOS exit interview processes."""
    
    session_id: str
    """Unique identifier for the current exit interview session."""

    conversation_history: List[Dict[str, Any]]
    """The chronological list of formatted exchange pairs (e.g. role, content)."""

    messages: List[Dict[str, Any]]
    """Raw message histories or system flags passed during the session."""

    transcript: str
    """The aggregated raw text conversation transcript."""

    uploaded_documents: List[Dict[str, Any]]
    """Reference details of documents uploaded for context injection."""

    knowledge_units: List[Dict[str, Any]]
    """List of extracted institutional knowledge models."""

    knowledge_count: int
    """Total count of successfully extracted institutional knowledge units."""

    validation_reports: List[Dict[str, Any]]
    """Detailed list of validation reports auditing each knowledge unit."""

    validated_units: List[Dict[str, Any]]
    """Filtered list of knowledge units that successfully passed validation audits."""

    generated_documents: List[str]
    """Local storage file paths to completed SOPs, Guides, and Summaries."""

    documentation_count: int
    """Total count of successfully generated documentation manuals."""

    confidence_score: float
    """Weighted metric (0.0 - 1.0) assessing overall knowledge trustworthiness."""

    follow_up_questions: List[str]
    """Targeted questions compiled by the Validation Agent to fill information gaps."""

    citations: List[Dict[str, Any]]
    """Retrieved reference citations for verification."""

    current_stage: str
    """Active node processing stage (e.g. interview, extraction, validation, documentation, qa)."""

    query: str
    """User search query string."""

    retrieved_documents: List[str]
    """List of reference document filenames or paths retrieved."""

    retrieved_knowledge_units: List[Dict[str, Any]]
    """List of validated knowledge units retrieved."""

    generated_answer: str
    """Answer string compiled by the QA Agent."""

    final_response: str
    """Last response content ready to be sent to the API client."""
