import shutil
from pathlib import Path
from typing import BinaryIO
from app.core.config import settings
import logging

logger = logging.getLogger("app.services.storage")


class StorageService:
    """Handles local file storage operations for uploaded files and generated documentation."""

    def __init__(self):
        self.uploads_dir = settings.UPLOADS_DIR
        self.generated_docs_dir = settings.GENERATED_DOCS_DIR
        
        # Double check directory creation
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.generated_docs_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"StorageService initialized. Uploads: {self.uploads_dir}, Generated Docs: {self.generated_docs_dir}")

    def save_upload(self, file_content: BinaryIO, filename: str) -> Path:
        """Saves an incoming upload file stream to the uploads directory."""
        dest_path = self.uploads_dir / filename
        try:
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file_content, buffer)
            logger.info(f"Successfully saved uploaded file to {dest_path}")
            return dest_path
        except Exception as e:
            logger.error(f"Failed to save upload {filename}: {str(e)}")
            raise

    def save_generated_document(self, content: str, filename: str) -> Path:
        """Writes generated markdown documentation or reports to the generated docs directory."""
        dest_path = self.generated_docs_dir / filename
        try:
            with open(dest_path, "w", encoding="utf-8") as f:
                f.write(content)
            logger.info(f"Successfully saved generated document to {dest_path}")
            return dest_path
        except Exception as e:
            logger.error(f"Failed to save generated document {filename}: {str(e)}")
            raise


storage_service = StorageService()
