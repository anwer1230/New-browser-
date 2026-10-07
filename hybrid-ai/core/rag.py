"""نظام RAG — البحث في المستندات"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from loguru import logger
from core.ollama_client import embed
from config.settings import (
    QDRANT_HOST, QDRANT_PORT, QDRANT_COLLECTION, EMBED_DIM
)

client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)


def ensure_collection():
    """إنشاء collection إذا لم توجد"""
    collections = [c.name for c in client.get_collections().collections]
    if QDRANT_COLLECTION not in collections:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
        )
        logger.info(f"✅ أُنشئت collection: {QDRANT_COLLECTION}")


def chunk_text(text: str, size: int = 800, overlap: int = 100) -> list[str]:
    """تقسيم النص إلى chunks متداخلة"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start = end - overlap
    return [c.strip() for c in chunks if c.strip()]


def add_document(text: str, source: str = "manual") -> int:
    """إضافة مستند إلى Qdrant"""
    ensure_collection()
    chunks = chunk_text(text)

    points = []
    for i, chunk in enumerate(chunks):
        vector = embed(chunk)
        point_id = abs(hash(f"{source}:{i}:{chunk[:50]}")) % (2**63)
        points.append(PointStruct(
            id=point_id,
            vector=vector,
            payload={"text": chunk, "source": source, "chunk_index": i},
        ))

    client.upsert(collection_name=QDRANT_COLLECTION, points=points)
    logger.info(f"✅ أُضيف {len(points)} chunk من {source}")
    return len(points)


def search_documents(query: str, limit: int = 5) -> list[dict]:
    """البحث في المستندات"""
    try:
        ensure_collection()
        query_vec = embed(query)
        results = client.search(
            collection_name=QDRANT_COLLECTION,
            query_vector=query_vec,
            limit=limit,
            score_threshold=0.4,
        )
        return [
            {"text": r.payload["text"], "source": r.payload["source"],
             "score": r.score}
            for r in results
        ]
    except Exception as e:
        logger.error(f"❌ فشل البحث: {e}")
        return []


def get_stats() -> dict:
    """إحصاءات قاعدة البيانات"""
    try:
        info = client.get_collection(QDRANT_COLLECTION)
        return {"points": info.points_count, "status": "ok"}
    except Exception as e:
        return {"points": 0, "status": str(e)}
