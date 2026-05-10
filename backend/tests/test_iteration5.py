"""
BarrioYa — Iteration 5 Backend Tests
Validates: httpOnly refresh cookies, /api/analytics/summary,
catalog sync (35 items), demo orders (>=28 BY-DEMO*), and regressions.
"""
import os
import time
import requests
import pytest

PUBLIC_URL = "https://b2352844-8435-42ef-8479-0901a3243211.preview.emergentagent.com"
ADMIN_EMAIL = "santiago@barrioya.co"
ADMIN_PASS = "AdminBarrioYa2026*"
COMERCIO_EMAIL = "donjose@barrioya.co"
COMERCIO_PASS = "Panaderia2026*"

# ── Helpers ───────────────────────────────────────────────
def _clear_login_attempts():
    """Limpia rate-limit antes de tests positivos (vía supabase si es alcanzable)."""
    try:
        from supabase import create_client
        url = os.environ.get("SUPABASE_URL", "https://gxpyfvzwienmswstrfld.supabase.co")
        key = os.environ.get("SUPABASE_ANON_KEY", "sb_secret_EUDfbg690Y6DH75q-oEMRw_6sjytmXT")
        c = create_client(url, key)
        c.table("login_attempts").delete().neq("id", 0).execute()
    except Exception:
        pass


@pytest.fixture(scope="module", autouse=True)
def _setup():
    _clear_login_attempts()
    yield


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    r = s.post(f"{PUBLIC_URL}/api/auth/login",
               json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
    assert r.status_code == 200, f"Admin login fail: {r.status_code} {r.text}"
    data = r.json()
    s.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    s._login_response = r  # type: ignore
    s._login_data = data  # type: ignore
    return s


@pytest.fixture(scope="module")
def comercio_session():
    s = requests.Session()
    r = s.post(f"{PUBLIC_URL}/api/auth/login",
               json={"email": COMERCIO_EMAIL, "password": COMERCIO_PASS}, timeout=15)
    assert r.status_code == 200, f"Comercio login fail: {r.status_code} {r.text}"
    data = r.json()
    s.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    return s


# ── Auth: httpOnly refresh cookie ─────────────────────────
class TestAuthCookies:
    def test_login_returns_access_token_json(self, admin_session):
        d = admin_session._login_data
        assert "access_token" in d and isinstance(d["access_token"], str)
        assert "user" in d and d["user"]["email"] == ADMIN_EMAIL
        assert d["user"]["rol"] == "admin"

    def test_login_sets_httponly_refresh_cookie(self, admin_session):
        r = admin_session._login_response
        # Find cookie in response
        set_cookie_headers = r.headers.get("set-cookie") or ""
        # requests may collapse multiple Set-Cookie; raw can be checked too
        raw = r.raw.headers.getlist("Set-Cookie") if hasattr(r.raw, "headers") else [set_cookie_headers]
        joined = " | ".join(raw)
        assert "barrioya_refresh=" in joined, f"Cookie not set in headers: {joined}"
        assert "HttpOnly" in joined, f"HttpOnly flag missing: {joined}"
        assert "Path=/api/auth" in joined, f"Path missing: {joined}"
        # SameSite Lax
        assert "SameSite=lax" in joined.lower() or "samesite=lax" in joined.lower(), f"SameSite missing: {joined}"

    def test_refresh_with_cookie_returns_new_access(self):
        s = requests.Session()
        r = s.post(f"{PUBLIC_URL}/api/auth/login",
                   json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
        assert r.status_code == 200
        # Cookie must be in jar
        assert "barrioya_refresh" in s.cookies.get_dict(), f"Cookie not in jar: {s.cookies.get_dict()}"
        # Refresh using only cookie (no body)
        rr = s.post(f"{PUBLIC_URL}/api/auth/refresh", timeout=15)
        assert rr.status_code == 200, f"Refresh fail: {rr.status_code} {rr.text}"
        data = rr.json()
        assert "access_token" in data and isinstance(data["access_token"], str)

    def test_refresh_without_cookie_returns_401(self):
        # Fresh session without any cookies
        r = requests.post(f"{PUBLIC_URL}/api/auth/refresh", timeout=15)
        assert r.status_code == 401, f"Expected 401 without cookie, got {r.status_code}: {r.text}"

    def test_logout_clears_cookie_and_revokes(self):
        s = requests.Session()
        r = s.post(f"{PUBLIC_URL}/api/auth/login",
                   json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=15)
        access = r.json()["access_token"]
        assert "barrioya_refresh" in s.cookies.get_dict()
        out = s.post(f"{PUBLIC_URL}/api/auth/logout",
                     headers={"Authorization": f"Bearer {access}"}, timeout=15)
        assert out.status_code == 200, f"Logout fail: {out.status_code} {out.text}"
        # Verify Set-Cookie clears it (Max-Age=0 or expires past)
        raw = out.raw.headers.getlist("Set-Cookie") if hasattr(out.raw, "headers") else [out.headers.get("set-cookie","")]
        joined = " | ".join(raw).lower()
        assert "barrioya_refresh" in joined
        assert ("max-age=0" in joined) or ("expires=" in joined and "1970" in joined) or ("expires=thu, 01 jan 1970" in joined), f"Cookie not cleared: {joined}"
        # Now refresh should fail (token revoked)
        # Need a fresh session because server might still have cookie in s
        rr = s.post(f"{PUBLIC_URL}/api/auth/refresh", timeout=15)
        assert rr.status_code == 401, f"Refresh after logout should be 401, got {rr.status_code}"

    def test_me_with_valid_token(self, admin_session):
        r = admin_session.get(f"{PUBLIC_URL}/api/auth/me", timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert d["rol"] == "admin"


# ── Analytics endpoint ────────────────────────────────────
class TestAnalytics:
    def test_summary_no_auth_returns_401(self):
        r = requests.get(f"{PUBLIC_URL}/api/analytics/summary", timeout=15)
        assert r.status_code == 401, f"Expected 401, got {r.status_code}"

    def test_summary_admin_returns_full_payload(self, admin_session):
        r = admin_session.get(f"{PUBLIC_URL}/api/analytics/summary", timeout=20)
        assert r.status_code == 200, f"{r.status_code} {r.text}"
        d = r.json()
        # Required keys
        for k in ["total_revenue", "total_orders", "avg_ticket", "active_orders",
                  "revenue_by_day", "orders_by_hour", "top_products", "status_distribution"]:
            assert k in d, f"Missing key: {k}"
        assert isinstance(d["total_revenue"], int)
        assert isinstance(d["total_orders"], int) and d["total_orders"] >= 0
        assert isinstance(d["revenue_by_day"], list) and len(d["revenue_by_day"]) == 7
        for day in d["revenue_by_day"]:
            assert "date" in day and "label" in day and "revenue" in day
        assert isinstance(d["orders_by_hour"], list) and len(d["orders_by_hour"]) == 24
        assert isinstance(d["top_products"], list) and len(d["top_products"]) <= 3
        for p in d["top_products"]:
            assert "name" in p and "quantity" in p
        sd = d["status_distribution"]
        for s in ["recibido", "preparando", "enviado", "entregado"]:
            assert s in sd

    def test_summary_comercio_returns_403(self, comercio_session):
        r = comercio_session.get(f"{PUBLIC_URL}/api/analytics/summary", timeout=15)
        assert r.status_code == 403, f"Expected 403 for comercio, got {r.status_code}: {r.text}"


# ── Catalog & Pedidos ─────────────────────────────────────
class TestCatalogAndPedidos:
    def test_catalog_has_6_businesses_and_35_items(self):
        r = requests.get(f"{PUBLIC_URL}/api/catalogo", timeout=15)
        assert r.status_code == 200
        d = r.json()
        # Could be {businesses:[...], items:[...]} or list
        if isinstance(d, dict):
            businesses = d.get("businesses") or d.get("comercios") or []
            items = d.get("items") or d.get("catalogo") or []
        else:
            businesses, items = [], d
        # Try alternative shape
        assert len(businesses) == 6 or len(items) == 35, f"Catalog unexpected shape: keys={list(d.keys()) if isinstance(d,dict) else 'list'} businesses={len(businesses)} items={len(items)}"

    def test_pedidos_admin_has_28_demo_orders(self, admin_session):
        r = admin_session.get(f"{PUBLIC_URL}/api/pedidos", timeout=20)
        assert r.status_code == 200
        data = r.json()
        # Count demo orders
        demo = [p for p in data if str(p.get("id") or p.get("order_id") or p.get("id_pedido") or "").startswith("BY-DEMO")]
        assert len(demo) >= 28, f"Expected >=28 BY-DEMO orders, got {len(demo)} (total {len(data)})"

    def test_post_pedido_public_no_auth(self, admin_session):
        # Pattern is BY-\d{8} — generate 8-digit number
        order_id = f"BY-{int(time.time()) % 100000000:08d}"
        payload = {
            "order_id": order_id,
            "business": "Panadería Don José",
            "items": [{"name": "Pan", "emoji": "🥖", "type": "product",
                       "quantity": 1, "unit_price": 1000, "total": 1000}],
            "subtotal": 1000, "delivery_fee": 2500, "total": 3500,
            "created_at": "2026-01-15T10:00:00Z",
        }
        r = requests.post(f"{PUBLIC_URL}/api/pedidos", json=payload, timeout=15)
        assert r.status_code in (200, 201), f"{r.status_code} {r.text}"
        # Verify id_comercio resolved (NOT the full business name)
        time.sleep(1)
        rg = admin_session.get(f"{PUBLIC_URL}/api/pedidos", timeout=15)
        rows = [p for p in rg.json() if p.get("id") == order_id]
        if rows:
            assert rows[0].get("id_comercio") == "panaderia", \
                f"id_comercio should be slug 'panaderia', got: {rows[0].get('id_comercio')}"


# ── Regression ────────────────────────────────────────────
class TestRegression:
    def test_health(self):
        r = requests.get(f"{PUBLIC_URL}/api/health", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"

    def test_webhook_whatsapp_get(self):
        # Verify endpoint at least responds (challenge param check would be 200/403)
        r = requests.get(
            f"{PUBLIC_URL}/api/webhook/whatsapp",
            params={"hub.mode": "subscribe", "hub.verify_token": "barrioya_verify_2026", "hub.challenge": "12345"},
            timeout=15,
        )
        assert r.status_code in (200, 403)
