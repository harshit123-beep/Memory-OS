import logging
import time
from typing import Any, Dict, List, Optional
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage
from langchain_groq import ChatGroq
from app.core.config import settings

logger = logging.getLogger("app.services.llm.groq_provider")


class GroqProvider:
    """Provider implementing direct integrations with Groq models using LangChain's ChatGroq client."""

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model_name = settings.GROQ_MODEL
        self.temperature = settings.LLM_TEMPERATURE
        
        # Guard key verification to avoid crashing on launch without key
        if not self.api_key or self.api_key == "mock_key_or_empty_for_now":
            logger.warning("GROQ_API_KEY is not set or is mock. LLM calls will fail until configured.")
            self._client = None
        else:
            try:
                self._client = ChatGroq(
                    groq_api_key=self.api_key,
                    model_name=self.model_name,
                    temperature=self.temperature
                )
                logger.info(f"GroqProvider successfully initialized with model: {self.model_name}")
            except Exception as e:
                logger.error(f"Failed to initialize ChatGroq: {str(e)}")
                self._client = None

    async def execute_messages_async(
        self,
        messages: List[BaseMessage],
        stop_sequences: Optional[List[str]] = None,
        **kwargs: Any
    ) -> Dict[str, Any]:
        """Asynchronously dispatches execution to ChatGroq and tracks performance latency."""
        if not self._client:
            raise ValueError("Groq client is not initialized. Please verify GROQ_API_KEY in configuration.")

        start_time = time.perf_counter()
        try:
            # Prepare execution args
            execution_args = {}
            if stop_sequences:
                execution_args["stop"] = stop_sequences
            if "temperature" in kwargs:
                execution_args["temperature"] = kwargs["temperature"]

            response = await self._client.ainvoke(messages, **execution_args)
            latency = time.perf_counter() - start_time
            
            logger.debug(f"LLM request completed in {latency:.4f}s")
            return {
                "content": response.content,
                "latency": latency,
                "usage": getattr(response, "response_metadata", {}).get("token_usage", {})
            }
        except Exception as e:
            logger.error(f"Error communicating with Groq API: {str(e)}")
            raise e
            
    def execute_messages_sync(
        self,
        messages: List[BaseMessage],
        stop_sequences: Optional[List[str]] = None,
        **kwargs: Any
    ) -> Dict[str, Any]:
        """Synchronous prompt execution handler."""
        if not self._client:
            raise ValueError("Groq client is not initialized. Please verify GROQ_API_KEY in configuration.")

        start_time = time.perf_counter()
        try:
            execution_args = {}
            if stop_sequences:
                execution_args["stop"] = stop_sequences
            if "temperature" in kwargs:
                execution_args["temperature"] = kwargs["temperature"]

            response = self._client.invoke(messages, **execution_args)
            latency = time.perf_counter() - start_time
            return {
                "content": response.content,
                "latency": latency,
                "usage": getattr(response, "response_metadata", {}).get("token_usage", {})
            }
        except Exception as e:
            logger.error(f"Error communicating with Groq API (sync): {str(e)}")
            raise e
