"""
BarrioYa — Test de Endpoints
Verifica que todos los endpoints respondan correctamente.
"""

import urllib.request
import json
import sys

# Force UTF-8 output on Windows
sys.stdout.reconfigure(encoding='utf-8')

BASE = "http://localhost:8000"

def test(method, url, body=None):
    """Simple HTTP test helper."""
    full_url = BASE + url
    print(f"\n{'='*60}")
    print(f"  {method} {url}")
    print(f"{'='*60}")

    try:
        if body:
            data = json.dumps(body).encode('utf-8')
            req = urllib.request.Request(full_url, data=data, method=method)
            req.add_header('Content-Type', 'application/json')
        else:
            req = urllib.request.Request(full_url, method=method)

        with urllib.request.urlopen(req) as resp:
            status = resp.status
            result = json.loads(resp.read().decode('utf-8'))
            print(f"  Status: {status}")
            print(f"  Response: {json.dumps(result, indent=2, ensure_ascii=False)[:500]}")
            return True, status
    except urllib.error.HTTPError as e:
        print(f"  HTTP Error: {e.code}")
        print(f"  Detail: {e.read().decode('utf-8')[:300]}")
        return False, e.code
    except Exception as e:
        print(f"  ERROR: {e}")
        return False, 0


# ═══════════════════════════════════════════
#  1. Health Check
# ═══════════════════════════════════════════
ok, code = test("GET", "/")
assert ok and code == 200, "Health check failed!"
print("  >>> PASS")


# ═══════════════════════════════════════════
#  2. Catalogo completo
# ═══════════════════════════════════════════
ok, code = test("GET", "/api/catalogo")
assert ok and code == 200, "Catalogo failed!"
print("  >>> PASS")


# ═══════════════════════════════════════════
#  3. Catalogo filtrado por categoria
# ═══════════════════════════════════════════
ok, code = test("GET", "/api/catalogo?categoria=mascotas")
assert ok and code == 200, "Catalogo filtrado failed!"
print("  >>> PASS")


# ═══════════════════════════════════════════
#  4. Crear pedido valido
# ═══════════════════════════════════════════
order_payload = {
    "order_id": "BY-12345678",
    "business": "Panadería Don José",
    "items": [
        {
            "name": "Pan de bono",
            "emoji": "🧀",
            "type": "product",
            "quantity": 3,
            "unit_price": 1000,
            "total": 3000
        },
        {
            "name": "Empanada de carne",
            "emoji": "🥟",
            "type": "product",
            "quantity": 2,
            "unit_price": 2000,
            "total": 4000
        }
    ],
    "subtotal": 7000,
    "delivery_fee": 2500,
    "total": 9500,
    "created_at": "2026-05-06T08:30:00.000Z"
}

ok, code = test("POST", "/api/pedidos", order_payload)
assert ok and code == 200, "Pedido failed!"
print("  >>> PASS")


# ═══════════════════════════════════════════
#  5. Listar pedidos (admin/debug)
# ═══════════════════════════════════════════
ok, code = test("GET", "/api/pedidos")
assert ok and code == 200, "Listar pedidos failed!"
print("  >>> PASS")


# ═══════════════════════════════════════════
#  6. WhatsApp webhook verification
# ═══════════════════════════════════════════
ok, code = test(
    "GET",
    "/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=barrioya_verify_2026&hub.challenge=test_challenge_123"
)
assert ok and code == 200, "WhatsApp verify failed!"
print("  >>> PASS")


# ═══════════════════════════════════════════
#  7. WhatsApp webhook - token invalido (debe fallar con 403)
# ═══════════════════════════════════════════
ok, code = test(
    "GET",
    "/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=test"
)
assert not ok and code == 403, "WhatsApp should reject bad token!"
print("  >>> PASS (correctly rejected)")


# ═══════════════════════════════════════════
#  8. WhatsApp webhook POST (simulated message)
# ═══════════════════════════════════════════
wa_payload = {
    "object": "whatsapp_business_account",
    "entry": [{
        "changes": [{
            "value": {
                "messages": [{
                    "from": "573001234567",
                    "type": "text",
                    "text": {"body": "Hola, quiero pedir un pan de bono"},
                    "id": "wamid.test123",
                    "timestamp": "1714000000"
                }],
                "contacts": [{
                    "profile": {"name": "Juan Pérez"}
                }]
            }
        }]
    }]
}

ok, code = test("POST", "/api/webhook/whatsapp", wa_payload)
assert ok and code == 200, "WhatsApp POST failed!"
print("  >>> PASS")


# ═══════════════════════════════════════════
#  9. Actualizar estado de pedido (PATCH)
# ═══════════════════════════════════════════
update_payload = {"status": "preparando"}
ok, code = test("PATCH", "/api/pedidos/BY-12345678", update_payload)
assert ok and code == 200, "Update status failed!"
print("  >>> PASS")


# ═══════════════════════════════════════════
print(f"\n{'='*60}")
print("  ALL 9 TESTS PASSED!")
print(f"{'='*60}\n")
