"""عميل Ollama موحد مع Retry و Cache و Cloud Fallback"""
import hashlib
import json
import redis
import ollama
from tenacity import retry, stop_after_attempt, wait_exponential
from loguru import logger
from config.settings import (
    REDIS_HOST, REDIS_PORT, CACHE_TTL, OLLAMA_HOST
)
from core.cloud_fallback import cloud_chat, ENABLE_CLOUD_FALLBACK

# إعداد Redis
r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

# إعداد Ollama client مخصص
_client = ollama.Client(host=OLLAMA_HOST)


def _make_key(model: str, prompt: str, system: str = "") -> str:
    h = hashlib.md5(f"{model}|{system}|{prompt}".encode()).hexdigest()
    return f"llm:{h}"


@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=8))
def chat(
    model: str,
    prompt: str,
    system: str = "",
    json_mode: bool = False,
    use_cache: bool = True,
    temperature: float = 0.7,
) -> str:
    """استدعاء موحد لـ Ollama مع Cache و Retry"""

    # 1. جرب Redis cache
    if use_cache and temperature <= 0.3:
        key = _make_key(model, prompt, system)
        if cached := r.get(key):
            logger.debug(f"✅ Cache hit: {model}")
            return cached

    # 2. بناء الرسائل
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    # 3. الاستدعاء
    logger.info(f"🤖 استدعاء {model} (json_mode={json_mode})")
    try:
        response = _client.chat(
            model=model,
            messages=messages,
            format="json" if json_mode else "",
            options={"temperature": temperature},
        )
        result = response["message"]["content"]
    except Exception as e:
        logger.error(f"❌ فشل {model}: {e}")
        if ENABLE_CLOUD_FALLBACK:
            return cloud_chat(prompt, system, model_hint=model)
        raise

    # 4. خزّن في Cache
    if use_cache and temperature <= 0.3:
        r.setex(_make_key(model, prompt, system), CACHE_TTL, result)

    return result


def embed(text: str) -> list[float]:
    """إنشاء embedding"""
    response = _client.embeddings(model="bge-m3", prompt=text)
    return response["embedding"]


def list_models() -> list[str]:
    """عرض النماذج المتاحة"""
    return [m["name"] for m in _client.list()["models"]]


def is_model_available(model: str) -> bool:
    """فحص إذا كان النموذج محمّلًا"""
    return any(model in m for m in list_models())
