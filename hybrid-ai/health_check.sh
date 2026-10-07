#!/bin/bash
echo "═══ حالة النظام ═══"
echo "🟢 Ollama: $(curl -s http://localhost:11434/api/tags | jq '.models | length') نماذج"
echo "🟢 Qdrant: $(curl -s http://localhost:6333/collections | jq '.result.collections | length') collections"
echo "🟢 Redis: $(docker exec redis redis-cli PING)"
echo "🟢 API: $(curl -s http://localhost:8000/health | jq -c .)"
echo "💾 RAM: $(free -h | awk '/^Mem:/{print $3"/"$2}')"
echo "💿 Disk: $(df -h / | awk 'NR==2{print $3"/"$2}')"
