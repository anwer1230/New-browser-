# ═══════════════════════════════════════════════════════════
# Stage 1: بناء Open WebUI
# ═══════════════════════════════════════════════════════════
FROM node:20-alpine AS webui-builder

RUN apk add --no-cache git python3 make g++

WORKDIR /webui
RUN git clone --depth 1 https://github.com/open-webui/open-webui.git .

WORKDIR /webui
RUN npm install --legacy-peer-deps
RUN npm run build

# ═══════════════════════════════════════════════════════════
# Stage 2: تحميل Qdrant binary
# ═══════════════════════════════════════════════════════════
FROM debian:bookworm-slim AS qdrant-fetcher

RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
    QDRANT_VERSION="v1.12.4" && \
    curl -L "https://github.com/qdrant/qdrant/releases/download/${QDRANT_VERSION}/qdrant-x86_64-unknown-linux-gnu.tar.gz" \
    -o /tmp/qdrant.tar.gz && \
    mkdir -p /qdrant && \
    tar -xzf /tmp/qdrant.tar.gz -C /qdrant && \
    chmod +x /qdrant/qdrant

# ═══════════════════════════════════════════════════════════
# Stage 3: الحاوية النهائية
# ═══════════════════════════════════════════════════════════
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# تثبيت الأدوات الأساسية
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    gnupg \
    python3.11 \
    python3.11-venv \
    python3-pip \
    redis-server \
    supervisor \
    nodejs \
    npm \
    git \
    jq \
    htop \
    nano \
    wget \
    && rm -rf /var/lib/apt/lists/*

# تثبيت Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# نسخ Qdrant
COPY --from=qdrant-fetcher /qdrant /qdrant

# نسخ Open WebUI المبنية
COPY --from=webui-builder /webui/build /app/webui/build
COPY --from=webui-builder /webui/package.json /app/webui/package.json
COPY --from=webui-builder /webui/node_modules /app/webui/node_modules

# إعداد مجلد التطبيق
WORKDIR /app

# نسخ الكود
COPY requirements.txt .
COPY config/ ./config/
COPY core/ ./core/
COPY server.py main.py ingest.py ./

# إنشاء بيئة Python وتثبيت المكتبات
RUN python3.11 -m venv /app/venv && \
    /app/venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/venv/bin/pip install --no-cache-dir -r requirements.txt

# إنشاء المجلدات اللازمة
RUN mkdir -p /app/logs /var/log/supervisor /qdrant/storage /data/redis /root/.ollama

# نسخ إعدادات supervisord
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# سكريبت البدء
COPY start.sh /start.sh
RUN chmod +x /start.sh

# المنافذ
# 11434 = Ollama
# 6333  = Qdrant HTTP
# 8000  = API
# 8080  = Open WebUI
# 6379  = Redis
EXPOSE 11434 6333 8000 8080 6379

# حجم دائم للنماذج والبيانات
VOLUME ["/root/.ollama", "/qdrant/storage", "/data/redis", "/app/logs"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

ENTRYPOINT ["/start.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
