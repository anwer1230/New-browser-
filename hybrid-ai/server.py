"""FastAPI server — واجهة API للنظام"""
import json
import os
import shutil
import time
import uuid
from pathlib import Path
from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from loguru import logger
from core.pipeline import process_query
from core.rag import get_stats
from ingest import ingest_file

app = FastAPI(title="Hybrid AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

API_KEY = os.getenv("HYBRID_API_KEY", "")


async def verify_key(x_api_key: str = Header(None)):
    if API_KEY and API_KEY != "change-me" and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    verbose: bool = False


class ChatResponse(BaseModel):
    response: str
    session_id: str
    experts_used: list[str]
    elapsed_seconds: float


@app.get("/")
def root():
    return {"status": "ok", "service": "Hybrid AI"}


@app.get("/health")
def health():
    from core.ollama_client import list_models
    return {
        "models": list_models(),
        "rag": get_stats(),
    }


@app.post("/chat", response_model=ChatResponse, dependencies=[Depends(verify_key)])
def chat(req: ChatRequest):
    try:
        result = process_query(
            req.message,
            session_id=req.session_id,
            verbose=req.verbose,
        )
        return ChatResponse(**{k: result[k] for k in ChatResponse.model_fields})
    except Exception as e:
        logger.exception(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload", dependencies=[Depends(verify_key)])
async def upload(file: UploadFile = File(...)):
    tmp = Path(f"/tmp/{file.filename}")
    with tmp.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    n = ingest_file(str(tmp))
    tmp.unlink(missing_ok=True)

    return {"added_chunks": n, "file": file.filename}


@app.get("/rag/stats")
def rag_stats():
    return get_stats()


# ═══════════════════════════════════════════════════════════
# OpenAI-compatible endpoint (لـ Open WebUI)
# ═══════════════════════════════════════════════════════════
@app.get("/v1/models")
async def list_openai_models():
    """قائمة النماذج بصيغة OpenAI"""
    return {
        "object": "list",
        "data": [
            {"id": "hybrid-ai", "object": "model", "created": 0,
             "owned_by": "local"},
            {"id": "qwen2.5:7b", "object": "model", "created": 0,
             "owned_by": "ollama"},
        ],
    }


@app.post("/v1/chat/completions")
async def openai_chat_completions(request: Request):
    """نقطة نهاية متوافقة مع OpenAI"""
    body = await request.json()
    messages = body.get("messages", [])
    stream = body.get("stream", False)

    # استخرج آخر رسالة مستخدم
    user_msg = ""
    system_msg = ""
    for m in messages:
        if m["role"] == "user":
            user_msg = m["content"]
        elif m["role"] == "system":
            system_msg = m["content"]

    if system_msg:
        user_msg = f"{system_msg}\n\n{user_msg}"

    # نفّذ النظام الهجين
    result = process_query(user_msg)
    response_text = result["response"]

    completion_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"

    if stream:
        async def event_stream():
            words = response_text.split(" ")
            for i, word in enumerate(words):
                chunk = {
                    "id": completion_id,
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": body.get("model", "hybrid-ai"),
                    "choices": [{
                        "index": 0,
                        "delta": {"content": word + (" " if i < len(words) - 1 else "")},
                        "finish_reason": None,
                    }],
                }
                yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"

            end_chunk = {
                "id": completion_id,
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": body.get("model", "hybrid-ai"),
                "choices": [{
                    "index": 0,
                    "delta": {},
                    "finish_reason": "stop",
                }],
            }
            yield f"data: {json.dumps(end_chunk, ensure_ascii=False)}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    return {
        "id": completion_id,
        "object": "chat.completion",
        "created": int(time.time()),
        "model": body.get("model", "hybrid-ai"),
        "choices": [{
            "index": 0,
            "message": {"role": "assistant", "content": response_text},
            "finish_reason": "stop",
        }],
        "usage": {
            "prompt_tokens": len(user_msg.split()),
            "completion_tokens": len(response_text.split()),
            "total_tokens": len(user_msg.split()) + len(response_text.split()),
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=False)
