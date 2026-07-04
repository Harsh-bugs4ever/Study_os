from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import ConceptNode, Profile, QuizAttempt, StudentMemory
from .memory import remember_student_fact


PROFILE_KEY = "persistent_learning_profile"


DEFAULT_PROFILE: dict[str, Any] = {
    "learning_style": "balanced",
    "difficulty_preference": "adaptive",
    "study_time": "",
    "weak_topics": [],
    "strong_topics": [],
    "completed_chapters": [],
    "quiz_history": [],
    "mistake_patterns": [],
    "preferred_explanation_style": "step-by-step",
    "preferred_language": "English",
    "attention_span": "medium",
    "revision_frequency": "weekly",
    "learning_speed": "steady",
    "confidence_score": 50,
    "updated_at": None,
}


def _score_state(score: float) -> str:
    if score >= 0.8:
        return "strong"
    if score < 0.6:
        return "weak"
    return "learning"


def _unique(values: list[Any], limit: int = 20) -> list[Any]:
    result = []
    seen = set()
    for value in values:
        key = str(value).lower()
        if key not in seen and value:
            seen.add(key)
            result.append(value)
    return result[:limit]


def _memory_value(db: Session, user_id) -> dict[str, Any]:
    memory = db.scalar(
        select(StudentMemory).where(
            StudentMemory.user_id == user_id,
            StudentMemory.kind == "learning_profile",
            StudentMemory.memory_key == PROFILE_KEY,
            StudentMemory.deleted_at.is_(None),
        )
    )
    return dict(memory.value) if memory else {}


def build_learning_profile(db: Session, user_id) -> dict[str, Any]:
    stored = _memory_value(db, user_id)
    profile_row = db.get(Profile, user_id)
    attempts = list(db.scalars(
        select(QuizAttempt).where(QuizAttempt.user_id == user_id).order_by(QuizAttempt.created_at.desc()).limit(80)
    ).all())
    nodes = list(db.scalars(
        select(ConceptNode).where(ConceptNode.user_id == user_id).order_by(ConceptNode.updated_at.desc()).limit(120)
    ).all())
    memories = list(db.scalars(
        select(StudentMemory).where(StudentMemory.user_id == user_id, StudentMemory.deleted_at.is_(None)).order_by(StudentMemory.updated_at.desc()).limit(120)
    ).all())

    weak_topics = []
    strong_topics = []
    quiz_history = []
    mistakes = []
    for attempt in attempts:
        score = attempt.correct / attempt.total
        item = {
            "subject": attempt.subject,
            "topic": attempt.topic,
            "score": round(score * 100),
            "timestamp": attempt.created_at.isoformat(),
        }
        quiz_history.append(item)
        if _score_state(score) == "weak":
            weak_topics.append(attempt.topic)
        elif _score_state(score) == "strong":
            strong_topics.append(attempt.topic)
        for question in attempt.details.get("questions", []):
            if not question.get("is_correct", False):
                mistakes.append({
                    "topic": attempt.topic,
                    "concept": question.get("concept") or attempt.topic,
                    "pattern": question.get("question", "")[:180],
                })

    weak_topics.extend(node.name for node in nodes if node.mastery < 60)
    strong_topics.extend(node.name for node in nodes if node.mastery >= 80)
    completed = [
        item.value.get("topic") or item.memory_key
        for item in memories
        if item.kind in {"study_completion", "completed_chapter"} and isinstance(item.value, dict)
    ]

    confidence = stored.get("confidence_score")
    if confidence is None:
        recent = quiz_history[:8]
        confidence = round(sum(item["score"] for item in recent) / len(recent)) if recent else (profile_row.readiness_score if profile_row else 50)

    return {
        **DEFAULT_PROFILE,
        **stored,
        "study_time": stored.get("study_time") or (profile_row.study_time if profile_row else ""),
        "weak_topics": _unique([*weak_topics, *stored.get("weak_topics", [])]),
        "strong_topics": _unique([*strong_topics, *stored.get("strong_topics", [])]),
        "completed_chapters": _unique([*completed, *stored.get("completed_chapters", [])]),
        "quiz_history": quiz_history[:25],
        "mistake_patterns": mistakes[:20],
        "confidence_score": max(0, min(100, int(confidence))),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


async def persist_learning_profile(db: Session, user_id, updates: dict[str, Any] | None = None) -> dict[str, Any]:
    profile = build_learning_profile(db, user_id)
    if updates:
        profile = {**profile, **{key: value for key, value in updates.items() if value is not None}}
    await remember_student_fact(db, user_id, "learning_profile", PROFILE_KEY, profile)
    return profile


def explain_profile_for_prompt(profile: dict[str, Any]) -> str:
    return "\n".join([
        f"Learning style: {profile.get('learning_style')}",
        f"Difficulty preference: {profile.get('difficulty_preference')}",
        f"Preferred explanation style: {profile.get('preferred_explanation_style')}",
        f"Preferred language: {profile.get('preferred_language')}",
        f"Attention span: {profile.get('attention_span')}",
        f"Learning speed: {profile.get('learning_speed')}",
        f"Confidence score: {profile.get('confidence_score')}",
        f"Weak topics: {', '.join(profile.get('weak_topics', [])[:10])}",
        f"Strong topics: {', '.join(profile.get('strong_topics', [])[:10])}",
        f"Mistake patterns: {profile.get('mistake_patterns', [])[:5]}",
    ])
