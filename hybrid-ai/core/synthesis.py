"""تجميع مخرجات الخبراء في إجابة نهائية"""
from core.ollama_client import chat
from config.settings import MODEL_SYNTHESIS
from loguru import logger

SYNTHESIS_PROMPT = """أنت المنسّق النهائي لنظام ذكاء اصطناعي هجين.
ستستلم سؤال المستخدم الأصلي ومخرجات عدة خبراء متخصصين.

مهمتك:
1. دمج المخرجات في إجابة واحدة متكاملة.
2. حل أي تعارض: الأولوية لـ RAG (مصادر موثقة) ثم LOGIC ثم TEXT.
3. حذف التكرار والحشو.
4. الحفاظ على كل المعلومات الجوهرية.
5. الكتابة بالعربية الفصحى الواضحة.

أعد فقط الإجابة النهائية، دون ذكر الخبراء أو العملية."""


def synthesize(query: str, results: dict) -> str:
    """توليد الإجابة النهائية"""
    if not results:
        return "عذرًا، لم يتمكن النظام من معالجة طلبك."

    if len(results) == 1:
        # خبير واحد → أعد إجابته مباشرة (توفير موارد)
        return list(results.values())[0]

    context = "\n\n".join(
        f"=== مخرجات خبير {name} ===\n{output}"
        for name, output in results.items()
    )

    prompt = f"""السؤال الأصلي: {query}

{context}

اكتب الإجابة النهائية الآن:"""

    logger.info("🔗 تجميع الإجابات")
    return chat(
        model=MODEL_SYNTHESIS,
        prompt=prompt,
        system=SYNTHESIS_PROMPT,
        temperature=0.5,
    )
