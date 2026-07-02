from typing import Any
from ..cognee.client import dataset_for_user
from ..cognee.search import RetrievalMode, combined_context_text, context_text, search_all_context, search_memory

def infer_mode(message: str, requested: str | None = None) -> RetrievalMode:
    if requested: return RetrievalMode(requested.upper())
    text = message.lower()
    if any(x in text for x in ("revise", "revision", "summarize", "summary")): return RetrievalMode.SUMMARIES
    if any(x in text for x in ("related", "relationship", "connect", "understand why")): return RetrievalMode.INSIGHTS
    if any(x in text for x in ("study next", "recommend", "learning path", "prerequisite")): return RetrievalMode.GRAPH_COMPLETION
    return RetrievalMode.CHUNKS

async def retrieve_tutor_context(query: str, user_id=None, requested_mode: str | None = None) -> tuple[RetrievalMode, str, Any]:
    mode = infer_mode(query, requested_mode)
    datasets = [dataset_for_user(None)]
    if user_id: datasets.append(dataset_for_user(user_id))
    result = await search_memory(query, mode, datasets=datasets)
    return mode, context_text(result), result

async def retrieve_complete_tutor_context(query: str, user_id=None) -> tuple[str, dict[str, Any]]:
    datasets = [dataset_for_user(None)]
    if user_id: datasets.append(dataset_for_user(user_id))
    results = await search_all_context(query, datasets=datasets)
    return combined_context_text(results), results
