"""
BarrioYa — Sync Catalog (idempotente).
Sube los 6 comercios + 35 items definidos en backend/data/catalogo_seed.py
a las tablas `comercios` y `catalogo` de Supabase.

Uso:
    python /app/scripts/sync_catalog.py
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv

load_dotenv(ROOT / "backend" / ".env")

from data.catalogo_seed import CATALOG  # noqa: E402
from supabase import create_client  # noqa: E402


def main():
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_ANON_KEY")
    if not url or not key:
        print("❌ SUPABASE_URL / SUPABASE_ANON_KEY no definidas en .env")
        sys.exit(1)

    sb = create_client(url, key)

    print(f"📦 Sincronizando {len(CATALOG)} comercios + items a Supabase…\n")

    total_items = 0
    for biz in CATALOG:
        # 1. Upsert comercio
        sb.table("comercios").upsert({
            "id": biz.id,
            "nombre": biz.name,
            "emoji": biz.emoji,
            "categoria": biz.category,
            "zona": biz.zone,
            "estado_actividad": True,
        }, on_conflict="id").execute()

        # 2. Borrar items previos del comercio (deja la tabla limpia)
        sb.table("catalogo").delete().eq("id_comercio", biz.id).execute()

        # 3. Insertar items frescos
        rows = []
        for item in biz.items:
            rows.append({
                "id_comercio": biz.id,
                "nombre_item": item.name,
                "tipo": item.type,
                "precio": item.price,
                "emoji": item.emoji,
                "proveedor": item.provider,
                "zona": item.zone,
                "duracion": item.duration,
            })
        if rows:
            sb.table("catalogo").insert(rows).execute()

        print(f"  ✅ {biz.emoji} {biz.name:<28} → {len(biz.items)} items")
        total_items += len(biz.items)

    print(f"\n🎉 Sincronización completa: {len(CATALOG)} comercios + {total_items} items.")


if __name__ == "__main__":
    main()
