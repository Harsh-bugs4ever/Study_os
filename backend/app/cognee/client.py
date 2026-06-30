import asyncio
from functools import lru_cache
from ..config import settings

_write_lock = asyncio.Lock()

def dataset_for_user(user_id: object | None) -> str:
    suffix = str(user_id) if user_id else "shared"
    return f"{settings.cognee_dataset_prefix}_{suffix}".replace("-", "_")

def cognee_module():
    if not settings.cognee_enabled:
        return None
    try:
        import cognee
        return cognee
    except ImportError as exc:
        raise RuntimeError("Cognee is enabled but not installed") from exc

def write_lock():
    return _write_lock
