import json
import logging
import re
from typing import Any, Dict, Type
from pydantic import BaseModel, ValidationError

logger = logging.getLogger("app.services.llm.parser")


class JSONParsingError(Exception):
    """Custom exception raised when JSON parsing fails."""
    pass


class Parser:
    """Helper utility for extracting and validating structured JSON and Pydantic models from LLM string outputs."""

    @staticmethod
    def extract_json_string(text: str) -> str:
        """Extracts JSON substring from raw text blocks (e.g., handling ```json ... ```)."""
        if not text:
            raise JSONParsingError("Empty text response received from LLM.")

        cleaned_text = text.strip()

        # 1. Match standard markdown json blocks
        match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned_text, re.IGNORECASE)
        if match:
            return match.group(1).strip()

        # 2. Extract JSON between the first '{' and the last '}'
        start_idx = cleaned_text.find("{")
        end_idx = cleaned_text.rfind("}")
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            return cleaned_text[start_idx : end_idx + 1].strip()

        # 3. If it looks like raw json list, match first '[' and last ']'
        start_list = cleaned_text.find("[")
        end_list = cleaned_text.rfind("]")
        if start_list != -1 and end_list != -1 and end_list > start_list:
            return cleaned_text[start_list : end_list + 1].strip()

        return cleaned_text

    @classmethod
    def parse_to_dict(cls, text: str) -> Dict[str, Any]:
        """Parses LLM text response directly to a dictionary."""
        json_str = cls.extract_json_string(text)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as je:
            logger.error(f"JSON decode failed on string:\n{json_str}\nError: {str(je)}")
            raise JSONParsingError(f"Could not parse valid JSON from text: {str(je)}") from je

    @classmethod
    def parse_to_model(cls, text: str, schema: Type[BaseModel]) -> BaseModel:
        """Parses and validates LLM text response against a specific Pydantic schema."""
        data_dict = cls.parse_to_dict(text)
        try:
            return schema.model_validate(data_dict)
        except ValidationError as ve:
            logger.error(f"Pydantic validation failed for schema {schema.__name__}. Data: {data_dict}. Error: {str(ve)}")
            raise JSONParsingError(f"Extracted JSON does not match schema {schema.__name__}: {str(ve)}") from ve
