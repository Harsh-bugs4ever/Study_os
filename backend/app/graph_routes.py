from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from time import monotonic

from .cognee.graph_builder import graph_payload
from .database import get_db
from .security import optional_user

router = APIRouter(prefix="/api", tags=["Concept graph"])
_GRAPH_CACHE: dict[str, tuple[float, dict]] = {}
_GRAPH_TTL_SECONDS = 45

_EMPTY_GRAPH = {"nodes": [], "edges": []}


@router.get("/graph")
def concept_graph(user=Depends(optional_user), db: Session = Depends(get_db)):
    # Return empty graph for unauthenticated requests instead of 401
    if not user:
        return _EMPTY_GRAPH
    key = str(user.id)
    cached = _GRAPH_CACHE.get(key)
    if cached and monotonic() - cached[0] < _GRAPH_TTL_SECONDS:
        return cached[1]
    payload = graph_payload(db, user.id)
    _GRAPH_CACHE[key] = (monotonic(), payload)
    return payload
