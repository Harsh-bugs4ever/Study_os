import json
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session
from ..models import StudentMemory
from .client import cognee_module, dataset_for_user, write_lock

async def remember_student_fact(db: Session, user_id, kind: str, key: str, value: dict) -> None:
    stmt = insert(StudentMemory).values(user_id=user_id, kind=kind, memory_key=key, value=value)
    stmt = stmt.on_conflict_do_update(index_elements=["user_id", "kind", "memory_key"], set_={"value": value})
    db.execute(stmt); db.commit()
    cognee = cognee_module()
    if cognee:
        text = f"Student memory. Type: {kind}. Key: {key}. Value: {json.dumps(value, default=str)}"
        async with write_lock():
            await cognee.add(text, dataset_name=dataset_for_user(user_id))
            await cognee.cognify(datasets=[dataset_for_user(user_id)], incremental_loading=True)

async def remember_conversation(user_id, messages: list[dict]) -> None:
    cognee = cognee_module()
    if not cognee or not user_id or not messages: return
    transcript = "Conversation:\n" + "\n".join(f"{m.get('role','unknown')}: {m.get('content','')}" for m in messages[-12:])
    async with write_lock():
        await cognee.add(transcript, dataset_name=dataset_for_user(user_id))
        await cognee.cognify(datasets=[dataset_for_user(user_id)], incremental_loading=True)
