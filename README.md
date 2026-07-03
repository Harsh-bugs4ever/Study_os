# StudyOS

The React frontend is unchanged. `backend/` is a FastAPI + SQLAlchemy service exposing the Supabase-compatible URL shapes currently consumed by the app, backed by self-hosted PostgreSQL.

## Run locally

Requirements: Docker Desktop, Python 3.11-3.13, and Node.js 20+. Cognee's dependency tree is not yet compatible with Python 3.14.

```powershell
docker compose up -d postgres
Copy-Item backend/.env.example backend/.env
Copy-Item .env.example .env
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

In a second terminal, run `npm install` followed by `npm run dev`. The health check is `http://localhost:8000/health` and API documentation is at `http://localhost:8000/docs`.

Backend secrets belong in `backend/.env`; browser-safe values remain in the root `.env`. Generate a secure `JWT_SECRET` before deployment. Uploaded files are stored under `backend/storage` by default.

The existing `@supabase/supabase-js` package is intentionally retained as a thin frontend protocol client. It points at this backend and is not a Supabase service dependency.

## Cognee intelligence layer

Cognee is the backend memory and knowledge-graph layer. Frontend APIs remain backward compatible: existing function, storage, and REST URLs are unchanged.

Backend behavior:

- Student uploads through `/storage/v1/object/{bucket}/{name}` are stored as `knowledge_documents`, ingested into the authenticated student's Cognee dataset, cognified into a knowledge graph, and post-processed for concept memory.
- Tutor generation and `/functions/v1/saathi-chat` retrieve Cognee graph context, revision summaries, and semantic chunks before calling the LLM. These results are combined into the system prompt as bounded context.
- `/functions/v1/saathi-chat` stores long-term conversation memory in the student's Cognee dataset after the streaming response completes.
- `/memory/quiz` stores each quiz attempt, updates rolling mastery scores, records weak topics, and writes learning-path signals to Cognee.
- `/memory/search` preserves the existing single-mode search contract for direct Cognee lookups.
- `/memory/learning-path`, `/memory/weak-topics`, `/memory/revision-summary`, and `/memory/related-concepts` expose Cognee-backed recommendations for backend consumers without requiring frontend changes.

Important settings:

```env
COGNEE_ENABLED=true
COGNEE_DATASET_PREFIX=studyos
```

Install dependencies with `pip install -r backend/requirements.txt`; Cognee support is provided by `cognee[postgres-binary,docs]`.

## Migrations and existing data

From `backend/`, create revisions with `alembic revision --autogenerate -m "description"` and apply them with `alembic upgrade head`.

The initial migration creates users, refresh tokens, profiles, user roles, streams, subjects, topics, sub-topics, materials, and journal entries. Export the matching public tables from the old PostgreSQL instance and import them after applying the migration. Auth users need a deliberate password-hash migration or a password reset.

Grant an administrator locally with:

```sql
UPDATE user_roles SET role = 'admin' WHERE user_id = (SELECT id FROM users WHERE email = 'admin@example.com');
```

For production, use TLS and a secret store, restrict `CORS_ORIGINS`, persist PostgreSQL and storage volumes, and apply migrations during deployment. AI features require `GOOGLE_AI_API_KEY`.
