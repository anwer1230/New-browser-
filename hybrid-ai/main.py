"""نقطة الدخول الرئيسية"""
from loguru import logger
from core.pipeline import process_query

logger.remove()
logger.add(
    lambda msg: print(msg, end=""),
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
    colorize=True,
)
logger.add("logs/hybrid_ai.log", rotation="10 MB", retention="7 days")

BANNER = """
╔══════════════════════════════════════════╗
║   🧠 Hybrid AI System — Local Edition    ║
║   Qwen + DeepSeek + RAG + Logic          ║
║   اكتب 'exit' للخروج، 'verbose' للتفصيل   ║
╚══════════════════════════════════════════╝
"""


def main():
    print(BANNER)
    verbose = False

    while True:
        try:
            query = input("\n👤 أنت: ").strip()
        except (EOFError, KeyboardInterrupt):
            break

        if not query:
            continue
        if query.lower() in ("exit", "quit", "خروج"):
            break
        if query.lower() in ("verbose", "تفصيل"):
            verbose = not verbose
            print(f"🔧 الوضع التفصيلي: {'مفعّل' if verbose else 'معطّل'}")
            continue

        try:
            result = process_query(query, verbose=verbose)
            print(f"\n🤖 النظام: {result['response']}")
            print(f"\n⏱️  {result['elapsed_seconds']}s | خبراء: {', '.join(result['experts_used'])}")
        except Exception as e:
            logger.exception(e)
            print(f"\n❌ خطأ: {e}")


if __name__ == "__main__":
    main()
