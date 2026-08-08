import logging
import time
import os
from typing import Any, Dict, List, Optional
from langchain_core.messages import BaseMessage
from google import genai
from google.genai import types
from app.core.config import settings

logger = logging.getLogger("app.services.llm.gemini_provider")


class GeminiProvider:
    """Provider implementing direct integrations with Gemini models using Google's native GenAI SDK."""

    def __init__(self):
        # Load keys from centralized settings config
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self.temperature = settings.LLM_TEMPERATURE

        # Verify key value content
        if not self.api_key or str(self.api_key).strip() in ("", "None", "undefined"):
            logger.warning("GEMINI_API_KEY environment variable is not configured. Gemini requests will fail.")
            self._client = None
        else:
            try:
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"GeminiProvider successfully initialized with model: {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to initialize Google GenAI Client: {str(e)}")
                self._client = None

    async def execute_messages_async(
        self,
        messages: List[BaseMessage],
        stop_sequences: Optional[List[str]] = None,
        **kwargs: Any
    ) -> Dict[str, Any]:
        """Asynchronously dispatches execution to Gemini API and tracks performance latency."""
        if not self._client:
            raise ValueError("Gemini client is not initialized. Please verify GEMINI_API_KEY environment variable.")

        start_time = time.perf_counter()
        try:
            # 1. Convert langchain base messages into Gemini contents and system instruction
            system_instruction = None
            contents = []

            for msg in messages:
                if msg.type == "system":
                    system_instruction = msg.content
                else:
                    role = "user" if msg.type == "human" else "model"
                    contents.append(
                        types.Content(
                            role=role,
                            parts=[types.Part.from_text(text=msg.content)]
                        )
                    )

            # 2. Formulate execution config parameters
            temp_val = kwargs.get("temperature", self.temperature)
            
            config = types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=temp_val,
            )
            if stop_sequences:
                config.stop_sequences = stop_sequences

            # 3. Call native async model generator
            logger.debug(f"Dispatched async call to Gemini model: {self.model_name}")
            response = await self._client.aio.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config
            )

            latency = time.perf_counter() - start_time
            logger.debug(f"Gemini LLM request completed in {latency:.4f}s")

            # Extract content text and build return payload
            content_text = response.text or ""
            return {
                "content": content_text,
                "latency": latency,
                "usage": {
                    "prompt_tokens": getattr(response.usage_metadata, "prompt_token_count", 0),
                    "candidates_tokens": getattr(response.usage_metadata, "candidates_token_count", 0),
                    "total_tokens": getattr(response.usage_metadata, "total_token_count", 0)
                }
            }
        except Exception as e:
            logger.error(f"Error communicating with Gemini API: {str(e)}")
            raise e
