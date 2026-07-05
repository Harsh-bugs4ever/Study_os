import asyncio
import os
import sys
from app.config import settings
from app.cognee.client import init_client, get_client

async def main():
    await init_client()
    cognee = get_client()
    print("Testing cognee.add()...")
    try:
        await cognee.add("Hello this is a test text.", dataset_name="test_dataset_123")
        print("Success!")
    except Exception as e:
        print("Error in add():", repr(e))

if __name__ == "__main__":
    asyncio.run(main())
