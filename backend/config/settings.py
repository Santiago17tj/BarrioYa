"""
BarrioYa — Configuración Centralizada
Carga variables de entorno y expone constantes globales.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# ── Cargar .env desde la raíz del backend ──
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_env_path)


# ═══════════════════════════════════════════
# Server
# ═══════════════════════════════════════════
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "8000"))
DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"


# ═══════════════════════════════════════════
# CORS — Orígenes permitidos
# ═══════════════════════════════════════════
# Lista explícita de orígenes (NO usar "*" con allow_credentials=True; los
# navegadores bloquean esa combinación según la spec CORS).
# En .env se puede sobreescribir con CORS_ORIGINS=https://barrioya.vercel.app,https://...
_default_origins = (
    "http://localhost:3000,"
    "http://localhost:5500,"
    "http://localhost:8000,"
    "http://127.0.0.1:3000,"
    "http://127.0.0.1:5500,"
    "http://127.0.0.1:8000,"
    "https://barrioya.vercel.app"
)
CORS_ORIGINS: list[str] = [
    o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()
]

# ═══════════════════════════════════════════
# WhatsApp App Secret (para validar firma X-Hub-Signature-256)
# ═══════════════════════════════════════════
WHATSAPP_APP_SECRET: str = os.getenv("WHATSAPP_APP_SECRET", "")


# ═══════════════════════════════════════════
# WhatsApp Cloud API
# ═══════════════════════════════════════════
WHATSAPP_VERIFY_TOKEN: str = os.getenv("WHATSAPP_VERIFY_TOKEN", "barrioya_verify_2026")
WHATSAPP_API_TOKEN: str = os.getenv("WHATSAPP_API_TOKEN", "")


# ═══════════════════════════════════════════
# Supabase
# ═══════════════════════════════════════════
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")


# ═══════════════════════════════════════════
# App Metadata
# ═══════════════════════════════════════════
APP_TITLE: str = "BarrioYa API"
APP_DESCRIPTION: str = (
    "API REST para la superapp hiperlocal BarrioYa. "
    "Gestiona catálogos multi-servicio, pedidos y la integración "
    "omnicanal con WhatsApp Cloud API."
)
APP_VERSION: str = "0.1.0"
