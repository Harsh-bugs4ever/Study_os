from collections import defaultdict
from typing import Any

from sqlalchemy.orm import Session

from repositories import MemoryRepository
from .client import dataset_for_user
from .search import RetrievalMode, context_text, search_memory


def _trend(scores: list[float]) -> str:
    if len(scores) < 2:
        return "steady"
    change = scores[0] - scores[-1]
    return "improving" if change >= .08 else "declining" if change <= -.08 else "steady"


async def student_analytics(db: Session, user_id) -> dict[str, list[Any]]:
    repository = MemoryRepository(db)
    attempts = repository.quiz_attempts(user_id)
    by_topic: dict[tuple[str, str], list] = defaultdict(list)
    mistakes: list[dict[str, Any]] = []

    for attempt in attempts:
        by_topic[(attempt.subject, attempt.topic)].append(attempt)
        for item in attempt.details.get("questions", []):
            if not item.get("is_correct", False):
                mistakes.append({
                    "topic": attempt.topic,
                    "question": item.get("question", ""),
                    "student_answer": item.get("student_answer"),
                    "correct_answer": item.get("correct_answer"),
                    "timestamp": item.get("timestamp") or attempt.created_at.isoformat(),
                })

    mastery_scores = []
    for (subject, topic), rows in by_topic.items():
        chronological = list(reversed(rows))
        scores = [row.correct / row.total for row in chronological]
        weighted = scores[0]
        for score in scores[1:]:
            weighted = weighted * .65 + score * .35
        repeated = sum(1 for mistake in mistakes if mistake["topic"] == topic)
        mastery_scores.append({
            "subject": subject,
            "topic": topic,
            "score": round(weighted * 100),
            "attempts": len(rows),
            "trend": _trend(list(reversed(scores))),
            "repeated_mistakes": repeated,
        })

    mastery_scores.sort(key=lambda item: item["score"])
    weak = [item for item in mastery_scores if item["score"] < 60]
    strong = [item for item in reversed(mastery_scores) if item["score"] >= 80]
    revision = sorted(mastery_scores, key=lambda item: (item["score"], -item["repeated_mistakes"]))

    # Graph completion supplies prerequisite/relationship context. The stable
    # structured ordering remains available if Cognee is temporarily offline.
    graph_context = ""
    if revision:
        names = ", ".join(item["topic"] for item in revision[:8])
        try:
            result = await search_memory(
                f"Recommend revision order using prerequisites and repeated mistakes for: {names}",
                RetrievalMode.GRAPH_COMPLETION,
                datasets=[dataset_for_user(user_id)],
                top_k=8,
            )
            graph_context = context_text(result)
        except Exception:
            pass

    return {
        "weak_topics": weak,
        "strong_topics": strong,
        "mastery_scores": mastery_scores,
        "recent_mistakes": mistakes[:10],
        "recommended_revision_order": [
            {**item, "reason": "Low mastery and repeated mistakes", "cognee_context": graph_context[:500] if index == 0 else ""}
            for index, item in enumerate(revision[:8])
        ],
    }
