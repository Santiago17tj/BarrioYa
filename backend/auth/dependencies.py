"""
BarrioYa — Auth dependencies: require_auth para FastAPI.
Lee Authorization: Bearer <token> y valida contra Supabase.
"""

import logging
from typing import Optional

import jwt
from fastapi import Depends, Header, HTTPException, status

from auth.jwt_utils import decode_token
from config.db import supabase_client, SUPABASE_AVAILABLE

logger = logging.getLogger("barrioya.auth")


class AuthUser:
    """Usuario autenticado, payload del JWT + datos básicos."""

    def __init__(self, user_id: str, email: str, rol: str, id_comercio: Optional[str]):
        self.id = user_id
        self.email = email
        self.rol = rol
        self.id_comercio = id_comercio

    def is_admin(self) -> bool:
        return self.rol == "admin"

    def is_comercio(self) -> bool:
        return self.rol == "comercio"


def _extract_bearer(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Falta token Bearer en header Authorization",
        )
    return authorization[7:].strip()


async def get_current_user(
    authorization: Optional[str] = Header(default=None),
) -> AuthUser:
    """
    Dependency: extrae el JWT de Authorization, valida y devuelve el usuario.
    Levanta 401 si el token es inválido/expirado/usuario inactivo.
    """
    token = _extract_bearer(authorization)

    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Tipo de token incorrecto")

    user_id = payload.get("sub")
    email = payload.get("email")
    rol = payload.get("rol")
    id_comercio = payload.get("id_comercio")

    if not user_id or not email or not rol:
        raise HTTPException(status_code=401, detail="Payload del token incompleto")

    # Verificamos que el usuario sigue activo en BD
    if supabase_client and SUPABASE_AVAILABLE:
        try:
            res = (
                supabase_client.table("usuarios_admin")
                .select("id, activo, rol, id_comercio")
                .eq("id", user_id)
                .limit(1)
                .execute()
            )
            if not res.data:
                raise HTTPException(status_code=401, detail="Usuario no encontrado")
            user = res.data[0]
            if not user.get("activo", True):
                raise HTTPException(status_code=401, detail="Usuario inactivo")
            # Sincronizamos rol/comercio del JWT con BD (gana BD por seguridad)
            rol = user.get("rol", rol)
            id_comercio = user.get("id_comercio", id_comercio)
        except HTTPException:
            raise
        except Exception as e:
            logger.error("Error verificando usuario en BD: %s", e)
            # Si BD falla, igual aceptamos el JWT (degradación grácil)

    return AuthUser(user_id=user_id, email=email, rol=rol, id_comercio=id_comercio)


def require_roles(*allowed_roles: str):
    """
    Dependency factory: require_roles('admin') o require_roles('admin', 'comercio').
    """

    async def _dep(user: AuthUser = Depends(get_current_user)) -> AuthUser:
        if user.rol not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Rol '{user.rol}' no autorizado para este recurso",
            )
        return user

    return _dep
