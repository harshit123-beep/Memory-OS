import os
import json
import logging
import datetime
from pathlib import Path
from typing import List, Dict, Any

from app.services.llm.llm_service import llm_service
from app.services.prompt_service import prompt_service
from app.schemas.schemas import DocumentationResponseSchema, GeneratedDocumentSchema

logger = logging.getLogger("app.agents.documentation_agent")


class DocumentationAgent:
    """Agent responsible for compiling validated Knowledge Units into professional Markdown manuals."""

    def __init__(self):
        # Establish storage directory paths
        self.output_dir = Path("generated_docs")
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"DocumentationAgent initialized. Storage directory: '{self.output_dir.resolve()}'")

    async def compile_docs(
        self,
        knowledge_units: List[Dict[str, Any]],
        validation_reports: List[Dict[str, Any]],
        documents_context: str = ""
    ) -> List[Dict[str, Any]]:
        """Synthesizes validated knowledge units, writes files, and returns registration metadata."""
        if not knowledge_units:
            logger.warning("No validated knowledge units provided to DocumentationAgent. Skipping compilation.")
            return []

        logger.info(f"DocumentationAgent compiling guides from {len(knowledge_units)} validated units...")

        try:
            # 1. Format inputs for system prompt
            units_json_str = json.dumps(knowledge_units, indent=2)
            reports_json_str = json.dumps(validation_reports, indent=2)

            formatted_prompt = prompt_service.get_prompt(
                "documentation_prompt",
                knowledge_units=units_json_str,
                validation_reports=reports_json_str,
                documents_context=documents_context or "No reference documents."
            )

            # 2. Invoke LLM to get structured document elements
            response: DocumentationResponseSchema = await llm_service.execute_structured_prompt(
                prompt="Compile the validated units into structured documentation manuals.",
                schema=DocumentationResponseSchema,
                system_prompt=formatted_prompt,
                temperature=0.2,
                max_retries=3
            )

            compiled_results = []
            current_time = datetime.datetime.utcnow().isoformat() + "Z"

            # 3. Format and save each document
            for doc in response.documents:
                # Compile Markdown content based on standard layout structure
                markdown_str = self._render_markdown(doc, len(knowledge_units))

                # Create safe filename from title
                safe_title = "".join(c if c.isalnum() or c in (" ", "_", "-") else "" for c in doc.title)
                safe_filename = safe_title.lower().replace(" ", "_")
                
                md_path = self.output_dir / f"{safe_filename}.md"
                json_path = self.output_dir / f"{safe_filename}.json"

                # Write Markdown manual
                with open(md_path, "w", encoding="utf-8") as f:
                    f.write(markdown_str)

                # Construct companion JSON metadata sidecar
                metadata_sidecar = {
                    "title": doc.title,
                    "document_type": doc.doc_type,
                    "confidence": doc.confidence_score,
                    "topics": doc.topics,
                    "knowledge_unit_count": len(knowledge_units),
                    "generated_timestamp": current_time,
                    "version": doc.version,
                    "status": doc.status
                }

                # Write JSON metadata
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(metadata_sidecar, f, indent=2)

                logger.info(f"Saved generated manual: {md_path} and sidecar: {json_path}")

                compiled_results.append({
                    "filepath": str(md_path),
                    "type": doc.doc_type,
                    "metadata": metadata_sidecar
                })

            return compiled_results

        except Exception as e:
            logger.error(f"Failed to generate documentation: {str(e)}")
            return []

    def _render_markdown(self, doc: GeneratedDocumentSchema, unit_count: int) -> str:
        """Helper to format structured document fields into a beautiful Markdown manual."""
        
        # Helper to render lists
        def render_list(items: List[str]) -> str:
            if not items:
                return "* None documented.\n"
            return "\n".join(f"* {item}" for item in items) + "\n"

        def render_numbered_list(items: List[str]) -> str:
            if not items:
                return "1. None documented.\n"
            return "\n".join(f"{idx+1}. {item}" for idx, item in enumerate(items)) + "\n"

        current_date = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        confidence_percent = int(doc.confidence_score * 100)

        markdown_body = f"""# {doc.title}

## Knowledge Coverage Summary
* **Topics Covered**: {", ".join(doc.topics) if doc.topics else "General"}
* **Knowledge Units Used**: {unit_count}
* **Related Documents Reference Count**: {len(doc.related_documents)}
* **Overall Document Confidence**: {doc.confidence_score:.2f} ({confidence_percent}%)

## Purpose
{doc.purpose}

## Business Value
{doc.business_value}

## Scope
{doc.scope}

## Prerequisites
{render_list(doc.prerequisites)}
## Step-by-Step Instructions
{render_numbered_list(doc.instructions)}
## Best Practices
{render_list(doc.best_practices)}
## Warnings
{render_list(doc.warnings)}
## Common Mistakes
{render_list(doc.common_mistakes)}
## Business Impact
{doc.business_impact}

## Related Documents
{render_list(doc.related_documents)}
## Knowledge Sources
{render_list(doc.knowledge_sources)}
## Version Information
* **Document Version**: {doc.version}
* **Generated Date**: {current_date}
* **Last Updated**: {current_date}
* **Documentation Status**: {doc.status}
* **Overall Confidence Score**: {doc.confidence_score:.2f}

## Changelog
### Version {doc.version}
{render_list(doc.changelog)}"""

        return markdown_body


# Instantiate single agent instance
documentation_agent = DocumentationAgent()
