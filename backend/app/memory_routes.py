from typing import Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from .cognee.client import dataset_for_user
from .cognee.graph import concept_insights, next_topic_recommendations
from .cognee.memory import remember_quiz_attempt, remember_student_fact
from .cognee.search import RetrievalMode
from .database import get_db
from .security import require_user
from .services.tutor_service import retrieve_tutor_context

router = APIRouter(prefix="/memory", tags=["Cognee memory"])

class SearchBody(BaseModel):
    query: str
    mode: RetrievalMode = RetrievalMode.CHUNKS
    top_k: int = Field(8, ge=1, le=50)

class ProfileMemoryBody(BaseModel):
    learning_style: str | None = None
    weak_concepts: list[str] = []
    mastered_topics: list[str] = []

class QuizMemoryBody(BaseModel):
    subject: str
    topic: str
    correct: int = Field(ge=0)
    total: int = Field(gt=0)
    details: dict[str, Any] = {}

class TopicQueryBody(BaseModel):
    subject: str | None = None
    topic: str
    goal: str | None = None

@router.post("/search")
async def memory_search(body: SearchBody, user=Depends(require_user)):
    mode, context, raw = await retrieve_tutor_context(body.query, user.id, body.mode.value)
    return {"mode": mode.value, "context": context, "results": raw}

@router.post("/profile", status_code=204)
async def profile_memory(body: ProfileMemoryBody, user=Depends(require_user), db: Session = Depends(get_db)):
    for kind, value in body.model_dump(exclude_none=True).items():
        await remember_student_fact(db, user.id, kind, kind, {"value": value})

@router.post("/quiz", status_code=204)
async def quiz_memory(body: QuizMemoryBody, user=Depends(require_user), db: Session = Depends(get_db)):
    await remember_quiz_attempt(db, user.id, **body.model_dump())

@router.post("/learning-path")
async def learning_path(body: TopicQueryBody, user=Depends(require_user)):
    datasets = [dataset_for_user(None), dataset_for_user(user.id)]
    query = f"{body.subject or ''} {body.topic} {body.goal or ''}".strip()
    return {"results": await next_topic_recommendations(query, datasets)}

@router.post("/weak-topics")
async def weak_topics(body: TopicQueryBody, user=Depends(require_user)):
    query = f"Weak topics and concepts for {body.subject or ''} {body.topic}".strip()
    _, context, raw = await retrieve_tutor_context(query, user.id, RetrievalMode.GRAPH_COMPLETION.value)
    return {"context": context, "results": raw}

@router.post("/revision-summary")
async def revision_summary(body: TopicQueryBody, user=Depends(require_user)):
    query = f"Revision summary for {body.subject or ''} {body.topic}".strip()
    _, context, raw = await retrieve_tutor_context(query, user.id, RetrievalMode.SUMMARIES.value)
    return {"context": context, "results": raw}

@router.post("/related-concepts")
async def related_concepts(body: TopicQueryBody, user=Depends(require_user)):
    datasets = [dataset_for_user(None), dataset_for_user(user.id)]
    query = f"Related concepts, prerequisites, and next concepts for {body.subject or ''} {body.topic}".strip()
    return {"results": await concept_insights(query, datasets)}
