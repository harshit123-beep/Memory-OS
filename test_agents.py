import pytest
from app.schemas.schemas import InterviewTurnSchema, KnowledgeTrackerSchema

def test_interview_turn_schema_validation():
    """Test that valid interview turn metadata matches the expected schema."""
    tracker = KnowledgeTrackerSchema(
        covered_topics=["GitLab Runners"],
        remaining_topics=["Database Workaround", "Tableau Accounts"],
        important_findings=["Temporary admin keys used"],
        knowledge_gaps=["Token rotation undocumented"]
    )
    turn = InterviewTurnSchema(
        response="Got it. How do you rotate these tokens?",
        is_finished=False,
        internal_tracker=tracker
    )
    assert turn.response.startswith("Got it.")
    assert turn.is_finished is False
    assert len(turn.internal_tracker.covered_topics) == 1
    assert len(turn.internal_tracker.remaining_topics) == 2

def test_interview_turn_schema_finished_state():
    """Test schema behavior when interview reaches completion state."""
    tracker = KnowledgeTrackerSchema(
        covered_topics=["GitLab", "Tableau", "Database"],
        remaining_topics=[],
        important_findings=["All items documented"],
        knowledge_gaps=[]
    )
    turn = InterviewTurnSchema(
        response="Thank you for sharing your knowledge. The interview is now complete.",
        is_finished=True,
        internal_tracker=tracker
    )
    assert turn.is_finished is True
    assert len(turn.internal_tracker.remaining_topics) == 0
