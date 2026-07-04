import json
import re
from typing import Any

from sqlalchemy.orm import Session

from .learning_profile import explain_profile_for_prompt, persist_learning_profile
from .recommendation_engine import adaptive_recommendations
from services.groq_service import GroqService


def _json_array(text: str) -> list[Any]:
    clean = re.sub(r"```(?:json)?", "", text).strip()
    start = clean.find("[")
    end = clean.rfind("]")
    if start < 0 or end < start:
        raise ValueError("No JSON array found")
    parsed = json.loads(clean[start:end + 1])
    return parsed if isinstance(parsed, list) else []


def adaptive_difficulty(profile: dict[str, Any], topic: str | None = None) -> str:
    weak = {str(item).lower() for item in profile.get("weak_topics", [])}
    strong = {str(item).lower() for item in profile.get("strong_topics", [])}
    lookup = (topic or "").lower()
    confidence = int(profile.get("confidence_score", 50))
    if lookup and any(item in lookup or lookup in item for item in weak):
        return "easy"
    if lookup and any(item in lookup or lookup in item for item in strong):
        return "hard" if confidence >= 70 else "medium"
    if confidence < 45:
        return "easy"
    if confidence >= 75:
        return "hard"
    return "medium"


async def generate_adaptive_quiz(db: Session, user_id, subject: str, topic: str | None, count: int = 5) -> dict[str, Any]:
    profile = await persist_learning_profile(db, user_id)
    recs = await adaptive_recommendations(db, user_id)
    target_topic = topic or recs["next_best_topic"]
    difficulty = adaptive_difficulty(profile, target_topic)
    system = f"""Return ONLY a JSON array of adaptive quiz questions.
Each item must have question, four options, correct (0-3), explanation, concept, difficulty, and hint.
Prioritize weak topics and avoid over-testing strong topics.
Difficulty: {difficulty}
Learning profile:
{explain_profile_for_prompt(profile)}
"""
    user = f"Subject: {subject}\nTarget topic: {target_topic}\nQuestion count: {count}"
    content = await GroqService().complete(system, [{"role": "user", "content": user}])
    return {
        "questions": _json_array(content)[:count],
        "difficulty": difficulty,
        "target_topic": target_topic,
        "profile": profile,
        "recommendations": recs["recommendations"],
    }
