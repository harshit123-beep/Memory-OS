import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Ensure environment uses test database
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_pytest.db"
os.environ["API_DEBUG"] = "true"

from app.main import app
from app.database.session import Base, get_db

test_engine = create_async_engine(
    "sqlite+aiosqlite:///./test_pytest.db",
    echo=False,
    future=True
)

test_async_session = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def override_get_db():
    async with test_async_session() as session:
        try:
            yield session
        finally:
            await session.close()

app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    if os.path.exists("./test_pytest.db"):
        try:
            os.remove("./test_pytest.db")
        except Exception:
            pass

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac
