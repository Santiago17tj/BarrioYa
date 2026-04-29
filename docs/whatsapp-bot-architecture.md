# BarrioYa — Arquitectura del Bot de WhatsApp

## Visión General

Bot conversacional que permite a los usuarios hacer pedidos en lenguaje natural a través de WhatsApp,
usando la WhatsApp Cloud API de Meta y un LLM para procesamiento de lenguaje natural.

## Diagrama de Arquitectura

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│   Usuario    │────▶│  WhatsApp Cloud  │────▶│   Webhook    │
│  WhatsApp    │◀────│   API (Meta)     │◀────│   Backend    │
└──────────────┘     └──────────────────┘     └──────┬───────┘
                                                     │
                                              ┌──────┴───────┐
                                              │              │
                                        ┌─────▼─────┐ ┌─────▼─────┐
                                        │   LLM     │ │  Base de  │
                                        │  (NLP)    │ │   Datos   │
                                        └───────────┘ └───────────┘
```

## Flujo del Bot

1. **Recepción**: El usuario envía mensaje → Meta lo reenvía al Webhook
2. **Procesamiento NLP**: El LLM extrae intención, entidades (productos, cantidades, dirección)
3. **Lógica de negocio**: Se consulta la BD para disponibilidad, precios, negocios cercanos
4. **Respuesta**: Se construye el mensaje y se envía de vuelta vía WhatsApp Cloud API
5. **Tracking**: Al confirmar, se genera enlace de seguimiento

## Configuración WhatsApp Cloud API

### Requisitos
- Cuenta de Meta Business verificada
- Número de teléfono dedicado
- App registrada en Meta Developers
- Webhook HTTPS con certificado SSL válido

### Endpoints principales
```
POST https://graph.facebook.com/v18.0/{phone_number_id}/messages
GET  https://graph.facebook.com/v18.0/{phone_number_id}
```

### Verificación del Webhook
```python
# Flask example
@app.route('/webhook', methods=['GET'])
def verify_webhook():
    mode = request.args.get('hub.mode')
    token = request.args.get('hub.verify_token')
    challenge = request.args.get('hub.challenge')

    if mode == 'subscribe' and token == VERIFY_TOKEN:
        return challenge, 200
    return 'Forbidden', 403
```

### Recepción de mensajes
```python
@app.route('/webhook', methods=['POST'])
def receive_message():
    data = request.json
    entry = data['entry'][0]
    changes = entry['changes'][0]
    value = changes['value']

    if 'messages' in value:
        message = value['messages'][0]
        phone = message['from']
        text = message['text']['body']

        # Procesar con LLM
        response = process_with_llm(phone, text)

        # Enviar respuesta
        send_whatsapp_message(phone, response)

    return 'OK', 200
```

### Envío de mensajes
```python
import requests

def send_whatsapp_message(to, text):
    url = f'https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages'
    headers = {
        'Authorization': f'Bearer {ACCESS_TOKEN}',
        'Content-Type': 'application/json'
    }
    payload = {
        'messaging_product': 'whatsapp',
        'to': to,
        'type': 'text',
        'text': { 'body': text }
    }
    requests.post(url, json=payload, headers=headers)
```

## Integración con LLM

### Prompt Engineering
```python
SYSTEM_PROMPT = """
Eres el bot de BarrioYa, una superapp de barrio en Bucaramanga, Colombia.
Tu rol es ayudar a los usuarios a hacer pedidos de domicilios.

Reglas:
1. Siempre responde en español colombiano casual y amigable
2. Extrae: intención, productos, cantidades, dirección
3. Si falta información, pregunta de forma natural
4. Confirma siempre antes de enviar el pedido
5. Responde en formato JSON cuando se solicite

Negocios disponibles:
- Panadería Don José: empanadas ($2000), pan de bono ($1000), buñuelo ($1500), jugo de lulo ($2500)
- Restaurante La Sazón: bandeja paisa ($15000), arroz con pollo ($12000), sancocho ($10000)
- Tienda Doña Carmen: leche ($4500), pan tajado ($6000), huevos ($8000)

Envío: $2500 COP
Zona de cobertura: Comunas 5, 14, 15 de Bucaramanga
"""
```

### Extracción de entidades
```python
def process_with_llm(phone, user_message):
    # Obtener contexto de conversación del usuario
    context = get_conversation_context(phone)

    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            *context,
            {"role": "user", "content": user_message}
        ],
        functions=[{
            "name": "create_order",
            "parameters": {
                "type": "object",
                "properties": {
                    "business": {"type": "string"},
                    "items": {"type": "array", "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "quantity": {"type": "integer"},
                            "price": {"type": "number"}
                        }
                    }},
                    "address": {"type": "string"},
                    "total": {"type": "number"}
                }
            }
        }]
    )

    return response.choices[0].message.content
```

## Esquema JSON del Pedido

```json
{
  "order_id": "BY-2026-0429",
  "phone": "573046279171",
  "business": {
    "name": "Panadería Don José",
    "id": "panaderia-don-jose"
  },
  "items": [
    { "name": "Empanada de carne", "quantity": 3, "unit_price": 2000, "total": 6000 },
    { "name": "Jugo de lulo", "quantity": 2, "unit_price": 2500, "total": 5000 }
  ],
  "subtotal": 11000,
  "delivery_fee": 2500,
  "total": 13500,
  "delivery_address": "Calle 45 #28-30, Cabecera, Bucaramanga",
  "payment_method": "contra_entrega",
  "status": "confirmed",
  "tracking_url": "https://barrioya.com/tracking.html?order=BY-2026-0429",
  "created_at": "2026-04-29T11:30:00-05:00"
}
```

## Stack Tecnológico Recomendado

| Componente | Tecnología | Justificación |
|------------|------------|---------------|
| Backend | Python (FastAPI) o Node.js (Express) | Ecosistema rico en libs de NLP y APIs |
| WebSocket | Socket.io o FastAPI WebSockets | Tracking en tiempo real |
| Base de datos | PostgreSQL + Redis | Persistencia + caché de sesiones |
| LLM | OpenAI GPT-4 / Claude | Mejor comprensión de español |
| Hosting | Railway / Render / AWS Lambda | Deploy rápido y económico |
| Webhook | HTTPS con Nginx + Certbot | Requerido por Meta |

## Próximos pasos

1. Crear cuenta en Meta Business y registrar app
2. Configurar número de WhatsApp Business
3. Implementar webhook backend (FastAPI recomendado)
4. Integrar LLM para procesamiento de lenguaje natural
5. Conectar con base de datos de negocios y menús
6. Implementar WebSocket para tracking en tiempo real
7. Testing con números de prueba de Meta
