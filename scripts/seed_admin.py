"""
BarrioYa — Seed admin user idempotente.
Crea el usuario admin definido en .env si no existe; si existe pero la password
cambió, actualiza el hash.

Uso:
    cd /app/backend && python ../scripts/seed_admin.py
"""

import os
import sys
from pathlib import Path

# Permitir importar desde /app/backend
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv

load_dotenv(ROOT / "backend" / ".env")

from auth.jwt_utils import hash_password, verify_password  # noqa: E402
from config.db import supabase_client, SUPABASE_AVAILABLE  # noqa: E402


def main():
    admin_email = (os.environ.get("ADMIN_EMAIL") or "").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD") or ""
    admin_name = os.environ.get("ADMIN_NAME") or "Admin"

    if not admin_email or not admin_password:
        print("❌ ADMIN_EMAIL o ADMIN_PASSWORD no definidos en .env")
        sys.exit(1)

    if not (supabase_client and SUPABASE_AVAILABLE):
        print("❌ Supabase no disponible — no puedo seedear admin")
        sys.exit(1)

    # Buscar usuario existente
    res = (
        supabase_client.table("usuarios_admin")
        .select("id, email, password_hash, rol, activo")
        .eq("email", admin_email)
        .limit(1)
        .execute()
    )

    if not res.data:
        # Crear nuevo
        new_user = {
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "nombre": admin_name,
            "rol": "admin",
            "id_comercio": None,
            "activo": True,
        }
        ins = supabase_client.table("usuarios_admin").insert(new_user).execute()
        print(f"✅ Admin creado: {admin_email} (id={ins.data[0]['id']})")
    else:
        existing = res.data[0]
        if not verify_password(admin_password, existing["password_hash"]):
            supabase_client.table("usuarios_admin").update({
                "password_hash": hash_password(admin_password),
                "rol": "admin",
                "activo": True,
            }).eq("id", existing["id"]).execute()
            print(f"♻️  Admin existente — password actualizada: {admin_email}")
        else:
            print(f"✅ Admin ya existe con la password correcta: {admin_email}")


if __name__ == "__main__":
    main()
