"""الذاكرة طويلة المدى باستخدام Redis + Qdrant"""
import json
import time
from typing import Optional
import redis
from loguru import logger
from core.ollama_client import embed
from core.rag import client as qdrant
from qdrant_client.models import Distance, VectorParams, PointStruct
from config.settings import (
    REDIS_HOST, REDIS_PORT, EMBED_DIM
)

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

MEMORY_COLLECTION = "conversation_memory"
SESSION_TTL = 86400  # 24 ساعة


def _ensure_memory_collection():
    collections = [c.name for c in qdrant.get_collections().collections]
    if MEMORY_COLLECTION not in collections:
        qdrant.create_collection(
            collection_name=MEMORY_COLLECTION,
            vectors_config=VectorParams(size=EMBED_DIM, distance=Distance.COSINE),
        )


def save_turn(session_id: str, user_msg: str, assistant_msg: str):
    """حفظ دور المحادثة"""
    # 1. Redis للسياق القصير
    key = f"session:{session_id}"
    turn = json.dumps({
        "user": user_msg,
        "assistant": assistant_msg,
        "ts": time.time(),
    }, ensure_ascii=False)

    r.lpush(key, turn)
    r.ltrim(key, 0, 19)  # آخر 20 رسالة
    r.expire(key, SESSION_TTL)

    # 2. Qdrant للذاكرة طويلة المدى
    _ensure_memory_collection()
    memory_text = f"س: {user_msg}\nج: {assistant_msg}"
    vector = embed(memory_text)
    point_id = abs(hash(f"{session_id}:{time.time()}")) % (2**63)

    qdrant.upsert(
        collection_name=MEMORY_COLLECTION,
        points=[PointStruct(
            id=point_id,
            vector=vector,
            payload={
                "text": memory_text,
                "session_id": session_id,
                "ts": time.time(),
            },
        )],
    )


def get_recent_context(session_id: str, n: int = 5) -> str:
    """آخر n رسائل من الجلسة"""
    key = f"session:{session_id}"
    turns = r.lrange(key, 0, n - 1)
    if not turns:
        return ""

    lines = []
    for t in reversed(turns):
        data = json.loads(t)
        lines.append(f"👤 {data['user']}")
        lines.append(f"🤖 {data['assistant']}")
    return "\n".join(lines)


def search_memory(query: str, session_id: Optional[str] = None, limit: int = 3) -> list[str]:
    """البحث في الذاكرة القديمة"""
    try:
        _ensure_memory_collection()
        vec = embed(query)
        filters = None
        if session_id:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            filters = Filter(must=[
                FieldCondition(key="session_id", match=MatchValue(value=session_id))
            ])

        results = qdrant.search(
            collection_name=MEMORY_COLLECTION,
            query_vector=vec,
            limit=limit,
            query_filter=filters,
            score_threshold=0.5,
        )
        return [r.payload["text"] for r in results]
    except Exception as e:
        logger.error(f"Memory search failed: {e}")
        return []


def clear_session(session_id: str):
    """مسح جلسة"""
    r.delete(f"session:{session_id}")
