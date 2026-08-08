import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import setup_logging
from app.api.endpoints import router as api_router
from app.database.session import init_db

logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle events manager for application startup and shutdown."""
    # 1. Setup structured logging
    setup_logging()
    logger.info("Initializing MemoryOS application lifecycle...")

    # 2. Automatically generate database tables (if missing)
    try:
        await init_db()
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.critical(f"Database initialization failed on startup: {str(e)}")

    yield
    
    logger.info("Shutting down MemoryOS application lifecycle...")


# Instantiate application
app = FastAPI(
    title=settings.PROJECT_NAME,
    debug=settings.API_DEBUG,
    openapi_url=f"{settings.API_PREFIX}/openapi.json",
    docs_url=f"{settings.API_PREFIX}/docs",
    redoc_url=f"{settings.API_PREFIX}/redoc",
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_router, prefix=settings.API_PREFIX)


if __name__ == "__main__":
    import uvicorn
    logger.info(f"Starting server in direct execution mode on port {settings.API_PORT}")
    uvicorn.run("main:app", host="0.0.0.0", port=settings.API_PORT, reload=settings.API_DEBUG)
