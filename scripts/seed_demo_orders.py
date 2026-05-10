"""
BarrioYa — Seed pedidos demo (idempotente por order_id prefijo BY-DEMO).
Genera ~25 pedidos distribuidos en los últimos 7 días con variedad de comercios,
horas y estados — para que el dashboard analytics se vea con datos reales.

Uso:
    python /app/scripts/seed_demo_orders.py
"""

import os
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from dotenv import load_dotenv

load_dotenv(ROOT / "backend" / ".env")

from supabase import create_client  # noqa: E402

random.seed(42)


def main():
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_ANON_KEY"])

    # Limpiar demo previo (idempotente)
    print("🧹 Limpiando pedidos demo previos…")
    existing = sb.table("pedidos").select("id").like("id", "BY-DEMO%").execute()
    for row in (existing.data or []):
        sb.table("pedido_items").delete().eq("id_pedido", row["id"]).execute()
    sb.table("pedidos").delete().like("id", "BY-DEMO%").execute()

    # Cargar catálogo real
    comercios = sb.table("comercios").select("id, nombre").execute().data or []
    catalogo = sb.table("catalogo").select("id_comercio, nombre_item, precio").execute().data or []
    items_por_comercio = {}
    for it in catalogo:
        items_por_comercio.setdefault(it["id_comercio"], []).append(it)

    if not items_por_comercio:
        print("❌ Catálogo vacío. Corre antes: python scripts/sync_catalog.py")
        sys.exit(1)

    estados = ["recibido", "preparando", "enviado", "entregado"]
    # Pesos: más entregados (días pasados) que recibidos (hoy)
    pesos_estado_por_dia_atras = {
        0: [0.4, 0.3, 0.2, 0.1],   # Hoy
        1: [0.1, 0.15, 0.25, 0.5], # Ayer
        2: [0.0, 0.05, 0.15, 0.8],
        3: [0.0, 0.0, 0.05, 0.95],
        4: [0.0, 0.0, 0.0, 1.0],
        5: [0.0, 0.0, 0.0, 1.0],
        6: [0.0, 0.0, 0.0, 1.0],
    }

    now = datetime.now(timezone.utc)
    pedidos_creados = 0
    n_target = 28

    print(f"📦 Generando {n_target} pedidos demo distribuidos en últimos 7 días…\n")

    for i in range(n_target):
        # Distribución de días (más en los últimos 3 días)
        days_ago = random.choices([0, 1, 2, 3, 4, 5, 6], weights=[5, 5, 4, 3, 3, 2, 2])[0]
        # Hora pico de comida (12-14h y 18-20h tienen más peso)
        hour = random.choices(
            list(range(8, 22)),
            weights=[1, 1, 2, 3, 6, 8, 6, 3, 2, 4, 7, 9, 7, 3]
        )[0]
        minute = random.randint(0, 59)
        fecha = now - timedelta(days=days_ago)
        fecha = fecha.replace(hour=hour, minute=minute, second=0, microsecond=0)

        comercio = random.choice(list(items_por_comercio.keys()))
        items_disponibles = items_por_comercio[comercio]

        # 1 a 4 items distintos por pedido
        n_items = random.randint(1, min(4, len(items_disponibles)))
        sampled = random.sample(items_disponibles, n_items)
        items_pedido = []
        subtotal = 0
        for it in sampled:
            qty = random.randint(1, 3)
            sub = it["precio"] * qty
            subtotal += sub
            items_pedido.append({
                "nombre_item": it["nombre_item"],
                "cantidad": qty,
                "subtotal": sub,
            })

        delivery_fee = 2500
        total = subtotal + delivery_fee

        estado = random.choices(estados, weights=pesos_estado_por_dia_atras[days_ago])[0]
        order_id = f"BY-DEMO{i:04d}"

        # Insertar pedido
        sb.table("pedidos").insert({
            "id": order_id,
            "id_comercio": comercio,
            "subtotal": subtotal,
            "costo_envio": delivery_fee,
            "total": total,
            "estado": estado,
            "datos_cliente": {"nombre": f"Cliente Demo {i+1}"},
            "fecha_creacion": fecha.isoformat(),
        }).execute()

        # Insertar items
        for it_pedido in items_pedido:
            it_pedido["id_pedido"] = order_id
        sb.table("pedido_items").insert(items_pedido).execute()

        pedidos_creados += 1

    print(f"✅ {pedidos_creados} pedidos demo creados.\n")
    print("   Para limpiarlos: DELETE FROM pedidos WHERE id LIKE 'BY-DEMO%';")


if __name__ == "__main__":
    main()
