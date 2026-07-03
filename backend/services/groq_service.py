import json
from collections.abc import AsyncIterator

import httpx

from app.config import settings


class GroqServiceError(RuntimeError):
    def __init__(self, message: str, status_code: int = 500):
        super().__init__(message)
        self.status_code = status_code


class GroqService:
    """Small async client for Groq's OpenAI-compatible chat API."""

    def __init__(self) -> None:
        if not settings.groq_api_key:
            raise GroqServiceError("GROQ_API_KEY is not configured")
        self.url = f"{settings.groq_api_url.rstrip('/')}/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {settings.groq_api_key}",
            "Content-Type": "application/json",
        }

    @staticmethod
    def _messages(system: str, messages: list[dict]) -> list[dict]:
        cleaned = [{"role": "system", "content": system}]
        for message in messages:
            role = message.get("role")
            content = message.get("content")
            if role in {"user", "assistant", "system"} and content:
                cleaned.append({"role": role, "content": str(content)})
        return cleaned

    async def complete(self, system: str, messages: list[dict]) -> str:
        payload = {
            "model": settings.groq_model,
            "messages": self._messages(system, messages),
            "temperature": 0.4,
        }
        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(self.url, headers=self.headers, json=payload)
        self._raise_for_status(response)
        return response.json()["choices"][0]["message"]["content"] or ""

    async def stream(self, system: str, messages: list[dict]) -> AsyncIterator[str]:
        payload = {
            "model": settings.groq_model,
            "messages": self._messages(system, messages),
            "temperature": 0.5,
            "stream": True,
        }
        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", self.url, headers=self.headers, json=payload) as response:
                if not response.is_success:
                    await response.aread()
                    self._raise_for_status(response)
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:].strip()
                    if not data or data == "[DONE]":
                        continue
                    try:
                        content = json.loads(data).get("choices", [{}])[0].get("delta", {}).get("content")
                    except (ValueError, IndexError, TypeError):
                        continue
                    if content:
                        yield content

    @staticmethod
    def _raise_for_status(response: httpx.Response) -> None:
        if response.is_success:
            return
        status = 429 if response.status_code == 429 else 502
        detail = "Groq rate limit reached" if status == 429 else "Groq AI service error"
        raise GroqServiceError(detail, status)
