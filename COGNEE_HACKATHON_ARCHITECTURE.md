# StudyOS Cognee Hackathon Architecture

StudyOS uses Cognee as the memory and knowledge layer behind tutoring, retrieval, analytics, graphing, and revision.

## Core Flow

1. Documents, chats, quizzes, profile updates, planner events, and study completions are written as `student_memories`.
2. The same events are sent to Cognee datasets with `cognee.add()` and `cognee.cognify()`.
3. Tutor answers retrieve Cognee chunks, summaries, graph completion, previous conversations, quiz history, weak topics, planner context, learning profile, and graph nodes before calling Groq.
4. Quiz completion updates mastery, weak topics, learning profile, graph nodes, planner recommendations, and adaptive recommendations.

## Main Services

- `backend/app/cognee/ingest.py`: background document ingestion and Cognify.
- `backend/app/cognee/memory.py`: durable memory writes, conversation memory, quiz memory updates.
- `backend/app/cognee/graph_builder.py`: concept graph nodes, relationships, mastery, evidence links.
- `backend/app/cognee/explainability.py`: source-aware chat responses.
- `backend/app/cognee/learning_profile.py`: persistent adaptive learning profile stored in Cognee memory.
- `backend/app/cognee/adaptive_engine.py`: personalized tutor responses.
- `backend/app/cognee/quiz_engine.py`: adaptive quiz generation from mastery and weak topics.
- `backend/app/cognee/recommendation_engine.py`: next topic, revision, PDF, and retry recommendations.
- `backend/app/cognee/hackathon_showcase.py`: timelines, heatmaps, semantic search, revision cards, mentor, demo metrics.

## Hackathon Demo APIs

- `GET /api/cognee/demo`: memory count, graph size, documents indexed, searches, updates.
- `GET /api/cognee/mentor`: today's focus, progress, weakest topic, suggested revision/quiz/document.
- `GET /api/cognee/timeline`: AI memory timeline and knowledge evolution timeline.
- `GET /api/cognee/documents/relationships`: document-to-concept relationships.
- `GET /api/cognee/heatmap`: revision and learning heatmaps.
- `POST /api/cognee/search`: cross-document semantic search.
- `POST /api/cognee/pdf/search`: semantic PDF search.
- `POST /api/cognee/revision-cards`: automatic concept flashcards and smart revision cards.

## Performance Notes

- Document ingestion runs in FastAPI background tasks.
- Graph payloads are cached briefly per user to avoid repeated expensive queries.
- Memory writes use unique `(user_id, kind, memory_key)` upserts to prevent duplicates.
- Conversation memory uses a transcript hash so repeated chat turns update durable memory instead of creating noisy duplicates.

## Frontend Surfaces

- `/dashboard`: AI Mentor and replay cards.
- `/memory`: search, pin, tag, delete, and browse memories.
- `/concept-graph`: concept dependency graph and mastery details.
- `/cognee-demo`: judge-facing Cognee capability dashboard.

The frontend is intentionally extended rather than redesigned; new surfaces reuse the existing StudyOS layout, cards, typography, and color tokens.
