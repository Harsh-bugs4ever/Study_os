# Cognee Integration in StudyOS

Cognee is the **persistent memory layer** of StudyOS. It sits between the raw PostgreSQL database and the AI tutor (Saathi), giving every generated response access to a student's learning history, quiz performance, uploaded materials, and past conversations.

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
│  ┌─────────────────┐   ┌────────────────┐   ┌─────────────┐  │
│  │  /functions/v1  │   │   /memory/*    │   │  /api/*     │  │
│  │  (AI endpoints) │   │ (Cognee CRUD)  │   │ /cognee/*   │  │
│  └────────┬────────┘   └───────┬────────┘   └──────┬──────┘  │
│           │                   │                    │         │
│           │     ┌─────────────▼────────────────────▼─────┐   │
│           │     │          app/cognee/                   │   │
│           │     │  client.py      memory.py    search.py │   │
│           └────►│  ingest.py      graph.py     builder.py│   │
│                 │  adaptive.py    quiz.py      recs.py   │   │
│                 │  analytics.py   explain.py   showcase.py│  │
│                 └──────────────┬─────────────────────────┘   │
└────────────────────────────────┼─────────────────────────────┘
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
| `write_lock()` | A single `asyncio.Lock` that serializes all `cognee.add` + `cognee.cognify` calls to avoid concurrent graph corruption |

---

### `app/cognee/memory.py` — Write Path

Three async functions write student data into both PostgreSQL and the Cognee graph.

#### `remember_student_fact(db, user_id, kind, key, value)`
Generic fact writer. Used by the two specialized functions below.
1. **Upserts** a row in the `student_memory` SQL table (`kind`, `memory_key`, `value`).
2. **Adds** a plain-text summary of the fact to Cognee under the user's dataset.
3. **Cognifies** the dataset incrementally — this builds the vector index and knowledge graph.

#### `remember_quiz_attempt(db, user_id, subject, topic, correct, total, details)`
Called after every quiz or boss-battle submission. It:
1. Writes a `quiz_attempts` row.
2. Computes a rolling **mastery score** (65% historical weight, 35% new attempt).
3. Classifies the topic as `mastered / learning / weak`.
4. Persists three memory facts via `remember_student_fact`:
   - `mastery` — score, state, attempt count, last raw score
   - `weak_topic` — written only when mastery < 0.6 or weak concepts exist
   - `learning_path` — recommended next action based on mastery state

#### `remember_conversation(user_id, messages)`
Called at the end of every Saathi chat stream. Takes the last 12 messages, formats them as a plain transcript, and feeds them into the user's Cognee dataset so future chats can reference past discussions.

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
Calls `cognee.search` with the appropriate `SearchType` and dataset scope. Returns raw Cognee results or `[]` when Cognee is disabled.

#### `search_all_context(query, datasets, top_k=6)`
Runs all three useful modes (`GRAPH_COMPLETION`, `SUMMARIES`, `CHUNKS`) **in parallel** via `asyncio.gather`. Returns a dict keyed by mode name.

#### `context_text(result)` / `combined_context_text(results)`
Flattens Cognee's nested result objects into a single string ready for LLM injection.

---

### `app/cognee/ingest.py` — Document Ingestion

Handles upload-triggered background processing for the **Knowledge Vault**.

#### `ingest_document(document_id, path)`
Triggered after a file is saved to disk. Steps:
1. Validates the file extension against `SUPPORTED_SUFFIXES` (`.pdf`, `.docx`, `.pptx`, `.txt`, `.md`, `.srt`, `.vtt`).
2. Sets `ingestion_status = "processing"` in the DB.
3. Calls `cognee.add(path)` then `cognee.cognify()` under the write lock.
4. Runs concept extraction to pull key concepts from the freshly cognified document.
5. Stores those concepts as a `document_concepts` memory fact for the user.
6. Sets `ingestion_status = "ready"` (or `"failed"` on error).

---

### `app/cognee/graph_builder.py` & `relationship_service.py` — SQL Knowledge Graph Builder

Bridges Cognee predictions with structured SQL tables (`ConceptNode` and `ConceptEdge`).

* **Concept Extraction (`extract_relationships_with_cognee`)**: Calls Cognee in `GRAPH_COMPLETION` mode to parse raw text and return structured JSON containing extracted concepts, relationships, and difficulties.
* **Graph Updates**: `ConceptGraphBuilder` processes incoming data to dynamically upsert nodes and edges.
* **Context Ingestion**:
  * `ingest_document`: Processes uploaded materials and populates document-concept links.
  * `ingest_quiz_attempt`: Parses quiz results, adjusts mastery levels, and flags missed topics as weaknesses.
  * `ingest_memory_fact` & `ingest_chat`: Extracts concepts and connections from messages and custom memory records.
* **Payload Generation (`graph_payload`)**: Assembles the complete graph structure (nodes, edges, study recommendations, document links) for frontend graph visualizations.

---

### `app/cognee/adaptive_engine.py` & `learning_profile.py` — Adaptive Tutoring

Orchestrates custom, profile-driven response generation.

* **Profile Construction**: Builds a student learning profile containing language preferences, learning styles (visual, auditory, reading, kinesthetic), strong/weak topics, attention span, and overall confidence score.
* **Adaptive Prompt Construction (`adaptive_tutor_answer`)**: 
  1. Retrieves all Cognee context (chunks, summaries, insights, history).
  2. Adjusts instruction rules based on the style (e.g., visual styles get compact tables; kinesthetic styles get mini exercises).
  3. Injects custom prompts aligned to user difficulty preferences (simplifying for beginners, adding technical depth for advanced).
  4. Returns the final answer alongside matched graph nodes, recent quiz stats, and reasoning steps.

---

### `app/cognee/quiz_engine.py` & `recommendation_engine.py` — Personalized Pathing

* **Adaptive Quizzes (`generate_adaptive_quiz`)**: Queries LLM to produce structured quiz questions dynamically. Difficulty is scaled (easy, medium, hard) based on the student's confidence score and subject mastery profile.
* **Study Recommendations (`adaptive_recommendations`)**: Sorts and selects personalized recommendations, categorized by `study_first`, `practice`, `review_pdf`, and `retry_quiz`.
* **Progress Aggregations**: Builds weekly completion metrics (quizzes taken, chapters mastered) and logs them into student memory.

---

### `app/cognee/explainability.py` & `memory_dashboard.py` — Memory Dashboard Services

Supplies full transparency and control over what the model remembers.

* **Explainable Context**: Collates all retrieved text chunks, graph nodes, active weaknesses, past chat logs, and quiz attempts matching a user query so students can see *why* Saathi gave a particular answer.
* **Dashboard Management**: Provides functions to query, pin, soft-delete, and tag memory records.
* **Memory History & Replays**: Calculates performance improvements on re-taken quizzes and recommends the next best action.

---

### `app/cognee/analytics.py` — Student Analytics

Calculates mastery performance statistics and trends.

* **Mistake Logging**: Tracks repeated incorrect answers across quizzes.
* **Mastery Trend Analysis**: Computes rolling weighted scores and maps progress trends (`improving`, `declining`, `steady`).
* **Revision Sequencing**: Uses Cognee's `GRAPH_COMPLETION` prerequisite mapping to sort recommended topics in order of priority.

---

### `app/cognee/hackathon_showcase.py` — Visualization Data Builders

Prepares formatted datasets for the dashboard analytics:

* **Memory Timeline**: Chronological stream of memory events with custom tags.
* **Knowledge Evolution**: Day-by-day counts tracking graph node and edge accumulation.
* **Document Relationships**: Formats bipartite graphs linking documents to concept nodes.
* **Learning Heatmaps**: Counts daily quiz submissions and revision sessions.

---

## API Endpoints

### `/memory/*` (Memory Management & Direct Retrieval)

| Method | Path | Description |
|---|---|---|
| `POST` | `/memory/search` | Manual Cognee search with configurable mode and `top_k` |
| `POST` | `/memory/profile` | Upsert learning style / weak concepts / mastered topics |
| `POST` | `/memory/quiz` | Record quiz result (triggers mastery + learning-path facts) |
| `POST` | `/memory/learning-path` | Graph-based "what to study next" recommendations |
| `POST` | `/memory/weak-topics` | Retrieve weak topic graph context for a subject |
| `POST` | `/memory/revision-summary` | Retrieve revision summaries for a topic |
| `POST` | `/memory/related-concepts` | Cross-concept relationship insights |
| `POST` | `/memory/tag` | Attach custom tag strings to a specific memory ID |

### `/api/*` (Adaptive Chat & Memory Dashboard CRUD)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/chat` | Main Saathi chat endpoint. Drives the adaptive tutor and registers transcripts |
| `GET` | `/api/memory` | Fetch memory dashboard records (pinned, recent, quiz/planner history) |
| `POST` | `/api/memory/search` | Text-search registered memories for a student |
| `POST` | `/api/memory/delete` | Soft-delete a memory record by ID |
| `POST` | `/api/memory/pin` | Pin or unpin a memory record by ID |
| `GET` | `/api/memory/history` | Retrieve memory history, performance improvement charts, and replays |

---

## How Cognee Context Reaches the LLM

```
User triggers generate-learning, quiz, or saathi-chat
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
Groq / Gemini generates personalized response
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

> **Note:** `LLM_API_KEY` / `LLM_MODEL` are used **exclusively by Cognee** for its internal graph construction (`cognify`). They are separate from `GROQ_API_KEY` / `GOOGLE_AI_API_KEY` which power the Saathi chat and generate-learning endpoints.

### Disable Cognee (no graph DB available)

```env
COGNEE_ENABLED=false
```

When disabled, all `cognee_module()` calls return `None`, every search returns `[]`, and `remember_*` functions skip the graph write. The LLM endpoints still work — they just receive no memory context.

---

## Dataset Namespacing

| Dataset name | Contains |
|---|---|
| `studyos_shared` | Curriculum materials uploaded by admins; available to all users |
| `studyos_<user_id>` | Personal quiz history, chat transcripts, uploaded documents for that user |

Both datasets are searched together on every LLM call so Saathi has access to both shared curriculum knowledge and the student's personal learning history.

---

## Data Flow Summary

```
Upload document  ──► ingest_document ──► cognee.add + cognify ──► user dataset ──► Extract SQL Graph
Quiz submitted   ──► remember_quiz_attempt ──► mastery facts ──► user dataset ──► Update mastery in SQL
Chat message     ──► remember_conversation ──► transcript ──► user dataset ──► Extract conversational concepts

LLM call (any)   ──► retrieve_complete_tutor_context
                       ├── search user dataset
                       └── search shared dataset
                     ──► inject into system prompt ──► personalized AI response
```
