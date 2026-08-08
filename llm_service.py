import logging
import asyncio
from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel
from langchain_core.messages import SystemMessage, HumanMessage
from app.services.llm.gemini_provider import GeminiProvider
from app.services.llm.groq_provider import GroqProvider
from app.services.llm.parser import Parser, JSONParsingError
from app.services.llm.structured_output import StructuredOutputHelper
from app.core.config import settings

logger = logging.getLogger("app.services.llm.llm_service")

T = TypeVar("T", bound=BaseModel)


class LLMService:
    """Central orchestration service for LLM operations. All agents must query the LLM through this interface."""

    def __init__(self):
        # Graceful provider fallback based on configuration keys
        gemini_key = settings.GEMINI_API_KEY
        if gemini_key and str(gemini_key).strip() not in ("", "None", "undefined"):
            self.provider = GeminiProvider()
            logger.info("LLMService initialized with GeminiProvider.")
        else:
            self.provider = GroqProvider()
            logger.info("LLMService initialized with GroqProvider (Fallback).")

    async def execute_prompt(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_retries: int = 3,
        backoff_seconds: float = 1.0
    ) -> str:
        """Executes a standard raw text prompt with self-healing fallback to Groq if Gemini fails."""
        messages = []
        if system_prompt:
            messages.append(SystemMessage(content=system_prompt))
        messages.append(HumanMessage(content=prompt))

        kwargs = {}
        if temperature is not None:
            kwargs["temperature"] = temperature

        try:
            # Try primary provider (Gemini or Groq)
            logger.debug(f"Attempting execution using provider: {self.provider.__class__.__name__}")
            result = await self.provider.execute_messages_async(messages, **kwargs)
            return result["content"]
        except Exception as e:
            # If Gemini fails (e.g. invalid credentials or 404 model), self-heal and fall back to Groq
            if isinstance(self.provider, GeminiProvider):
                logger.warning(
                    f"Gemini execution failed: {str(e)}. "
                    f"Initiating self-healing mechanism: falling back to GroqProvider."
                )
                self.provider = GroqProvider()
                # Run again using the fallback Groq provider
                result = await self.provider.execute_messages_async(messages, **kwargs)
                return result["content"]
            else:
                # If Groq also fails, log and raise
                logger.error(f"Execution failed on all providers.")
                raise e

    async def execute_structured_prompt(
        self,
        prompt: str,
        schema: Type[T],
        system_prompt: Optional[str] = None,
        temperature: Optional[float] = None,
        max_retries: int = 3,
        backoff_seconds: float = 1.0
    ) -> T:
        """Executes prompt, appends schema instructions, and validates JSON output into a Pydantic model with format retries."""
        
        # Format the system prompt to append the schema instructions
        schema_instructions = StructuredOutputHelper.get_schema_instructions(schema)
        
        base_system_prompt = system_prompt or "You are a helpful assistant."
        combined_system_prompt = f"{base_system_prompt}\n\n{schema_instructions}"
        
        last_error = None
        current_prompt = prompt
        
        for attempt in range(1, max_retries + 1):
            try:
                # 1. Execute LLM call
                raw_response = await self.execute_prompt(
                    prompt=current_prompt,
                    system_prompt=combined_system_prompt,
                    temperature=temperature,
                    max_retries=2,  # Keep inner connection retries low
                    backoff_seconds=backoff_seconds
                )
                
                # 2. Extract and validate against Pydantic schema
                parsed_model = Parser.parse_to_model(raw_response, schema)
                return parsed_model

            except (JSONParsingError, Exception) as e:
                last_error = e
                logger.warning(
                    f"Structured parse attempt {attempt}/{max_retries} failed: {str(e)}. "
                    f"Prompting LLM with formatting corrections."
                )
                
                if attempt < max_retries:
                    # Self-correction prompt refinement
                    current_prompt = (
                        f"{prompt}\n\n"
                        f"CRITICAL: Your previous response could not be parsed into the JSON schema due to the following error: {str(e)}.\n"
                        f"Please re-generate the JSON matching the schema correctly, making sure the output is valid JSON and only contains the requested properties."
                    )
                    await asyncio.sleep(backoff_seconds)
                    backoff_seconds *= 1.5

        logger.error(f"Failed to execute structured prompt and validate schema '{schema.__name__}' after {max_retries} attempts.")
        raise last_error or JSONParsingError("Structured LLM output validation failed.")


async def check_enkrypt_guardrails(text: str) -> tuple[bool, Optional[str]]:
    """Runs a simulated Enkrypt AI security gateway scan on incoming text payloads.

    Detects prompt injections, jailbreak vectors, and PII leaks.
    """
    if not text:
        return True, None

    cleaned = text.lower()
    
    # 1. Prompt Injection & Jailbreak Vectors
    injection_keywords = [
        "ignore previous", 
        "ignore instructions", 
        "forget constraints", 
        "bypass limits", 
        "reveal system", 
        "reveal developer", 
        "you are now",
        "act as a",
        "override system",
        "system override",
        "dan mode"
    ]
    for kw in injection_keywords:
        if kw in cleaned:
            return False, "Jailbreak Vector / Prompt Injection Attempt"

    # 2. PII / Credit Card leaks
    import re
    # Match standard credit card pattern
    if re.search(r'\b(?:\d[ -]*?){13,16}\b', text):
        return False, "PII Leakage: Credit Card Number"
    
    # Match Social Security Number
    if re.search(r'\b\d{3}-\d{2}-\d{4}\b', text):
        return False, "PII Leakage: Social Security Number"

    return True, None


# Instantiate default service
llm_service = LLMService()
