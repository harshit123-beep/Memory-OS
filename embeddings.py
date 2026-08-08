import logging
import os
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger("app.services.embeddings")


class EmbeddingsService:
    """Generates dense vector representations of text using Vertex AI / Google GenAI,

    falling back to Sentence Transformers for offline/local testing.
    """

    def __init__(self):
        self.local_model_name = "all-MiniLM-L6-v2"
        self.google_model_name = "text-embedding-004"
        self._google_client = None
        self._local_model = None

        # Verify Google Cloud Gemini credentials for Vertex Embeddings
        self.api_key = os.environ.get("GEMINI_API_KEY")
        
        if self.api_key:
            try:
                from google import genai
                self._google_client = genai.Client(api_key=self.api_key)
                logger.info(f"EmbeddingsService initialized with Google Vertex AI: {self.google_model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Google GenAI embeddings client: {str(e)}. Falling back to local model.")
                self._google_client = None

        if not self._google_client:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading local SentenceTransformer model '{self.local_model_name}'...")
                self._local_model = SentenceTransformer(self.local_model_name)
                logger.info("Local SentenceTransformer model loaded successfully.")
            except Exception as e:
                logger.error(f"Failed to load local SentenceTransformer model: {str(e)}")
                raise RuntimeError(f"Embedding model initialization failed: {str(e)}") from e

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings for a list of document strings."""
        if not texts:
            return []

        try:
            # 1. Try Google GenAI / Vertex AI text-embedding-004
            if self._google_client:
                logger.info(f"Generating Vertex AI embeddings for {len(texts)} chunks...")
                response = self._google_client.models.embed_content(
                    model=self.google_model_name,
                    contents=texts
                )
                # Extract vector values
                return [emb.values for emb in response.embeddings]

            # 2. Fall back to local SentenceTransformer
            embeddings = self._local_model.encode(texts, convert_to_numpy=True)
            return [emb.tolist() for emb in embeddings]

        except Exception as e:
            logger.error(f"Failed to generate embeddings for documents: {str(e)}")
            raise RuntimeError(f"Document embedding failed: {str(e)}") from e

    def embed_query(self, query: str) -> List[float]:
        """Generates embedding for a single query string."""
        if not query:
            return []

        try:
            # 1. Try Google GenAI / Vertex AI text-embedding-004
            if self._google_client:
                response = self._google_client.models.embed_content(
                    model=self.google_model_name,
                    contents=query
                )
                return response.embeddings[0].values

            # 2. Fall back to local SentenceTransformer
            embedding = self._local_model.encode(query, convert_to_numpy=True)
            return embedding.tolist()

        except Exception as e:
            logger.error(f"Failed to generate embedding for query: {str(e)}")
            raise RuntimeError(f"Query embedding failed: {str(e)}") from e


# Single instance caching model weights in memory
embeddings_service = EmbeddingsService()
