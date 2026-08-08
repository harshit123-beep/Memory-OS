import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App Settings
    PROJECT_NAME: str = "MemoryOS Platform"
    API_PREFIX: str = "/api/v1"
    API_PORT: int = 8000
    API_DEBUG: bool = True
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "*"  # Development fallback; restrict in strict production setups
    ]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/memoryos"

    # Groq API Configuration (Fallback)
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    LLM_TEMPERATURE: float = 0.2

    # Gemini API Configuration (Mandatory Hackathon Stack)
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # ChromaDB Configuration
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    QDRANT_PERSIST_DIR: str = "./qdrant_db"

    # Local Directory Storage Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOADS_DIR: Path = BASE_DIR / "uploads"
    GENERATED_DOCS_DIR: Path = BASE_DIR / "generated_docs"

    # Log Level
    LOG_LEVEL: str = "INFO"

    # Pydantic Settings Configuration
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


# Instantiate settings
settings = Settings()

# Ensure required local directories exist
settings.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
settings.GENERATED_DOCS_DIR.mkdir(parents=True, exist_ok=True)
