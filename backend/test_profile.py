import asyncio
import httpx
from test_cognee_cloud import make_token

async def test_profile():
    h = {"Authorization": f"Bearer {make_token()}"}
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        r = await client.post(
            "/memory/profile",
            headers=h,
            json={"learning_style": "visual", "weak_concepts": ["Newton's laws"]},
        )
        print(f"Status: {r.status_code}")
        print(f"Response: {r.text}")

asyncio.run(test_profile())
