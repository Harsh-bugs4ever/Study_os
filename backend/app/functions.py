import json, re
from fastapi import APIRouter, Header, HTTPException, Request
from fastapi.responses import StreamingResponse
from .cognee.memory import remember_conversation
from .security import optional_user
from .services.tutor_service import retrieve_complete_tutor_context
from services.groq_service import GroqService, GroqServiceError

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

def openai_sse_chunk(content: str) -> bytes:
    payload = {"choices": [{"delta": {"content": content}}]}
    return f"data: {json.dumps(payload)}\n\n".encode("utf-8")

@router.post("/generate-learning")
async def generate_learning(request: Request, authorization: str | None = Header(None)):
    body = await request.json(); mode = body.get("mode")
    if not body.get("subject") or not body.get("subtopic") or mode not in PROMPTS: raise HTTPException(400, "subject, subtopic, and mode are required")
    count = body.get("numQuestions") or (10 if mode == "flashcards" else 5)
    user_obj = optional_user(authorization)
    try:
        memory_context, _ = await retrieve_complete_tutor_context(f"{body['subject']} {body['subtopic']}", user_obj.id if user_obj else None)
    except Exception:
        memory_context = ""
    system = "You are Saathi, a warm AI tutor for Indian students. " + PROMPTS[mode]
    if memory_context: system += f"\nGround the response in this student knowledge memory when relevant:\n{memory_context[:12000]}"
    user = f"Subject: {body['subject']}\nTopic: {body['subtopic']}\nCount: {count}\nStudent explanation: {body.get('studentExplanation','')}"
    try:
        content = await GroqService().complete(system, [{"role": "user", "content": user}])
    except GroqServiceError as exc:
        raise HTTPException(exc.status_code, str(exc)) from exc
    try: return {"result": extract_json(content)}
    except ValueError: return {"result": content, "raw": True}

@router.post("/saathi-chat")
async def saathi_chat(request: Request, authorization: str | None = Header(None)):
    body = await request.json()
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
    try:
        groq = GroqService()
    except GroqServiceError as exc:
        raise HTTPException(exc.status_code, str(exc)) from exc
    async def relay():
        response_parts: list[str] = []
        try:
            async for content in groq.stream(system, messages):
                response_parts.append(content)
                yield openai_sse_chunk(content)
            yield b"data: [DONE]\n\n"
        finally:
            if user_obj and messages:
                await remember_conversation(user_obj.id, [*messages, {"role": "assistant", "content": "".join(response_parts)[-8000:]}])
    return StreamingResponse(relay(), media_type="text/event-stream")
