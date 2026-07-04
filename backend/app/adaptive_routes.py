from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .cognee.adaptive_engine import adaptive_tutor_answer
from .cognee.learning_profile import persist_learning_profile
from .cognee.quiz_engine import generate_adaptive_quiz
from .cognee.recommendation_engine import adaptive_recommendations
from .database import get_db
from .security import require_user
from services.groq_service import GroqServiceError

router = APIRouter(prefix="/api/adaptive", tags=["Adaptive AI Tutor"])


class ProfileUpdate(BaseModel):
    learning_style: str | None = None
    difficulty_preference: str | None = None
    study_time: str | None = None
    preferred_explanation_style: str | None = None
    preferred_language: str | None = None
    attention_span: str | None = None
    revision_frequency: str | None = None
    learning_speed: str | None = None
    confidence_score: int | None = Field(None, ge=0, le=100)


class TutorBody(BaseModel):
    messages: list[dict[str, Any]]
    context: dict[str, Any] = {}


class QuizBody(BaseModel):
    subject: str
    topic: str | None = None
    count: int = Field(5, ge=1, le=20)


@router.get("/profile")
async def learning_profile(user=Depends(require_user), db: Session = Depends(get_db)):
    return await persist_learning_profile(db, user.id)


@router.post("/profile")
async def update_profile(body: ProfileUpdate, user=Depends(require_user), db: Session = Depends(get_db)):
    return await persist_learning_profile(db, user.id, body.model_dump(exclude_none=True))


@router.get("/recommendations")
async def recommendations(user=Depends(require_user), db: Session = Depends(get_db)):
    return await adaptive_recommendations(db, user.id)


@router.post("/quiz")
async def adaptive_quiz(body: QuizBody, user=Depends(require_user), db: Session = Depends(get_db)):
    try:
        return await generate_adaptive_quiz(db, user.id, body.subject, body.topic, body.count)
    except GroqServiceError as exc:
        raise HTTPException(exc.status_code, str(exc)) from exc


@router.post("/tutor")
async def adaptive_tutor(body: TutorBody, user=Depends(require_user), db: Session = Depends(get_db)):
    try:
        return await adaptive_tutor_answer(db, user.id, body.messages, body.context)
    except GroqServiceError as exc:
        raise HTTPException(exc.status_code, str(exc)) from exc
