"""
基于 rengong 项目的 Python AI 服务
整合 CloudBase AI HTTP API，替代本地 Ollama 和 Neo4j
"""

import os
import json
import logging
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai_server")

# ── 环境配置 ──────────────────────────────────────────────
ENV_ID = os.getenv("CLOUDBASE_ENV_ID", "")
TOKEN = os.getenv("CLOUDBASE_TOKEN", "")
AI_BASE_URL = f"https://{ENV_ID}.api.tcloudbasegateway.com" if ENV_ID else ""
AI_PROVIDER = os.getenv("AI_PROVIDER", "deepseek")
AI_MODEL = os.getenv("AI_MODEL", "deepseek-v3.2")
PORT = int(os.getenv("PORT", "8080"))

# 如果 TOKEN 带 Bearer 前缀，去掉
if TOKEN.startswith("Bearer "):
    TOKEN = TOKEN[7:]

# ── FastAPI 应用 ──────────────────────────────────────────
app = FastAPI(title="AI 对话与翻译服务", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── 请求/响应模型 ────────────────────────────────────────
class ChatRequest(BaseModel):
    messages: list[dict]
    stream: bool = False


class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "auto"
    target_lang: str = "zh"


class ExplainRequest(BaseModel):
    text: str
    translation: str
    source_lang: str = ""
    target_lang: str = ""


class RelatedRequest(BaseModel):
    phrase: str
    language: str = "zh"
    max_results: int = 5


# ── 工具函数 ──────────────────────────────────────────────
async def call_ai(
    messages: list[dict],
    model: str = AI_MODEL,
    provider: str = AI_PROVIDER,
    stream: bool = False,
) -> dict:
    """调用 CloudBase AI HTTP API"""
    if not ENV_ID or not TOKEN:
        raise HTTPException(
            status_code=500,
            detail="CLOUDBASE_ENV_ID 和 CLOUDBASE_TOKEN 未配置，请先设置环境变量",
        )

    url = f"{AI_BASE_URL}/v1/ai/{provider}/chat/completions"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": messages,
        "stream": stream,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        if stream:
            # 流式模式：收集所有数据块
            content = ""
            async with client.stream("POST", url, json=payload, headers=headers) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if line.startswith("data: ") and line != "data: [DONE]":
                        try:
                            data = json.loads(line[6:])
                            delta = data.get("choices", [{}])[0].get("delta", {})
                            content += delta.get("content", "")
                        except json.JSONDecodeError:
                            continue
            return {"choices": [{"message": {"role": "assistant", "content": content}}]}
        else:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            return resp.json()


async def ai_chat(messages: list[dict]) -> str:
    """AI 对话，返回文本"""
    result = await call_ai(messages, stream=False)
    return result["choices"][0]["message"]["content"]


async def ai_translate(text: str, source: str, target: str) -> str:
    """用 AI 翻译文本"""
    lang_hint = f"从{source} " if source != "auto" else ""
    prompt = f"请{lang_hint}翻译成{target}。只返回翻译结果，不要解释：\n{text}"
    return await ai_chat([{"role": "user", "content": prompt}])


# ── API 端点 ──────────────────────────────────────────────
@app.get("/api/health")
async def health():
    """健康检查"""
    return {
        "status": "ok",
        "env_id": ENV_ID[:8] + "..." if ENV_ID else "未配置",
        "model": AI_MODEL,
    }


@app.post("/api/chat")
async def chat(req: ChatRequest):
    """AI 对话"""
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages 不能为空")

    content = await ai_chat(req.messages)
    return {"choices": [{"message": {"role": "assistant", "content": content}}]}


@app.post("/api/translate")
async def translate(req: TranslateRequest):
    """AI 翻译"""
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text 不能为空")

    result = await ai_translate(req.text, req.source_lang, req.target_lang)
    return {"result": result}


@app.post("/api/explain")
async def explain(req: ExplainRequest):
    """解释翻译结果"""
    prompt = (
        f"请解释为什么将「{req.text}」翻译成「{req.translation}」。\n"
        "从语法结构、词汇选择、文化背景等方面简要说明。"
    )
    explanation = await ai_chat([{"role": "user", "content": prompt}])
    return {"translation": req.translation, "explanation": explanation}


@app.post("/api/related")
async def related(req: RelatedRequest):
    """获取相关短语"""
    prompt = (
        f"请列出与「{req.phrase}」({req.language})相关的{req.max_results}个"
        "短语或表达，编号列出，每行一个，不要其他内容。"
    )
    result = await ai_chat([{"role": "user", "content": prompt}])

    lines = [line.strip() for line in result.split("\n") if line.strip()]
    phrases = []
    for line in lines:
        cleaned = line.lstrip("0123456789.）-)]- ")
        if cleaned and cleaned != line.strip():
            phrases.append(cleaned)
        elif line and not line.startswith("#"):
            phrases.append(line)

    return {"phrases": phrases[: req.max_results]}


# ── 启动 ──────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    if not ENV_ID or not TOKEN:
        logger.warning("=" * 60)
        logger.warning("⚠ CLOUDBASE_ENV_ID 和 CLOUDBASE_TOKEN 未配置！")
        logger.warning("AI 功能将无法使用，请设置环境变量后再启动。")
        logger.warning("=" * 60)

    uvicorn.run(app, host="0.0.0.0", port=PORT)
