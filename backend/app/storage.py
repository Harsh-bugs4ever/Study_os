from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from .config import settings
from .database import get_db
from .models import KnowledgeDocument
from .security import require_user
from .cognee.client import dataset_for_user
from .cognee.ingest import ingest_document

router = APIRouter(prefix="/storage/v1", tags=["Supabase-compatible storage"])

def safe_path(bucket: str, name: str) -> Path:
    root = (settings.storage_path / bucket).resolve(); path = (root / name).resolve()
    if root != path and root not in path.parents: raise HTTPException(400, "Invalid object path")
    return path

@router.post("/object/{bucket}/{name:path}")
async def upload(bucket: str, name: str, request: Request, background: BackgroundTasks, user=Depends(require_user), db: Session = Depends(get_db)):
    content = await request.body()
    path = safe_path(bucket, name); path.parent.mkdir(parents=True, exist_ok=True); path.write_bytes(content)
    doc = KnowledgeDocument(user_id=user.id, storage_key=f"{bucket}/{name}", title=Path(name).name, media_type=request.headers.get("content-type"), size_bytes=len(content), cognee_dataset=dataset_for_user(None))
    db.add(doc); db.commit(); db.refresh(doc)
    background.add_task(ingest_document, doc.id, path)
    return {"Key": f"{bucket}/{name}"}

@router.get("/object/public/{bucket}/{name:path}")
def public_object(bucket: str, name: str):
    path = safe_path(bucket, name)
    if not path.is_file(): raise HTTPException(404, "Object not found")
    return FileResponse(path)
