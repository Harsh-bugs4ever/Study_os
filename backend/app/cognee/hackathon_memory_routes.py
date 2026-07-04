from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import StudentMemory
from ..security import require_user

router = APIRouter(prefix="/api/memory", tags=["Memory tagging"])


class TagBody(BaseModel):
    id: str
    tags: list[str]


@router.post("/tag")
def tag_memory(body: TagBody, user=Depends(require_user), db: Session = Depends(get_db)):
    memory = db.get(StudentMemory, UUID(body.id))
    if not memory or memory.user_id != user.id or memory.deleted_at:
        return None
    value = dict(memory.value or {})
    value["tags"] = list(dict.fromkeys([tag.strip() for tag in body.tags if tag.strip()]))[:12]
    memory.value = value
    db.commit()
    db.refresh(memory)
    return {"id": str(memory.id), "tags": value["tags"]}
