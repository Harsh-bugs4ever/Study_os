import json
import re
from typing import Any

from .search import RetrievalMode, context_text, search_memory


FALLBACK_RELATIONSHIPS = {
    "operating systems": ["Scheduling", "Memory Management", "File Systems", "Process Synchronization"],
    "scheduling": ["FCFS", "Round Robin", "Priority Scheduling", "Multilevel Queue"],
    "graphs": ["DFS", "BFS", "Topological Sort", "Dijkstra"],
}


def normalize_concept_name(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip(" \t\r\n-•*0123456789.)")).strip()


def concept_slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", normalize_concept_name(value).lower()).strip("-")[:120]


def _json_from_text(text: str) -> dict[str, Any] | None:
    clean = re.sub(r"```(?:json)?", "", text).strip()
    start = clean.find("{")
    end = clean.rfind("}")
    if start < 0 or end < start:
        return None
    try:
        parsed = json.loads(clean[start : end + 1])
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


def _fallback_from_text(text: str) -> dict[str, Any]:
    concepts: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw in re.split(r"[\n,;]+", text):
        name = normalize_concept_name(raw)
        if not name or len(name) > 80:
            continue
        slug = concept_slug(name)
        if slug and slug not in seen:
            seen.add(slug)
            concepts.append({"name": name, "difficulty": "intermediate", "summary": ""})
        if len(concepts) >= 16:
            break

    relationships: list[dict[str, Any]] = []
    names = [item["name"] for item in concepts]
    for source, children in FALLBACK_RELATIONSHIPS.items():
        source_match = next((name for name in names if concept_slug(name) == concept_slug(source)), None)
        for child in children:
            child_match = next((name for name in names if concept_slug(name) == concept_slug(child)), None)
            if source_match and child_match:
                relationships.append({"source": source_match, "target": child_match, "type": "prerequisite", "strength": 70})
    for source, target in zip(names, names[1:]):
        relationships.append({"source": source, "target": target, "type": "related", "strength": 45})

    return {"concepts": concepts, "relationships": relationships}


async def extract_relationships_with_cognee(
    source_text: str,
    datasets: list[str],
    *,
    source_kind: str,
    source_title: str = "",
) -> dict[str, Any]:
    prompt = f"""
Extract a student concept knowledge graph from this {source_kind}.
Use Cognee chunks, summaries, insights, and graph completion context.
Return strict JSON only with:
{{
  "concepts": [{{"name": "...", "difficulty": "foundational|intermediate|advanced", "summary": "...", "aliases": []}}],
  "relationships": [{{"source": "...", "target": "...", "type": "prerequisite|contains|related|next|weakness", "strength": 1}}],
  "insights": ["..."]
}}
Title: {source_title}
Content:
{source_text[:6000]}
"""
    result = await search_memory(prompt, RetrievalMode.GRAPH_COMPLETION, datasets=datasets, top_k=16)
    text = context_text(result)
    parsed = _json_from_text(text)
    if parsed:
        return parsed
    return _fallback_from_text(text or source_text)
