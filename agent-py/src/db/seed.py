"""Seed MongoDB with sample users, orders, and knowledge documents.

Run after db/indexes.py:

    uv run -m db.seed
"""

import asyncio
import logging
from datetime import datetime, timezone

from dotenv import load_dotenv

from db.client import aclose, get_db
from tools.embeddings import embed_texts

load_dotenv(".env.local")

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


async def seed_data() -> None:
    db = await get_db()

    for name in ["users", "orders", "knowledge", "memories", "sessions"]:
        await db[name].delete_many({})
    logger.info("Cleared existing data from all collections")

    users = [
        {
            "user_id": "user_1",
            "name": "Jordan",
            "email": "jordan@example.com",
            "preferences": {"language": "en", "timezone": "America/New_York"},
            "created_at": _now(),
        },
        {
            "user_id": "user_2",
            "name": "Casey",
            "email": "casey@example.com",
            "preferences": {"language": "en", "timezone": "Europe/London"},
            "created_at": _now(),
        },
    ]
    await db.users.insert_many(users)
    logger.info("Inserted %d users", len(users))

    orders = [
        {
            "user_id": "user_1",
            "order_id": "order_1001",
            "items": ["Widget A", "Widget B"],
            "total": 49.99,
            "status": "delivered",
            "created_at": _now(),
        },
        {
            "user_id": "user_1",
            "order_id": "order_1002",
            "items": ["Gadget X"],
            "total": 29.99,
            "status": "pending",
            "created_at": _now(),
        },
    ]
    await db.orders.insert_many(orders)
    logger.info("Inserted %d orders", len(orders))

    knowledge_inputs = [
        {
            "title": "Handling interruptions",
            "content": (
                "Voice agents detect speech during a reply and pause playback. "
                "Use disallow_interruptions inside function tools that mutate state."
            ),
            "category": "voice-agents",
        },
        {
            "title": "Session telemetry and metrics",
            "content": (
                "Use session.usage to collect per-model usage metrics. "
                "Export from on_session_end alongside the session report."
            ),
            "category": "deployment",
        },
        {
            "title": "Choosing an STT provider",
            "content": (
                "LiveKit Inference supports Deepgram Nova-3, AssemblyAI, and "
                "others. Prefer models with built-in endpointing for realtime."
            ),
            "category": "models",
        },
        {
            "title": "Voice agent RAG pattern",
            "content": (
                "Run vector search inside on_user_turn_completed and inject "
                "results into the chat context before the LLM replies."
            ),
            "category": "patterns",
        },
        {
            "title": "Agentic memory pattern",
            "content": (
                "Expose remember, recall, forget, and search_memory as tools "
                "so the LLM decides what persists across sessions."
            ),
            "category": "patterns",
        },
    ]

    embeddings = await embed_texts(
        [doc["content"] for doc in knowledge_inputs], input_type="document"
    )
    knowledge_docs = [
        {**doc, "embedding": emb, "created_at": _now()}
        for doc, emb in zip(knowledge_inputs, embeddings)
    ]
    await db.knowledge.insert_many(knowledge_docs)
    logger.info("Inserted %d knowledge documents with embeddings", len(knowledge_docs))

    await aclose()
    logger.info("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed_data())
