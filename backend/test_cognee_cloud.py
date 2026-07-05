"""
Cognee Cloud Integration Test Script
=====================================
Run this from the backend directory WHILE the server is running:

    cd c:\\Users\\ANSH\\Downloads\\Gurukul-main\\StudyOS\\backend
    .venv\\Scripts\\python.exe test_cognee_cloud.py

The script:
  1. Verifies the backend is reachable
  2. Creates a local JWT so we don't need a real user account
     (sub MUST be a valid UUID — security.py parses it with uuid.UUID())
  3. Tests remember() via POST /memory/profile
  4. Tests recall() via POST /memory/search
  5. Tests the hackathon demo endpoint GET /api/cognee/demo
  6. Tests quiz memory write + weak-topics recall() for a quiz attempt
  7. Reports pass / fail for each step
"""

import asyncio
import json
import sys
from datetime import datetime, timedelta, timezone

import httpx
import jwt  # PyJWT -- already in requirements

# ── Config ────────────────────────────────────────────────────────────────────
BASE_URL = "https://study-os-j8xk.onrender.com"
JWT_SECRET = "change-me"          # matches backend/.env JWT_SECRET default
JWT_ALGORITHM = "HS256"

# ── Helpers ───────────────────────────────────────────────────────────────────

def make_token(user_id: str = "00000000-0000-0000-0000-000000000000") -> str:
    """Generate a local JWT that the backend will accept."""
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": user_id,
            "email": "cognee_test@studyos.local",
            "role": "authenticated",
            "aud": "authenticated",
            "iat": now,
            "exp": now + timedelta(hours=1),
        },
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def ok(label: str):
    print(f"  OK  {label}")


def fail(label: str, detail: str):
    print(f"  FAIL  {label}: {detail}")


# ── Tests ─────────────────────────────────────────────────────────────────────

async def test_all():
    token = make_token()
    h = headers(token)
    passed = 0
    failed = 0

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30) as client:

        # 1. Health check
        print("\n[1] Health check")
        try:
            r = await client.get("/")
            assert r.status_code == 200, r.text
            ok(f"GET / -> {r.json()}")
            passed += 1
        except Exception as e:
            fail("GET /", str(e)); failed += 1

        # 2. Remember: profile memory (write path)
        print("\n[2] remember() -- POST /memory/profile")
        try:
            r = await client.post(
                "/memory/profile",
                headers=h,
                json={"learning_style": "visual", "weak_concepts": ["Newton's laws", "Integration by parts"]},
            )
            assert r.status_code in (200, 204), r.text
            ok(f"Stored profile memory -> HTTP {r.status_code}")
            passed += 1
        except Exception as e:
            fail("POST /memory/profile", str(e)); failed += 1

        # 3. Recall: search (read path)
        print("\n[3] recall() -- POST /memory/search")
        try:
            r = await client.post(
                "/memory/search",
                headers=h,
                json={"query": "What is my learning style?", "mode": "CHUNKS", "top_k": 5},
            )
            assert r.status_code == 200, r.text
            body = r.json()
            context = body.get("context", "")
            results = body.get("results", [])
            ok(f"recall() returned {len(results)} results | context length: {len(context)} chars")
            if context:
                print(f"       Preview: {context[:200]}...")
            passed += 1
        except Exception as e:
            fail("POST /memory/search", str(e)); failed += 1

        # 4. Quiz memory (write + graph update)
        print("\n[4] remember() -- POST /memory/quiz")
        try:
            r = await client.post(
                "/memory/quiz",
                headers=h,
                json={
                    "subject": "Physics",
                    "topic": "Newton's Laws",
                    "correct": 3,
                    "total": 5,
                    "details": {"weak_concepts": ["Newton's third law"]},
                },
            )
            assert r.status_code in (200, 204), r.text
            ok(f"Stored quiz attempt -> HTTP {r.status_code}")
            passed += 1
        except Exception as e:
            fail("POST /memory/quiz", str(e)); failed += 1

        # 5. Recall after quiz
        print("\n[5] recall() after quiz -- POST /memory/weak-topics")
        try:
            r = await client.post(
                "/memory/weak-topics",
                headers=h,
                json={"subject": "Physics", "topic": "Newton's Laws"},
            )
            assert r.status_code == 200, r.text
            body = r.json()
            ok(f"Weak topics context: {len(body.get('context',''))} chars")
            passed += 1
        except Exception as e:
            fail("POST /memory/weak-topics", str(e)); failed += 1

        # 6. Hackathon demo metrics
        print("\n[6] GET /api/cognee/demo")
        try:
            r = await client.get("/api/cognee/demo", headers=h)
            assert r.status_code == 200, r.text
            ok(f"Demo metrics -> {json.dumps(r.json())[:300]}")
            passed += 1
        except Exception as e:
            fail("GET /api/cognee/demo", str(e)); failed += 1

        # 7. Hackathon semantic search
        print("\n[7] POST /api/cognee/search")
        try:
            r = await client.post(
                "/api/cognee/search",
                headers=h,
                json={"query": "Newton's third law weak topic", "mode": "CHUNKS"},
            )
            assert r.status_code == 200, r.text
            body = r.json()
            ok(f"Semantic search -> {len(str(body))} chars in response")
            passed += 1
        except Exception as e:
            fail("POST /api/cognee/search", str(e)); failed += 1

        # 8. Revision cards
        print("\n[8] POST /api/cognee/revision-cards")
        try:
            r = await client.post(
                "/api/cognee/revision-cards",
                headers=h,
                json={"topic": "Newton's Laws"},
            )
            assert r.status_code == 200, r.text
            ok(f"Revision cards -> {len(str(r.json()))} chars")
            passed += 1
        except Exception as e:
            fail("POST /api/cognee/revision-cards", str(e)); failed += 1

    # Summary
    print(f"\n{'='*50}")
    print(f"Results: {passed} passed, {failed} failed out of {passed+failed} tests")
    if failed == 0:
        print("All Cognee Cloud routes are working!")
    else:
        print("Some tests failed. Check the backend logs for details.")
    print("="*50)

    return failed


if __name__ == "__main__":
    sys.exit(asyncio.run(test_all()))
