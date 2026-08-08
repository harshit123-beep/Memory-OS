import json
from typing import Type
from pydantic import BaseModel


class StructuredOutputHelper:
    """Helper to convert Pydantic schemas into clear, markdown-friendly system instructions for LLM execution."""

    @staticmethod
    def get_schema_instructions(schema: Type[BaseModel]) -> str:
        """Generates clear instructions and property outlines for the LLM to output valid JSON conforming to the schema."""
        schema_json = schema.model_json_schema()
        
        # Format the fields cleanly
        properties_desc = []
        required_fields = schema_json.get("required", [])
        
        for field_name, field_info in schema_json.get("properties", {}).items():
            field_type = field_info.get("type", "string")
            description = field_info.get("description", "No description provided.")
            is_req = "Required" if field_name in required_fields else "Optional"
            
            # Format list types cleanly
            if field_type == "array" and "items" in field_info:
                item_type = field_info["items"].get("type", "string")
                field_type = f"array of {item_type}s"
                
            properties_desc.append(
                f"- **{field_name}** ({field_type}) [{is_req}]: {description}"
            )

        properties_bullet = "\n".join(properties_desc)

        instructions = (
            f"You MUST output your response as a single, valid JSON object matching the schema below.\n"
            f"Do not include conversational introductions or explanations in the response text. "
            f"Wrap your JSON output inside markdown code blocks like this:\n\n"
            f"```json\n"
            f"{{\n"
            f"  ... your response ...\n"
            f"}}\n"
            f"```\n\n"
            f"### Target JSON Properties:\n"
            f"{properties_bullet}\n\n"
            f"### Detailed JSON Schema Specification:\n"
            f"```json\n"
            f"{json.dumps(schema_json, indent=2)}\n"
            f"```"
        )
        return instructions
