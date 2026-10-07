"""خط الأنابيب الرئيسي — يربط كل شيء"""
import time
import uuid
from loguru import logger
from core.orchestrator import create_plan
from core.experts import run_experts_parallel
from core.synthesis import synthesize
from core.memory import get_recent_context, save_turn, search_memory


def process_query(query: str, session_id: str = None, verbose: bool = False) -> dict:
    """معالجة طلب المستخدم من البداية للنهاية"""
    session_id = session_id or str(uuid.uuid4())
    start = time.time()

    # استرجع السياق
    recent = get_recent_context(session_id, n=3)
    if recent:
        query_enriched = f"السياق السابق:\n{recent}\n\nالسؤال الجديد: {query}"
    else:
        query_enriched = query

    # 1. التخطيط
    plan = create_plan(query_enriched)
    plan["original_query"] = query_enriched

    # 2. تشغيل الخبراء
    results = run_experts_parallel(plan)

    # 3. التجميع
    final = synthesize(query, results)

    # احفظ في الذاكرة
    save_turn(session_id, query, final)

    elapsed = round(time.time() - start, 2)
    logger.success(f"✅ اكتمل في {elapsed}s")

    response = {
        "query": query,
        "response": final,
        "session_id": session_id,
        "experts_used": list(results.keys()),
        "elapsed_seconds": elapsed,
    }

    if verbose:
        response["plan"] = plan
        response["expert_outputs"] = results

    return response
