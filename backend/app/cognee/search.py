from enum import Enum
from typing import Any
from .client import cognee_module

class RetrievalMode(str, Enum):
    CHUNKS = "CHUNKS"
    SUMMARIES = "SUMMARIES"
    INSIGHTS = "INSIGHTS"
    GRAPH_COMPLETION = "GRAPH_COMPLETION"

async def search_memory(query: str, mode: RetrievalMode, datasets: list[str] | None = None, top_k: int = 8) -> Any:
    cognee = cognee_module()
    if cognee is None: return []
    from cognee import SearchType
    if mode is RetrievalMode.CHUNKS:
        search_type = SearchType.CHUNKS
    elif mode is RetrievalMode.SUMMARIES:
        search_type = SearchType.SUMMARIES
    else:
        # INSIGHTS is an application-level mode: Cognee's Python API exposes
        # graph insights through GRAPH_COMPLETION, not an INSIGHTS enum.
        search_type = SearchType.GRAPH_COMPLETION
    kwargs = {"query_type": search_type, "top_k": top_k}
    if datasets: kwargs["datasets"] = datasets
    if mode is RetrievalMode.INSIGHTS: kwargs["verbose"] = True
    return await cognee.search(query, **kwargs)

def context_text(result: Any) -> str:
    if not result: return ""
    if isinstance(result, str): return result
    if isinstance(result, dict):
        return str(result.get("context_result") or result.get("text_result") or result.get("text") or result)
    return "\n\n".join(context_text(item) for item in result)
