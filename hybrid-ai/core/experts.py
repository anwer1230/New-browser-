"""الخبراء المتخصصون الخمسة"""
from concurrent.futures import ThreadPoolExecutor
from loguru import logger
from core.ollama_client import chat, embed
from core.rag import search_documents
from config.settings import (
    MODEL_TEXT, MODEL_TEXT_FALLBACK, MODEL_CODE,
    MODEL_LOGIC, MODEL_SYNTHESIS, MAX_EXPERTS_PARALLEL
)


def expert_text(task: str) -> str:
    """خبير النصوص والتحليل"""
    try:
        return chat(
            model=MODEL_TEXT,
            prompt=task,
            system="أنت خبير في النصوص والتحليل. أجب بالعربية بوضوح ودقة.",
            temperature=0.7,
        )
    except Exception:
        # Fallback للنموذج الأصغر
        return chat(
            model=MODEL_TEXT_FALLBACK,
            prompt=task,
            temperature=0.7,
        )


def expert_code(task: str) -> str:
    """خبير البرمجة"""
    return chat(
        model=MODEL_CODE,
        prompt=task,
        system="أنت خبير برمجة. اكتب كودًا نظيفًا مع شرح موجز.",
        temperature=0.3,
    )


def expert_rag(task: str) -> str:
    """خبير البحث في المستندات"""
    docs = search_documents(task, limit=5)
    if not docs:
        return "لم أجد معلومات ذات صلة في مستنداتك."

    context = "\n\n---\n\n".join(
        f"[مصدر: {d['source']}]\n{d['text']}" for d in docs
    )

    prompt = f"""بناءً على المستندات التالية، أجب على السؤال بدقة.

المستندات:
{context}

السؤال: {task}

أجب بالعربية مع الإشارة للمصادر عند الحاجة."""

    return chat(
        model=MODEL_TEXT_FALLBACK,
        prompt=prompt,
        temperature=0.3,
    )


def expert_logic(task: str) -> str:
    """خبير المنطق والرياضيات"""
    return chat(
        model=MODEL_LOGIC,
        prompt=task,
        system="أنت خبير منطق ورياضيات. حلل خطوة بخطوة.",
        temperature=0.2,
    )


def expert_audio(task: str) -> str:
    """خبير الصوت (placeholder)"""
    return "⚠️ خبير الصوت غير مفعّل حاليًا."


EXPERT_REGISTRY = {
    "TEXT": expert_text,
    "CODE": expert_code,
    "RAG": expert_rag,
    "LOGIC": expert_logic,
    "AUDIO": expert_audio,
}


def run_experts_parallel(plan: dict) -> dict:
    """تشغيل الخبراء بالتوازي"""
    experts = plan["experts"][:MAX_EXPERTS_PARALLEL]
    tasks = plan["tasks"]
    results = {}

    with ThreadPoolExecutor(max_workers=MAX_EXPERTS_PARALLEL) as executor:
        futures = {}
        for expert in experts:
            fn = EXPERT_REGISTRY.get(expert)
            if not fn:
                continue
            task = tasks.get(expert, plan.get("original_query", ""))
            futures[executor.submit(fn, task)] = expert

        for future in futures:
            expert = futures[future]
            try:
                results[expert] = future.result(timeout=180)
                logger.info(f"✅ {expert} أنجز المهمة")
            except Exception as e:
                logger.error(f"❌ {expert} فشل: {e}")
                results[expert] = f"[فشل: {e}]"

    return results
