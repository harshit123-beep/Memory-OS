import logging
import os
from pathlib import Path
from typing import Dict

logger = logging.getLogger("app.services.prompt_service")


class PromptService:
    """Service to load and format system prompts stored in external markdown files."""

    def __init__(self, prompts_dir: Optional[Path] = None):
        if prompts_dir is None:
            # Resolve relative to this file: backend/app/services/prompt_service.py -> backend/app/prompts/
            self.prompts_dir = Path(__file__).resolve().parent.parent / "prompts"
        else:
            self.prompts_dir = prompts_dir
            
        self._cache: Dict[str, str] = {}
        logger.info(f"Initialized PromptService with directory: {self.prompts_dir}")

    def _load_prompt_file(self, name: str) -> str:
        """Loads prompt file from disk or cache."""
        if name in self._cache:
            return self._cache[name]
            
        filename = f"{name}.md" if not name.endswith(".md") else name
        filepath = self.prompts_dir / filename
        
        if not filepath.exists():
            logger.error(f"Prompt file not found at: {filepath}")
            raise FileNotFoundError(f"Prompt file '{filename}' was not found in {self.prompts_dir}")
            
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            self._cache[name] = content
            logger.debug(f"Loaded and cached prompt: {name}")
            return content
        except Exception as e:
            logger.error(f"Error reading prompt file {filepath}: {str(e)}")
            raise

    def get_prompt(self, name: str, **kwargs) -> str:
        """Retrieves and formats a system prompt with injected variables."""
        raw_prompt = self._load_prompt_file(name)
        try:
            # Formats prompt using format string syntax.
            # Safe parsing defaults variables not supplied to empty strings to prevent KeyError.
            formatted_prompt = raw_prompt.format(**kwargs)
            return formatted_prompt
        except KeyError as ke:
            missing_key = ke.args[0]
            logger.warning(f"Formatting prompt '{name}' failed due to missing variable '{missing_key}'. Retrying with empty fallback.")
            # Fallback formatting by assigning empty strings to missing keys
            fallback_args = {k: "" for k in kwargs}
            # We can capture all format keys or dynamically fill missing ones
            # For simplicity, we fill missing keys with empty strings or default text
            import re
            placeholder_names = re.findall(r"\{([a-zA-Z0-9_]+)\}", raw_prompt)
            merged_args = {}
            for placeholder in placeholder_names:
                merged_args[placeholder] = kwargs.get(placeholder, f"[{placeholder} not provided]")
            return raw_prompt.format(**merged_args)
        except Exception as e:
            logger.error(f"Error formatting prompt {name}: {str(e)}")
            raise


# Default single instance
prompt_service = PromptService()
from typing import Optional
