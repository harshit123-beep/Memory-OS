import logging
from typing import List, Optional, Any
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.models import (
    InterviewSession,
    ChatMessage,
    UploadedDocument,
    KnowledgeUnit,
    ValidationReport,
    GeneratedDocument,
    QueryHistory
)

logger = logging.getLogger("app.database.crud")


# ==========================================
# InterviewSession CRUD
# ==========================================

async def create_interview_session(
    db: AsyncSession,
    session_id: str,
    employee_name: Optional[str] = None,
    employee_role: Optional[str] = None
) -> InterviewSession:
    """Creates a new exit interview session."""
    session = InterviewSession(
        session_id=session_id,
        employee_name=employee_name,
        employee_role=employee_role,
        current_stage="interview",
        status="active"
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    logger.info(f"Created InterviewSession: {session_id}")
    return session


async def get_interview_session(
    db: AsyncSession,
    session_id: str
) -> Optional[InterviewSession]:
    """Retrieves an exit interview session by session_id."""
    stmt = select(InterviewSession).where(InterviewSession.session_id == session_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def update_interview_session_stage(
    db: AsyncSession,
    session_id: str,
    stage: str
) -> Optional[InterviewSession]:
    """Updates the current progression stage of the session."""
    stmt = (
        update(InterviewSession)
        .where(InterviewSession.session_id == session_id)
        .values(current_stage=stage)
    )
    await db.execute(stmt)
    await db.commit()
    logger.info(f"Updated InterviewSession {session_id} stage to {stage}")
    return await get_interview_session(db, session_id)


async def update_interview_session_status(
    db: AsyncSession,
    session_id: str,
    status: str
) -> Optional[InterviewSession]:
    """Updates the operational status of the session."""
    stmt = (
        update(InterviewSession)
        .where(InterviewSession.session_id == session_id)
        .values(status=status)
    )
    await db.execute(stmt)
    await db.commit()
    logger.info(f"Updated InterviewSession {session_id} status to {status}")
    return await get_interview_session(db, session_id)


# ==========================================
# ChatMessage CRUD
# ==========================================

async def add_chat_message(
    db: AsyncSession,
    session_id: str,
    role: str,
    content: str
) -> ChatMessage:
    """Persists a new message associated with a session."""
    message = ChatMessage(
        session_id=session_id,
        role=role,
        content=content
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def get_chat_messages(
    db: AsyncSession,
    session_id: str
) -> List[ChatMessage]:
    """Fetches all messages for a session ordered chronologically."""
    stmt = (
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.timestamp.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_session_transcript_dynamically(
    db: AsyncSession,
    session_id: str
) -> str:
    """Assembles and formats a complete session conversation transcript dynamically."""
    messages = await get_chat_messages(db, session_id)
    transcript_lines = []
    for msg in messages:
        # Ignore system instructions in standard output transcript if desired
        if msg.role == "system":
            continue
        sender = "Employee" if msg.role == "user" else "Interviewer"
        transcript_lines.append(f"{sender}: {msg.content}")
    
    return "\n\n".join(transcript_lines)


# ==========================================
# UploadedDocument CRUD
# ==========================================

async def add_uploaded_document(
    db: AsyncSession,
    session_id: Optional[str],
    filename: str,
    filepath: str,
    file_size: Optional[int] = None,
    file_type: str = "pdf",
    status: str = "pending"
) -> UploadedDocument:
    """Registers an uploaded document under a session (or general)."""
    doc = UploadedDocument(
        session_id=session_id,
        filename=filename,
        filepath=filepath,
        file_size=file_size,
        file_type=file_type,
        status=status
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    logger.info(f"Registered UploadedDocument: {filename} (ID: {doc.id})")
    return doc


async def update_uploaded_document_status(
    db: AsyncSession,
    doc_id: int,
    status: str,
    content_extracted: Optional[str] = None,
    page_count: Optional[int] = None
) -> Optional[UploadedDocument]:
    """Updates status, page count, and parsed textual contents of an uploaded document."""
    values = {"status": status}
    if content_extracted is not None:
        values["content_extracted"] = content_extracted
    if page_count is not None:
        values["page_count"] = page_count
        
    stmt = (
        update(UploadedDocument)
        .where(UploadedDocument.id == doc_id)
        .values(**values)
    )
    await db.execute(stmt)
    await db.commit()
    
    stmt_select = select(UploadedDocument).where(UploadedDocument.id == doc_id)
    res = await db.execute(stmt_select)
    return res.scalar_one_or_none()


async def get_uploaded_documents(
    db: AsyncSession,
    session_id: str
) -> List[UploadedDocument]:
    """Retrieves all documents assigned to a session."""
    stmt = select(UploadedDocument).where(UploadedDocument.session_id == session_id)
    res = await db.execute(stmt)
    return list(res.scalars().all())


# ==========================================
# KnowledgeUnit CRUD
# ==========================================

async def add_knowledge_unit(
    db: AsyncSession,
    session_id: str,
    unit_type: str,
    content: Any,
    confidence_score: float = 1.0
) -> KnowledgeUnit:
    """Saves a structured piece of extracted institutional knowledge."""
    unit = KnowledgeUnit(
        session_id=session_id,
        type=unit_type,
        content=content,
        confidence_score=confidence_score
    )
    db.add(unit)
    await db.commit()
    await db.refresh(unit)
    logger.info(f"Saved KnowledgeUnit of type {unit_type} for session {session_id}")
    return unit


async def get_knowledge_units(
    db: AsyncSession,
    session_id: str
) -> List[KnowledgeUnit]:
    """Retrieves all extracted knowledge items for a session."""
    stmt = select(KnowledgeUnit).where(KnowledgeUnit.session_id == session_id)
    res = await db.execute(stmt)
    return list(res.scalars().all())


# ==========================================
# ValidationReport CRUD
# ==========================================

async def add_validation_report(
    db: AsyncSession,
    session_id: str,
    content: Any,
    confidence_score: float = 1.0
) -> ValidationReport:
    """Saves a complete knowledge contradiction validation report."""
    report = ValidationReport(
        session_id=session_id,
        content=content,
        confidence_score=confidence_score
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    logger.info(f"Saved ValidationReport for session {session_id}")
    return report


async def get_validation_reports(
    db: AsyncSession,
    session_id: str
) -> List[ValidationReport]:
    """Retrieves all validation audits generated for a session."""
    stmt = select(ValidationReport).where(ValidationReport.session_id == session_id)
    res = await db.execute(stmt)
    return list(res.scalars().all())


# ==========================================
# GeneratedDocument CRUD
# ==========================================

async def add_generated_document(
    db: AsyncSession,
    session_id: str,
    filepath: str,
    doc_type: str,
    metadata_info: Optional[Any] = None
) -> GeneratedDocument:
    """Tracks a generated output file stored in local storage."""
    doc = GeneratedDocument(
        session_id=session_id,
        filepath=filepath,
        type=doc_type,
        metadata_info=metadata_info
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    logger.info(f"Registered GeneratedDocument {doc_type} at {filepath}")
    return doc


async def get_generated_documents(
    db: AsyncSession,
    session_id: str
) -> List[GeneratedDocument]:
    """Retrieves all generated output references for a session."""
    stmt = select(GeneratedDocument).where(GeneratedDocument.session_id == session_id)
    res = await db.execute(stmt)
    return list(res.scalars().all())


# ==========================================
# QueryHistory CRUD
# ==========================================

async def add_query_history(
    db: AsyncSession,
    question: str,
    answer: str,
    confidence_score: float,
    sources_used: Optional[Any] = None
) -> QueryHistory:
    """Saves a query history entry for user searches."""
    entry = QueryHistory(
        question=question,
        answer=answer,
        confidence_score=confidence_score,
        sources_used=sources_used
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    logger.info(f"Registered QueryHistory entry with ID {entry.id}")
    return entry


async def get_query_history(
    db: AsyncSession,
    limit: int = 100
) -> List[QueryHistory]:
    """Retrieves standard query history logs."""
    stmt = select(QueryHistory).order_by(QueryHistory.timestamp.desc()).limit(limit)
    res = await db.execute(stmt)
    return list(res.scalars().all())
