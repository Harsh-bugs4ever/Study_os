from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .cognee.analytics import student_analytics
from .database import get_db
from .security import optional_user

router = APIRouter(prefix="/api/student", tags=["Student analytics"])


@router.get("/analytics")
async def analytics(user=Depends(optional_user), db: Session = Depends(get_db)):
    if not user:
        return {}
    return await student_analytics(db, user.id)
