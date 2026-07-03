from typing import Any
from sqlalchemy.orm import Session


class TableRepository:
    def __init__(self, db: Session): self.db = db
    def all(self, statement): return self.db.scalars(statement).all()
    def one(self, statement): return self.db.scalars(statement).one()
    def add(self, obj: Any) -> Any:
        self.db.add(obj); self.db.flush(); return obj
    def delete(self, obj: Any) -> None: self.db.delete(obj)
    def commit(self) -> None: self.db.commit()
