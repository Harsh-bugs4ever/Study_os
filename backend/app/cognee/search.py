from enum import Enum
import asyncio
from typing import Any
from .client import get_client, dataset_for_user


class RetrievalMode(str, Enum):
    CHUNKS = "CHUNKS"
    SUMMARIES = "SUMMARIES"
    INSIGHTS = "INSIGHTS"
    GRAPH_COMPLETION = "GRAPH_COMPLETION"


async def search_memory(query: str, mode: RetrievalMode, datasets: list[str] | None = None, top_k: int = 8) -> Any:
    client = get_client()
    if client is None:
        return []
    
    kwargs: dict[str, Any] = {"query_type": mode.value, "top_k": top_k}
    if datasets:
        kwargs["datasets"] = datasets
    if mode is RetrievalMode.INSIGHTS:
        kwargs["verbose"] = True
    try:
        return await client.recall(query, **kwargs)
    except Exception as exc:
        print(f"[Cognee] recall() failed: {exc}")
        return []


async def search_all_context(query: str, datasets: list[str] | None = None, top_k: int = 6) -> dict[str, Any]:
    """Retrieve every Cognee context type needed before calling the tutor LLM."""
    modes = (RetrievalMode.GRAPH_COMPLETION, RetrievalMode.SUMMARIES, RetrievalMode.CHUNKS)
    results = await asyncio.gather(
        *(search_memory(query, mode, datasets=datasets, top_k=top_k) for mode in modes),
        return_exceptions=True,
    )
    return {
        mode.value.lower(): [] if isinstance(result, Exception) else result
        for mode, result in zip(modes, results)
    }


def context_text(result: Any) -> str:
    """Flatten Cognee search results into a single string."""
    if not result:
        return ""
    if isinstance(result, str):
        return result
    if isinstance(result, dict):
        return str(result.get("context_result") or result.get("text_result") or result.get("text") or result)
    # Handle objects with a .text attribute (e.g. Cloud result objects)
    if hasattr(result, "text") and result.text:
        return str(result.text)
    if isinstance(result, (list, tuple)):
        return "\n\n".join(context_text(item) for item in result)
    return str(result)


def combined_context_text(results: dict[str, Any]) -> str:
    sections = []
    labels = {
        "graph_completion": "Cognee graph context",
        "summaries": "Cognee revision summaries",
        "chunks": "Cognee semantic chunks",
    }
    for key, label in labels.items():
        text = context_text(results.get(key))
        if text:
            sections.append(f"{label}:\n{text}")
    return "\n\n".join(sections)
