import fitz  # PyMuPDF
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple

logger = logging.getLogger("app.services.document_processor")


class DocumentProcessingError(Exception):
    """Raised when parsing or chunking operations fail."""
    pass


class PDFParserService:
    """Extracts text page-by-page from local PDF files using PyMuPDF."""

    @staticmethod
    def parse_pdf(filepath: Path) -> List[Tuple[int, str]]:
        """Reads a PDF file from disk and returns a list of (page_number, text) tuples.
        
        Raises DocumentProcessingError if the file is invalid or empty.
        """
        if not filepath.exists():
            raise DocumentProcessingError(f"PDF file not found at: {filepath}")

        try:
            logger.info(f"Opening PDF document: {filepath.name}")
            doc = fitz.open(filepath)
            page_count = doc.page_count
            logger.info(f"PDF opened successfully. Total pages: {page_count}")

            if page_count == 0:
                raise DocumentProcessingError(f"PDF document '{filepath.name}' is empty (has 0 pages).")

            extracted_pages = []
            total_characters = 0

            for page_idx in range(page_count):
                page = doc.load_page(page_idx)
                # Extract text using PyMuPDF plain text layout extractor
                page_text = page.get_text("text").strip()
                page_number = page_idx + 1  # 1-indexed for reader readability
                
                # Record page text (even if empty, but log warning)
                if not page_text:
                    logger.warning(f"Page {page_number} in PDF '{filepath.name}' returned no text.")
                
                extracted_pages.append((page_number, page_text))
                total_characters += len(page_text)

            # Close document handle
            doc.close()

            if total_characters == 0:
                raise DocumentProcessingError(f"PDF document '{filepath.name}' contains no readable text content.")

            logger.info(f"PDF parsing complete. Extracted {total_characters} characters across {page_count} pages.")
            return extracted_pages

        except fitz.FileDataError as fe:
            logger.error(f"PyMuPDF could not read file format: {str(fe)}")
            raise DocumentProcessingError(f"Invalid PDF structure or corrupted file: {str(fe)}") from fe
        except Exception as e:
            logger.error(f"Unexpected error parsing PDF {filepath.name}: {str(e)}")
            raise DocumentProcessingError(f"Failed to parse PDF document: {str(e)}") from e


class TextChunkerService:
    """Splits raw text into sliding window chunks, preserving source page index and identifiers."""

    def __init__(self, chunk_size: int = 900, overlap: int = 180):
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.stride = chunk_size - overlap
        
        # Validation checks
        if chunk_size <= overlap:
            raise ValueError("Chunk size must be strictly greater than overlap.")
        if overlap < 0:
            raise ValueError("Overlap cannot be negative.")

        logger.info(f"Initialized TextChunkerService with chunk_size={chunk_size}, overlap={overlap}")

    def chunk_document(self, document_id: int, filename: str, pages: List[Tuple[int, str]]) -> List[Dict[str, Any]]:
        """Chunks pages text, assigning metadata.
        
        Returns a list of dictionaries, each containing:
        - text: Str chunk content
        - metadata: Dict with keys [document_id, filename, page, chunk_number]
        - chunk_id: Str unique identifier
        """
        chunks = []
        chunk_global_index = 0

        for page_number, page_text in pages:
            if not page_text:
                continue

            text_len = len(page_text)
            
            # If page text is smaller than chunk size, save it as a single chunk
            if text_len <= self.chunk_size:
                chunk_id = f"doc_{document_id}_p{page_number}_c0"
                chunks.append({
                    "text": page_text,
                    "metadata": {
                        "document_id": document_id,
                        "filename": filename,
                        "page": page_number,
                        "chunk_number": 0
                    },
                    "chunk_id": chunk_id
                })
                continue

            # Sliding window splits
            start = 0
            page_chunk_index = 0
            
            while start < text_len:
                end = min(start + self.chunk_size, text_len)
                chunk_text = page_text[start:end].strip()
                
                if chunk_text:
                    chunk_id = f"doc_{document_id}_p{page_number}_c{page_chunk_index}"
                    chunks.append({
                        "text": chunk_text,
                        "metadata": {
                            "document_id": document_id,
                            "filename": filename,
                            "page": page_number,
                            "chunk_number": page_chunk_index
                        },
                        "chunk_id": chunk_id
                    })
                    page_chunk_index += 1
                    chunk_global_index += 1

                # If we've processed up to the end of the text, break
                if end == text_len:
                    break
                    
                start += self.stride

        logger.info(f"Chunking complete. Created {len(chunks)} chunks for document ID: {document_id}")
        return chunks


# Instantiate default chunking service
document_chunker = TextChunkerService()
