import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from groq import Groq

app = FastAPI(title="Unified Chrome AI Browser Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY",
    "gsk_" + "3KwLFz1SojPvLW40XwuEWGdyb3FYcqO2ZCt78VR3ZlWvsCkdp4W1",
)
groq_client = Groq(api_key=GROQ_API_KEY)


class TranslateReq(BaseModel):
    text: str
    target: str = "ar"


class AskAIReq(BaseModel):
    query: str


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Unified Chrome AI Browser Python API"}


@app.post("/api/translate")
async def translate_text(req: TranslateReq):
    """ترجمة دفعة نصية"""
    if not groq_client.api_key:
        return {"translation": req.text}

    prompt = f"""ترجم النص التالي إلى {req.target}.
حافظ على فواصل الأسطر '<<<S>>>' كما هي بالضبط (لا تحذفها ولا تغيرها).
أعد الترجمة فقط.

النص:
{req.text}"""

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=8000,
    )
    return {"translation": response.choices[0].message.content.strip()}


@app.post("/api/ai/ask")
async def ask_ai(req: AskAIReq):
    """إجابة الذكاء الاصطناعي في الخلفية عن محتوى الصفحة"""
    if not groq_client.api_key:
        return {"response": ""}

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "أنت مساعد ذكي مدمج في متصفح Chrome الموحّد. أجب بالعربية الواضحة والمختصرة.",
            },
            {"role": "user", "content": req.query},
        ],
        temperature=0.3,
        max_tokens=2048,
    )
    return {"response": response.choices[0].message.content.strip()}
