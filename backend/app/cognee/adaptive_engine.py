from typing import Any

from sqlalchemy.orm import Session

from .explainability import explainable_context
from .learning_profile import explain_profile_for_prompt, persist_learning_profile
from services.groq_service import GroqService


async def adaptive_tutor_answer(db: Session, user_id, messages: list[dict], context: dict[str, Any] | None = None) -> dict[str, Any]:
    profile = await persist_learning_profile(db, user_id)
    latest = next((item.get("content", "") for item in reversed(messages) if item.get("role") == "user"), "")
    query = " ".join(x for x in ((context or {}).get("currentSubject", ""), (context or {}).get("currentTopic", ""), latest) if x)
    evidence = await explainable_context(db, user_id, query)
    style = profile.get("learning_style", "balanced")
    difficulty = profile.get("difficulty_preference", "adaptive")
    style_rule = {
        "visual": "Use simple diagrams, spatial analogies, and compact tables when helpful.",
        "auditory": "Use conversational explanation and memorable phrasing.",
        "reading": "Use structured notes, definitions, and bullet summaries.",
        "kinesthetic": "Use examples, mini exercises, and practice prompts.",
    }.get(str(style).lower(), "Use a balanced explanation with an example and a short check.")
    system = f"""You are Saathi, an adaptive AI tutor.
Personalize every answer using the student's Learning Profile, Cognee chunks, summaries, insights, graph completion, weak topics, planner context, previous chats, and quiz history.
{style_rule}
If beginner or low confidence, simplify. If advanced or high confidence, use more technical detail.
Preferred language: {profile.get('preferred_language')}
Preferred explanation style: {profile.get('preferred_explanation_style')}
Difficulty preference: {difficulty}

Learning Profile:
{explain_profile_for_prompt(profile)}

Retrieved Cognee context:
{evidence["context"][:12000]}
"""
    answer = await GroqService().complete(system, messages)
    return {
        "answer": answer,
        "profile": profile,
        "sources": evidence["sources"],
        "graph_nodes": evidence["graph_nodes"],
        "memories": evidence["memories"],
        "related_documents": evidence["related_documents"],
        "related_topics": evidence["related_topics"],
        "reasoning": [
            "Retrieved Cognee chunks, summaries, insights, and graph completion for the question.",
            "Merged weak topics, planner context, previous chats, quiz history, and the persistent Learning Profile.",
            f"Adapted the explanation for {style} learning style and {difficulty} difficulty preference.",
        ],
        "previous_conversations": evidence["previous_conversations"],
        "quiz_history": evidence["quiz_history"],
        "weak_topics": evidence["weak_topics"],
        "study_planner_context": evidence["study_planner_context"],
    }
