import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import crud
from app.schemas.schemas import InterviewTurnSchema
from app.services.llm.llm_service import llm_service
from app.services.prompt_service import prompt_service

logger = logging.getLogger("app.agents.interview_agent")


class InterviewAgent:
    """Agent responsible for conducting exit interviews, maintaining context, and generating questions."""

    def __init__(self):
        logger.info("InterviewAgent initialized and ready.")

    async def conduct_turn(
        self,
        db: AsyncSession,
        session_id: str,
        employee_name: str,
        employee_role: str
    ) -> InterviewTurnSchema:
        """Assembles conversation history, renders the prompt template, and executes structured LLM inference."""
        
        # 1. Fetch message history from database
        messages = await crud.get_chat_messages(db, session_id)
        
        # 2. Form conversation history as a formatted transcript block
        history_lines = []
        last_user_message = ""
        
        for msg in messages:
            if msg.role == "system":
                continue
            sender = "Employee" if msg.role == "user" else "Interviewer"
            history_lines.append(f"{sender}: {msg.content}")
            if msg.role == "user":
                last_user_message = msg.content

        history_str = "\n".join(history_lines) if history_lines else "No conversation history yet."
        logger.debug(f"Assembled history length: {len(history_lines)} lines.")

        # 3. Retrieve system prompt with context variables injected
        system_context_prompt = prompt_service.get_prompt(
            "interview_prompt",
            employee_name=employee_name,
            employee_role=employee_role,
            conversation_history=history_str
        )

        if not last_user_message:
            # First turn: start interview with warm greeting and opening role question
            human_query = (
                f"Please initiate the exit interview with a warm greeting for the employee, "
                f"present the 3 known outstanding gaps and security warnings from the system prompt context, "
                f"and ask them to recommend remediation changes or procedures to resolve these."
            )
            temperature = 0.5  # Slightly higher temperature for warm, creative greeting
        else:
            human_query = (
                f"The employee just replied: \"{last_user_message}\".\n\n"
                f"Analyze this answer alongside the entire history and generate your follow-up question. "
                f"If you have successfully captured sufficient institutional knowledge across all categories "
                f"(processes, systems, risks, best practices, tribal knowledge), conclude the interview."
            )
            temperature = 0.2  # Low temperature for highly logical follow-ups

        logger.info(f"Submitting interview agent turn query for session: {session_id}")
        
        # 5. Call central LLM service to retrieve validated structured output matching schema
        turn_result: InterviewTurnSchema = await llm_service.execute_structured_prompt(
            prompt=human_query,
            schema=InterviewTurnSchema,
            system_prompt=system_context_prompt,
            temperature=temperature,
            max_retries=3
        )
        
        logger.info(
            f"Agent turn computed. finished_flag={turn_result.is_finished}. "
            f"Question: '{turn_result.response[:60]}...'"
        )
        
        # Log internal knowledge coverage tracker details for debugging/auditing
        try:
            tracker = turn_result.internal_tracker
            logger.info(
                f"[Knowledge Tracker State] "
                f"Covered: {tracker.covered_topics} | "
                f"Remaining: {tracker.remaining_topics} | "
                f"Gaps: {tracker.knowledge_gaps} | "
                f"Findings: {len(tracker.important_findings)}"
            )
        except Exception as te:
            logger.warning(f"Could not print knowledge tracker log: {te}")
            
        return turn_result


# Instantiate single agent instance
interview_agent = InterviewAgent()
