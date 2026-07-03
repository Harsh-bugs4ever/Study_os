import asyncio
import os
from functools import lru_cache
from ..config import settings

_write_lock = asyncio.Lock()

def dataset_for_user(user_id: object | None) -> str:
    suffix = str(user_id) if user_id else "shared"
    return f"{settings.cognee_dataset_prefix}_{suffix}".replace("-", "_")

def cognee_module():
    if not settings.cognee_enabled:
        return None
    values = {
        "DB_PROVIDER": settings.db_provider,
        "DB_NAME": settings.db_name,
        "DB_HOST": settings.db_host,
        "DB_PORT": settings.db_port,
        "DB_USERNAME": settings.db_username,
        "DB_PASSWORD": settings.db_password,
        "VECTOR_DB_PROVIDER": settings.vector_db_provider,
        "VECTOR_DATASET_DATABASE_HANDLER": settings.vector_dataset_database_handler,
        "VECTOR_DB_NAME": settings.vector_db_name,
        "VECTOR_DB_URL": settings.vector_db_url,
        "VECTOR_DB_PORT": settings.vector_db_port,
        "VECTOR_DB_USERNAME": settings.vector_db_username,
        "VECTOR_DB_PASSWORD": settings.vector_db_password,
        "GRAPH_DATABASE_PROVIDER": settings.graph_database_provider,
        "SYSTEM_ROOT_DIRECTORY": settings.system_root_directory,
        "LLM_MODEL": f"groq/{settings.groq_model}",
    }
    if settings.groq_api_key:
        values["LLM_API_KEY"] = settings.groq_api_key
    for key, value in values.items():
        if not os.environ.get(key):
            os.environ[key] = str(value)
    try:
        import cognee
        return cognee
    except ImportError as exc:
        raise RuntimeError("Cognee is enabled but not installed") from exc

def write_lock():
    return _write_lock
