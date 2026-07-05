from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .cognee.explainability import explainable_chat
from .cognee.memory_dashboard import memory_dashboard, memory_history, pin_memory, search_memories, soft_delete_memory
from .database import get_db
from .security import optional_user, require_user
from services.groq_service import GroqServiceError

router = APIRouter(prefix="/api", tags=["Explainable AI and memory"])


class ChatBody(BaseModel):
    messages: list[dict[str, Any]]
    context: dict[str, Any] = {}


class SearchBody(BaseModel):
    query: str = ""


class MemoryIdBody(BaseModel):
    id: str


class PinBody(MemoryIdBody):
    pinned: bool = True


@router.post("/chat")
async def chat(body: ChatBody, user=Depends(optional_user), db: Session = Depends(get_db)):
    try:
        user_id = user.id if user else None
        return await explainable_chat(db, user_id, body.messages, body.context)
    except GroqServiceError as exc:
        raise HTTPException(exc.status_code, str(exc)) from exc


@router.get("/memory")
def memory(user=Depends(require_user), db: Session = Depends(get_db)):
    return memory_dashboard(db, user.id)


@router.post("/memory/search")
def memory_search(body: SearchBody, user=Depends(require_user), db: Session = Depends(get_db)):
    return {"results": search_memories(db, user.id, body.query)}


@router.post("/memory/delete", status_code=204)
def memory_delete(body: MemoryIdBody, user=Depends(require_user), db: Session = Depends(get_db)):
    soft_delete_memory(db, user.id, body.id)


@router.post("/memory/pin")
def memory_pin(body: PinBody, user=Depends(require_user), db: Session = Depends(get_db)):
    return pin_memory(db, user.id, body.id, body.pinned)


@router.get("/memory/history")
def history(user=Depends(optional_user), db: Session = Depends(get_db)):
    if not user:
        return {"replay": []}
    return memory_history(db, user.id)
