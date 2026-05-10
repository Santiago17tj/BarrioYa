"""
BarrioYa — Generador de logo via Gemini Nano Banana (one-time script).
Crea un logo geométrico (casa/red barrio) + wordmark en /app/assets/.

Uso:
    python /app/scripts/generate_logo.py
"""

import asyncio
import base64
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / "backend" / ".env")

from emergentintegrations.llm.chat import LlmChat, UserMessage  # noqa: E402


LOGO_PROMPTS = {
    "logo-square": (
        "Modern minimalist logo icon ONLY (no text). A geometric stylized house with a green leaf "
        "or a hexagonal neighborhood network mark. Bold flat design with thick rounded strokes. "
        "Primary color: vibrant green #00C853. Secondary accent: amber/sun #FFB400 as a small dot "
        "or highlight. Pure WHITE solid background (do not use transparent). Centered, generous padding, "
        "logo occupies ~60% of canvas. Format: square 1024x1024, sharp vectors, ready for app icon use. "
        "NO text, NO letters, just the icon mark. Latin warmth + premium fintech polish. "
        "Inspiration: Rappi, Cornershop, but with neighborhood soul. Flat 2D, no 3D, no shadows."
    ),
    "logo-horizontal": (
        "Modern logo for 'BarrioYa' — a hyperlocal Colombian neighborhood superapp. "
        "Horizontal layout: on the LEFT a geometric icon (stylized house with green leaf, or hexagonal "
        "neighborhood network mark). On the RIGHT the wordmark 'BarrioYa' in bold modern sans-serif "
        "(Geist/Outfit style), kerned tightly, letter B and Y capitalized. Color palette: vibrant green "
        "#00C853 for icon, dark charcoal #0F0F11 for wordmark. Small amber #FFB400 accent dot on the "
        "'i' or after 'Ya' for energy. Pure WHITE background. Format: 1024x512 horizontal. Flat 2D, "
        "no shadows, no 3D. Bucaramanga/Colombia neighborhood warmth + premium fintech polish."
    ),
}


async def generate(prompt_key: str, prompt: str):
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("❌ EMERGENT_LLM_KEY no configurado en /app/backend/.env")
        sys.exit(1)

    chat = LlmChat(
        api_key=api_key,
        session_id=f"barrioya-logo-{prompt_key}",
        system_message="You are a world-class brand designer.",
    )
    chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    print(f"🎨 Generando {prompt_key}…")
    msg = UserMessage(text=prompt)
    text, images = await chat.send_message_multimodal_response(msg)

    if not images:
        print(f"  ⚠️  No se generaron imágenes para {prompt_key}. Respuesta: {text[:200]}")
        return

    out_dir = ROOT / "assets"
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / f"{prompt_key}.png"

    image_bytes = base64.b64decode(images[0]["data"])
    with open(out_path, "wb") as f:
        f.write(image_bytes)
    print(f"  ✅ Guardado en {out_path} ({len(image_bytes)/1024:.1f} KB)")


async def main():
    for key, prompt in LOGO_PROMPTS.items():
        await generate(key, prompt)


if __name__ == "__main__":
    asyncio.run(main())
