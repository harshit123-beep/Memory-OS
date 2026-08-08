import logging
import uuid
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from app.core.config import settings
from app.services.embeddings import embeddings_service

logger = logging.getLogger("app.services.rag")


class RAGService:
    """Interfaces with Qdrant for storing and querying text embeddings and metadata."""

    def __init__(self):
        try:
            self.persist_dir = settings.QDRANT_PERSIST_DIR
            logger.info(f"Initializing Qdrant Client at: {self.persist_dir}")
            
            # Setup persistent client
            self.client = QdrantClient(path=self.persist_dir)
            self.collection_name = "knowledge_base"
            
            # Generate a 1-word sample embedding to detect active dimension (384 vs 768)
            try:
                sample_vector = embeddings_service.embed_query("probe")
                self.vector_size = len(sample_vector) if sample_vector else 384
            except Exception as e:
                logger.warning(f"Could not verify active embedding dimensions: {e}. Defaulting size to 384.")
                self.vector_size = 384
            
            # Get or create default collection with dynamic dimension size
            if not self.client.collection_exists(self.collection_name):
                logger.info(f"Creating Qdrant collection '{self.collection_name}' with size {self.vector_size}...")
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
                )
            else:
                # Validate matching dimensions
                info = self.client.get_collection(self.collection_name)
                existing_size = info.config.params.vectors.size
                if existing_size != self.vector_size:
                    logger.warning(f"Qdrant dimension mismatch: existing {existing_size} vs active {self.vector_size}. Re-creating collection...")
                    self.client.delete_collection(self.collection_name)
                    self.client.create_collection(
                        collection_name=self.collection_name,
                        vectors_config=VectorParams(size=self.vector_size, distance=Distance.COSINE),
                    )
            logger.info(f"Qdrant Collection '{self.collection_name}' initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collection: {str(e)}")
            raise RuntimeError(f"Qdrant setup failed: {str(e)}") from e

    async def add_documents(
        self, 
        texts: List[str], 
        metadatas: List[Dict[str, Any]], 
        ids: List[str],
        embeddings: List[List[float]]
    ) -> None:
        """Indexes text segments and their calculated embedding vectors into Qdrant."""
        if not texts:
            logger.warning("add_documents called with empty list. Skipping indexing.")
            return

        try:
            # Validate input alignments
            if not (len(texts) == len(metadatas) == len(ids) == len(embeddings)):
                raise ValueError("Mismatch in sizes of texts, metadatas, ids, or embeddings lists.")

            logger.info(f"Indexing {len(texts)} document chunks into Qdrant collection '{self.collection_name}'...")
            
            points = []
            for i in range(len(ids)):
                # Store the document text in payload alongside custom metadata for retrieval
                payload = {
                    "document": texts[i],
                    **metadatas[i]
                }
                
                # Translate ids to string UUIDs format for Qdrant compatibility
                try:
                    point_id = str(uuid.UUID(ids[i]))
                except ValueError:
                    # Generate deterministic UUID for string based ids
                    point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, ids[i]))

                points.append(PointStruct(
                    id=point_id,
                    vector=embeddings[i],
                    payload=payload
                ))
            
            # Upsert into collection
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            logger.info("Qdrant index insertion completed successfully.")
        except Exception as e:
            logger.error(f"Failed to index documents in Qdrant: {str(e)}")
            raise RuntimeError(f"Qdrant ingestion failed: {str(e)}") from e

    async def query_knowledge_base(
        self, 
        query_embedding: List[float], 
        n_results: int = 4
    ) -> List[Dict[str, Any]]:
        """Queries the vector database using a computed query embedding vector."""
        try:
            logger.info(f"Querying Qdrant for {n_results} nearest neighbors...")
            
            search_results = self.client.query_points(
                collection_name=self.collection_name,
                query=query_embedding,
                limit=n_results
            )
            
            # Reformat results to match the expected format of other components
            formatted_results = []
            for hit in search_results.points:
                payload = hit.payload or {}
                doc_text = payload.get("document", "")
                
                # Exclude the core document text from the returned metadata dictionary
                metadata = {k: v for k, v in payload.items() if k != "document"}
                
                formatted_results.append({
                    "id": str(hit.id),
                    "document": doc_text,
                    "metadata": metadata,
                    "distance": hit.score
                })

            logger.info(f"Query returned {len(formatted_results)} cited segments.")
            return formatted_results
        except Exception as e:
            logger.error(f"Qdrant search query failed: {str(e)}")
            raise RuntimeError(f"Qdrant search failed: {str(e)}") from e

    async def delete_session_data(self, session_id: str) -> int:
        """Deletes all document vector chunks for a specific session ID from Qdrant.

        Returns the number of deleted records.
        """
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            # Retrieve matching points to count them
            filter_query = Filter(
                must=[
                    FieldCondition(
                        key="session_id",
                        match=MatchValue(value=session_id)
                    )
                ]
            )
            scroll_result = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=filter_query,
                limit=10000,
                with_payload=False,
                with_vectors=False
            )
            points = scroll_result[0]
            count = len(points)
            
            if count > 0:
                self.client.delete(
                    collection_name=self.collection_name,
                    points_selector=filter_query
                )
                logger.info(f"Qdrant: Permanently deleted {count} vector entries for session {session_id}")
            return count
        except Exception as e:
            logger.error(f"Failed to delete Qdrant session data: {str(e)}")
            raise RuntimeError(f"Qdrant delete failed: {str(e)}") from e


# Instantiate unified RAG service
rag_service = RAGService()
