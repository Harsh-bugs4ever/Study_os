from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from app.models import QuizAttempt, StudentMemory


class MemoryRepository:
    def __init__(self, db: Session): self.db = db

    def upsert(self, user_id, kind: str, key: str, value: dict) -> None:
        statement = insert(StudentMemory).values(user_id=user_id, kind=kind, memory_key=key, value=value)
        statement = statement.on_conflict_do_update(index_elements=["user_id", "kind", "memory_key"], set_={"value": value, "updated_at": datetime.now(timezone.utc)})
        self.db.execute(statement); self.db.commit()

    def add_quiz_attempt(self, user_id, subject: str, topic: str, correct: int, total: int, details: dict) -> None:
        self.db.add(QuizAttempt(user_id=user_id, subject=subject, topic=topic, correct=correct, total=total, details=details)); self.db.commit()

    def get(self, user_id, kind: str, key: str):
        return self.db.scalar(select(StudentMemory).where(StudentMemory.user_id == user_id, StudentMemory.kind == kind, StudentMemory.memory_key == key))

    def list_by_kind(self, user_id, kind: str) -> list[StudentMemory]:
        statement = select(StudentMemory).where(
            StudentMemory.user_id == user_id,
            StudentMemory.kind == kind,
        ).order_by(StudentMemory.updated_at.desc())
        return list(self.db.scalars(statement).all())

    def quiz_attempts(self, user_id, limit: int = 100) -> list[QuizAttempt]:
        statement = select(QuizAttempt).where(
            QuizAttempt.user_id == user_id,
        ).order_by(QuizAttempt.created_at.desc()).limit(limit)
        return list(self.db.scalars(statement).all())
