"""
BarrioYa — JWT utilities + password hashing.
PyJWT (HS256) + bcrypt rounds=12. Refresh tokens se guardan hasheados (sha256) en BD.
"""

import hashlib
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt

JWT_ALGORITHM = "HS256"


# ── env helpers ──
def _jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET", "")
    if not secret:
        raise RuntimeError("JWT_SECRET no configurado en .env")
    return secret


def _access_minutes() -> int:
    return int(os.environ.get("JWT_ACCESS_EXPIRE_MIN", "15"))


def _refresh_days() -> int:
    return int(os.environ.get("JWT_REFRESH_EXPIRE_DAYS", "7"))


# ── password hashing ──
def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ── access token ──
def create_access_token(*, user_id: str, email: str, rol: str, id_comercio: Optional[str]) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "rol": rol,
        "id_comercio": id_comercio,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=_access_minutes()),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


# ── refresh token (raw + hashed for DB) ──
def create_refresh_token_and_hash(user_id: str) -> tuple[str, str, datetime]:
    """Devuelve (raw_token, sha256_hash, expires_at_utc)."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=_refresh_days())
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expires_at,
        "iat": datetime.now(timezone.utc),
        # Para que dos refresh tokens emitidos en el mismo segundo sean distintos:
        "jti": secrets.token_hex(8),
    }
    raw = jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)
    token_hash = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return raw, token_hash, expires_at


def hash_refresh_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


# ── decode helpers ──
def decode_token(token: str) -> dict:
    """Decodifica un JWT (lanza jwt.* exceptions). El caller maneja errores."""
    return jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
