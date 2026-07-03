import json
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from repositories import MemoryRepository
from .client import cognee_module, dataset_for_user, write_lock

async def remember_student_fact(db: Session, user_id, kind: str, key: str, value: dict) -> None:
    MemoryRepository(db).upsert(user_id, kind, key, value)
    cognee = cognee_module()
    if cognee:
        text = f"Student memory. Type: {kind}. Key: {key}. Value: {json.dumps(value, default=str)}"
        async with write_lock():
            await cognee.add(text, dataset_name=dataset_for_user(user_id))
            await cognee.cognify(datasets=[dataset_for_user(user_id)], incremental_loading=True)

async def remember_quiz_attempt(db: Session, user_id, subject: str, topic: str, correct: int, total: int, details: dict) -> None:
    repository = MemoryRepository(db)
    repository.add_quiz_attempt(user_id, subject, topic, correct, total, details)
    memory_key = f"{subject}:{topic}"
    recorded_at = datetime.now(timezone.utc).isoformat()
    await remember_student_fact(db, user_id, "quiz_attempt", f"{memory_key}:{recorded_at}", {
        "subject": subject,
        "topic": topic,
        "correct": correct,
        "total": total,
        "score": round(correct / total, 4),
        "timestamp": recorded_at,
        "questions": details.get("questions", []),
    })
    previous = repository.get(user_id, "mastery", memory_key)
    attempt_score = correct / total
    previous_value = previous.value if previous else {}
    previous_score = float(previous_value.get("score", attempt_score))
    attempts = int(previous_value.get("attempts", 0)) + 1
    mastery_score = round((previous_score * 0.65) + (attempt_score * 0.35), 4)
    weak_concepts = details.get("weakConcepts") or details.get("weak_concepts") or []
    if isinstance(weak_concepts, str):
        weak_concepts = [weak_concepts]
    state = "mastered" if mastery_score >= .8 else "weak" if mastery_score < .6 else "learning"
    await remember_student_fact(db, user_id, "mastery", memory_key, {
        "subject": subject,
        "topic": topic,
        "score": mastery_score,
        "last_score": round(attempt_score, 4),
        "state": state,
        "attempts": attempts,
        "weak_concepts": weak_concepts,
        "last_attempt": details,
    })
    if weak_concepts or state == "weak":
        await remember_student_fact(db, user_id, "weak_topic", memory_key, {
            "subject": subject,
            "topic": topic,
            "score": mastery_score,
            "weak_concepts": weak_concepts,
        })
    await remember_student_fact(db, user_id, "learning_path", memory_key, {
        "subject": subject,
        "topic": topic,
        "recommendation_basis": "quiz_mastery",
        "priority": "high" if state == "weak" else "medium" if state == "learning" else "low",
        "next_action": "revise weak concepts" if state == "weak" else "practice mixed questions" if state == "learning" else "advance to related concepts",
    })

async def remember_conversation(user_id, messages: list[dict]) -> None:
    cognee = cognee_module()
    if not cognee or not user_id or not messages: return
    transcript = "Conversation:\n" + "\n".join(f"{m.get('role','unknown')}: {m.get('content','')}" for m in messages[-12:])
    async with write_lock():
        await cognee.add(transcript, dataset_name=dataset_for_user(user_id))
        await cognee.cognify(datasets=[dataset_for_user(user_id)], incremental_loading=True)
