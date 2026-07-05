from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import ConceptNode, KnowledgeDocument, QuizAttempt, StudentMemory
from ..services.tutor_service import retrieve_complete_tutor_context
from .client import dataset_for_user
from .memory import remember_conversation
from .search import context_text
from services.groq_service import GroqService


def _short(value: Any, limit: int = 700) -> str:
    text = str(value or "")
    return text[:limit]


def _memory_row(memory: StudentMemory) -> dict[str, Any]:
    return {
        "id": str(memory.id),
        "kind": memory.kind,
        "key": memory.memory_key,
        "value": memory.value,
        "pinned": memory.pinned,
        "created_at": memory.created_at.isoformat(),
        "updated_at": memory.updated_at.isoformat(),
    }


def _matches(query: str, *values: Any) -> bool:
    if not query:
        return True
    text = " ".join(str(value or "") for value in values).lower()
    return any(part in text for part in query.lower().split())


async def explainable_context(db: Session, user_id, query: str) -> dict[str, Any]:
    context, raw = await retrieve_complete_tutor_context(query, user_id)
    memories = list(db.scalars(
        select(StudentMemory)
        .where(StudentMemory.user_id == user_id, StudentMemory.deleted_at.is_(None))
        .order_by(StudentMemory.pinned.desc(), StudentMemory.updated_at.desc())
        .limit(80)
    ).all())
    relevant_memories = [item for item in memories if _matches(query, item.kind, item.memory_key, item.value)][:12]
    documents = list(db.scalars(
        select(KnowledgeDocument)
        .where(KnowledgeDocument.user_id == user_id)
        .order_by(KnowledgeDocument.created_at.desc())
        .limit(30)
    ).all())
    relevant_documents = [doc for doc in documents if _matches(query, doc.title, doc.storage_key, doc.media_type)][:8]
    quizzes = list(db.scalars(
        select(QuizAttempt)
        .where(QuizAttempt.user_id == user_id)
        .order_by(QuizAttempt.created_at.desc())
        .limit(30)
    ).all())
    relevant_quizzes = [quiz for quiz in quizzes if _matches(query, quiz.subject, quiz.topic, quiz.details)][:8]
    nodes = list(db.scalars(
        select(ConceptNode)
        .where(ConceptNode.user_id == user_id)
        .order_by(ConceptNode.updated_at.desc())
        .limit(80)
    ).all())
    relevant_nodes = [node for node in nodes if _matches(query, node.name, node.metadata_json, node.weaknesses)][:10]

    chunks = raw.get("chunks", []) if isinstance(raw, dict) else []
    summaries = raw.get("summaries", []) if isinstance(raw, dict) else []
    graph_completion = raw.get("graph_completion", []) if isinstance(raw, dict) else []
    weak_topics = [memory for memory in memories if memory.kind == "weak_topic"][:8]
    planner = [memory for memory in memories if memory.kind == "learning_path"][:8]
    conversations = [memory for memory in memories if memory.kind in {"conversation", "chat"}][:8]

    return {
        "context": context,
        "raw": raw,
        "sources": {
            "chunks": [{"text": _short(context_text(item)), "type": "chunk"} for item in chunks[:8]],
            "summaries": [{"text": _short(context_text(item)), "type": "summary"} for item in summaries[:8]],
            "graph_completion": [{"text": _short(context_text(item)), "type": "graph_completion"} for item in graph_completion[:8]],
        },
        "memories": [_memory_row(item) for item in relevant_memories],
        "related_documents": [
            {
                "id": str(doc.id),
                "title": doc.title,
                "storage_key": doc.storage_key,
                "media_type": doc.media_type,
                "status": doc.ingestion_status,
                "created_at": doc.created_at.isoformat(),
            }
            for doc in relevant_documents
        ],
        "quiz_history": [
            {
                "id": str(quiz.id),
                "subject": quiz.subject,
                "topic": quiz.topic,
                "score": round((quiz.correct / quiz.total) * 100),
                "created_at": quiz.created_at.isoformat(),
            }
            for quiz in relevant_quizzes
        ],
        "graph_nodes": [
            {
                "id": str(node.id),
                "name": node.name,
                "difficulty": node.difficulty,
                "mastery": node.mastery,
                "weaknesses": node.weaknesses or [],
            }
            for node in relevant_nodes
        ],
        "related_topics": [node.name for node in relevant_nodes],
        "previous_conversations": [_memory_row(item) for item in conversations],
        "weak_topics": [_memory_row(item) for item in weak_topics],
        "study_planner_context": [_memory_row(item) for item in planner],
        "datasets": [dataset_for_user(None), dataset_for_user(user_id)],
    }


async def explainable_chat(db: Session, user_id, messages: list[dict], context: dict[str, Any] | None = None) -> dict[str, Any]:
    from .adaptive_engine import adaptive_tutor_answer

    payload = await adaptive_tutor_answer(db, user_id, messages, context)
    if user_id:
        await remember_conversation(user_id, [*messages, {"role": "assistant", "content": payload["answer"][-8000:]}])
    return payload
