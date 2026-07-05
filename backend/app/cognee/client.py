import asyncio
import os
from typing import Any

from ..config import settings

_client: Any = None
_write_lock = asyncio.Lock()


def dataset_for_user(user_id: object | None) -> str:
    suffix = str(user_id) if user_id else "shared"
    return f"{settings.cognee_dataset_prefix}_{suffix}".replace("-", "_")


async def init_client() -> None:
    """Connect to Cognee Cloud. Called once at FastAPI startup."""
    global _client
    if not settings.cognee_enabled:
        return
    if not settings.cognee_api_key or not settings.cognee_service_url:
        raise RuntimeError(
            "Cognee Cloud is enabled but COGNEE_API_KEY / COGNEE_SERVICE_URL are not set."
        )
    
    os.environ.setdefault("COGNEE_API_KEY", settings.cognee_api_key)
    os.environ.setdefault("COGNEE_SERVICE_URL", settings.cognee_service_url)
    
    try:
        import cognee
        # cognee.serve() connects to the Cloud and returns a CloudClient instance.
        _client = await cognee.serve(
            url=settings.cognee_service_url,
            api_key=settings.cognee_api_key
        )
        print("[Cognee] Connected to Cognee Cloud ✓")
    except ImportError as exc:
        raise RuntimeError("Cognee is enabled but not installed: pip install cognee") from exc
    except Exception as exc:
        print(f"[Cognee] WARNING: Could not initialise Cognee SDK: {exc}")
        _client = None


async def shutdown_client() -> None:
    """Disconnect from Cognee Cloud. Called at FastAPI shutdown."""
    global _client
    if _client is None:
        return
    try:
        import cognee
        await cognee.disconnect()
        print("[Cognee] Disconnected from Cognee Cloud.")
    except Exception as exc:
        print(f"[Cognee] WARNING: Error during shutdown: {exc}")
    finally:
        _client = None


def get_client() -> Any | None:
    """
    Return the connected Cognee Cloud client.
    Use V2 methods: client.remember(), client.recall(), client.forget(), client.improve()
    """
    return _client


def write_lock() -> asyncio.Lock:
    return _write_lock
