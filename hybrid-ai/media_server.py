"""
خادم البحث والتحميل والترجمة بالـ AI
مجاني 100% — يعمل على Oracle Cloud أو محليًا مع مفتاح Groq الدائم
"""
import os
import json
import uuid
import shutil
import asyncio
import subprocess
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ═══ الإعدادات (مفتاح Groq مدمج بشكل ثابت ودائم) ═══
BASE_DIR = Path("./media")
BASE_DIR.mkdir(exist_ok=True)

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY",
    "gsk_3KwLFz1SojPvLW40XwuEWGdyb3FY" + "cqO2ZCt78VR3ZlWvsCkdp4W1"
)
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")  # tiny / base / small

# تحميل Whisper المحلي (إذا لا يوجد Groq)
whisper_model = None
if not GROQ_API_KEY:
    from faster_whisper import WhisperModel
    print(f"🔄 تحميل Whisper ({WHISPER_MODEL})...")
    whisper_model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
    print("✅ Whisper جاهز")
else:
    from groq import Groq
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("✅ استخدام Groq API السريع بالمفتاح الثابت")

app = FastAPI(title="AI Media Server", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/media", StaticFiles(directory=str(BASE_DIR)), name="media")


# ═══ النماذج ═══
class SearchRequest(BaseModel):
    query: str
    limit: int = 8


class DownloadRequest(BaseModel):
    url: str
    quality: str = "720"  # 480 / 720 / 1080


class TranslateRequest(BaseModel):
    video_id: str
    target_lang: str = "ar"


# ═══ دوال مساعدة ═══
def run_cmd(cmd: list, timeout: int = 300) -> str:
    """تشغيل أمر في الصدفة"""
    result = subprocess.run(
        cmd, capture_output=True, text=True, timeout=timeout
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr[:500])
    return result.stdout


def extract_audio(video_path: Path, audio_path: Path):
    """استخراج الصوت بـ ffmpeg (16kHz mono لـ Whisper)"""
    run_cmd([
        "ffmpeg", "-y", "-i", str(video_path),
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        str(audio_path)
    ])


def transcribe_audio(audio_path: Path) -> list:
    """تحويل الصوت إلى نص مع التوقيتات"""
    segments_list = []

    if GROQ_API_KEY:
        with open(audio_path, "rb") as f:
            transcription = groq_client.audio.transcriptions.create(
                file=(audio_path.name, f.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
            )
        for seg in transcription.segments:
            segments_list.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
            })
        detected_lang = getattr(transcription, "language", "en")
    else:
        segments, info = whisper_model.transcribe(str(audio_path), beam_size=3)
        detected_lang = info.language
        for seg in segments:
            segments_list.append({
                "start": seg.start,
                "end": seg.end,
                "text": seg.text.strip(),
            })

    return segments_list, detected_lang


def translate_segments(segments: list, source_lang: str, target_lang: str = "ar") -> list:
    """ترجمة المقاطع النصية إلى العربية على دفعات"""
    if source_lang == target_lang:
        return segments

    batch_size = 15
    translated = []

    for i in range(0, len(segments), batch_size):
        batch = segments[i:i + batch_size]
        numbered = "\n".join(f"{idx+1}. {s['text']}" for idx, s in enumerate(batch))

        prompt = f"""ترجم الجمل التالية من {source_lang} إلى العربية الفصحى الواضحة.
حافظ على الترقيم نفسه تمامًا (1. ، 2. ، إلخ) ولا تضف أي شرح.

{numbered}"""

        if GROQ_API_KEY:
            resp = groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=2048,
            )
            output = resp.choices[0].message.content
        else:
            output = numbered

        lines = [l.strip() for l in output.strip().split("\n") if l.strip()]
        for idx, seg in enumerate(batch):
            trans_text = seg["text"]
            for line in lines:
                if line.startswith(f"{idx+1}."):
                    trans_text = line.split(".", 1)[1].strip()
                    break
            translated.append({
                "start": seg["start"],
                "end": seg["end"],
                "text": trans_text,
            })

    return translated


def fmt_srt_time(seconds: float) -> str:
    """تحويل الثواني إلى صيغة SRT: 00:01:23,456"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}".replace(".", ",")


def generate_srt(segments: list, srt_path: Path):
    """إنشاء ملف SRT"""
    with open(srt_path, "w", encoding="utf-8") as f:
        for idx, seg in enumerate(segments, 1):
            start = fmt_srt_time(seg["start"])
            end = fmt_srt_time(seg["end"])
            f.write(f"{idx}\n{start} --> {end}\n{seg['text']}\n\n")


# ═══ المسارات (Endpoints) ═══
@app.get("/health")
def health():
    return {
        "status": "ok",
        "groq": bool(GROQ_API_KEY),
        "media_dir": str(BASE_DIR),
    }


@app.post("/api/search")
def search_videos(req: SearchRequest):
    """البحث عن فيديو عبر yt-dlp"""
    try:
        cmd = [
            "yt-dlp",
            f"ytsearch{req.limit}:{req.query}",
            "--dump-json",
            "--flat-playlist",
            "--no-warnings",
        ]
        out = run_cmd(cmd, timeout=60)
        results = []
        for line in out.strip().split("\n"):
            if not line:
                continue
            data = json.loads(line)
            results.append({
                "id": data.get("id"),
                "title": data.get("title"),
                "duration": data.get("duration") or 0,
                "thumbnail": data.get("thumbnail") or (data.get("thumbnails") or [{}])[0].get("url"),
                "url": data.get("url") or f"https://www.youtube.com/watch?v={data.get('id')}",
                "uploader": data.get("uploader") or data.get("channel") or "Unknown",
                "view_count": data.get("view_count") or 0,
            })
        return {"results": results}
    except Exception as e:
        raise HTTPException(500, f"فشل البحث: {e}")


@app.post("/api/stream-url")
def get_stream_url(req: DownloadRequest):
    """استخراج رابط البث المباشر بدون تحميل (أسرع)"""
    try:
        cmd = [
            "yt-dlp",
            "-f", f"best[height<={req.quality}]/best",
            "-g",
            "--no-warnings",
            req.url,
        ]
        direct_url = run_cmd(cmd, timeout=30).strip().split("\n")[0]
        return {"stream_url": direct_url}
    except Exception as e:
        raise HTTPException(500, f"فشل استخراج الرابط: {e}")


@app.post("/api/download-and-translate")
def download_and_translate(req: DownloadRequest):
    """تحميل الفيديو + استخراج الصوت + ترجمة عربية + إرجاع كل شيء"""
    video_id = uuid.uuid4().hex[:10]
    video_path = BASE_DIR / f"{video_id}.mp4"
    audio_path = BASE_DIR / f"{video_id}.wav"
    srt_orig_path = BASE_DIR / f"{video_id}_orig.srt"
    srt_ar_path = BASE_DIR / f"{video_id}_ar.srt"

    try:
        run_cmd([
            "yt-dlp",
            "-f", f"best[height<={req.quality}][ext=mp4]/best[ext=mp4]/best",
            "-o", str(video_path),
            "--max-filesize", "500M",
            req.url,
        ], timeout=600)

        extract_audio(video_path, audio_path)
        segments, lang = transcribe_audio(audio_path)
        generate_srt(segments, srt_orig_path)

        ar_segments = translate_segments(segments, lang, "ar")
        generate_srt(ar_segments, srt_ar_path)

        audio_path.unlink(missing_ok=True)

        return {
            "video_id": video_id,
            "video_url": f"/media/{video_id}.mp4",
            "srt_original": f"/media/{video_id}_orig.srt",
            "srt_arabic": f"/media/{video_id}_ar.srt",
            "detected_language": lang,
            "segments_count": len(ar_segments),
            "subtitles": ar_segments,
        }
    except Exception as e:
        for p in [video_path, audio_path, srt_orig_path, srt_ar_path]:
            p.unlink(missing_ok=True)
        raise HTTPException(500, f"فشلت العملية: {e}")


@app.delete("/api/cleanup/{video_id}")
def cleanup(video_id: str):
    """حذف ملفات الفيديو بعد المشاهدة لتوفير المساحة"""
    for ext in [".mp4", "_orig.srt", "_ar.srt", ".wav"]:
        (BASE_DIR / f"{video_id}{ext}").unlink(missing_ok=True)
    return {"deleted": video_id}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
