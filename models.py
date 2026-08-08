import datetime
from typing import List, Optional, Any
from sqlalchemy import String, ForeignKey, DateTime, Text, JSON, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    employee_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    employee_role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    current_stage: Mapped[str] = mapped_column(String(50), default="interview")
    status: Mapped[str] = mapped_column(String(50), default="active")
    
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow
    )

    # Relationships
    messages: Mapped[List["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="session", cascade="all, delete-orphan"
    )
    documents: Mapped[List["UploadedDocument"]] = relationship(
        "UploadedDocument", back_populates="session", cascade="all, delete-orphan"
    )
    knowledge_units: Mapped[List["KnowledgeUnit"]] = relationship(
        "KnowledgeUnit", back_populates="session", cascade="all, delete-orphan"
    )
    validation_reports: Mapped[List["ValidationReport"]] = relationship(
        "ValidationReport", back_populates="session", cascade="all, delete-orphan"
    )
    generated_documents: Mapped[List["GeneratedDocument"]] = relationship(
        "GeneratedDocument", back_populates="session", cascade="all, delete-orphan"
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(255), ForeignKey("interview_sessions.session_id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(50))  # system, user, assistant
    content: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    # Relationships
    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="messages")


class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[Optional[str]] = mapped_column(
        String(255), ForeignKey("interview_sessions.session_id", ondelete="SET NULL"), nullable=True
    )
    filename: Mapped[str] = mapped_column(String(255))
    filepath: Mapped[str] = mapped_column(String(512))
    file_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    file_type: Mapped[str] = mapped_column(String(50))
    content_extracted: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, processed, failed
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    # Relationships
    session: Mapped[Optional["InterviewSession"]] = relationship("InterviewSession", back_populates="documents")


class KnowledgeUnit(Base):
    __tablename__ = "knowledge_units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("interview_sessions.session_id", ondelete="CASCADE")
    )
    type: Mapped[str] = mapped_column(String(100))  # procedure, best_practice, dependency, risk, tribal_knowledge
    content: Mapped[Any] = mapped_column(JSON)  # Structured JSON
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    # Relationships
    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="knowledge_units")


class ValidationReport(Base):
    __tablename__ = "validation_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("interview_sessions.session_id", ondelete="CASCADE")
    )
    content: Mapped[Any] = mapped_column(JSON)  # Audit reports, contradictions, missing fields
    confidence_score: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    # Relationships
    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="validation_reports")


class GeneratedDocument(Base):
    __tablename__ = "generated_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(255), ForeignKey("interview_sessions.session_id", ondelete="CASCADE")
    )
    filepath: Mapped[str] = mapped_column(String(512))
    type: Mapped[str] = mapped_column(String(100))  # markdown, sop, onboarding_guide, summary
    metadata_info: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )

    # Relationships
    session: Mapped["InterviewSession"] = relationship("InterviewSession", back_populates="generated_documents")


class QueryHistory(Base):
    __tablename__ = "query_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    confidence_score: Mapped[float] = mapped_column(Float)
    sources_used: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)  # List of strings
    timestamp: Mapped[datetime.datetime] = mapped_column(
        DateTime, default=datetime.datetime.utcnow
    )
