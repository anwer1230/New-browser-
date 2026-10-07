"""Fallback سحابي مجاني عبر Groq"""
from loguru import logger
from config.settings import GROQ_API_KEY, ENABLE_CLOUD_FALLBACK

if ENABLE_CLOUD_FALLBACK:
    from groq import Groq
    _groq = Groq(api_key=GROQ_API_KEY)
else:
    _groq = None

# خرائط النماذج المحلية ← السحابية
MODEL_MAP = {
    "qwen2.5:7b": "llama-3.3-70b-versatile",
    "qwen2.5:14b": "llama-3.3-70b-versatile",
    "deepseek-coder-v2:6.7b": "llama-3.3-70b-versatile",
    "llama3.2:3b": "llama-3.1-8b-instant",
}


def cloud_chat(prompt: str, system: str = "", model_hint: str = "") -> str:
    """استدعاء Groq كـ Fallback"""
    if not _groq:
        raise RuntimeError("Cloud fallback not configured")

    cloud_model = MODEL_MAP.get(model_hint, "llama-3.3-70b-versatile")
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    logger.warning(f"☁️ استخدام Fallback السحابي: {cloud_model}")

    response = _groq.chat.completions.create(
        model=cloud_model,
        messages=messages,
        temperature=0.7,
        max_tokens=2048,
    )
    return response.choices[0].message.content
