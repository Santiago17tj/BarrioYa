"""
═══════════════════════════════════════════════════════════
  BarrioYa — API REST Principal
  Superapp Hiperlocal — Backend FastAPI
═══════════════════════════════════════════════════════════

Punto de entrada del servidor.

Cómo ejecutar en local:
  1. cd backend
  2. pip install -r requirements.txt
  3. python main.py

El servidor arrancará en http://localhost:8000
Documentación Swagger UI: http://localhost:8000/docs
Documentación ReDoc:      http://localhost:8000/redoc
"""

import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config.settings import (
    APP_TITLE,
    APP_DESCRIPTION,
    APP_VERSION,
    CORS_ORIGINS,
    HOST,
    PORT,
    DEBUG,
)
from routes.catalogo import router as catalogo_router
from routes.pedidos import router as pedidos_router
from routes.whatsapp import router as whatsapp_router

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("barrioya")


# ═══════════════════════════════════════════
#  App FastAPI
# ═══════════════════════════════════════════
app = FastAPI(
    title=APP_TITLE,
    description=APP_DESCRIPTION,
    version=APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ═══════════════════════════════════════════
#  CORS Middleware
# ═══════════════════════════════════════════
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════
#  Registrar Routers
# ═══════════════════════════════════════════
app.include_router(catalogo_router)
app.include_router(pedidos_router)
app.include_router(whatsapp_router)


# ═══════════════════════════════════════════
#  Health Check
# ═══════════════════════════════════════════
@app.get(
    "/",
    tags=["Health"],
    summary="Health check del servidor",
)
async def health_check():
    """Endpoint raíz para verificar que el servidor está activo."""
    return {
        "status": "🟢 online",
        "app": APP_TITLE,
        "version": APP_VERSION,
        "docs": "/docs",
        "endpoints": {
            "catalogo": "GET  /api/catalogo",
            "pedidos": "POST /api/pedidos",
            "pedidos_list": "GET  /api/pedidos",
            "whatsapp_verify": "GET  /api/webhook/whatsapp",
            "whatsapp_receive": "POST /api/webhook/whatsapp",
        },
    }


# ═══════════════════════════════════════════
#  Arranque del servidor
# ═══════════════════════════════════════════
if __name__ == "__main__":
    logger.info("🚀 Arrancando BarrioYa API en http://%s:%d", HOST, PORT)
    logger.info("📚 Swagger UI disponible en http://localhost:%d/docs", PORT)
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=DEBUG,
        log_level="info",
    )
