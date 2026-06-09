"""
vectorize_api.py — standalone vectorization + background removal microservice.

NEW FILE ONLY — do not modify any existing server files.

Steps to deploy on Hetzner (run once):
  pip install fastapi uvicorn "rembg[cpu]" aiohttp pillow
  nohup uvicorn vectorize_api:app --host 127.0.0.1 --port 8001 &

Also copy nginx-vectorize.conf → /etc/nginx/conf.d/vectorize.conf
then: sudo nginx -s reload && sudo ufw allow 8443/tcp
"""

import asyncio
import subprocess
import tempfile
from pathlib import Path

import aiohttp
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from rembg import remove as rembg_remove

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS", "GET"],
    allow_headers=["*"],
)


class VectorizeRequest(BaseModel):
    url: str


async def _fetch_image(url: str) -> bytes:
    async with aiohttp.ClientSession() as session:
        async with session.get(url, timeout=aiohttp.ClientTimeout(total=30)) as resp:
            if resp.status != 200:
                raise HTTPException(status_code=400, detail=f"Cannot fetch image: {resp.status}")
            return await resp.read()


def _remove_bg(data: bytes) -> bytes:
    return rembg_remove(data)


def _vtracer(data: bytes) -> str:
    with tempfile.TemporaryDirectory() as d:
        inp = Path(d) / "input.png"
        out = Path(d) / "output.svg"
        inp.write_bytes(data)
        subprocess.run(
            [
                "vtracer",
                "--input", str(inp),
                "--output", str(out),
                "--colormode", "color",
                "--hierarchical", "stacked",
                "--mode", "spline",
                "--filter_speckle", "4",
                "--color_precision", "6",
                "--layer_difference", "16",
                "--corner_threshold", "60",
                "--length_threshold", "4.0",
                "--max_iterations", "10",
                "--splice_threshold", "45",
                "--path_precision", "3",
            ],
            check=True,
            capture_output=True,
        )
        return out.read_text()


@app.get("/api/vectorize/health")
async def health():
    return {"status": "ok"}


@app.post("/api/vectorize", response_class=PlainTextResponse)
async def vectorize(req: VectorizeRequest):
    loop = asyncio.get_event_loop()
    image_bytes = await _fetch_image(req.url)
    clean_bytes = await loop.run_in_executor(None, _remove_bg, image_bytes)
    svg = await loop.run_in_executor(None, _vtracer, clean_bytes)
    return svg
