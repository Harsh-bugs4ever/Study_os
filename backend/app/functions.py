import hashlib, json, re
import httpx
from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from .config import settings
from .cognee.memory import remember_conversation
from .security import optional_user
from .services.tutor_service import retrieve_tutor_context

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

@router.post("/generate-learning")
async def generate_learning(request: Request, authorization: str | None = Header(None)):
    body = await request.json(); mode = body.get("mode")
    if not body.get("subject") or not body.get("subtopic") or mode not in PROMPTS: raise HTTPException(400, "subject, subtopic, and mode are required")
    if not settings.lovable_api_key: raise HTTPException(500, "LOVABLE_API_KEY is not configured")
    count = body.get("numQuestions") or (10 if mode == "flashcards" else 5)
    user_obj = optional_user(authorization)
    memory_mode = "SUMMARIES" if mode == "flashcards" else "INSIGHTS" if mode == "concepts" else "GRAPH_COMPLETION" if mode == "boss-battle" else "CHUNKS"
    try:
        _, memory_context, _ = await retrieve_tutor_context(f"{body['subject']} {body['subtopic']}", user_obj.id if user_obj else None, memory_mode)
    except Exception:
        memory_context = ""
    system = "You are Saathi, a warm AI tutor for Indian students. " + PROMPTS[mode]
    if memory_context: system += f"\nGround the response in this student knowledge memory when relevant:\n{memory_context[:12000]}"
    user = f"Subject: {body['subject']}\nTopic: {body['subtopic']}\nCount: {count}\nStudent explanation: {body.get('studentExplanation','')}"
    async with httpx.AsyncClient(timeout=90) as client:
        r = await client.post(settings.ai_gateway_url, headers={"Authorization": f"Bearer {settings.lovable_api_key}"}, json={"model": settings.ai_model, "messages": [{"role":"system","content":system},{"role":"user","content":user}]})
    if r.status_code == 429: raise HTTPException(429, "Rate limited. Please try again in a moment.")
    if not r.is_success: raise HTTPException(500, "AI service error")
    content = r.json().get("choices", [{}])[0].get("message", {}).get("content", "")
    try: return {"result": extract_json(content)}
    except ValueError: return {"result": content, "raw": True}

@router.post("/saathi-chat")
async def saathi_chat(request: Request):
    body = await request.json()
    if not settings.lovable_api_key: raise HTTPException(500, "LOVABLE_API_KEY is not configured")
    context = body.get("context") or {}
    system = f"""You are Saathi, a warm, supportive study companion for Indian students.
Detect whether the student needs study help, emotional support, or planning help. Be conversational and specific.
Use no more than 4-5 short lines. Never dismiss distress. Current subject: {context.get('currentSubject','')}; current topic: {context.get('currentTopic','')}; mood: {context.get('mood','')}; readiness: {context.get('readiness','')}.
If recovery mode is active, suggest lighter activities. Recovery mode: {context.get('recoveryMode', False)}."""
    client = httpx.AsyncClient(timeout=None)
    req = client.build_request("POST", settings.ai_gateway_url, headers={"Authorization": f"Bearer {settings.lovable_api_key}"}, json={"model": settings.ai_model, "messages": [{"role":"system","content":system}, *body.get("messages", [])], "stream": True})
    upstream = await client.send(req, stream=True)
    if not upstream.is_success:
        await upstream.aclose(); await client.aclose()
        raise HTTPException(429 if upstream.status_code == 429 else 500, "AI service error")
    async def relay():
        try:
            async for chunk in upstream.aiter_bytes(): yield chunk
        finally:
            await upstream.aclose(); await client.aclose()
    return StreamingResponse(relay(), media_type="text/event-stream")
