"""الموجّه الرئيسي — بديل Gemini"""
import json
from loguru import logger
from core.ollama_client import chat
from config.settings import MODEL_ORCHESTRATOR

ORCHESTRATOR_PROMPT = """أنت عقل نظام ذكاء اصطناعي هجين. مهمتك تحليل طلب المستخدم وتوزيعه على الخبراء المناسبين.

الخبراء المتاحون:
- TEXT: للأسئلة العامة، الشرح، التلخيص، الكتابة الإبداعية، التحليل النصي.
- CODE: لأي شيء يتعلق بالبرمجة، الأكواد، debugging، شرح تقني.
- RAG: للأسئلة عن ملفات المستخدم ومستنداته وبياناته الخاصة.
- LOGIC: للحسابات الرياضية، المنطق، الاستنتاج، حل الألغاز.
- AUDIO: لتحليل الصوتيات أو النصوص الصوتية.

القواعد:
1. اختر 1-3 خبراء فقط (لا تفرط).
2. إذا كان السؤال عامًا وبسيطًا، اختر TEXT فقط.
3. إذا احتاج السؤال بحثًا في ملفات + شرحًا، اختر RAG و TEXT.
4. لكل خبير، اكتب مهمة محددة وواضحة.

أرجع JSON فقط بهذا الشكل:
{
  "reasoning": "سبب اختيارك للخبراء",
  "experts": ["TEXT", "CODE"],
  "tasks": {
    "TEXT": "المهمة المحددة لهذا الخبير",
    "CODE": "المهمة المحددة لهذا الخبير"
  }
}"""

VALID_EXPERTS = {"TEXT", "CODE", "RAG", "LOGIC", "AUDIO"}


def create_plan(query: str) -> dict:
    """تحليل الطلب وإنشاء خطة"""
    raw = chat(
        model=MODEL_ORCHESTRATOR,
        prompt=f"طلب المستخدم: {query}",
        system=ORCHESTRATOR_PROMPT,
        json_mode=True,
        temperature=0.1,
    )

    try:
        plan = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("⚠️ فشل JSON parsing، استخدام TEXT كافتراضي")
        return {
            "reasoning": "fallback",
            "experts": ["TEXT"],
            "tasks": {"TEXT": query},
        }

    # تنظيف الخطة
    plan["experts"] = [e for e in plan.get("experts", []) if e in VALID_EXPERTS]
    if not plan["experts"]:
        plan["experts"] = ["TEXT"]
        plan["tasks"] = {"TEXT": query}

    logger.info(f"📋 الخطة: {plan['experts']} — {plan.get('reasoning', '')}")
    return plan
