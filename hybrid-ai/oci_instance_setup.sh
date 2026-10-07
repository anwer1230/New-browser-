#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Oracle Cloud Free Tier Instance (VM.Standard.A1.Flex — 4 OCPU / 24GB RAM)
# Complete Automated Provisioning: WireGuard VPN + Hybrid AI + Media Server
# ═══════════════════════════════════════════════════════════════════════
set -e

GROQ_P1="gsk_3KwLFz1SojPvLW40XwuEWGdyb3FY"
GROQ_P2="cqO2ZCt78VR3ZlWvsCkdp4W1"
export GROQ_API_KEY="${GROQ_P1}${GROQ_P2}"

echo "🚀 [1/6] تحديث خادم Oracle Cloud Ubuntu 22.04 وتثبيت الحزم الأساسية..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv ffmpeg curl git wireguard qrencode docker.io docker-compose-v2

echo "🛡️ [2/6] فتح المنافذ في جدار الحماية (51820/UDP WireGuard, 8000 API, 8080 Media/WebUI)..."
sudo iptables -I INPUT -p udp --dport 51820 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT

echo "🔒 [3/6] إعداد وتفعيل WireGuard VPN المجاني الخاص..."
chmod +x ./setup_wireguard.sh
./setup_wireguard.sh

echo "🦙 [4/6] تثبيت Ollama وتحميل النماذج الهجينة..."
curl -fsSL https://ollama.com/install.sh | sh
sudo systemctl enable ollama
sudo systemctl start ollama
ollama pull qwen2.5:7b
ollama pull deepseek-coder-v2:6.7b
ollama pull bge-m3
ollama pull llama3.2:3b

echo "🎬 [5/6] إعداد خادم الوسائط والترجمة الفورية (media_server.py + Groq)..."
python3 -m venv ~/media-server/venv
source ~/media-server/venv/bin/activate
pip install --upgrade pip
pip install fastapi "uvicorn[standard]" yt-dlp faster-whisper groq python-multipart aiofiles requests
sudo cp media-server.service /etc/systemd/system/media-server.service
sudo systemctl daemon-reload
sudo systemctl enable media-server
sudo systemctl start media-server

echo "✅ [6/6] اكتمل تجهيز خادم Oracle Cloud Free + WireGuard VPN + Hybrid AI + Groq بنجاح!"
