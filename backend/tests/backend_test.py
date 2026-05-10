"""
BarrioYa — Backend Test Suite (pytest)
Test all REST endpoints against the public preview backend URL and the
local backend for tests that aren't reachable through the public ingress
(e.g., bare "/" health check is routed to frontend by k8s ingress).
"""
import os
import json
import pytest
import requests

PUBLIC_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://b2352844-8435-42ef-8479-0901a3243211.preview.emergentagent.com",
).rstrip("/")
LOCAL_URL = "http://localhost:8001"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ── Health ────────────────────────────────────────────────
class TestHealth:
    def test_health_check_local(self, api):
        """Bare '/' is served by frontend through public ingress; verify
        backend health directly on localhost."""
        r = api.get(f"{LOCAL_URL}/")
        assert r.status_code == 200
        data = r.json()
        assert "online" in data["status"]
        assert data["app"] == "BarrioYa API"
        assert "version" in data

    def test_public_root_serves_frontend(self, api):
        """Public root is the frontend HTML."""
        r = requests.get(f"{PUBLIC_URL}/", allow_redirects=True)
        assert r.status_code == 200

    def test_api_health_public(self, api):
        """NEW Phase 2: /api/health must be reachable through public ingress."""
        r = api.get(f"{PUBLIC_URL}/api/health")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("status") == "ok"
        assert data.get("app") == "BarrioYa API"
        assert "version" in data and isinstance(data["version"], str)

    def test_received_at_is_utc_timezone_aware(self, api):
        """Verify pedidos use datetime.now(timezone.utc)."""
        r = api.get(f"{PUBLIC_URL}/api/pedidos")
        assert r.status_code == 200
        data = r.json()
        if isinstance(data, list) and data:
            for o in data:
                ra = o.get("received_at") or o.get("fecha_creacion")
                if ra:
                    # ISO with timezone offset (Z, +00:00, etc.)
                    assert ("+" in ra) or ra.endswith("Z") or "T" in ra, f"received_at not ISO/UTC: {ra}"
                    break


# ── Catalogo ──────────────────────────────────────────────
class TestCatalogo:
    def test_catalogo_full(self, api):
        r = api.get(f"{PUBLIC_URL}/api/catalogo")
        assert r.status_code == 200
        data = r.json()
        assert "businesses" in data
        assert data.get("total_businesses") == 6
        assert data.get("total_items") == 35
        assert len(data["businesses"]) == 6
        all_items = [it for b in data["businesses"] for it in b.get("items", [])]
        assert len(all_items) == 35

    def test_catalogo_filter_mascotas(self, api):
        r = api.get(f"{PUBLIC_URL}/api/catalogo", params={"categoria": "mascotas"})
        assert r.status_code == 200
        data = r.json()
        biz = data.get("businesses", [])
        assert len(biz) >= 1
        for b in biz:
            assert b.get("category") == "mascotas", f"Unexpected category {b.get('category')}"


# ── Pedidos ───────────────────────────────────────────────
# order_id pattern: ^BY-\d{8}$  → exactly 8 digits
VALID_ORDER = {
    "order_id": "BY-10000001",
    "business": "Panadería Don José",
    "items": [
        {"name": "Pan de bono", "emoji": "🧀", "type": "product",
         "quantity": 3, "unit_price": 1000, "total": 3000},
        {"name": "Empanada", "emoji": "🥟", "type": "product",
         "quantity": 2, "unit_price": 2000, "total": 4000},
    ],
    "subtotal": 7000,
    "delivery_fee": 2500,
    "total": 9500,
    "created_at": "2026-01-06T08:30:00.000Z",
}


class TestPedidos:
    def test_create_pedido_valid(self, api):
        r = api.post(f"{PUBLIC_URL}/api/pedidos", json=VALID_ORDER)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["order_id"] == "BY-10000001"
        assert data["status"] == "received"
        assert data.get("estimated_time")

    def test_create_pedido_invalid_subtotal(self, api):
        bad = json.loads(json.dumps(VALID_ORDER))
        bad["order_id"] = "BY-10000002"
        bad["subtotal"] = 9999
        bad["total"] = 9999 + 2500
        r = api.post(f"{PUBLIC_URL}/api/pedidos", json=bad)
        assert r.status_code == 422, r.text

    def test_create_pedido_invalid_total(self, api):
        bad = json.loads(json.dumps(VALID_ORDER))
        bad["order_id"] = "BY-10000003"
        bad["total"] = 12345
        r = api.post(f"{PUBLIC_URL}/api/pedidos", json=bad)
        assert r.status_code == 422, r.text

    def test_create_pedido_bad_order_id_format(self, api):
        bad = json.loads(json.dumps(VALID_ORDER))
        bad["order_id"] = "BAD-FORMAT"
        r = api.post(f"{PUBLIC_URL}/api/pedidos", json=bad)
        assert r.status_code == 422, r.text

    def test_list_pedidos_contains_created(self, api):
        r = api.get(f"{PUBLIC_URL}/api/pedidos")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        ids = {o.get("order_id") or o.get("id") for o in data}
        assert "BY-10000001" in ids

    def test_patch_pedido_status(self, api):
        r = api.patch(
            f"{PUBLIC_URL}/api/pedidos/BY-10000001",
            json={"status": "preparando"},
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["new_status"] == "preparando"
        assert data["order_id"] == "BY-10000001"

    def test_patch_pedido_nonexistent_returns_404(self, api):
        """Phase 2 FIX: PATCH on a non-existent order_id must return 404
        (was 200 silently when Supabase returned empty)."""
        r = api.patch(
            f"{PUBLIC_URL}/api/pedidos/BY-99999999",
            json={"status": "preparando"},
        )
        assert r.status_code == 404, r.text

    def test_create_pedido_invalid_item_total(self, api):
        bad = json.loads(json.dumps(VALID_ORDER))
        bad["order_id"] = "BY-10000004"
        bad["items"][0]["total"] = 99999  # mismatch with unit_price * quantity
        bad["subtotal"] = bad["items"][0]["total"] + bad["items"][1]["total"]
        bad["total"] = bad["subtotal"] + bad["delivery_fee"]
        r = api.post(f"{PUBLIC_URL}/api/pedidos", json=bad)
        assert r.status_code == 422, r.text


# ── WhatsApp Webhook ──────────────────────────────────────
class TestWhatsAppWebhook:
    def test_verify_correct_token(self, api):
        r = api.get(
            f"{PUBLIC_URL}/api/webhook/whatsapp",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": "barrioya_verify_2026",
                "hub.challenge": "12345",
            },
        )
        assert r.status_code == 200
        assert r.text.strip().strip('"') == "12345"

    def test_verify_invalid_token(self, api):
        r = api.get(
            f"{PUBLIC_URL}/api/webhook/whatsapp",
            params={
                "hub.mode": "subscribe",
                "hub.verify_token": "wrong_token",
                "hub.challenge": "abc",
            },
        )
        assert r.status_code == 403

    def test_post_webhook_dev_no_signature(self, api):
        payload = {
            "object": "whatsapp_business_account",
            "entry": [{
                "changes": [{
                    "value": {
                        "messages": [{
                            "from": "573001234567",
                            "type": "text",
                            "text": {"body": "Hola"},
                            "id": "wamid.test_pytest",
                            "timestamp": "1714000000",
                        }],
                        "contacts": [{"profile": {"name": "Tester"}}]
                    }
                }]
            }],
        }
        r = api.post(f"{PUBLIC_URL}/api/webhook/whatsapp", json=payload)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ── CORS ──────────────────────────────────────────────────
class TestCORS:
    """CORS must be tested on the LOCAL backend because the public ingress
    (Cloudflare/k8s) overrides CORS headers with '*' regardless of backend
    config. The backend FastAPI app correctly echoes the requesting Origin."""

    def test_cors_allowed_origin_local(self):
        r = requests.options(
            f"{LOCAL_URL}/api/catalogo",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        assert r.status_code in (200, 204)
        allow_origin = r.headers.get("access-control-allow-origin", "")
        assert allow_origin == "http://localhost:3000"
        assert allow_origin != "*"

    def test_cors_no_wildcard_local(self):
        r = requests.get(
            f"{LOCAL_URL}/api/catalogo",
            headers={"Origin": "http://localhost:3000"},
        )
        assert r.status_code == 200
        allow_origin = r.headers.get("access-control-allow-origin", "")
        assert allow_origin == "http://localhost:3000"
        assert allow_origin != "*"



# ── Static Frontend Assets (Phase 2/3 cleanup) ────────────
class TestStaticAssets:
    """The static HTML site is served from the same preview URL on port 3000.
    Public ingress only sends /api/* to backend; everything else is frontend."""

    def test_pwa_icon_192(self):
        r = requests.get(f"{PUBLIC_URL}/assets/icon-192.png", timeout=15)
        assert r.status_code == 200
        size = int(r.headers.get("content-length", "0") or len(r.content))
        assert size < 300_000

    def test_pwa_icon_512(self):
        r = requests.get(f"{PUBLIC_URL}/assets/icon-512.png", timeout=15)
        assert r.status_code == 200
        size = int(r.headers.get("content-length", "0") or len(r.content))
        assert size < 300_000

    def test_apple_touch_icon(self):
        r = requests.get(f"{PUBLIC_URL}/assets/apple-touch-icon.png", timeout=15)
        assert r.status_code == 200
        size = int(r.headers.get("content-length", "0") or len(r.content))
        assert size < 300_000

    def test_barrioya_logo_optimized(self):
        r = requests.get(f"{PUBLIC_URL}/assets/BarrioYalogo.png", timeout=15)
        assert r.status_code == 200
        size = int(r.headers.get("content-length", "0") or len(r.content))
        assert size < 1_000_000, f"BarrioYalogo.png too large: {size} bytes"

    def test_manifest_points_to_optimized_icons(self):
        r = requests.get(f"{PUBLIC_URL}/manifest.json", timeout=15)
        assert r.status_code == 200
        data = r.json()
        srcs = [i["src"] for i in data.get("icons", [])]
        assert "/assets/icon-192.png" in srcs
        assert "/assets/icon-512.png" in srcs
        assert not any("BarrioYalogo.png" in s for s in srcs)

    def test_sw_cache_name_v2(self):
        r = requests.get(f"{PUBLIC_URL}/sw.js", timeout=15)
        assert r.status_code == 200
        assert "barrioYa-v2" in r.text
        assert "/css/cart.css" in r.text
        assert "/js/cart.js" in r.text
        assert "/js/checkout.js" in r.text
        assert "/js/router.js" in r.text
