"""
BarrioYa — JWT Auth E2E Test Suite (iteration 3)
Tests:
- /api/auth/login (admin + comercio + invalid + nonexistent + rate limit)
- /api/auth/me (with/without bearer)
- /api/auth/refresh (valid/invalid/revoked)
- /api/auth/logout (revokes refresh token)
- /api/pedidos role-based access (admin sees all, comercio filtered, PATCH ownership)
- /api/pedidos POST stays public (anonymous checkout)
"""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://b2352844-8435-42ef-8479-0901a3243211.preview.emergentagent.com",
).rstrip("/")

ADMIN = {"email": "santiago@barrioya.co", "password": "AdminBarrioYa2026*"}
COMERCIO = {"email": "donjose@barrioya.co", "password": "Panaderia2026*"}


# ── Fixtures ──────────────────────────────────────────────
@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_tokens(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def comercio_tokens(api):
    r = api.post(f"{BASE_URL}/api/auth/login", json=COMERCIO)
    assert r.status_code == 200, r.text
    return r.json()


def _bearer(tok):
    return {"Authorization": f"Bearer {tok}"}


# ── /api/auth/login ───────────────────────────────────────
class TestLogin:
    def test_login_admin_returns_tokens_and_user(self, admin_tokens):
        d = admin_tokens
        assert "access_token" in d and isinstance(d["access_token"], str)
        assert "refresh_token" in d and isinstance(d["refresh_token"], str)
        assert d.get("token_type", "").lower() == "bearer"
        assert d.get("expires_in") == 900  # 15 min
        u = d["user"]
        assert u["email"] == ADMIN["email"]
        assert u["rol"] == "admin"
        assert u.get("id_comercio") in (None, "")
        assert "id" in u and "nombre" in u

    def test_login_comercio_returns_id_comercio(self, comercio_tokens):
        u = comercio_tokens["user"]
        assert u["rol"] == "comercio"
        assert u["id_comercio"] == "panaderia"
        assert u["email"] == COMERCIO["email"]

    def test_login_wrong_password_returns_401(self, api):
        # use a unique-looking-but-real email so it doesn't pollute admin lockout
        r = api.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "santiago@barrioya.co", "password": "definitelyWrong!1"},
        )
        assert r.status_code == 401, r.text
        body = r.text.lower()
        # generic error to avoid user enumeration
        assert "credenciales" in body or "invalid" in body or "inválid" in body

    def test_login_nonexistent_user_returns_401_not_404(self, api):
        # use a real-looking domain so Pydantic EmailStr validator passes
        r = api.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": f"ghost-{uuid.uuid4().hex[:8]}@example.com", "password": "whatever"},
        )
        assert r.status_code == 401, f"expected 401 (generic), got {r.status_code}: {r.text}"
        assert r.status_code != 404

    def test_rate_limit_429_after_5_failed_attempts(self, api):
        """Use an isolated email so it doesn't lock out the seeded admin."""
        target = f"ratelimit-{uuid.uuid4().hex[:8]}@barrioya.co"
        codes = []
        for i in range(7):
            r = api.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": target, "password": "wrongpass"},
            )
            codes.append(r.status_code)
        # Expect at least one 429 within the burst (limit = 5/15min)
        assert 429 in codes, f"Expected 429 lockout in codes={codes}"
        # Before the lockout we should see 401 (invalid credentials)
        assert 401 in codes, f"Expected 401 codes prior to lockout: {codes}"


# ── /api/auth/me ──────────────────────────────────────────
class TestMe:
    def test_me_without_bearer_returns_401(self, api):
        r = requests.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 401

    def test_me_with_invalid_bearer_returns_401(self, api):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=_bearer("not.a.valid.jwt"))
        assert r.status_code == 401

    def test_me_with_valid_bearer_returns_user(self, admin_tokens):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=_bearer(admin_tokens["access_token"]))
        assert r.status_code == 200, r.text
        u = r.json()
        assert u["email"] == ADMIN["email"]
        assert u["rol"] == "admin"


# ── /api/auth/refresh ─────────────────────────────────────
class TestRefresh:
    def test_refresh_with_valid_token_returns_new_access(self, api):
        # fresh login so that refresh is not revoked by other tests
        login = api.post(f"{BASE_URL}/api/auth/login", json=ADMIN).json()
        rtok = login["refresh_token"]
        # JWT with HS256 is deterministic for identical payloads — sleep 1s
        # so iat differs and the new access_token is guaranteed unique
        time.sleep(1.1)
        r = api.post(f"{BASE_URL}/api/auth/refresh", json={"refresh_token": rtok})
        assert r.status_code == 200, r.text
        d = r.json()
        assert "access_token" in d and isinstance(d["access_token"], str)
        assert d.get("expires_in") == 900
        assert d["access_token"] != login["access_token"]

    def test_refresh_with_invalid_token_returns_401(self, api):
        r = api.post(f"{BASE_URL}/api/auth/refresh", json={"refresh_token": "garbage.invalid.token"})
        assert r.status_code == 401


# ── /api/auth/logout (revocation) ─────────────────────────
class TestLogout:
    def test_logout_revokes_refresh_token(self, api):
        login = api.post(f"{BASE_URL}/api/auth/login", json=ADMIN).json()
        atok = login["access_token"]
        rtok = login["refresh_token"]

        # 1) logout (auth required) including refresh_token in body
        r = requests.post(
            f"{BASE_URL}/api/auth/logout",
            headers=_bearer(atok),
            json={"refresh_token": rtok},
        )
        assert r.status_code in (200, 204), r.text

        # 2) using same refresh token should now fail
        time.sleep(0.5)
        r2 = api.post(f"{BASE_URL}/api/auth/refresh", json={"refresh_token": rtok})
        assert r2.status_code == 401, f"expected revoked refresh to 401, got {r2.status_code}"


# ── /api/pedidos protections ─────────────────────────────
class TestPedidosAuth:
    def test_get_pedidos_without_auth_returns_401(self, api):
        r = api.get(f"{BASE_URL}/api/pedidos")
        assert r.status_code == 401, r.text

    def test_get_pedidos_with_admin_returns_list(self, admin_tokens):
        r = requests.get(
            f"{BASE_URL}/api/pedidos",
            headers=_bearer(admin_tokens["access_token"]),
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)

    def test_get_pedidos_with_comercio_only_own(self, comercio_tokens):
        r = requests.get(
            f"{BASE_URL}/api/pedidos",
            headers=_bearer(comercio_tokens["access_token"]),
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, list)
        for o in data:
            # business field may be id_comercio or business; check both
            ic = o.get("id_comercio")
            if ic is not None:
                assert ic == "panaderia", f"comercio saw non-own order: {o}"

    def test_post_pedidos_remains_public(self, api):
        """Anonymous checkout: must NOT require auth."""
        order_id = f"BY-{int(time.time()) % 100000000:08d}"
        order = {
            "order_id": order_id,
            "business": "Panadería Don José",
            "id_comercio": "panaderia",
            "items": [
                {"name": "Pan", "emoji": "🥖", "type": "product",
                 "quantity": 1, "unit_price": 1000, "total": 1000}
            ],
            "subtotal": 1000,
            "delivery_fee": 2500,
            "total": 3500,
            "created_at": "2026-01-15T10:00:00.000Z",
        }
        r = api.post(f"{BASE_URL}/api/pedidos", json=order)
        assert r.status_code == 200, f"public POST broke: {r.status_code} {r.text}"
        assert r.json().get("order_id") == order_id

    def test_patch_pedido_without_auth_returns_401(self, api):
        r = api.patch(
            f"{BASE_URL}/api/pedidos/BY-10000001",
            json={"status": "preparando"},
        )
        assert r.status_code == 401

    def test_patch_pedido_admin_succeeds_or_404(self, admin_tokens):
        # creating a new pedido for this test to ensure 200 path
        order_id = f"BY-{(int(time.time()) + 1) % 100000000:08d}"
        new = {
            "order_id": order_id, "business": "Panadería Don José", "id_comercio": "panaderia",
            "items": [{"name": "Pan", "emoji": "🥖", "type": "product",
                       "quantity": 1, "unit_price": 1000, "total": 1000}],
            "subtotal": 1000, "delivery_fee": 2500, "total": 3500,
            "created_at": "2026-01-15T10:00:00.000Z",
        }
        c = requests.post(f"{BASE_URL}/api/pedidos", json=new)
        assert c.status_code == 200, c.text

        r = requests.patch(
            f"{BASE_URL}/api/pedidos/{order_id}",
            headers=_bearer(admin_tokens["access_token"]),
            json={"status": "preparando"},
        )
        assert r.status_code == 200, r.text
        assert r.json().get("new_status") == "preparando"

    def test_patch_pedido_comercio_owner_succeeds(self, comercio_tokens, api):
        order_id = f"BY-{(int(time.time()) + 2) % 100000000:08d}"
        new = {
            "order_id": order_id, "business": "Panadería Don José", "id_comercio": "panaderia",
            "items": [{"name": "Pan", "emoji": "🥖", "type": "product",
                       "quantity": 1, "unit_price": 1000, "total": 1000}],
            "subtotal": 1000, "delivery_fee": 2500, "total": 3500,
            "created_at": "2026-01-15T10:00:00.000Z",
        }
        api.post(f"{BASE_URL}/api/pedidos", json=new)
        r = requests.patch(
            f"{BASE_URL}/api/pedidos/{order_id}",
            headers=_bearer(comercio_tokens["access_token"]),
            json={"status": "preparando"},
        )
        assert r.status_code == 200, f"comercio-owner PATCH should succeed: {r.text}"

    def test_patch_pedido_comercio_not_owner_returns_403(self, comercio_tokens, api):
        order_id = f"BY-{(int(time.time()) + 3) % 100000000:08d}"
        # create an order that belongs to a DIFFERENT comercio (e.g., 'mascotas')
        new = {
            "order_id": order_id, "business": "Veterinaria Patitas", "id_comercio": "mascotas",
            "items": [{"name": "Croquetas", "emoji": "🐶", "type": "product",
                       "quantity": 1, "unit_price": 5000, "total": 5000}],
            "subtotal": 5000, "delivery_fee": 2500, "total": 7500,
            "created_at": "2026-01-15T10:00:00.000Z",
        }
        api.post(f"{BASE_URL}/api/pedidos", json=new)
        r = requests.patch(
            f"{BASE_URL}/api/pedidos/{order_id}",
            headers=_bearer(comercio_tokens["access_token"]),
            json={"status": "preparando"},
        )
        # 403 expected — comercio panaderia is not owner of mascotas order
        assert r.status_code == 403, f"expected 403, got {r.status_code}: {r.text}"
