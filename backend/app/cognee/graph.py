from .search import RetrievalMode, search_memory

async def concept_insights(query: str, datasets: list[str] | None = None):
    return await search_memory(query, RetrievalMode.INSIGHTS, datasets)

async def next_topic_recommendations(query: str, datasets: list[str] | None = None):
    prompt = f"Using prerequisites, mastery and weak-concept relationships, recommend what to study next. {query}"
    return await search_memory(prompt, RetrievalMode.GRAPH_COMPLETION, datasets)
