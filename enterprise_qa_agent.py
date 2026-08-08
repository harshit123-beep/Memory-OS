import logging
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

from app.database import crud
from app.database.models import KnowledgeUnit, ValidationReport, GeneratedDocument
from app.services.llm.llm_service import llm_service
from app.services.prompt_service import prompt_service
from app.services.embeddings import embeddings_service
from app.services.rag import rag_service
from app.schemas.schemas import QAResponseSchema
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger("app.agents.enterprise_qa_agent")


class EnterpriseQAAgent:
    """Agent responsible for querying all organizational memory using semantic RAG and structured LLM answers."""

    async def answer_question(self, db: AsyncSession, query: str) -> QAResponseSchema:
        """Runs the semantic retrieval pipeline, merges context, calls the LLM, and logs query history."""
        logger.info(f"EnterpriseQAAgent processing user query: '{query}'")

        try:
            # 1. Generate query embedding
            logger.info("Generating query vector embedding...")
            query_embedding = embeddings_service.embed_query(query)

            # 2. Search ChromaDB for relevant enterprise document chunks
            logger.info("Executing ChromaDB similarity search...")
            retrieved_chunks = await rag_service.query_knowledge_base(query_embedding, n_results=4)
            
            # Format chunks for context
            chunks_context_list = []
            retrieved_doc_names = []
            for chunk in retrieved_chunks:
                filename = chunk.get("metadata", {}).get("filename", "Unknown Document")
                retrieved_doc_names.append(filename)
                chunks_context_list.append(
                    f"[Source: Uploaded Document - {filename}]\n{chunk.get('document', '')}"
                )
            chunks_context = "\n\n".join(chunks_context_list)

            # 3. Retrieve Related Knowledge Units (Validated ONLY)
            logger.info("Retrieving validated knowledge units...")
            validated_units = await self._retrieve_validated_units(db, query)
            
            units_context_list = []
            for unit in validated_units:
                units_context_list.append(
                    f"[Source: Validated Knowledge Unit - '{unit.get('title')}' (Category: {unit.get('category')})]\n"
                    f"Knowledge: {unit.get('knowledge')}\n"
                    f"Business Impact: {unit.get('business_impact', 'N/A')}"
                )
            units_context = "\n\n".join(units_context_list)

            # 4. Retrieve Related Generated Documents
            logger.info("Retrieving related generated manuals...")
            generated_docs = await self._retrieve_related_generated_documents(db, query)
            
            docs_context_list = []
            for gdoc in generated_docs:
                # Truncate content slightly to fit context limits comfortably
                truncated_content = gdoc["content"][:2000]
                docs_context_list.append(
                    f"[Source: Generated Documentation - '{gdoc['title']}' (Type: {gdoc['type']})]\n"
                    f"{truncated_content}"
                )
            docs_context = "\n\n".join(docs_context_list)

            # 5. Format the prompt context
            formatted_prompt = prompt_service.get_prompt(
                "qa_prompt",
                retrieved_chunks=chunks_context or "No relevant document chunks found.",
                retrieved_knowledge_units=units_context or "No relevant validated knowledge units found.",
                retrieved_documents=docs_context or "No relevant generated manuals found.",
                query=query
            )

            # 6. Call LLM to generate structured QA response
            logger.info("Dispatching context to LLM for final answer synthesis...")
            response: QAResponseSchema = await llm_service.execute_structured_prompt(
                prompt=f"Answer the query: {query}",
                schema=QAResponseSchema,
                system_prompt=formatted_prompt,
                temperature=0.1,
                max_retries=3
            )

            # 7. Persist query in database QueryHistory
            logger.info("Logging search query details in PostgreSQL database history...")
            await crud.add_query_history(
                db=db,
                question=query,
                answer=response.answer,
                confidence_score=response.confidence_score,
                sources_used=response.used_sources
            )

            return response

        except Exception as e:
            logger.error(f"EnterpriseQAAgent pipeline failed: {str(e)}")
            # Recover gracefully with fallback schema
            return QAResponseSchema(
                answer="An internal error occurred while trying to process the search query.",
                confidence_score=0.0,
                confidence_percentage="0%",
                confidence_reason=f"Pipeline error: {str(e)}",
                citations=[],
                related_topics=[],
                used_sources=[]
            )

    async def _retrieve_validated_units(self, db: AsyncSession, query: str) -> List[Dict[str, Any]]:
        """Retrieves and filters knowledge units, keeping only validated items matching query keywords."""
        try:
            # Get validation reports to retrieve validated unit IDs
            reports_stmt = select(ValidationReport)
            reports_res = await db.execute(reports_stmt)
            reports = reports_res.scalars().all()
            
            validated_ids = set()
            for r in reports:
                reports_data = r.content if isinstance(r.content, list) else []
                for report in reports_data:
                    if report.get("validation_status") == "Validated":
                        validated_ids.add(report.get("knowledge_unit_id"))

            # Get all units
            units_stmt = select(KnowledgeUnit)
            units_res = await db.execute(units_stmt)
            units = units_res.scalars().all()

            validated_units = []
            for u in units:
                if u.id in validated_ids:
                    unit_dict = dict(u.content) if isinstance(u.content, dict) else {}
                    unit_dict["id"] = u.id
                    validated_units.append(unit_dict)

            # Relevancy ranking via simple term-matching
            query_terms = set(query.lower().split())
            ranked_units = []
            for u in validated_units:
                search_text = f"{u.get('title', '')} {u.get('category', '')} {u.get('knowledge', '')} {' '.join(u.get('tags', []))}".lower()
                match_score = sum(1 for term in query_terms if term in search_text)
                if match_score > 0 or not query_terms:
                    ranked_units.append((match_score, u))

            ranked_units.sort(key=lambda x: x[0], reverse=True)
            return [item[1] for item in ranked_units[:5]]

        except Exception as e:
            logger.error(f"Failed to query validated knowledge units: {str(e)}")
            return []

    async def _retrieve_related_generated_documents(self, db: AsyncSession, query: str) -> List[Dict[str, Any]]:
        """Retrieves generated manuals, reads their markdown files on disk, and filters by keyword overlap."""
        try:
            stmt = select(GeneratedDocument)
            res = await db.execute(stmt)
            db_docs = res.scalars().all()

            query_terms = set(query.lower().split())
            ranked_docs = []

            for doc in db_docs:
                filepath = Path(doc.filepath)
                if filepath.exists():
                    try:
                        with open(filepath, "r", encoding="utf-8") as f:
                            markdown_content = f.read()
                        
                        # Rank by keyword overlap
                        search_text = f"{filepath.name} {doc.type} {markdown_content}".lower()
                        match_score = sum(1 for term in query_terms if term in search_text)
                        
                        doc_info = {
                            "filepath": doc.filepath,
                            "type": doc.type,
                            "title": doc.metadata_info.get("title") if isinstance(doc.metadata_info, dict) else filepath.stem.replace("_", " ").title(),
                            "content": markdown_content
                        }
                        
                        if match_score > 0 or not query_terms:
                            ranked_docs.append((match_score, doc_info))
                    except Exception as err:
                        logger.warning(f"Could not read generated manual at {filepath}: {err}")

            ranked_docs.sort(key=lambda x: x[0], reverse=True)
            return [item[1] for item in ranked_docs[:3]]

        except Exception as e:
            logger.error(f"Failed to query generated manuals: {str(e)}")
            return []


# Instantiate QA agent
enterprise_qa_agent = EnterpriseQAAgent()
