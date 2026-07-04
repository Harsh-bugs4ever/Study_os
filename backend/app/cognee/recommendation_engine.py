from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import ConceptNode, KnowledgeDocument, QuizAttempt, StudentMemory
from .learning_profile import build_learning_profile, persist_learning_profile
from .memory import remember_student_fact


def _priority_topic(profile: dict[str, Any], nodes: list[ConceptNode]) -> str:
    if profile.get("weak_topics"):
        return profile["weak_topics"][0]
    weakest = sorted(nodes, key=lambda item: item.mastery)
    if weakest:
        return weakest[0].name
    return "your next pending topic"


async def adaptive_recommendations(db: Session, user_id) -> dict[str, Any]:
    profile = await persist_learning_profile(db, user_id)
    nodes = list(db.scalars(select(ConceptNode).where(ConceptNode.user_id == user_id).order_by(ConceptNode.mastery.asc()).limit(30)).all())
    documents = list(db.scalars(select(KnowledgeDocument).where(KnowledgeDocument.user_id == user_id).order_by(KnowledgeDocument.created_at.desc()).limit(20)).all())
    quizzes = list(db.scalars(select(QuizAttempt).where(QuizAttempt.user_id == user_id).order_by(QuizAttempt.created_at.desc()).limit(20)).all())
    next_topic = _priority_topic(profile, nodes)
    weak = profile.get("weak_topics", [])[:5]
    strong = set(profile.get("strong_topics", [])[:12])

    recommendations = [
        {"type": "study_first", "title": next_topic, "reason": "Lowest current mastery or repeated weakness", "action": "Study first"},
        *[
            {"type": "practice", "title": topic, "reason": "Repeated mistakes or low confidence", "action": "Practice questions"}
            for topic in weak[:3]
        ],
        *[
            {"type": "review_pdf", "title": doc.title, "reason": "Recently uploaded study material", "action": "Review PDF"}
            for doc in documents[:3]
        ],
        *[
            {"type": "retry_quiz", "title": quiz.topic, "reason": f"Last score {round((quiz.correct / quiz.total) * 100)}%", "action": "Retry quiz"}
            for quiz in quizzes
            if quiz.topic not in strong and (quiz.correct / quiz.total) < 0.75
        ][:3],
    ]
    weekly = {
        "completed_quizzes": len(quizzes),
        "completed_chapters": len(profile.get("completed_chapters", [])),
        "weak_topics": len(profile.get("weak_topics", [])),
        "strong_topics": len(profile.get("strong_topics", [])),
    }
    payload = {
        "profile": profile,
        "next_best_topic": next_topic,
        "confidence_score": profile.get("confidence_score", 50),
        "weekly_progress": weekly,
        "recommendations": recommendations[:10],
        "insights": [
            f"Use {profile.get('preferred_explanation_style', 'step-by-step')} explanations for new topics.",
            f"Keep sessions {profile.get('attention_span', 'medium')} and revision {profile.get('revision_frequency', 'weekly')}.",
            f"Focus adaptive quizzes on {next_topic}.",
        ],
    }
    await remember_student_fact(db, user_id, "adaptive_recommendations", "latest", payload)
    return payload


async def update_after_quiz(db: Session, user_id) -> dict[str, Any]:
    profile = await persist_learning_profile(db, user_id)
    return await adaptive_recommendations(db, user_id)
