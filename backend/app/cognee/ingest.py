from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID
from ..database import SessionLocal
from ..models import KnowledgeDocument
from .client import cognee_module, write_lock

SUPPORTED_SUFFIXES = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".md", ".srt", ".vtt"}

async def ingest_document(document_id: UUID, path: Path) -> None:
    """Run after the upload transaction: add first, then cognify its dataset."""
    with SessionLocal() as db:
        doc = db.get(KnowledgeDocument, document_id)
        if not doc: return
        if path.suffix.lower() not in SUPPORTED_SUFFIXES:
            doc.ingestion_status = "skipped"
            doc.ingestion_error = "Unsupported file type; upload a transcript for video files"
            db.commit(); return
        doc.ingestion_status = "processing"; db.commit()
        dataset = doc.cognee_dataset
    try:
        cognee = cognee_module()
        if cognee is None: return
        async with write_lock():
            await cognee.add(str(path), dataset_name=dataset)
            await cognee.cognify(datasets=[dataset], incremental_loading=True)
        with SessionLocal() as db:
            doc = db.get(KnowledgeDocument, document_id)
            doc.ingestion_status = "ready"; doc.ingestion_error = None
            doc.cognified_at = datetime.now(timezone.utc); db.commit()
    except Exception as exc:
        with SessionLocal() as db:
            doc = db.get(KnowledgeDocument, document_id)
            if doc:
                doc.ingestion_status = "failed"; doc.ingestion_error = str(exc)[:2000]; db.commit()
