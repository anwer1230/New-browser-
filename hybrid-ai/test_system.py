"""اختبار شامل للنظام"""
import requests
import time
from loguru import logger

API = "http://localhost:8000"

TESTS = [
    ("نص", "اشرح لي الفرق بين AI و ML في 3 أسطر"),
    ("كود", "اكتب دالة Python لقلب نص"),
    ("منطق", "لو 3 قطط تصطاد 3 فئران في 3 دقائق، كم قطة لـ 100 فأر في 100 دقيقة؟"),
    ("مختلط", "اكتب كود Python لحساب الأعداد الأولية واشرحه"),
]

def run_tests():
    for name, query in TESTS:
        print(f"\n{'='*60}")
        print(f"🧪 اختبار: {name}")
        print(f"❓ {query}")

        start = time.time()
        r = requests.post(f"{API}/chat", json={"message": query}, timeout=180)
        elapsed = time.time() - start

        if r.status_code == 200:
            data = r.json()
            print(f"✅ {data['elapsed_seconds']}s | خبراء: {data['experts_used']}")
            print(f"💬 {data['response'][:300]}...")
        else:
            print(f"❌ فشل: {r.status_code} — {r.text}")

if __name__ == "__main__":
    run_tests()
