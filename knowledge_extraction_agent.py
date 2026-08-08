import logging
from typing import List, Dict, Any

from app.services.llm.llm_service import llm_service
from app.services.prompt_service import prompt_service
from app.schemas.schemas import ExtractionResponseSchema

logger = logging.getLogger("app.agents.knowledge_extraction_agent")


class KnowledgeExtractionAgent:
    """Agent responsible for parsing interview records and extracting structured knowledge units."""

    def __init__(self):
        logger.info("KnowledgeExtractionAgent initialized and ready.")

    async def extract(self, transcript: str, documents_content: str = "") -> List[Dict[str, Any]]:
        """Processes transcripts to extract procedural, risk, dependency, and tribal knowledge."""
        if not transcript or not transcript.strip():
            logger.warning("Empty transcript provided to KnowledgeExtractionAgent. Skipping extraction.")
            return []

        logger.info("KnowledgeExtractionAgent starting extraction workflow...")
        
        try:
            # 1. Load the prompt template with transcript and document content injected
            formatted_prompt = prompt_service.get_prompt(
                "extraction_prompt",
                transcript=transcript,
                documents_content=documents_content or "No external documents uploaded."
            )

            # 2. Call the central LLM service to retrieve validated structured output matching the schema
            # Low temperature is used to ensure high fidelity and prevent hallucinations
            extraction_result: ExtractionResponseSchema = await llm_service.execute_structured_prompt(
                prompt="Analyze the transcript and documents content, then extract all valid Knowledge Units.",
                schema=ExtractionResponseSchema,
                system_prompt=formatted_prompt,
                temperature=0.1,
                max_retries=3
            )

            logger.info(f"Extraction successful. Extracted {len(extraction_result.knowledge_units)} knowledge units.")
            
            # 3. Convert the list of pydantic models into a list of dicts for state return
            units_dict_list = [unit.model_dump() for unit in extraction_result.knowledge_units]
            return units_dict_list

        except Exception as e:
            logger.error(f"Failed to extract knowledge: {str(e)}")
            # Gracefully recover by returning empty list on LLM failures
            return []


# Single instance instantiation
knowledge_extraction_agent = KnowledgeExtractionAgent()
