from collections.abc import Iterable
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import ConceptEdge, ConceptNode, KnowledgeDocument, QuizAttempt, StudentMemory
from .client import dataset_for_user
from .relationship_service import concept_slug, extract_relationships_with_cognee, normalize_concept_name


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _dedupe_append(items: list[dict], new_item: dict, key: str, limit: int = 12) -> list[dict]:
    value = str(new_item.get(key, ""))
    merged = [item for item in items or [] if str(item.get(key, "")) != value]
    return [new_item, *merged][:limit]


class ConceptGraphBuilder:
    def __init__(self, db: Session, user_id):
        self.db = db
        self.user_id = user_id

    def _get_or_create_node(self, name: str, difficulty: str = "intermediate", metadata: dict | None = None) -> ConceptNode | None:
        concept = normalize_concept_name(name)
        slug = concept_slug(concept)
        if not concept or not slug:
            return None
        node = self.db.scalar(select(ConceptNode).where(ConceptNode.user_id == self.user_id, ConceptNode.slug == slug))
        if node:
            if difficulty and node.difficulty == "intermediate":
                node.difficulty = difficulty
            if metadata:
                node.metadata_json = {**(node.metadata_json or {}), **metadata}
            node.updated_at = datetime.now(timezone.utc)
            return node
        node = ConceptNode(
            user_id=self.user_id,
            name=concept,
            slug=slug,
            difficulty=difficulty or "intermediate",
            metadata_json=metadata or {},
        )
        self.db.add(node)
        self.db.flush()
        return node

    def _upsert_edge(self, source: ConceptNode, target: ConceptNode, relationship: str, strength: int, evidence: dict) -> None:
        if source.id == target.id:
            return
        existing = self.db.scalar(
            select(ConceptEdge).where(
                ConceptEdge.user_id == self.user_id,
                ConceptEdge.source_id == source.id,
                ConceptEdge.target_id == target.id,
                ConceptEdge.relationship == relationship,
            )
        )
        if existing:
            existing.strength = min(100, max(existing.strength, strength))
            existing.evidence = _dedupe_append(existing.evidence or [], evidence, "id")
            existing.updated_at = datetime.now(timezone.utc)
            return
        self.db.add(ConceptEdge(
            user_id=self.user_id,
            source_id=source.id,
            target_id=target.id,
            relationship=relationship or "related",
            strength=max(1, min(100, int(strength or 50))),
            evidence=[evidence],
        ))

    def _apply_mastery(self, node: ConceptNode, mastery: int | None, weakness: str | None = None) -> None:
        if mastery is not None:
            node.mastery = max(0, min(100, int(mastery)))
        if weakness:
            node.weaknesses = list(dict.fromkeys([weakness, *(node.weaknesses or [])]))[:10]

    def ingest_extraction(self, extraction: dict[str, Any], evidence: dict, *, mastery: int | None = None) -> None:
        nodes_by_name: dict[str, ConceptNode] = {}
        for item in extraction.get("concepts", []):
            if isinstance(item, str):
                item = {"name": item}
            node = self._get_or_create_node(
                item.get("name", ""),
                item.get("difficulty", "intermediate"),
                {"summary": item.get("summary", ""), "aliases": item.get("aliases", [])},
            )
            if not node:
                continue
            self._apply_mastery(node, mastery)
            key = concept_slug(node.name)
            nodes_by_name[key] = node
            if evidence["kind"] == "document":
                node.documents = _dedupe_append(node.documents or [], evidence, "id")
            elif evidence["kind"] == "quiz":
                node.quiz_history = _dedupe_append(node.quiz_history or [], evidence, "id")
            elif evidence["kind"] == "chat":
                node.chat_history = _dedupe_append(node.chat_history or [], evidence, "id")
            else:
                node.memories = _dedupe_append(node.memories or [], evidence, "id")

        for relation in extraction.get("relationships", []):
            source = nodes_by_name.get(concept_slug(str(relation.get("source", ""))))
            target = nodes_by_name.get(concept_slug(str(relation.get("target", ""))))
            if source and target:
                self._upsert_edge(source, target, relation.get("type", "related"), int(relation.get("strength") or 50), evidence)
        self.db.commit()

    async def ingest_document(self, document: KnowledgeDocument, concepts: Iterable[str] | None = None) -> None:
        seed = "\n".join(concepts or [])
        extraction = await extract_relationships_with_cognee(
            f"Document concepts:\n{seed}\nBuild prerequisites and related concepts.",
            [document.cognee_dataset],
            source_kind="document",
            source_title=document.title,
        )
        evidence = {
            "kind": "document",
            "id": str(document.id),
            "title": document.title,
            "storage_key": document.storage_key,
            "media_type": document.media_type,
            "timestamp": _now_iso(),
        }
        self.ingest_extraction(extraction, evidence)

    async def ingest_quiz_attempt(self, attempt: QuizAttempt) -> None:
        score = round((attempt.correct / attempt.total) * 100)
        weak = attempt.details.get("weakConcepts") or attempt.details.get("weak_concepts") or []
        if isinstance(weak, str):
            weak = [weak]
        source = "\n".join([
            f"Subject: {attempt.subject}",
            f"Topic: {attempt.topic}",
            f"Score: {score}",
            f"Weak concepts: {', '.join(weak)}",
            f"Questions: {attempt.details.get('questions', [])}",
        ])
        extraction = await extract_relationships_with_cognee(source, [dataset_for_user(self.user_id)], source_kind="quiz", source_title=attempt.topic)
        evidence = {
            "kind": "quiz",
            "id": str(attempt.id),
            "subject": attempt.subject,
            "topic": attempt.topic,
            "score": score,
            "correct": attempt.correct,
            "total": attempt.total,
            "timestamp": attempt.created_at.isoformat(),
        }
        self.ingest_extraction(extraction, evidence, mastery=score)
        for name in weak:
            node = self._get_or_create_node(name, "intermediate")
            if node:
                self._apply_mastery(node, min(score, 45), "Missed in quiz")
        self.db.commit()

    async def ingest_memory_fact(self, memory: StudentMemory) -> None:
        extraction = await extract_relationships_with_cognee(
            f"Memory kind: {memory.kind}\nKey: {memory.memory_key}\nValue: {memory.value}",
            [dataset_for_user(self.user_id)],
            source_kind=memory.kind,
            source_title=memory.memory_key,
        )
        evidence = {"kind": memory.kind, "id": str(memory.id), "key": memory.memory_key, "timestamp": _now_iso(), "value": memory.value}
        self.ingest_extraction(extraction, evidence)

    async def ingest_chat(self, messages: list[dict]) -> None:
        transcript = "\n".join(f"{m.get('role')}: {m.get('content', '')}" for m in messages[-12:])
        extraction = await extract_relationships_with_cognee(transcript, [dataset_for_user(self.user_id)], source_kind="chat", source_title="Saathi chat")
        evidence = {"kind": "chat", "id": f"chat:{_now_iso()}", "timestamp": _now_iso(), "excerpt": transcript[-1000:]}
        self.ingest_extraction(extraction, evidence)


def graph_payload(db: Session, user_id) -> dict[str, Any]:
    nodes = list(db.scalars(select(ConceptNode).where(ConceptNode.user_id == user_id).order_by(ConceptNode.updated_at.desc())).all())
    edges = list(db.scalars(select(ConceptEdge).where(ConceptEdge.user_id == user_id)).all())
    recommendations = list(db.scalars(select(StudentMemory).where(StudentMemory.user_id == user_id, StudentMemory.kind == "learning_path")).all())

    def recommendations_for(node: ConceptNode) -> list[dict]:
        matches = []
        for item in recommendations:
            value = item.value or {}
            if node.name in {item.memory_key, value.get("topic"), value.get("subject")} or node.slug == item.memory_key:
                matches.append({"id": str(item.id), "title": "Study planner recommendation", "value": value})
        return _dedupe_append(node.study_recommendations or [], matches[0], "id") if matches else node.study_recommendations or []
    return {
        "nodes": [
            {
                "id": str(node.id),
                "name": node.name,
                "slug": node.slug,
                "difficulty": node.difficulty,
                "mastery": node.mastery,
                "metadata": node.metadata_json or {},
                "connectedDocuments": node.documents or [],
                "connectedMemories": node.memories or [],
                "relatedQuizHistory": node.quiz_history or [],
                "previousChats": node.chat_history or [],
                "studyPlannerRecommendations": recommendations_for(node),
                "weaknesses": node.weaknesses or [],
            }
            for node in nodes
        ],
        "edges": [
            {
                "id": str(edge.id),
                "source": str(edge.source_id),
                "target": str(edge.target_id),
                "relationship": edge.relationship,
                "strength": edge.strength,
                "metadata": edge.metadata_json or {},
                "evidence": edge.evidence or [],
            }
            for edge in edges
        ],
    }
