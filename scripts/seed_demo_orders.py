"""
BarrioYa — Seed pedidos demo ENRIQUECIDO (idempotente por prefijo BY-DEMO).
Genera ~70 pedidos distribuidos en últimos 14 días con horas pico, variedad de comercios
y productos, y estados realistas. Esto produce dashboards profesionales con
comparativa semana actual vs semana anterior.

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

    print("🧹 Limpiando pedidos demo previos…")
    existing = sb.table("pedidos").select("id").like("id", "BY-DEMO%").execute()
    for row in (existing.data or []):
        sb.table("pedido_items").delete().eq("id_pedido", row["id"]).execute()
    sb.table("pedidos").delete().like("id", "BY-DEMO%").execute()

    comercios = sb.table("comercios").select("id, nombre").execute().data or []
    catalogo = sb.table("catalogo").select("id_comercio, nombre_item, precio").execute().data or []
    items_por_comercio = {}
    for it in catalogo:
        items_por_comercio.setdefault(it["id_comercio"], []).append(it)

    if not items_por_comercio:
        print("❌ Catálogo vacío. Corre antes: python scripts/sync_catalog.py")
        sys.exit(1)

    # ── Distribución semana actual vs anterior ──
    # Semana actual: ~40 pedidos (más densidad)
    # Semana anterior: ~30 pedidos (para comparar tendencia ↑)
    estados = ["recibido", "preparando", "enviado", "entregado"]
    pesos_estado_por_dia_atras = {
        0: [0.45, 0.30, 0.20, 0.05],   # Hoy
        1: [0.10, 0.20, 0.25, 0.45],   # Ayer
        2: [0.00, 0.05, 0.15, 0.80],
        3: [0.00, 0.00, 0.05, 0.95],
    }

    # Pesos por día (más actividad en semana actual)
    weights_dias = [
        7, 6, 6, 5, 5, 4, 4,    # días 0-6 (semana actual, más densa)
        4, 4, 3, 3, 3, 2, 2,    # días 7-13 (semana anterior, menos)
    ]
    # Hora pico: comida (12-14h y 18-21h)
    weights_hora = [1, 1, 2, 3, 6, 8, 6, 3, 2, 4, 8, 10, 8, 4]  # 8h..21h

    n_target = 72
    now = datetime.now(timezone.utc)
    pedidos_creados = 0

    print(f"📦 Generando {n_target} pedidos demo en últimos 14 días (semana actual + anterior)…\n")

    for i in range(n_target):
        days_ago = random.choices(list(range(14)), weights=weights_dias)[0]
        hour = random.choices(list(range(8, 22)), weights=weights_hora)[0]
        minute = random.randint(0, 59)
        fecha = (now - timedelta(days=days_ago)).replace(hour=hour, minute=minute, second=0, microsecond=0)

        comercio = random.choice(list(items_por_comercio.keys()))
        items_disponibles = items_por_comercio[comercio]

        n_items = random.randint(1, min(4, len(items_disponibles)))
        sampled = random.sample(items_disponibles, n_items)
        items_pedido = []
        subtotal = 0
        for it in sampled:
            qty = random.randint(1, 4)
            sub = it["precio"] * qty
            subtotal += sub
            items_pedido.append({
                "nombre_item": it["nombre_item"],
                "cantidad": qty,
                "subtotal": sub,
            })

        delivery_fee = 2500
        total = subtotal + delivery_fee

        # Si tiene > 3 días, casi siempre entregado. Si es hoy, todos los estados.
        days_clamped = min(days_ago, 3)
        estado = random.choices(estados, weights=pesos_estado_por_dia_atras[days_clamped])[0]
        order_id = f"BY-DEMO{i:04d}"

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

        for it_pedido in items_pedido:
            it_pedido["id_pedido"] = order_id
        sb.table("pedido_items").insert(items_pedido).execute()

        pedidos_creados += 1

    # Resumen
    print(f"✅ {pedidos_creados} pedidos demo creados.")
    print("   Para limpiarlos: DELETE FROM pedidos WHERE id LIKE 'BY-DEMO%';")
    return pedidos_creados


if __name__ == "__main__":
    main()
