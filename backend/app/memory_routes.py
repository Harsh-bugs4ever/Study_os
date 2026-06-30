from typing import Any
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from .cognee.memory import remember_student_fact
from .cognee.search import RetrievalMode
from .database import get_db
from .models import QuizAttempt
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
    db.add(QuizAttempt(user_id=user.id, **body.model_dump())); db.commit()
    score = body.correct / body.total
    state = "mastered" if score >= .8 else "weak" if score < .6 else "learning"
    await remember_student_fact(db, user.id, "mastery", f"{body.subject}:{body.topic}", {"subject": body.subject, "topic": body.topic, "score": score, "state": state, "attempt": body.details})
