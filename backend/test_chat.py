import asyncio
import httpx
from test_cognee_cloud import make_token

async def test_chat():
    h = {"Authorization": f"Bearer {make_token()}"}
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=60.0) as client:
        try:
            r = await client.post(
                "/api/chat",
                headers=h,
                json={"messages": [{"role": "user", "content": "Hello"}], "context": {}},
            )
            print(f"Status: {r.status_code}")
            print(f"Response: {r.text}")
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(test_chat())
