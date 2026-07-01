import json
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import QuizAttempt, StudentMemory
from .client import cognee_module, dataset_for_user, write_lock

async def remember_student_fact(db: Session, user_id, kind: str, key: str, value: dict) -> None:
    stmt = insert(StudentMemory).values(user_id=user_id, kind=kind, memory_key=key, value=value)
    stmt = stmt.on_conflict_do_update(index_elements=["user_id", "kind", "memory_key"], set_={"value": value, "updated_at": datetime.now(timezone.utc)})
    db.execute(stmt); db.commit()
    cognee = cognee_module()
    if cognee:
        text = f"Student memory. Type: {kind}. Key: {key}. Value: {json.dumps(value, default=str)}"
        async with write_lock():
            await cognee.add(text, dataset_name=dataset_for_user(user_id))
            await cognee.cognify(datasets=[dataset_for_user(user_id)], incremental_loading=True)

async def remember_quiz_attempt(db: Session, user_id, subject: str, topic: str, correct: int, total: int, details: dict) -> None:
    db.add(QuizAttempt(user_id=user_id, subject=subject, topic=topic, correct=correct, total=total, details=details))
    db.commit()
    memory_key = f"{subject}:{topic}"
    previous = db.scalar(select(StudentMemory).where(
        StudentMemory.user_id == user_id,
        StudentMemory.kind == "mastery",
        StudentMemory.memory_key == memory_key,
    ))
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
