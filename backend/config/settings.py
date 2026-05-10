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
# Incluye Live Server (VS Code), file://, y localhost variantes
CORS_ORIGINS: list[str] = ["*"]


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
