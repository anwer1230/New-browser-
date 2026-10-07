#!/bin/bash
set -e

# تحديث وتثبيت
sudo apt update && sudo apt install -y wireguard qrencode curl iptables

# تفعيل إعادة التوجيه
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# مفاتيح الخادم
umask 077
wg genkey | tee /tmp/server_priv | wg pubkey > /tmp/server_pub
wg genkey | tee /tmp/client_priv | wg pubkey > /tmp/client_pub

SERVER_PRIV=$(cat /tmp/server_priv)
SERVER_PUB=$(cat /tmp/server_pub)
CLIENT_PRIV=$(cat /tmp/client_priv)
CLIENT_PUB=$(cat /tmp/client_pub)
SERVER_IP=$(curl -s ifconfig.me)
IFACE=$(ip route | grep default | awk '{print $5}' | head -1)

echo "🌐 IP الخادم: $SERVER_IP (واجهة: $IFACE)"

# إعداد الخادم
sudo tee /etc/wireguard/wg0.conf > /dev/null <<EOF
[Interface]
Address = 10.66.66.1/24
ListenPort = 51820
PrivateKey = $SERVER_PRIV
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -o $IFACE -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -o $IFACE -j MASQUERADE

[Peer]
PublicKey = $CLIENT_PUB
AllowedIPs = 10.66.66.2/32
EOF

# إعداد العميل (للجوال)
cat > ~/client.conf <<EOF
[Interface]
PrivateKey = $CLIENT_PRIV
Address = 10.66.66.2/24
DNS = 1.1.1.1, 1.0.0.1

[Peer]
PublicKey = $SERVER_PUB
Endpoint = $SERVER_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
EOF

# فتح المنفذ في جدار النظام
sudo iptables -I INPUT -p udp --dport 51820 -j ACCEPT

# تشغيل
sudo systemctl enable wg-quick@wg0
sudo systemctl start wg-quick@wg0

# عرض QR Code للجوال
echo ""
echo "╔══════════════════════════════════════╗"
echo "║  📱 امسح هذا الكود بتطبيق WireGuard ║"
echo "╚══════════════════════════════════════╝"
qrencode -t ansiutf8 < ~/client.conf

echo ""
echo "أو انسخ الملف: ~/client.conf"
rm /tmp/server_* /tmp/client_*
