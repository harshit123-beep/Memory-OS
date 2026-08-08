import logging
from typing import List, Dict, Any

from app.services.llm.llm_service import llm_service
from app.services.prompt_service import prompt_service
from app.schemas.schemas import ValidationResponseSchema

logger = logging.getLogger("app.agents.knowledge_validation_agent")


class KnowledgeValidationAgent:
    """Agent responsible for auditing extracted knowledge units against official guidelines and history."""

    def __init__(self):
        logger.info("KnowledgeValidationAgent initialized and ready.")

    async def validate(self, knowledge_units: List[Dict[str, Any]], documents_content: str = "") -> List[Dict[str, Any]]:
        """Evaluates extracted knowledge units and outputs structured validation reports."""
        if not knowledge_units:
            logger.warning("No knowledge units provided to KnowledgeValidationAgent. Skipping validation.")
            return []

        logger.info(f"KnowledgeValidationAgent auditing {len(knowledge_units)} knowledge units...")
        
        try:
            # Format the knowledge units as a clean JSON context string for the prompt
            import json
            units_json_str = json.dumps(knowledge_units, indent=2)

            # Load the system prompt template with placeholders injected
            formatted_prompt = prompt_service.get_prompt(
                "validation_prompt",
                knowledge_units=units_json_str,
                documents_content=documents_content or "No reference documentation uploaded."
            )

            # Invoke the LLM to get structured Validation Reports
            validation_result: ValidationResponseSchema = await llm_service.execute_structured_prompt(
                prompt="Audit the provided knowledge units and generate validation reports.",
                schema=ValidationResponseSchema,
                system_prompt=formatted_prompt,
                temperature=0.0,  # Zero temperature for deterministic auditing
                max_retries=3
            )

            logger.info(f"Validation completed. Generated {len(validation_result.validation_reports)} audit reports.")
            
            # Convert validation report models to list of dicts for graph state return
            reports_dict_list = [report.model_dump() for report in validation_result.validation_reports]
            return reports_dict_list

        except Exception as e:
            logger.error(f"Failed to audit knowledge units: {str(e)}")
            # Recover gracefully by returning empty validation reports list on failures
            return []


# Instantiate single agent instance
knowledge_validation_agent = KnowledgeValidationAgent()
