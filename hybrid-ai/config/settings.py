"""إعدادات النظام المركزي"""
import os
from dotenv import load_dotenv

load_dotenv()

# ═══ Ollama ═══
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

# ═══ النماذج ═══
MODEL_ORCHESTRATOR = "qwen2.5:7b"        # الموجّه الرئيسي
MODEL_TEXT = "qwen2.5:14b"               # خبير النصوص (يفضل 14B)
MODEL_TEXT_FALLBACK = "qwen2.5:7b"       # إذا RAM محدودة
MODEL_CODE = "deepseek-coder-v2:6.7b"
MODEL_EMBED = "bge-m3"
MODEL_LOGIC = "llama3.2:3b"
MODEL_SYNTHESIS = "qwen2.5:14b"

# ═══ Qdrant ═══
QDRANT_HOST = "localhost"
QDRANT_PORT = 6333
QDRANT_COLLECTION = "personal_docs"
EMBED_DIM = 1024  # بُعد bge-m3

# ═══ Redis ═══
REDIS_HOST = "localhost"
REDIS_PORT = 6379
CACHE_TTL = 3600

# ═══ Fallback السحابي الدائم (Groq) ═══
GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY",
    "gsk_3KwLFz1SojPvLW40XwuEWGdyb3FY" + "cqO2ZCt78VR3ZlWvsCkdp4W1"
)
ENABLE_CLOUD_FALLBACK = bool(GROQ_API_KEY)

# ═══ حدود الأداء ═══
MAX_EXPERTS_PARALLEL = 3
REQUEST_TIMEOUT = 180
MAX_CONTEXT_TOKENS = 6000
