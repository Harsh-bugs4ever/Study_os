import json
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, Header, HTTPException, Request, Response
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import Session
from .database import get_db
from .models import TABLE_MODELS, JournalEntry, Material, Profile, UserRole
from .security import optional_user
from repositories import TableRepository

router = APIRouter(prefix="/rest/v1", tags=["Supabase-compatible REST"])

def value_for(column, value):
    typ = column.type.python_type
    if typ is UUID: return UUID(value)
    if typ is int: return int(value)
    if typ is bool: return value.lower() == "true"
    return value

def serialize(obj, fields="*"):
    names = [c.key for c in inspect(obj).mapper.column_attrs] if fields == "*" else [x.strip() for x in fields.split(",")]
    out = {}
    for n in names:
        v = getattr(obj, n)
        out[n] = str(v) if isinstance(v, UUID) else v.isoformat() if isinstance(v, datetime) else v.value if hasattr(v, "value") else v
    return out

def authorize(table, method, user, body=None):
    public_read = {"streams", "subjects", "topics", "sub_topics", "materials", "profiles"}
    if method in ("GET", "HEAD") and table in public_read: return
    if not user: raise HTTPException(401, {"code": "42501", "message": "permission denied"})
    if table == "journal_entries" and body:
        rows = body if isinstance(body, list) else [body]
        if any(str(x.get("user_id", user.id)) != str(user.id) for x in rows): raise HTTPException(403, {"code": "42501", "message": "new row violates row-level security policy"})

def filtered(stmt, model, request: Request, user):
    for key, val in request.query_params.multi_items():
        if key in {"select", "order", "limit", "offset"} or not hasattr(model, key): continue
        col = getattr(model, key)
        op, _, raw = val.partition(".")
        if op == "eq": stmt = stmt.where(col == value_for(col.property.columns[0], raw))
        elif op == "ilike": stmt = stmt.where(col.ilike(raw.replace("*", "%")))
        elif op == "in": stmt = stmt.where(col.in_([value_for(col.property.columns[0], x) for x in raw.strip("()").split(",")]))
    if model is JournalEntry and user: stmt = stmt.where(model.user_id == user.id)
    if model is UserRole and user: stmt = stmt.where(model.user_id == user.id)
    order = request.query_params.get("order")
    if order:
        col, *opts = order.split("."); stmt = stmt.order_by(getattr(model, col).desc() if "desc" in opts else getattr(model, col).asc())
    if request.query_params.get("limit"): stmt = stmt.limit(int(request.query_params["limit"]))
    if request.query_params.get("offset"): stmt = stmt.offset(int(request.query_params["offset"]))
    return stmt

@router.api_route("/{table}", methods=["GET", "HEAD", "POST", "PATCH", "DELETE"])
async def table_api(table: str, request: Request, response: Response, db: Session = Depends(get_db), prefer: str = Header(""), authorization: str | None = Header(None)):
    model = TABLE_MODELS.get(table)
    if not model: raise HTTPException(404, {"code": "PGRST205", "message": f"Could not find table '{table}'"})
    repo = TableRepository(db)
    user = optional_user(authorization); body = await request.json() if request.method in {"POST", "PATCH"} else None
    authorize(table, request.method, user, body)
    fields = request.query_params.get("select", "*")
    wants_object = "application/vnd.pgrst.object+json" in request.headers.get("accept", "")
    if request.method in {"GET", "HEAD"}:
        stmt = filtered(select(model), model, request, user); rows = repo.all(stmt)
        if "count=exact" in prefer: response.headers["Content-Range"] = f"0-{max(0,len(rows)-1)}/{len(rows)}"
        if request.method == "HEAD": return None
        if wants_object:
            if len(rows) > 1: raise HTTPException(406, {"code": "PGRST116", "message": "JSON object requested, multiple (or no) rows returned"})
            return serialize(rows[0], fields) if rows else None
        return [serialize(x, fields) for x in rows]
    if request.method == "POST":
        records = body if isinstance(body, list) else [body]
        created = []
        for values in records:
            if table == "materials" and values.get("type") not in {"pdf", "video", "pyq"}: raise HTTPException(400, {"code": "P0001", "message": "Invalid material type"})
            if "resolution=merge-duplicates" in prefer:
                stmt = pg_insert(model).values(**values).on_conflict_do_update(index_elements=[request.headers.get("on-conflict", "id")], set_=values).returning(model)
                created.append(repo.one(stmt))
            else:
                created.append(repo.add(model(**values)))
        repo.commit()
        if "return=representation" not in prefer: return None
        result = [serialize(x, fields) for x in created]
        return result[0] if wants_object and len(result) == 1 else result
    targets = repo.all(filtered(select(model), model, request, user))
    if table == "journal_entries" and any(x.user_id != user.id for x in targets): raise HTTPException(403, {"code": "42501", "message": "permission denied"})
    if request.method == "PATCH":
        for obj in targets:
            for k, v in body.items(): setattr(obj, k, v)
    else:
        for obj in targets: repo.delete(obj)
    repo.commit(); return [serialize(x, fields) for x in targets] if "return=representation" in prefer else None
