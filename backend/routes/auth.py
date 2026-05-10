"""
BarrioYa — Auth Router
POST /api/auth/login    — email + password → access_token (JSON) + refresh_token (httpOnly cookie)
POST /api/auth/refresh  — lee refresh_token de cookie → new access_token
POST /api/auth/logout   — revoca refresh_token actual y limpia la cookie
GET  /api/auth/me       — devuelve usuario del JWT
"""

import logging
import os
from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status

from auth.dependencies import AuthUser, get_current_user
from auth.jwt_utils import (
    create_access_token,
    create_refresh_token_and_hash,
    decode_token,
    hash_refresh_token,
    verify_password,
    _access_minutes,
    _refresh_days,
)
from auth.rate_limit import is_locked, record_attempt
from config.db import SUPABASE_AVAILABLE, supabase_client
from models.auth import (
    AccessTokenResponse,
    LoginRequest,
    TokenResponse,
    UserPublic,
)

logger = logging.getLogger("barrioya.auth.router")
router = APIRouter(prefix="/api/auth", tags=["Auth"])

REFRESH_COOKIE = "barrioya_refresh"


def _client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        return fwd.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _cookie_secure() -> bool:
    """En producción/HTTPS: True. En dev local: False (lo controla env var)."""
    return os.environ.get("JWT_COOKIE_SECURE", "false").lower() == "true"


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,                     # ← Mitiga XSS: JS no puede leerla
        secure=_cookie_secure(),           # True en HTTPS prod
        samesite="lax",                    # same-site (frontend y /api/* mismo dominio)
        max_age=_refresh_days() * 24 * 60 * 60,
        path="/api/auth",                  # solo enviada a /api/auth/*
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE,
        path="/api/auth",
        samesite="lax",
        secure=_cookie_secure(),
    )


def _require_db():
    if not (supabase_client and SUPABASE_AVAILABLE):
        raise HTTPException(
            status_code=503,
            detail="Servicio de autenticación no disponible (BD no conectada)",
        )


@router.post("/login", response_model=TokenResponse, summary="Login con email + password")
async def login(payload: LoginRequest, request: Request, response: Response):
    _require_db()
    ip = _client_ip(request)
    email = payload.email.lower().strip()

    if is_locked(ip, email):
        raise HTTPException(
            status_code=429,
            detail="Demasiados intentos fallidos. Intenta de nuevo en 15 minutos.",
        )

    try:
        res = (
            supabase_client.table("usuarios_admin")
            .select("id, email, password_hash, nombre, rol, id_comercio, activo")
            .eq("email", email)
            .limit(1)
            .execute()
        )
    except Exception as e:
        logger.error("Error consultando usuarios_admin: %s", e)
        raise HTTPException(status_code=500, detail="Error interno")

    user = res.data[0] if res.data else None
    valid_password = bool(user) and verify_password(payload.password, user["password_hash"])
    is_active = bool(user) and user.get("activo", True)

    if not user or not valid_password or not is_active:
        record_attempt(ip, email, success=False)
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    record_attempt(ip, email, success=True)

    access = create_access_token(
        user_id=user["id"],
        email=user["email"],
        rol=user["rol"],
        id_comercio=user.get("id_comercio"),
    )
    refresh_raw, refresh_hash, refresh_exp = create_refresh_token_and_hash(user["id"])

    try:
        supabase_client.table("refresh_tokens").insert({
            "user_id": user["id"],
            "token_hash": refresh_hash,
            "expires_at": refresh_exp.isoformat(),
            "revoked": False,
        }).execute()
    except Exception as e:
        logger.error("Error guardando refresh_token: %s", e)
        raise HTTPException(status_code=500, detail="No se pudo emitir el refresh token")

    try:
        supabase_client.table("usuarios_admin").update({
            "last_login_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", user["id"]).execute()
    except Exception:
        pass

    # ★ Seteamos refresh_token como cookie httpOnly (mitigación XSS)
    _set_refresh_cookie(response, refresh_raw)

    # Por compatibilidad (y para tests CLI con curl) seguimos devolviendo el refresh
    # en JSON. El frontend NO lo persistirá; usará la cookie.
    return TokenResponse(
        access_token=access,
        refresh_token=refresh_raw,
        expires_in=_access_minutes() * 60,
        user=UserPublic(
            id=user["id"],
            email=user["email"],
            nombre=user.get("nombre") or "",
            rol=user["rol"],
            id_comercio=user.get("id_comercio"),
        ),
    )


@router.post("/refresh", response_model=AccessTokenResponse, summary="Renueva el access token")
async def refresh(
    response: Response,
    barrioya_refresh: str | None = Cookie(default=None),
):
    _require_db()

    refresh_token = barrioya_refresh
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token ausente")

    try:
        data = decode_token(refresh_token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Refresh token inválido")

    if data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Tipo de token incorrecto")

    user_id = data.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Refresh token sin subject")

    token_hash = hash_refresh_token(refresh_token)
    try:
        rt = (
            supabase_client.table("refresh_tokens")
            .select("id, user_id, revoked, expires_at")
            .eq("token_hash", token_hash)
            .limit(1)
            .execute()
        )
    except Exception as e:
        logger.error("Error consultando refresh_tokens: %s", e)
        raise HTTPException(status_code=500, detail="Error interno")

    if not rt.data:
        raise HTTPException(status_code=401, detail="Refresh token no reconocido")
    if rt.data[0]["revoked"]:
        raise HTTPException(status_code=401, detail="Refresh token revocado")

    user_res = (
        supabase_client.table("usuarios_admin")
        .select("id, email, rol, id_comercio, activo")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    if not user_res.data or not user_res.data[0].get("activo", True):
        raise HTTPException(status_code=401, detail="Usuario no disponible")
    user = user_res.data[0]

    access = create_access_token(
        user_id=user["id"],
        email=user["email"],
        rol=user["rol"],
        id_comercio=user.get("id_comercio"),
    )
    return AccessTokenResponse(access_token=access, expires_in=_access_minutes() * 60)


@router.post("/logout", summary="Revoca el refresh token actual y limpia la cookie")
async def logout(
    response: Response,
    user: AuthUser = Depends(get_current_user),
    barrioya_refresh: str | None = Cookie(default=None),
):
    _require_db()
    if barrioya_refresh:
        token_hash = hash_refresh_token(barrioya_refresh)
        try:
            supabase_client.table("refresh_tokens").update({"revoked": True}).eq(
                "token_hash", token_hash
            ).eq("user_id", user.id).execute()
        except Exception as e:
            logger.error("Error revocando refresh token: %s", e)

    _clear_refresh_cookie(response)
    return {"ok": True}


@router.get("/me", response_model=UserPublic, summary="Devuelve el usuario autenticado")
async def me(user: AuthUser = Depends(get_current_user)):
    _require_db()
    res = (
        supabase_client.table("usuarios_admin")
        .select("id, email, nombre, rol, id_comercio")
        .eq("id", user.id)
        .limit(1)
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    u = res.data[0]
    return UserPublic(
        id=u["id"],
        email=u["email"],
        nombre=u.get("nombre") or "",
        rol=u["rol"],
        id_comercio=u.get("id_comercio"),
    )
