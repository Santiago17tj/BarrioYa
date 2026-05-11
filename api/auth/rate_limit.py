"""
BarrioYa — Rate limiting para login (5 intentos / 15 min por (ip, email)).
Implementación con tabla `login_attempts` en Supabase + fallback en memoria.
"""

import logging
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

from config.db import supabase_client, SUPABASE_AVAILABLE

logger = logging.getLogger("barrioya.ratelimit")

MAX_ATTEMPTS = 5
WINDOW_MINUTES = 15

# Fallback en memoria (deque de timestamps por identifier)
_memory_attempts: dict[str, deque] = defaultdict(deque)


def _identifier(ip: str, email: str) -> str:
    return f"{ip}:{email.lower().strip()}"


def is_locked(ip: str, email: str) -> bool:
    """Devuelve True si la combinación (ip, email) supera el límite."""
    ident = _identifier(ip, email)
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=WINDOW_MINUTES)

    # 1. Intentar via Supabase
    if supabase_client and SUPABASE_AVAILABLE:
        try:
            res = (
                supabase_client.table("login_attempts")
                .select("id", count="exact")
                .eq("identifier", ident)
                .eq("success", False)
                .gte("attempted_at", cutoff.isoformat())
                .execute()
            )
            return (res.count or 0) >= MAX_ATTEMPTS
        except Exception as e:
            logger.warning("Rate limit BD falló, usando memoria: %s", e)

    # 2. Fallback memoria
    q = _memory_attempts[ident]
    while q and q[0] < cutoff:
        q.popleft()
    return len(q) >= MAX_ATTEMPTS


def record_attempt(ip: str, email: str, success: bool) -> None:
    """Registra un intento de login (éxito o fallo)."""
    ident = _identifier(ip, email)
    now = datetime.now(timezone.utc)

    # Memoria: solo registramos fallos (los éxitos no cuentan para lock)
    if not success:
        _memory_attempts[ident].append(now)

    if supabase_client and SUPABASE_AVAILABLE:
        try:
            supabase_client.table("login_attempts").insert({
                "identifier": ident,
                "attempted_at": now.isoformat(),
                "success": success,
            }).execute()

            # En login exitoso, limpiamos los attempts fallidos previos
            if success:
                supabase_client.table("login_attempts").delete().eq("identifier", ident).eq("success", False).execute()
                _memory_attempts.pop(ident, None)
        except Exception as e:
            logger.warning("No se pudo registrar attempt en BD: %s", e)
