"""
BarrioYa — Analytics Router
GET /api/analytics/summary — KPIs + series temporales para dashboard admin.
Solo accesible por rol admin.
"""

import logging
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends

from auth.dependencies import AuthUser, require_roles
from config.db import SUPABASE_AVAILABLE, supabase_client

logger = logging.getLogger("barrioya.analytics")
router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def _empty_summary() -> dict[str, Any]:
    return {
        "total_revenue": 0,
        "total_orders": 0,
        "avg_ticket": 0,
        "active_orders": 0,
        "revenue_by_day": [],
        "orders_by_hour": [0] * 24,
        "top_products": [],
        "status_distribution": {"recibido": 0, "preparando": 0, "enviado": 0, "entregado": 0},
    }


@router.get(
    "/summary",
    summary="Métricas agregadas para el dashboard admin",
)
async def get_summary(user: AuthUser = Depends(require_roles("admin"))):
    """
    Devuelve KPIs y series temporales:
    - total_revenue, total_orders, avg_ticket, active_orders
    - revenue_by_day (últimos 7 días)
    - orders_by_hour (últimas 24h)
    - top_products (top 3 más vendidos por cantidad)
    - status_distribution
    """
    if not (supabase_client and SUPABASE_AVAILABLE):
        return _empty_summary()

    try:
        cutoff_7d = datetime.now(timezone.utc) - timedelta(days=7)
        cutoff_24h = datetime.now(timezone.utc) - timedelta(hours=24)

        # Pedidos completos con sus items (los necesitamos todos para top_products)
        all_pedidos = (
            supabase_client.table("pedidos")
            .select("*, pedido_items(*)")
            .order("fecha_creacion", desc=True)
            .execute()
        ).data or []
    except Exception as e:
        logger.error("Error consultando analytics: %s", e)
        return _empty_summary()

    total_revenue = 0
    total_orders = len(all_pedidos)
    active_orders = 0
    status_dist = {"recibido": 0, "preparando": 0, "enviado": 0, "entregado": 0}
    revenue_by_day_map: dict[str, int] = defaultdict(int)
    orders_by_hour = [0] * 24
    product_counter: Counter = Counter()

    for p in all_pedidos:
        total = int(p.get("total", 0) or 0)
        total_revenue += total

        estado = (p.get("estado") or "recibido").lower()
        status_dist[estado] = status_dist.get(estado, 0) + 1
        if estado != "entregado":
            active_orders += 1

        # Parse fecha_creacion (ISO string desde Supabase)
        fecha_str = p.get("fecha_creacion") or ""
        try:
            # Supabase devuelve algo como "2026-01-15T10:00:00.123456+00:00"
            fecha = datetime.fromisoformat(fecha_str.replace("Z", "+00:00"))
            if fecha.tzinfo is None:
                fecha = fecha.replace(tzinfo=timezone.utc)
        except Exception:
            continue

        # Revenue últimos 7 días por día
        if fecha >= cutoff_7d:
            day_key = fecha.strftime("%Y-%m-%d")
            revenue_by_day_map[day_key] += total

        # Orders últimas 24h por hora
        if fecha >= cutoff_24h:
            orders_by_hour[fecha.hour] += 1

        # Top productos (suma cantidades)
        for item in p.get("pedido_items", []) or []:
            name = item.get("nombre_item")
            qty = int(item.get("cantidad", 0) or 0)
            if name and qty > 0:
                product_counter[name] += qty

    # Construir array de últimos 7 días en orden cronológico (incluye días sin ventas con 0)
    revenue_by_day = []
    today = datetime.now(timezone.utc).date()
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        key = d.strftime("%Y-%m-%d")
        revenue_by_day.append({
            "date": key,
            "label": d.strftime("%a %d"),  # "Lun 15"
            "revenue": revenue_by_day_map.get(key, 0),
        })

    top3 = product_counter.most_common(3)
    top_products = [{"name": name, "quantity": qty} for name, qty in top3]

    avg_ticket = (total_revenue // total_orders) if total_orders > 0 else 0

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "avg_ticket": avg_ticket,
        "active_orders": active_orders,
        "revenue_by_day": revenue_by_day,
        "orders_by_hour": orders_by_hour,
        "top_products": top_products,
        "status_distribution": status_dist,
    }
