from datetime import datetime, timezone
from uuid import UUID
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import KnowledgeDocument, QuizAttempt, StudentMemory


def serialize_memory(memory: StudentMemory) -> dict[str, Any]:
    return {
        "id": str(memory.id),
        "kind": memory.kind,
        "key": memory.memory_key,
        "value": memory.value,
        "tags": (memory.value or {}).get("tags", []) if isinstance(memory.value, dict) else [],
        "pinned": memory.pinned,
        "created_at": memory.created_at.isoformat(),
        "updated_at": memory.updated_at.isoformat(),
    }


def memory_dashboard(db: Session, user_id) -> dict[str, Any]:
    memories = list(db.scalars(
        select(StudentMemory)
        .where(StudentMemory.user_id == user_id, StudentMemory.deleted_at.is_(None))
        .order_by(StudentMemory.pinned.desc(), StudentMemory.updated_at.desc())
        .limit(120)
    ).all())
    documents = list(db.scalars(
        select(KnowledgeDocument)
        .where(KnowledgeDocument.user_id == user_id)
        .order_by(KnowledgeDocument.created_at.desc())
        .limit(40)
    ).all())
    quizzes = list(db.scalars(
        select(QuizAttempt)
        .where(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.created_at.desc())
        .limit(40)
    ).all())
    return {
        "pinned": [serialize_memory(item) for item in memories if item.pinned],
        "recent": [serialize_memory(item) for item in memories[:30]],
        "conversations": [serialize_memory(item) for item in memories if item.kind in {"conversation", "chat"}],
        "quiz_memories": [serialize_memory(item) for item in memories if item.kind in {"quiz_attempt", "mastery", "weak_topic"}],
        "planner_history": [serialize_memory(item) for item in memories if item.kind == "learning_path"],
        "documents": [
            {
                "id": str(doc.id),
                "title": doc.title,
                "storage_key": doc.storage_key,
                "media_type": doc.media_type,
                "status": doc.ingestion_status,
                "created_at": doc.created_at.isoformat(),
            }
            for doc in documents
        ],
        "quiz_attempts": [
            {
                "id": str(item.id),
                "subject": item.subject,
                "topic": item.topic,
                "score": round((item.correct / item.total) * 100),
                "correct": item.correct,
                "total": item.total,
                "created_at": item.created_at.isoformat(),
            }
            for item in quizzes
        ],
    }


def search_memories(db: Session, user_id, query: str) -> list[dict[str, Any]]:
    terms = [term for term in query.lower().split() if term]
    memories = list(db.scalars(
        select(StudentMemory)
        .where(StudentMemory.user_id == user_id, StudentMemory.deleted_at.is_(None))
        .order_by(StudentMemory.pinned.desc(), StudentMemory.updated_at.desc())
        .limit(200)
    ).all())
    if not terms:
        return [serialize_memory(item) for item in memories[:50]]
    results = []
    for memory in memories:
        haystack = f"{memory.kind} {memory.memory_key} {memory.value}".lower()
        if all(term in haystack for term in terms):
            results.append(serialize_memory(memory))
    return results[:50]


def soft_delete_memory(db: Session, user_id, memory_id: str) -> None:
    memory = db.get(StudentMemory, UUID(memory_id))
    if not memory or memory.user_id != user_id:
        return
    memory.deleted_at = datetime.now(timezone.utc)
    memory.updated_at = datetime.now(timezone.utc)
    db.commit()


def pin_memory(db: Session, user_id, memory_id: str, pinned: bool) -> dict[str, Any] | None:
    memory = db.get(StudentMemory, UUID(memory_id))
    if not memory or memory.user_id != user_id or memory.deleted_at:
        return None
    memory.pinned = pinned
    memory.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(memory)
    return serialize_memory(memory)


def memory_history(db: Session, user_id) -> dict[str, Any]:
    data = memory_dashboard(db, user_id)
    quizzes = data["quiz_attempts"]
    documents = data["documents"]
    weak = data["quiz_memories"]
    latest_quiz = quizzes[0] if quizzes else None
    previous_same = next((item for item in quizzes[1:] if latest_quiz and item["topic"] == latest_quiz["topic"]), None)
    improvement = None
    if latest_quiz and previous_same:
        improvement = latest_quiz["score"] - previous_same["score"]
    weakest = next((item for item in weak if item["kind"] == "weak_topic"), None)
    return {
        **data,
        "replay": {
            "improvement": improvement,
            "improved_topic": latest_quiz["topic"] if latest_quiz and improvement is not None else None,
            "completed_quizzes": len(quizzes),
            "latest_document": documents[0] if documents else None,
            "weak_topic": (weakest or {}).get("value", {}).get("topic") if weakest else None,
            "recommendation": "Review weak concepts before the next quiz." if weakest else "Continue with the next recommended revision topic.",
        },
    }
