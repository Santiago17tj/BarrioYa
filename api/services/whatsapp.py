"""
BarrioYa — Servicio: WhatsApp Cloud API
Lógica de procesamiento de mensajes entrantes de WhatsApp.
En una fase futura, aquí se integrará el LLM para entender
pedidos en lenguaje natural.
"""

import logging

logger = logging.getLogger("barrioya.whatsapp")


def extract_message_data(payload: dict) -> dict | None:
    """
    Extrae los datos relevantes del webhook de WhatsApp Cloud API.

    Estructura esperada del payload de Meta:
    {
      "object": "whatsapp_business_account",
      "entry": [{
        "changes": [{
          "value": {
            "messages": [{
              "from": "573001234567",
              "type": "text",
              "text": { "body": "Hola, quiero un pan de bono" }
            }],
            "contacts": [{
              "profile": { "name": "Juan Pérez" }
            }]
          }
        }]
      }]
    }

    Returns:
        dict con sender, message_text, message_type, sender_name
        None si el payload no contiene un mensaje válido
    """
    try:
        entry = payload.get("entry", [])
        if not entry:
            return None

        changes = entry[0].get("changes", [])
        if not changes:
            return None

        value = changes[0].get("value", {})
        messages = value.get("messages", [])
        if not messages:
            return None

        message = messages[0]
        contacts = value.get("contacts", [])
        sender_name = "Desconocido"
        if contacts:
            sender_name = contacts[0].get("profile", {}).get("name", "Desconocido")

        # Extraer texto del mensaje según su tipo
        message_type = message.get("type", "unknown")
        message_text = ""

        if message_type == "text":
            message_text = message.get("text", {}).get("body", "")
        elif message_type == "interactive":
            # Botones o listas interactivas
            interactive = message.get("interactive", {})
            if "button_reply" in interactive:
                message_text = interactive["button_reply"].get("title", "")
            elif "list_reply" in interactive:
                message_text = interactive["list_reply"].get("title", "")
        elif message_type == "image":
            message_text = "[Imagen recibida]"
        elif message_type == "audio":
            message_text = "[Audio recibido]"
        elif message_type == "location":
            message_text = "[Ubicación recibida]"

        return {
            "sender": message.get("from", ""),
            "sender_name": sender_name,
            "message_text": message_text,
            "message_type": message_type,
            "message_id": message.get("id", ""),
            "timestamp": message.get("timestamp", ""),
        }

    except (IndexError, KeyError, TypeError) as e:
        logger.error("Error extrayendo datos del webhook: %s", e)
        return None


async def process_incoming_message(message_data: dict) -> None:
    """
    Procesa un mensaje entrante de WhatsApp.

    Por ahora solo hace logging. En una fase futura:
    1. Analizará el mensaje con un LLM (GPT / Gemini / local)
    2. Determinará la intención (pedir, consultar catálogo, tracking)
    3. Generará una respuesta contextual
    4. Enviará la respuesta vía WhatsApp Cloud API

    Args:
        message_data: dict con sender, message_text, message_type, sender_name
    """
    logger.info(
        "💬 WhatsApp entrante | De: %s (%s) | Tipo: %s | Mensaje: '%s'",
        message_data["sender"],
        message_data["sender_name"],
        message_data["message_type"],
        message_data["message_text"][:100],  # Truncar para el log
    )

    # ═══════════════════════════════════════════
    # 🤖 FUTURO: Integración con LLM
    # ═══════════════════════════════════════════
    #
    # from services.llm import analyze_intent
    #
    # intent = await analyze_intent(message_data["message_text"])
    #
    # if intent.type == "order":
    #     # Crear pedido automáticamente
    #     order = await create_order_from_intent(intent)
    #     await send_whatsapp_message(
    #         to=message_data["sender"],
    #         text=f"✅ Pedido #{order.id} creado. Total: ${order.total:,}"
    #     )
    # elif intent.type == "catalog_query":
    #     # Buscar en el catálogo
    #     results = search_catalog(intent.query)
    #     await send_whatsapp_message(...)
    # elif intent.type == "tracking":
    #     # Consultar estado del pedido
    #     ...
    # ═══════════════════════════════════════════
