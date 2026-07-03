import hashlib, json, re
import httpx
from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from .config import settings
from .cognee.memory import remember_conversation
from .security import optional_user
from .services.tutor_service import retrieve_complete_tutor_context

router = APIRouter(prefix="/functions/v1", tags=["Supabase-compatible functions"])

PROMPTS = {
 "learn": "Return ONLY a JSON array of exactly 5 interactive learning steps with types hook, fillblank, choice, teachback, summary. Each has type, instruction, content and where relevant options, correctIndex, explanation.",
 "quiz": "Return ONLY a JSON array of quiz questions. Each has question, four options, correct (0-3), explanation, concept, difficulty and optional hint.",
 "boss-battle": "Return ONLY a JSON array of exactly 3 challenging application questions, each with question, four options, correct and explanation.",
 "flashcards": "Return ONLY a JSON array of flashcards, each with front and back.",
 "teachback-evaluate": "Return ONLY JSON with score (1-10), feedback, gaps array, and passed boolean.",
 "concepts": "Return ONLY a JSON array of 5-7 concept names ordered foundational to advanced."
}

def extract_json(text: str):
    text = re.sub(r"```(?:json)?", "", text).strip(); start = min([x for x in (text.find("["), text.find("{")) if x >= 0], default=-1)
    if start < 0: raise ValueError("No JSON found")
    end = max(text.rfind("]"), text.rfind("}")); return json.loads(text[start:end+1])

def stream_text_from_chunk(chunk: bytes) -> str:
    text = chunk.decode("utf-8", errors="ignore")
    parts: list[str] = []
    saw_data = False
    for line in text.splitlines():
        if not line.startswith("data: "): continue
        saw_data = True
        payload = line[6:].strip()
        if not payload or payload == "[DONE]": continue
        try:
            data = json.loads(payload)
        except ValueError:
            continue
        delta = data.get("choices", [{}])[0].get("delta", {})
        parts.append(delta.get("content", ""))
    return "".join(parts) if saw_data else text

# ---------------------------------------------------------------------------
# Gemini helpers
# ---------------------------------------------------------------------------

def gemini_url(action: str) -> str:
    base = settings.ai_gateway_url.rstrip("/")
    return f"{base}/models/{settings.ai_model}:{action}?key={settings.ai_api_key}"

def gemini_contents(messages: list[dict]) -> list[dict]:
    contents = []
    for message in messages:
        content = str(message.get("content") or "")
        if not content:
            continue
        role = "model" if message.get("role") == "assistant" else "user"
        contents.append({"role": role, "parts": [{"text": content}]})
    return contents

def gemini_payload(system: str, messages: list[dict]) -> dict:
    return {
        "systemInstruction": {"parts": [{"text": system}]},
        "contents": gemini_contents(messages),
    }

def gemini_text(data: dict) -> str:
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    return "".join(str(part.get("text", "")) for part in parts)

def openai_sse_chunk(content: str) -> bytes:
    payload = {"choices": [{"delta": {"content": content}}]}
    return f"data: {json.dumps(payload)}\n\n".encode("utf-8")

def gemini_stream_text_from_line(line: str) -> str:
    if not line.startswith("data: "):
        return ""
    try:
        return gemini_text(json.loads(line[6:].strip()))
    except ValueError:
        return ""

# ---------------------------------------------------------------------------
# Groq helpers  (OpenAI-compatible chat completions)
# ---------------------------------------------------------------------------

GROQ_BASE_URL = "https://api.groq.com/openai/v1"

def groq_url(path: str) -> str:
    return f"{GROQ_BASE_URL}/{path.lstrip('/')}"

def openai_payload(system: str, messages: list[dict], stream: bool = False) -> dict:
    """Build an OpenAI-style chat completions request body."""
    formatted = [{"role": "system", "content": system}]
    for m in messages:
        role = m.get("role", "user")
        content = str(m.get("content") or "")
        if content:
            formatted.append({"role": role, "content": content})
    return {
        "model": settings.active_model,
        "messages": formatted,
        "stream": stream,
    }

def openai_text(data: dict) -> str:
    """Extract text from an OpenAI-style (non-streaming) response."""
    return data.get("choices", [{}])[0].get("message", {}).get("content", "")

def openai_stream_text_from_line(line: str) -> str:
    """Extract delta text from a single SSE line in OpenAI streaming format."""
    if not line.startswith("data: "):
        return ""
    payload = line[6:].strip()
    if not payload or payload == "[DONE]":
        return ""
    try:
        data = json.loads(payload)
    except ValueError:
        return ""
    return data.get("choices", [{}])[0].get("delta", {}).get("content", "") or ""

# ---------------------------------------------------------------------------
# Provider-agnostic helpers
# ---------------------------------------------------------------------------

async def call_ai(system: str, messages: list[dict]) -> str:
    """Call the active provider (Groq or Gemini) and return the response text."""
    provider = settings.active_provider
    if provider == "groq":
        headers = {
            "Authorization": f"Bearer {settings.active_api_key}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(
                groq_url("chat/completions"),
                json=openai_payload(system, messages, stream=False),
                headers=headers,
            )
        if r.status_code == 429:
            raise HTTPException(429, "Rate limited by Groq. Please try again in a moment.")
        if not r.is_success:
            raise HTTPException(500, f"Groq API error: {r.status_code}")
        return openai_text(r.json())
    else:
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(gemini_url("generateContent"), json=gemini_payload(system, messages))
        if r.status_code == 429:
            raise HTTPException(429, "Rate limited. Please try again in a moment.")
        if not r.is_success:
            raise HTTPException(500, "AI service error")
        return gemini_text(r.json())


async def stream_ai(system: str, messages: list[dict]):
    """Stream from the active provider. Yields openai_sse_chunk bytes."""
    provider = settings.active_provider
    if provider == "groq":
        headers = {
            "Authorization": f"Bearer {settings.active_api_key}",
            "Content-Type": "application/json",
        }
        client = httpx.AsyncClient(timeout=None)
        req = client.build_request(
            "POST",
            groq_url("chat/completions"),
            json=openai_payload(system, messages, stream=True),
            headers=headers,
        )
        upstream = await client.send(req, stream=True)
        if not upstream.is_success:
            await upstream.aclose(); await client.aclose()
            raise HTTPException(429 if upstream.status_code == 429 else 500, "Groq API error")

        async def relay_groq():
            buffer = ""
            try:
                async for chunk in upstream.aiter_bytes():
                    buffer += chunk.decode("utf-8", errors="ignore")
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.rstrip("\r")
                        content = openai_stream_text_from_line(line)
                        if content:
                            yield openai_sse_chunk(content)
                yield b"data: [DONE]\n\n"
            finally:
                await upstream.aclose(); await client.aclose()

        return relay_groq()
    else:
        client = httpx.AsyncClient(timeout=None)
        req = client.build_request("POST", gemini_url("streamGenerateContent") + "&alt=sse", json=gemini_payload(system, messages))
        upstream = await client.send(req, stream=True)
        if not upstream.is_success:
            await upstream.aclose(); await client.aclose()
            raise HTTPException(429 if upstream.status_code == 429 else 500, "AI service error")

        async def relay_gemini():
            buffer = ""
            try:
                async for chunk in upstream.aiter_bytes():
                    buffer += chunk.decode("utf-8", errors="ignore")
                    while "\n" in buffer:
                        line, buffer = buffer.split("\n", 1)
                        line = line.rstrip("\r")
                        content = gemini_stream_text_from_line(line)
                        if content:
                            yield openai_sse_chunk(content)
                yield b"data: [DONE]\n\n"
            finally:
                await upstream.aclose(); await client.aclose()

        return relay_gemini()

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/generate-learning")
async def generate_learning(request: Request, authorization: str | None = Header(None)):
    body = await request.json(); mode = body.get("mode")
    if not body.get("subject") or not body.get("subtopic") or mode not in PROMPTS:
        raise HTTPException(400, "subject, subtopic, and mode are required")
    if not settings.active_api_key:
        raise HTTPException(500, f"No API key configured for provider '{settings.active_provider}'. "
                                 "Set GROQ_API_KEY or GOOGLE_AI_API_KEY in your environment.")
    count = body.get("numQuestions") or (10 if mode == "flashcards" else 5)
    user_obj = optional_user(authorization)
    try:
        memory_context, _ = await retrieve_complete_tutor_context(f"{body['subject']} {body['subtopic']}", user_obj.id if user_obj else None)
    except Exception:
        memory_context = ""
    system = "You are Saathi, a warm AI tutor for Indian students. " + PROMPTS[mode]
    if memory_context: system += f"\nGround the response in this student knowledge memory when relevant:\n{memory_context[:12000]}"
    user = f"Subject: {body['subject']}\nTopic: {body['subtopic']}\nCount: {count}\nStudent explanation: {body.get('studentExplanation','')}"
    content = await call_ai(system, [{"role": "user", "content": user}])
    try: return {"result": extract_json(content)}
    except ValueError: return {"result": content, "raw": True}

@router.post("/saathi-chat")
async def saathi_chat(request: Request, authorization: str | None = Header(None)):
    body = await request.json()
    if not settings.active_api_key:
        raise HTTPException(500, f"No API key configured for provider '{settings.active_provider}'. "
                                 "Set GROQ_API_KEY or GOOGLE_AI_API_KEY in your environment.")
    context = body.get("context") or {}
    messages = body.get("messages", [])
    user_obj = optional_user(authorization)
    latest_question = next((m.get("content", "") for m in reversed(messages) if m.get("role") == "user"), "")
    memory_query = " ".join(x for x in (context.get("currentSubject", ""), context.get("currentTopic", ""), latest_question) if x)
    try:
        memory_context, _ = await retrieve_complete_tutor_context(memory_query, user_obj.id if user_obj else None)
    except Exception:
        memory_context = ""
    system = f"""You are Saathi, a warm, supportive study companion for Indian students.
Detect whether the student needs study help, emotional support, or planning help. Be conversational and specific.
Use no more than 4-5 short lines. Never dismiss distress. Current subject: {context.get('currentSubject','')}; current topic: {context.get('currentTopic','')}; mood: {context.get('mood','')}; readiness: {context.get('readiness','')}.
If recovery mode is active, suggest lighter activities. Recovery mode: {context.get('recoveryMode', False)}."""
    if memory_context:
        system += f"\n\nBefore answering, use this Cognee memory context when relevant:\n{memory_context[:12000]}"

    generator = await stream_ai(system, messages)

    async def relay_with_memory():
        response_parts: list[str] = []
        async for chunk in generator:
            # Extract content from SSE chunk for memory storage
            try:
                raw = chunk.decode("utf-8", errors="ignore")
                for line in raw.splitlines():
                    text = openai_stream_text_from_line(line)
                    if text:
                        response_parts.append(text)
            except Exception:
                pass
            yield chunk
        if user_obj and messages:
            await remember_conversation(user_obj.id, [*messages, {"role": "assistant", "content": "".join(response_parts)[-8000:]}])

    return StreamingResponse(relay_with_memory(), media_type="text/event-stream")
