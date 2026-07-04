from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import ConceptEdge, ConceptNode, KnowledgeDocument, QuizAttempt, StudentMemory
from .client import dataset_for_user
from .learning_profile import persist_learning_profile
from .recommendation_engine import adaptive_recommendations
from .search import RetrievalMode, context_text, search_memory


def _iso(dt) -> str:
    return dt.isoformat() if dt else ""


def _tags(memory: StudentMemory) -> list[str]:
    value = memory.value if isinstance(memory.value, dict) else {}
    return list(dict.fromkeys([memory.kind, *value.get("tags", [])]))[:8]


def memory_timeline(db: Session, user_id) -> list[dict[str, Any]]:
    memories = list(db.scalars(
        select(StudentMemory)
        .where(StudentMemory.user_id == user_id, StudentMemory.deleted_at.is_(None))
        .order_by(StudentMemory.updated_at.desc())
        .limit(120)
    ).all())
    return [
        {
            "id": str(memory.id),
            "kind": memory.kind,
            "title": memory.memory_key,
            "summary": str(memory.value.get("excerpt") or memory.value.get("topic") or memory.value.get("title") or memory.value)[:240],
            "tags": _tags(memory),
            "pinned": memory.pinned,
            "timestamp": _iso(memory.updated_at),
        }
        for memory in memories
    ]


def knowledge_evolution(db: Session, user_id) -> dict[str, Any]:
    nodes = list(db.scalars(select(ConceptNode).where(ConceptNode.user_id == user_id).order_by(ConceptNode.updated_at.asc())).all())
    edges = list(db.scalars(select(ConceptEdge).where(ConceptEdge.user_id == user_id).order_by(ConceptEdge.updated_at.asc())).all())
    buckets: dict[str, dict[str, int]] = defaultdict(lambda: {"concepts": 0, "relationships": 0})
    for node in nodes:
        buckets[node.updated_at.date().isoformat()]["concepts"] += 1
    for edge in edges:
        buckets[edge.updated_at.date().isoformat()]["relationships"] += 1
    cumulative_concepts = 0
    cumulative_relationships = 0
    timeline = []
    for day in sorted(buckets):
        cumulative_concepts += buckets[day]["concepts"]
        cumulative_relationships += buckets[day]["relationships"]
        timeline.append({
            "date": day,
            "concepts": cumulative_concepts,
            "relationships": cumulative_relationships,
            "new_concepts": buckets[day]["concepts"],
            "new_relationships": buckets[day]["relationships"],
        })
    return {"timeline": timeline, "latest": timeline[-1] if timeline else {"concepts": 0, "relationships": 0}}


def document_relationships(db: Session, user_id) -> dict[str, Any]:
    docs = list(db.scalars(select(KnowledgeDocument).where(KnowledgeDocument.user_id == user_id).order_by(KnowledgeDocument.created_at.desc()).limit(60)).all())
    nodes = list(db.scalars(select(ConceptNode).where(ConceptNode.user_id == user_id).limit(200)).all())
    doc_nodes = []
    links = []
    for doc in docs:
        doc_nodes.append({"id": str(doc.id), "title": doc.title, "type": "document"})
    for node in nodes:
        doc_nodes.append({"id": str(node.id), "title": node.name, "type": "concept", "mastery": node.mastery})
        for evidence in node.documents or []:
            doc_id = evidence.get("id")
            if doc_id:
                links.append({"source": str(doc_id), "target": str(node.id), "relationship": "mentions"})
    return {"nodes": doc_nodes, "edges": links}


def learning_heatmaps(db: Session, user_id) -> dict[str, Any]:
    attempts = list(db.scalars(select(QuizAttempt).where(QuizAttempt.user_id == user_id).order_by(QuizAttempt.created_at.asc()).limit(240)).all())
    revision_memories = list(db.scalars(select(StudentMemory).where(
        StudentMemory.user_id == user_id,
        StudentMemory.kind.in_(["learning_path", "study_completion", "adaptive_recommendations"]),
        StudentMemory.deleted_at.is_(None),
    ).order_by(StudentMemory.updated_at.asc()).limit(240)).all())
    quiz_counter = Counter(attempt.created_at.date().isoformat() for attempt in attempts)
    revision_counter = Counter(memory.updated_at.date().isoformat() for memory in revision_memories)
    return {
        "learning": [{"date": day, "count": count} for day, count in sorted(quiz_counter.items())],
        "revision": [{"date": day, "count": count} for day, count in sorted(revision_counter.items())],
    }


async def semantic_search(db: Session, user_id, query: str, mode: RetrievalMode = RetrievalMode.CHUNKS) -> dict[str, Any]:
    datasets = [dataset_for_user(None), dataset_for_user(user_id)]
    result = await search_memory(query, mode, datasets=datasets, top_k=12)
    text = context_text(result)
    return {
        "query": query,
        "mode": mode.value,
        "results": [{"text": section[:900]} for section in text.split("\n\n") if section.strip()][:12],
    }


async def revision_cards(db: Session, user_id, topic: str | None = None) -> dict[str, Any]:
    profile = await persist_learning_profile(db, user_id)
    target_topics = [topic] if topic else profile.get("weak_topics", [])[:5]
    if not target_topics:
        target_topics = profile.get("strong_topics", [])[:2] or ["Core concepts"]
    cards = []
    for target in target_topics:
        summary = await semantic_search(db, user_id, f"revision summary key facts mistakes {target}", RetrievalMode.SUMMARIES)
        text = " ".join(item["text"] for item in summary["results"])[:600]
        cards.append({
            "topic": target,
            "front": f"What should you remember about {target}?",
            "back": text or f"Review definitions, prerequisites, common mistakes, and one practice question for {target}.",
            "source": "Cognee summaries and memory",
        })
    return {"cards": cards, "mode": "smart_revision", "profile": profile}


async def ai_mentor(db: Session, user_id) -> dict[str, Any]:
    recs = await adaptive_recommendations(db, user_id)
    docs = list(db.scalars(select(KnowledgeDocument).where(KnowledgeDocument.user_id == user_id).order_by(KnowledgeDocument.created_at.desc()).limit(1)).all())
    attempts = list(db.scalars(select(QuizAttempt).where(QuizAttempt.user_id == user_id).order_by(QuizAttempt.created_at.desc()).limit(20)).all())
    weakest = recs["next_best_topic"]
    improved = None
    if len(attempts) >= 2:
        latest = attempts[0]
        previous = next((item for item in attempts[1:] if item.topic == latest.topic), None)
        if previous:
            improved = {
                "topic": latest.topic,
                "delta": round((latest.correct / latest.total - previous.correct / previous.total) * 100),
            }
    return {
        "todays_focus": weakest,
        "progress_since_last_session": recs["weekly_progress"],
        "weakest_topic": weakest,
        "most_improved_topic": improved,
        "suggested_revision": next((item for item in recs["recommendations"] if item["type"] in {"study_first", "practice"}), None),
        "suggested_quiz": {"topic": weakest, "difficulty": "adaptive"},
        "suggested_document": {"title": docs[0].title, "id": str(docs[0].id)} if docs else None,
        "recommendations": recs["recommendations"],
        "insights": recs["insights"],
    }


def demo_metrics(db: Session, user_id) -> dict[str, Any]:
    memory_count = db.scalar(select(func.count()).select_from(StudentMemory).where(StudentMemory.user_id == user_id, StudentMemory.deleted_at.is_(None))) or 0
    node_count = db.scalar(select(func.count()).select_from(ConceptNode).where(ConceptNode.user_id == user_id)) or 0
    edge_count = db.scalar(select(func.count()).select_from(ConceptEdge).where(ConceptEdge.user_id == user_id)) or 0
    docs = db.scalar(select(func.count()).select_from(KnowledgeDocument).where(KnowledgeDocument.user_id == user_id)) or 0
    quizzes = db.scalar(select(func.count()).select_from(QuizAttempt).where(QuizAttempt.user_id == user_id)) or 0
    plans = db.scalar(select(func.count()).select_from(StudentMemory).where(StudentMemory.user_id == user_id, StudentMemory.kind == "learning_path", StudentMemory.deleted_at.is_(None))) or 0
    searches = db.scalar(select(func.count()).select_from(StudentMemory).where(StudentMemory.user_id == user_id, StudentMemory.kind == "cognee_search", StudentMemory.deleted_at.is_(None))) or 0
    updates = db.scalar(select(func.count()).select_from(StudentMemory).where(StudentMemory.user_id == user_id, StudentMemory.updated_at >= datetime.now(timezone.utc) - timedelta(days=7), StudentMemory.deleted_at.is_(None))) or 0
    return {
        "number_of_memories": memory_count,
        "knowledge_graph_size": {"concepts": node_count, "relationships": edge_count},
        "concepts_learned": node_count,
        "relationships_built": edge_count,
        "documents_indexed": docs,
        "quiz_attempts": quizzes,
        "study_plans_generated": plans,
        "cognee_searches": searches,
        "memory_updates": updates,
    }
