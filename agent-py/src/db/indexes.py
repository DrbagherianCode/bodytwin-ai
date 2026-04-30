"""Create MongoDB Atlas collections, indexes, and search indexes.

Run once after configuring MONGODB_URI:

    uv run -m db.indexes

Search indexes take ~1-2 minutes to become queryable on Atlas after creation.

Requires MongoDB 8.0 or later because `search_memory` uses the `$rankFusion`
aggregation stage for hybrid vector + text retrieval. Atlas M10+ dedicated
clusters run 8.0 by default; verify shared-tier clusters (M0/M2/M5) before
running this script.
"""

import asyncio
import logging

from dotenv import load_dotenv
from pymongo.errors import OperationFailure
from pymongo.operations import SearchIndexModel

from db.client import aclose, get_db
from tools.embeddings import EMBEDDING_DIMENSIONS

load_dotenv(".env.local")

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def _vector_index(name: str) -> SearchIndexModel:
    return SearchIndexModel(
        definition={
            "fields": [
                {
                    "type": "vector",
                    "path": "embedding",
                    "numDimensions": EMBEDDING_DIMENSIONS,
                    "similarity": "cosine",
                },
                {"type": "filter", "path": "user_id"},
                {"type": "filter", "path": "tenant_id"},
            ]
        },
        name=name,
        type="vectorSearch",
    )


def _memories_text_index() -> SearchIndexModel:
    """Full-text search index on `memory_type` + `content`.

    Paired with `memories_embedding_index` inside the `$rankFusion` pipeline
    in `tools/memory.search_memory`. The token fields on `user_id` and
    `tenant_id` let the text branch of the pipeline `$match` per-user scope
    cheaply.
    """
    return SearchIndexModel(
        definition={
            "mappings": {
                "dynamic": False,
                "fields": {
                    "memory_type": {"type": "string", "analyzer": "lucene.standard"},
                    "content": {"type": "string", "analyzer": "lucene.standard"},
                    "user_id": {"type": "token"},
                    "tenant_id": {"type": "token"},
                },
            }
        },
        name="memories_text_index",
        type="search",
    )


async def create_indexes() -> None:
    db = await get_db()

    existing = set(await db.list_collection_names())
    for name in ["users", "orders", "sessions", "knowledge", "memories"]:
        if name not in existing:
            await db.create_collection(name)
            logger.info("%s: collection created", name)

    await db.users.create_index("user_id", unique=True)
    logger.info("users: user_id unique index ready")

    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("user_id")
    logger.info("orders: order_id unique + user_id indexes ready")

    await db.sessions.create_index("session_id", unique=True)
    await db.sessions.create_index("user_id")
    logger.info("sessions: session_id unique + user_id indexes ready")

    await db.memories.create_index(
        [("user_id", 1), ("tenant_id", 1), ("memory_type", 1)],
        unique=True,
        name="memories_slot_unique",
    )
    logger.info("memories: (user_id, tenant_id, memory_type) unique index ready")

    search_indexes: list[tuple[str, SearchIndexModel]] = [
        ("knowledge", _vector_index("knowledge_embedding_index")),
        ("memories", _vector_index("memories_embedding_index")),
        ("memories", _memories_text_index()),
    ]
    for collection_name, model in search_indexes:
        collection = db[collection_name]
        try:
            await collection.create_search_indexes([model])
            logger.info("%s: %s search index created", collection_name, model.document["name"])
        except OperationFailure as exc:
            if "already exists" in str(exc).lower() or "duplicate" in str(exc).lower():
                logger.info(
                    "%s: %s already exists",
                    collection_name,
                    model.document["name"],
                )
            else:
                raise

    await aclose()
    logger.info("Done. Search indexes need ~1-2 minutes to sync on Atlas.")


if __name__ == "__main__":
    asyncio.run(create_indexes())
