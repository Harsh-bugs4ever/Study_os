from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID
from ..database import SessionLocal
from ..models import KnowledgeDocument
from .client import cognee_module, write_lock
from .graph_builder import ConceptGraphBuilder
from .memory import remember_student_fact
from .search import RetrievalMode, context_text, search_memory

SUPPORTED_SUFFIXES = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md", ".srt", ".vtt"}

async def ingest_document(document_id: UUID, path: Path) -> None:
    """Run after the upload transaction: add first, then cognify its dataset."""
    user_id = None
    with SessionLocal() as db:
        doc = db.get(KnowledgeDocument, document_id)
        if not doc: return
        if path.suffix.lower() not in SUPPORTED_SUFFIXES:
            doc.ingestion_status = "skipped"
            doc.ingestion_error = "Unsupported file type; upload a transcript for video files"
            db.commit(); return
        doc.ingestion_status = "processing"; db.commit()
        dataset = doc.cognee_dataset
        user_id = doc.user_id
        title = doc.title
    try:
        cognee = cognee_module()
        if cognee is None:
            with SessionLocal() as db:
                doc = db.get(KnowledgeDocument, document_id)
                if doc:
                    doc.ingestion_status = "skipped"; doc.ingestion_error = "Cognee is disabled"; db.commit()
            return
        async with write_lock():
            await cognee.add(str(path), dataset_name=dataset)
            await cognee.cognify(datasets=[dataset], incremental_loading=True)
        concepts = await extract_document_concepts(title, dataset)
        if user_id and concepts:
            with SessionLocal() as db:
                await remember_student_fact(db, user_id, "document_concepts", str(document_id), {"title": title, "concepts": concepts})
        if user_id:
            with SessionLocal() as db:
                doc = db.get(KnowledgeDocument, document_id)
                if doc:
                    await ConceptGraphBuilder(db, user_id).ingest_document(doc, concepts)
        with SessionLocal() as db:
            doc = db.get(KnowledgeDocument, document_id)
            doc.ingestion_status = "ready"; doc.ingestion_error = None
            doc.cognified_at = datetime.now(timezone.utc); db.commit()
    except Exception as exc:
        with SessionLocal() as db:
            doc = db.get(KnowledgeDocument, document_id)
            if doc:
                doc.ingestion_status = "failed"; doc.ingestion_error = str(exc)[:2000]; db.commit()

async def extract_document_concepts(title: str, dataset: str) -> list[str]:
    prompt = f"Extract the most important student-facing concepts from the uploaded notes titled '{title}'. Return concept names only."
    result = await search_memory(prompt, RetrievalMode.GRAPH_COMPLETION, datasets=[dataset], top_k=12)
    text = context_text(result)
    concepts: list[str] = []
    for raw in text.replace("\r", "\n").split("\n"):
        concept = raw.strip(" -0123456789.)\t")
        if concept and len(concept) <= 120 and concept.lower() not in {x.lower() for x in concepts}:
            concepts.append(concept)
        if len(concepts) == 12:
            break
    return concepts
