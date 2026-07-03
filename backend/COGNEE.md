# Cognee Integration in StudyOS

Cognee is the **persistent memory layer** of StudyOS. It sits between the raw PostgreSQL
database and the AI tutor (Saathi), giving every generated response access to a student's
learning history, quiz performance, uploaded materials, and past conversations.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
└───────────────────────┬──────────────────────────────────────┘
                        │  REST / SSE
┌───────────────────────▼──────────────────────────────────────┐
│                  FastAPI Backend                              │
│                                                              │
│  ┌─────────────────┐   ┌────────────────┐   ┌─────────────┐ │
│  │  /functions/v1  │   │   /memory/*    │   │  /rest/v1   │ │
│  │  (AI endpoints) │   │ (Cognee CRUD)  │   │ (Supabase   │ │
│  └────────┬────────┘   └───────┬────────┘   │  compat.)   │ │
│           │                   │             └─────────────┘ │
│           │     ┌─────────────▼──────────────────────────┐  │
│           │     │          app/cognee/                   │  │
│           │     │  client.py  memory.py  search.py       │  │
│           └────►│  ingest.py  graph.py                   │  │
│                 └──────────────┬─────────────────────────┘  │
└────────────────────────────────┼────────────────────────────┘
                                 │
         ┌───────────────────────▼────────────────────────┐
         │                  Cognee                         │
         │  Vector store (pgvector) + Graph (Kuzu) +       │
         │  Relational meta-DB (PostgreSQL)                │
         └────────────────────────────────────────────────┘
```

---

## Module Breakdown

### `app/cognee/client.py` — Bootstrap & Locking

| Symbol | Purpose |
|---|---|
| `dataset_for_user(user_id)` | Returns a namespaced dataset string: `studyos_<user_id>` or `studyos_shared` for the global dataset |
| `cognee_module()` | Lazy-imports `cognee` only when enabled; returns `None` if `COGNEE_ENABLED=false` |
| `write_lock()` | A single `asyncio.Lock` that serialises all `cognee.add` + `cognee.cognify` calls to avoid concurrent graph corruption |

---

### `app/cognee/memory.py` — Write Path

Three async functions write student data into both PostgreSQL and the Cognee graph.

#### `remember_student_fact(db, user_id, kind, key, value)`

Generic fact writer. Used by the two specialised functions below.

1. **Upserts** a row in the `student_memory` SQL table (`kind`, `memory_key`, `value`).
2. **Adds** a plain-text summary of the fact to Cognee under the user's dataset.
3. **Cognifies** the dataset incrementally — this builds the vector index and knowledge graph.

#### `remember_quiz_attempt(db, user_id, subject, topic, correct, total, details)`

Called after every quiz or boss-battle submission. It:

1. Writes a `quiz_attempts` row.
2. Computes a rolling **mastery score** (65 % historical weight, 35 % new attempt).
3. Classifies the topic as `mastered / learning / weak`.
4. Persists three memory facts via `remember_student_fact`:
   - `mastery` — score, state, attempt count, last raw score
   - `weak_topic` — written only when mastery < 0.6 or weak concepts exist
   - `learning_path` — recommended next action based on mastery state

#### `remember_conversation(user_id, messages)`

Called at the end of every Saathi chat stream. Takes the last 12 messages, formats them
as a plain transcript, and feeds them into the user's Cognee dataset so future chats
can reference past discussions.

---

### `app/cognee/search.py` — Read Path

#### Retrieval Modes

| `RetrievalMode` | Cognee `SearchType` | Best for |
|---|---|---|
| `CHUNKS` | `CHUNKS` | Direct factual recall — quiz context, definitions |
| `SUMMARIES` | `SUMMARIES` | Revision sessions — condensed topic overviews |
| `INSIGHTS` | `GRAPH_COMPLETION` (verbose) | Relationship questions — "why does X connect to Y?" |
| `GRAPH_COMPLETION` | `GRAPH_COMPLETION` | Learning path recommendations, prerequisites |

#### `search_memory(query, mode, datasets, top_k=8)`

Calls `cognee.search` with the appropriate `SearchType` and dataset scope.
Returns raw Cognee results or `[]` when Cognee is disabled.

#### `search_all_context(query, datasets, top_k=6)`

Runs all three useful modes (`GRAPH_COMPLETION`, `SUMMARIES`, `CHUNKS`) **in parallel**
via `asyncio.gather`. Returns a dict keyed by mode name.

#### `context_text(result)` / `combined_context_text(results)`

Flatten Cognee's nested result objects into a single string ready for LLM injection.
`combined_context_text` prefixes each section with a human-readable label:

```
Cognee graph context:
…

Cognee revision summaries:
…

Cognee semantic chunks:
…
```

---

### `app/cognee/ingest.py` — Document Ingestion

Handles upload-triggered background processing for the **Knowledge Vault**.

#### `ingest_document(document_id, path)`

Triggered after a file is saved to disk. Steps:

1. Validates the file extension against `SUPPORTED_SUFFIXES` (`.pdf`, `.docx`, `.pptx`, `.txt`, `.md`, `.srt`, `.vtt`).
2. Sets `ingestion_status = "processing"` in the DB.
3. Calls `cognee.add(path)` then `cognee.cognify()` under the write lock.
4. Runs `extract_document_concepts` to pull key concepts from the freshly cognified document.
5. Stores those concepts as a `document_concepts` memory fact for the user.
6. Sets `ingestion_status = "ready"` (or `"failed"` on error).

#### `extract_document_concepts(title, dataset)`

Issues a `GRAPH_COMPLETION` search over the just-ingested document to extract up to
12 student-facing concept names, deduped and truncated to 120 chars each.

---

### `app/cognee/graph.py` — Graph Queries

Two thin helpers over `search_memory`:

| Function | Query strategy |
|---|---|
| `concept_insights(query, datasets)` | `INSIGHTS` mode — returns cross-concept relationships |
| `next_topic_recommendations(query, datasets)` | `GRAPH_COMPLETION` with a "recommend what to study next" prompt |

---

### `app/services/tutor_service.py` — Smart Context for LLM Calls

#### `infer_mode(message, requested)`

Heuristic that picks the best `RetrievalMode` from the user's message text:

| Keyword group | Mode chosen |
|---|---|
| revise, revision, summarize, summary | `SUMMARIES` |
| related, relationship, connect, understand why | `INSIGHTS` |
| study next, recommend, learning path, prerequisite | `GRAPH_COMPLETION` |
| *(anything else)* | `CHUNKS` |

#### `retrieve_complete_tutor_context(query, user_id)`

Used by `/functions/v1/generate-learning` and `/functions/v1/saathi-chat` — runs all
modes in parallel and returns the combined text + raw results. The combined text is
injected into the LLM system prompt (first 12 000 characters).

---

## API Endpoints — `/memory/*`

All routes require a valid JWT (`Authorization: Bearer <token>`).

| Method | Path | Description |
|---|---|---|
| `POST` | `/memory/search` | Manual Cognee search with configurable mode and `top_k` |
| `POST` | `/memory/profile` | Upsert learning style / weak concepts / mastered topics |
| `POST` | `/memory/quiz` | Record quiz result (triggers mastery + learning-path facts) |
| `POST` | `/memory/learning-path` | Graph-based "what to study next" recommendations |
| `POST` | `/memory/weak-topics` | Retrieve weak topic graph context for a subject |
| `POST` | `/memory/revision-summary` | Retrieve revision summaries for a topic |
| `POST` | `/memory/related-concepts` | Cross-concept relationship insights |

### Example — Record a quiz result

```http
POST /memory/quiz
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Physics",
  "topic": "Thermodynamics",
  "correct": 7,
  "total": 10,
  "details": { "weakConcepts": ["Entropy", "Carnot cycle"] }
}
```

### Example — Search memory

```http
POST /memory/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "What are my weak topics in Thermodynamics?",
  "mode": "GRAPH_COMPLETION",
  "top_k": 8
}
```

---

## How Cognee Context Reaches the LLM

```
User triggers generate-learning or saathi-chat
            │
            ▼
retrieve_complete_tutor_context(query, user_id)
  ├── cognee.search(GRAPH_COMPLETION, [shared, user])
  ├── cognee.search(SUMMARIES,        [shared, user])
  └── cognee.search(CHUNKS,           [shared, user])
            │
            ▼
combined_context_text(results)  ← up to 12 000 chars
            │
            ▼
Injected into LLM system prompt:
  "Before answering, use this Cognee memory context when relevant:
   <combined context>"
            │
            ▼
Groq / Gemini generates personalised response
```

---

## Configuration

All Cognee settings live in the backend `.env` / `.env.example`.

### Required for Cognee to run

```env
COGNEE_ENABLED=true
COGNEE_DATASET_PREFIX=studyos   # prefix for all dataset names

# Relational + vector store (can be the same PostgreSQL instance)
DB_PROVIDER=postgres
DB_NAME=cognee
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=studyos
DB_PASSWORD=studyos

VECTOR_DB_PROVIDER=pgvector
VECTOR_DB_NAME=cognee
VECTOR_DB_URL=127.0.0.1
VECTOR_DB_PORT=5432
VECTOR_DB_USERNAME=studyos
VECTOR_DB_PASSWORD=studyos

# Graph store
GRAPH_DATABASE_PROVIDER=kuzu
SYSTEM_ROOT_DIRECTORY=./.cognee_system

# LLM key used internally by Cognee to build the knowledge graph
LLM_API_KEY=<your-key>
LLM_MODEL=gemini/gemini-2.5-flash   # or groq/llama-3.3-70b-versatile
```

> **Note:** `LLM_API_KEY` / `LLM_MODEL` are used **exclusively by Cognee** for its
> internal graph construction (`cognify`). They are separate from `GROQ_API_KEY` /
> `GOOGLE_AI_API_KEY` which power the Saathi chat and generate-learning endpoints.

### Disable Cognee (no graph DB available)

```env
COGNEE_ENABLED=false
```

When disabled, all `cognee_module()` calls return `None`, every search returns `[]`, and
`remember_*` functions skip the graph write. The LLM endpoints still work — they just
receive no memory context.

---

## Dataset Namespacing

| Dataset name | Contains |
|---|---|
| `studyos_shared` | Curriculum materials uploaded by admins; available to all users |
| `studyos_<user_id>` | Personal quiz history, chat transcripts, uploaded documents for that user |

Both datasets are searched together on every LLM call so Saathi has access to both
shared curriculum knowledge and the student's personal learning history.

---

## Data Flow Summary

```
Upload document  ──► ingest_document ──► cognee.add + cognify ──► user dataset
Quiz submitted   ──► remember_quiz_attempt ──► mastery facts ──► user dataset
Chat message     ──► remember_conversation ──► transcript ──► user dataset

LLM call (any)   ──► retrieve_complete_tutor_context
                       ├── search user dataset
                       └── search shared dataset
                     ──► inject into system prompt ──► personalised AI response
```
