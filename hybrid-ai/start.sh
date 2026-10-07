#!/bin/bash
set -e

echo "╔══════════════════════════════════════════╗"
echo "║   🧠 Hybrid AI System - Starting...      ║"
echo "╚══════════════════════════════════════════╝"

# ═══ 1. تحضير مجلدات Redis ═══
mkdir -p /data/redis
chown -R redis:redis /data/redis 2>/dev/null || true

# ═══ 2. تحميل النماذج إن لم تكن موجودة ═══
MODELS_TO_LOAD=(
    "qwen2.5:7b"
    "deepseek-coder-v2:6.7b"
    "bge-m3"
    "llama3.2:3b"
)

echo "🔍 فحص النماذج المحمّلة..."

# ابدأ Ollama مؤقتًا للتحميل
ollama serve &
OLLAMA_PID=$!
sleep 5

for model in "${MODELS_TO_LOAD[@]}"; do
    if ollama list 2>/dev/null | grep -q "${model%%:*}"; then
        echo "✅ موجود: $model"
    else
        echo "⬇️  تحميل: $model"
        ollama pull "$model" || echo "⚠️  فشل تحميل $model"
    fi
done

# أوقف Ollama المؤقت (سيعيد supervisord تشغيله)
kill $OLLAMA_PID 2>/dev/null || true
sleep 2

# ═══ 3. تحضير قاعدة بيانات RAG ═══
echo "🗄️  تحضير Qdrant..."
mkdir -p /qdrant/storage

# ═══ 4. إعلام المستخدم ═══
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ النظام جاهز                          ║"
echo "╠══════════════════════════════════════════╣"
echo "║   🌐 Open WebUI:  http://localhost:8080  ║"
echo "║   🔌 API:         http://localhost:8000  ║"
echo "║   📊 Qdrant:      http://localhost:6333  ║"
echo "║   🤖 Ollama:      http://localhost:11434 ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ═══ 5. شغّل supervisor ═══
exec "$@"
