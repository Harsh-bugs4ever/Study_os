from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..security import require_user
from .hackathon_showcase import (
    ai_mentor,
    demo_metrics,
    document_relationships,
    knowledge_evolution,
    learning_heatmaps,
    memory_timeline,
    revision_cards,
    semantic_search,
)
from .memory_dashboard import pin_memory
from .search import RetrievalMode

router = APIRouter(prefix="/api/cognee", tags=["Cognee hackathon"])


class SearchBody(BaseModel):
    query: str
    mode: RetrievalMode = RetrievalMode.CHUNKS


class TagBody(BaseModel):
    id: str
    tags: list[str]


class RevisionBody(BaseModel):
    topic: str | None = None


@router.get("/mentor")
async def mentor(user=Depends(require_user), db: Session = Depends(get_db)):
    return await ai_mentor(db, user.id)


@router.get("/demo")
def demo(user=Depends(require_user), db: Session = Depends(get_db)):
    return demo_metrics(db, user.id)


@router.get("/timeline")
def timeline(user=Depends(require_user), db: Session = Depends(get_db)):
    return {"memory_timeline": memory_timeline(db, user.id), "knowledge_evolution": knowledge_evolution(db, user.id)}


@router.get("/documents/relationships")
def documents(user=Depends(require_user), db: Session = Depends(get_db)):
    return document_relationships(db, user.id)


@router.get("/heatmap")
def heatmap(user=Depends(require_user), db: Session = Depends(get_db)):
    return learning_heatmaps(db, user.id)


@router.post("/search")
async def search(body: SearchBody, user=Depends(require_user), db: Session = Depends(get_db)):
    from .memory import remember_student_fact

    await remember_student_fact(db, user.id, "cognee_search", body.query, {"query": body.query, "mode": body.mode.value, "tags": ["search"]})
    return await semantic_search(db, user.id, body.query, body.mode)


@router.post("/pdf/search")
async def pdf_search(body: SearchBody, user=Depends(require_user), db: Session = Depends(get_db)):
    return await semantic_search(db, user.id, f"PDF notes documents {body.query}", body.mode)


@router.post("/revision-cards")
async def cards(body: RevisionBody, user=Depends(require_user), db: Session = Depends(get_db)):
    return await revision_cards(db, user.id, body.topic)
