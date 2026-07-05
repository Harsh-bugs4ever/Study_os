import asyncio
import os
from typing import Any

from ..config import settings

_client: Any = None
_write_lock = asyncio.Lock()


def dataset_for_user(user_id: object | None) -> str:
    suffix = str(user_id) if user_id else "shared"
    return f"{settings.cognee_dataset_prefix}_{suffix}".replace("-", "_")


class _CogneeCloudProxy:
    """
    Thin proxy so the rest of the codebase can keep calling
    client.remember(...), client.recall(...), client.forget(...),
    client.improve(...) as if a connected client object existed.

    cognee.serve() does not return a client instance -- it configures the
    imported `cognee` module itself to route every subsequent call to your
    Cloud tenant. The four V2 verbs are plain module-level async functions
    on `cognee` after serve() has been awaited.
    """

    def __init__(self, cognee_module: Any) -> None:
        self._cognee = cognee_module

    async def remember(self, *args: Any, **kwargs: Any) -> Any:
        return await self._cognee.remember(*args, **kwargs)

    async def recall(self, *args: Any, **kwargs: Any) -> Any:
        return await self._cognee.recall(*args, **kwargs)

    async def forget(self, *args: Any, **kwargs: Any) -> Any:
        return await self._cognee.forget(*args, **kwargs)

    async def improve(self, *args: Any, **kwargs: Any) -> Any:
        return await self._cognee.improve(*args, **kwargs)


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
        # cognee.serve() connects to the Cloud (direct mode: url + api_key).
        # It configures the `cognee` module to route remember()/recall()/
        # forget()/improve() to the cloud tenant -- it does not return a client.
        await cognee.serve(
            url=settings.cognee_service_url,
            api_key=settings.cognee_api_key,
        )
        _client = _CogneeCloudProxy(cognee)
        print("[Cognee] Connected to Cognee Cloud OK")
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
    Return the connected Cognee Cloud proxy.
    Use V2 methods: client.remember(), client.recall(), client.forget(), client.improve()
    """
    return _client


def write_lock() -> asyncio.Lock:
    return _write_lock