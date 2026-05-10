"""
BarrioYa — Ruta: Webhook de WhatsApp (Omnicanalidad)
GET  /api/webhook/whatsapp — Verificación del token de Meta
POST /api/webhook/whatsapp — Recepción de mensajes entrantes
"""

import logging
from fastapi import APIRouter, Query, Request, HTTPException
from config.settings import WHATSAPP_VERIFY_TOKEN
from services.whatsapp import extract_message_data, process_incoming_message

logger = logging.getLogger("barrioya.webhook")

router = APIRouter(prefix="/api/webhook", tags=["WhatsApp Webhook"])


@router.get(
    "/whatsapp",
    summary="Verificación del webhook (Meta)",
    description=(
        "Endpoint de verificación requerido por la WhatsApp Cloud API de Meta. "
        "Al configurar el webhook en el panel de Meta Developers, este endpoint "
        "responde al challenge para confirmar la propiedad del servidor."
    ),
)
async def verify_webhook(
    hub_mode: str = Query(alias="hub.mode", default=""),
    hub_verify_token: str = Query(alias="hub.verify_token", default=""),
    hub_challenge: str = Query(alias="hub.challenge", default=""),
):
    """
    Meta envía una solicitud GET con tres parámetros:
    - `hub.mode`: debe ser "subscribe"
    - `hub.verify_token`: debe coincidir con nuestro token secreto
    - `hub.challenge`: el valor que debemos devolver para confirmar

    Si la verificación es exitosa, respondemos con el challenge.
    Si falla, respondemos 403.
    """
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        logger.info("✅ Webhook de WhatsApp verificado exitosamente")
        # Meta espera recibir el challenge como texto plano
        return int(hub_challenge) if hub_challenge.isdigit() else hub_challenge

    logger.warning(
        "❌ Verificación de webhook fallida | mode=%s | token_match=%s",
        hub_mode,
        hub_verify_token == WHATSAPP_VERIFY_TOKEN,
    )
    raise HTTPException(
        status_code=403,
        detail="Verificación fallida. Token inválido.",
    )


@router.post(
    "/whatsapp",
    summary="Recibir mensajes entrantes de WhatsApp",
    description=(
        "Puerta de entrada para todos los mensajes entrantes de la "
        "WhatsApp Cloud API. Extrae el contenido del mensaje, lo procesa "
        "y siempre responde 200 OK (requisito de Meta)."
    ),
)
async def receive_message(request: Request):
    """
    Meta envía un POST con el payload del mensaje.
    SIEMPRE debemos responder 200, incluso si hay un error interno.
    De lo contrario, Meta reintentará la entrega y eventualmente
    desactivará el webhook.
    """
    try:
        payload = await request.json()
    except Exception:
        logger.error("❌ Payload inválido recibido en webhook de WhatsApp")
        return {"status": "ok"}

    # Verificar que es un evento de WhatsApp Business
    if payload.get("object") != "whatsapp_business_account":
        logger.debug("Evento ignorado (no es whatsapp_business_account)")
        return {"status": "ok"}

    # Extraer datos del mensaje
    message_data = extract_message_data(payload)

    if message_data:
        # Procesar el mensaje (por ahora solo logging)
        await process_incoming_message(message_data)
    else:
        # Podría ser una notificación de estado (entregado, leído, etc.)
        logger.debug("Evento de WhatsApp sin mensaje procesable (posible status update)")

    # SIEMPRE responder 200 OK
    return {"status": "ok"}
