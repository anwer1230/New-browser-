"""استيراد المستندات إلى RAG"""
import sys
from pathlib import Path
from loguru import logger
from pypdf import PdfReader
from docx import Document
from core.rag import add_document, get_stats


def read_pdf(path: str) -> str:
    reader = PdfReader(path)
    return "\n\n".join(p.extract_text() or "" for p in reader.pages)


def read_docx(path: str) -> str:
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs)


def read_txt(path: str) -> str:
    return Path(path).read_text(encoding="utf-8", errors="ignore")


READERS = {
    ".pdf": read_pdf,
    ".docx": read_docx,
    ".txt": read_txt,
    ".md": read_txt,
}


def ingest_file(path: str) -> int:
    p = Path(path)
    if not p.exists():
        logger.error(f"❌ الملف غير موجود: {path}")
        return 0

    ext = p.suffix.lower()
    if ext not in READERS:
        logger.warning(f"⚠️ صيغة غير مدعومة: {ext}")
        return 0

    logger.info(f"📖 قراءة {p.name}")
    text = READERS[ext](path)

    if len(text.strip()) < 50:
        logger.warning(f"⚠️ نص قصير جدًا: {p.name}")
        return 0

    return add_document(text, source=p.name)


def ingest_folder(folder: str):
    """استيراد كل الملفات في مجلد"""
    folder_path = Path(folder)
    total = 0
    for f in folder_path.rglob("*"):
        if f.suffix.lower() in READERS:
            total += ingest_file(str(f))
    logger.success(f"✅ أُضيف {total} chunk إجمالًا")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("الاستخدام:")
        print("  python ingest.py <ملف>       # ملف واحد")
        print("  python ingest.py <مجلد>       # مجلد كامل")
        print("  python ingest.py --stats      # إحصاءات")
        sys.exit(1)

    arg = sys.argv[1]
    if arg == "--stats":
        print(get_stats())
    elif Path(arg).is_dir():
        ingest_folder(arg)
    else:
        ingest_file(arg)
