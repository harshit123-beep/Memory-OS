import logging
from typing import Dict, Any
from langgraph.graph import StateGraph, START, END
from app.orchestrator.state import MemoryState

logger = logging.getLogger("app.orchestrator.graph")


# ==========================================
# LangGraph Node Skeletons (Phase 1)
# ==========================================

async def interview_node(state: MemoryState) -> Dict[str, Any]:
    """Orchestrates the active exit interview conversation step."""
    logger.info(f"[LangGraph Node] Running interview_node for session: {state.get('session_id')}")
    # Updates only the node's current stage and a default final response placeholder
    return {
        "current_stage": "interview",
        "final_response": "Interview agent step complete."
    }


async def extraction_node(state: MemoryState) -> Dict[str, Any]:
    """Orchestrates structured knowledge extraction from the session logs."""
    logger.info(f"[LangGraph Node] Running extraction_node for session: {state.get('session_id')}")
    
    session_id = state.get("session_id")
    if not session_id:
        logger.error("Missing session_id in extraction_node state.")
        return {
            "current_stage": "extraction",
            "knowledge_units": [],
            "knowledge_count": 0
        }

    from app.database import crud
    from app.database.session import async_session
    from app.agents.knowledge_extraction_agent import knowledge_extraction_agent

    try:
        async with async_session() as db:
            # 1. Fetch transcript dynamically
            transcript_str = await crud.get_session_transcript_dynamically(db, session_id)
            
            # 2. Fetch uploaded documents associated with the session for context
            uploaded_docs = await crud.get_uploaded_documents(db, session_id)
            docs_contents = []
            for doc in uploaded_docs:
                if doc.content_extracted:
                    docs_contents.append(f"Document Name: {doc.filename}\nContent:\n{doc.content_extracted}")
            docs_content_str = "\n\n".join(docs_contents)

            # 3. Call agent to extract structured knowledge units
            extracted_units = await knowledge_extraction_agent.extract(
                transcript=transcript_str,
                documents_content=docs_content_str
            )

            # 4. Save extracted units into database
            for unit in extracted_units:
                await crud.add_knowledge_unit(
                    db=db,
                    session_id=session_id,
                    unit_type=unit.get("category", "General"),
                    content=unit,
                    confidence_score=unit.get("confidence", 1.0)
                )

            logger.info(f"[LangGraph Node] Extraction node finished. Saved {len(extracted_units)} units.")
            return {
                "current_stage": "extraction",
                "knowledge_units": extracted_units,
                "knowledge_count": len(extracted_units)
            }
            
    except Exception as e:
        logger.error(f"Error in extraction_node: {str(e)}")
        # Recover gracefully by returning empty placeholders
        return {
            "current_stage": "extraction",
            "knowledge_units": [],
            "knowledge_count": 0
        }


async def validation_node(state: MemoryState) -> Dict[str, Any]:
    """Orchestrates consistency audits and logical contradiction validation."""
    logger.info(f"[LangGraph Node] Running validation_node for session: {state.get('session_id')}")
    
    session_id = state.get("session_id")
    if not session_id:
        logger.error("Missing session_id in validation_node state.")
        return {
            "current_stage": "validation",
            "validation_reports": [],
            "validated_units": []
        }

    from app.database import crud
    from app.database.session import async_session
    from app.agents.knowledge_validation_agent import knowledge_validation_agent

    try:
        async with async_session() as db:
            # 1. Retrieve all knowledge units extracted for the session from the DB
            # We map each unit and inject its database id so the LLM can align the reports
            db_units = await crud.get_knowledge_units(db, session_id)
            knowledge_units_data = []
            for unit in db_units:
                unit_dict = dict(unit.content) if isinstance(unit.content, dict) else {}
                unit_dict["id"] = unit.id
                knowledge_units_data.append(unit_dict)

            # 2. Retrieve reference documents content
            uploaded_docs = await crud.get_uploaded_documents(db, session_id)
            docs_contents = []
            for doc in uploaded_docs:
                if doc.content_extracted:
                    docs_contents.append(f"Document Name: {doc.filename}\nContent:\n{doc.content_extracted}")
            docs_content_str = "\n\n".join(docs_contents)

            # 3. Call agent to perform audits
            reports = await knowledge_validation_agent.validate(
                knowledge_units=knowledge_units_data,
                documents_content=docs_content_str
            )

            # 4. Filter validated units (those that passed the audit successfully)
            validated_ids = {r["knowledge_unit_id"] for r in reports if r["validation_status"] == "Validated"}
            validated_units = [u for u in knowledge_units_data if u.get("id") in validated_ids]

            # 5. Persist the Validation Reports list into the database
            if reports:
                avg_confidence = sum(r["confidence_score"] for r in reports) / len(reports)
                await crud.add_validation_report(
                    db=db,
                    session_id=session_id,
                    content=reports,
                    confidence_score=avg_confidence
                )

            logger.info(f"[LangGraph Node] Validation node completed. Generated {len(reports)} reports. Validated: {len(validated_units)} units.")
            
            return {
                "current_stage": "validation",
                "validation_reports": reports,
                "validated_units": validated_units
            }
            
    except Exception as e:
        logger.error(f"Error in validation_node: {str(e)}")
        # Recover gracefully
        return {
            "current_stage": "validation",
            "validation_reports": [],
            "validated_units": []
        }


async def documentation_node(state: MemoryState) -> Dict[str, Any]:
    """Orchestrates compilation of validated knowledge into documentation templates."""
    logger.info(f"[LangGraph Node] Running documentation_node for session: {state.get('session_id')}")
    
    session_id = state.get("session_id")
    if not session_id:
        logger.error("Missing session_id in documentation_node state.")
        return {
            "current_stage": "documentation",
            "generated_documents": [],
            "documentation_count": 0
        }

    from app.database import crud
    from app.database.session import async_session
    from app.agents.documentation_agent import documentation_agent

    try:
        async with async_session() as db:
            # 1. Fetch all validation reports for this session
            reports_records = await crud.get_validation_reports(db, session_id)
            validated_unit_ids = set()
            validation_reports_list = []
            
            for record in reports_records:
                # content holds the JSON array of reports
                reports_data = record.content if isinstance(record.content, list) else []
                for report in reports_data:
                    validation_reports_list.append(report)
                    if report.get("validation_status") == "Validated":
                        validated_unit_ids.add(report.get("knowledge_unit_id"))

            # 2. Fetch all knowledge units and filter to include ONLY validated ones
            db_units = await crud.get_knowledge_units(db, session_id)
            validated_units_data = []
            for unit in db_units:
                if unit.id in validated_unit_ids:
                    unit_dict = dict(unit.content) if isinstance(unit.content, dict) else {}
                    unit_dict["id"] = unit.id
                    validated_units_data.append(unit_dict)

            logger.info(f"[LangGraph Node] Found {len(validated_units_data)} validated units for session {session_id}.")

            if not validated_units_data:
                logger.warning(f"[LangGraph Node] No validated knowledge units found. Skipping document generation.")
                return {
                    "current_stage": "documentation",
                    "generated_documents": [],
                    "documentation_count": 0
                }

            # 3. Retrieve reference documents content for context
            uploaded_docs = await crud.get_uploaded_documents(db, session_id)
            docs_contents = []
            for doc in uploaded_docs:
                if doc.content_extracted:
                    docs_contents.append(f"Document Name: {doc.filename}\nContent:\n{doc.content_extracted}")
            docs_content_str = "\n\n".join(docs_contents)

            # 4. Call agent to compile documentation manuals
            compiled_docs = await documentation_agent.compile_docs(
                knowledge_units=validated_units_data,
                validation_reports=validation_reports_list,
                documents_context=docs_content_str
            )

            # 5. Persist generated documents in the SQL database
            filepaths = []
            for doc in compiled_docs:
                await crud.add_generated_document(
                    db=db,
                    session_id=session_id,
                    filepath=doc["filepath"],
                    doc_type=doc["type"],
                    metadata_info=doc["metadata"]
                )
                filepaths.append(doc["filepath"])

            logger.info(f"[LangGraph Node] Documentation node completed. Generated {len(filepaths)} manuals.")
            
            return {
                "current_stage": "documentation",
                "generated_documents": filepaths,
                "documentation_count": len(filepaths)
            }
            
    except Exception as e:
        logger.error(f"Error in documentation_node: {str(e)}")
        # Recover gracefully
        return {
            "current_stage": "documentation",
            "generated_documents": [],
            "documentation_count": 0
        }


# ==========================================
# Graph Definition
# ==========================================

workflow = StateGraph(MemoryState)

# Register all nodes
workflow.add_node("interview", interview_node)
workflow.add_node("extraction", extraction_node)
workflow.add_node("validation", validation_node)
workflow.add_node("documentation", documentation_node)

# Set up transitions: START -> interview -> extraction -> validation -> documentation -> END
workflow.add_edge(START, "interview")
workflow.add_edge("interview", "extraction")
workflow.add_edge("extraction", "validation")
workflow.add_edge("validation", "documentation")
workflow.add_edge("documentation", END)

# Compile graph
graph = workflow.compile()
logger.info("LangGraph workflow successfully built and compiled.")


# ==========================================
# QA Graph Definition
# ==========================================

async def qa_node(state: MemoryState) -> Dict[str, Any]:
    """Orchestrates query answering using semantic retrieval."""
    logger.info(f"[LangGraph Node] Running qa_node for query: '{state.get('query')}'")
    
    query = state.get("query", "")
    if not query:
        return {
            "current_stage": "qa",
            "generated_answer": "No query was provided.",
            "retrieved_documents": [],
            "retrieved_knowledge_units": [],
            "citations": []
        }

    from app.agents.enterprise_qa_agent import enterprise_qa_agent
    from app.database.session import async_session

    try:
        async with async_session() as db:
            response = await enterprise_qa_agent.answer_question(db, query)
            # Map human-readable citations to list of Dicts
            citations_dicts = [{"source": c, "content": "RAG Source Context"} for c in response.citations]
            
            # Map used_sources and knowledge units for LangGraph state update
            res_dict = {
                "current_stage": "qa",
                "generated_answer": response.answer,
                "retrieved_documents": response.used_sources,
                "retrieved_knowledge_units": [], # Structured context retrieved internally
                "citations": citations_dicts,
                "confidence_score": response.confidence_score,
                "final_response": response.model_dump_json() # We store the full JSON here!
            }
            logger.info(f"[qa_node Debug] Returning keys: {list(res_dict.keys())}")
            logger.info(f"[qa_node Debug] Returning final_response len: {len(res_dict['final_response'])}")
            return res_dict
    except Exception as e:
        logger.error(f"Error in qa_node: {e}")
        return {
            "current_stage": "qa",
            "generated_answer": f"Error compiling answer: {e}",
            "retrieved_documents": [],
            "retrieved_knowledge_units": [],
            "citations": []
        }


qa_workflow = StateGraph(MemoryState)
qa_workflow.add_node("qa", qa_node)
qa_workflow.add_edge(START, "qa")
qa_workflow.add_edge("qa", END)
qa_graph = qa_workflow.compile()
logger.info("QA LangGraph workflow successfully compiled.")
