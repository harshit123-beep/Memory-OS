from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings

# Create async database engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.API_DEBUG,
    future=True
)

# Create async session maker
async_session = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# Declarative Base for models (SQLAlchemy 2.x style)
class Base(DeclarativeBase):
    pass

# FastAPI Dependency
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection helper to yield an asynchronous database session."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
            
async def init_db() -> None:
    """Helper to initialize the database schema. In production, migrations should be used."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
