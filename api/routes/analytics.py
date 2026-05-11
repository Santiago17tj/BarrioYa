"""
BarrioYa — Analytics Router
GET  /api/analytics/summary    — KPIs + series + comparativa semana actual vs anterior (admin)
POST /api/analytics/reset-demo — Limpia pedidos y re-seedea datos demo (admin)
"""

import logging
import subprocess
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

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
        "current_week_revenue": 0,
        "previous_week_revenue": 0,
        "growth_pct": 0,
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
    - top_products (top 3)
    - status_distribution
    - current_week_revenue, previous_week_revenue, growth_pct (comparativa)
    """
    if not (supabase_client and SUPABASE_AVAILABLE):
        return _empty_summary()

    try:
        cutoff_24h = datetime.now(timezone.utc) - timedelta(hours=24)
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
    # Whitelist: ignoramos estados desconocidos para no contaminar el dict
    valid_statuses = {"recibido", "preparando", "enviado", "entregado"}
    status_dist = {s: 0 for s in valid_statuses}

    revenue_by_day_map: dict[str, int] = defaultdict(int)
    orders_by_hour = [0] * 24
    product_counter: Counter = Counter()

    # Comparativa: últimos 7 días vs los 7 anteriores
    today_utc = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    current_week_start = today_utc - timedelta(days=6)
    prev_week_start = current_week_start - timedelta(days=7)
    prev_week_end = current_week_start
    current_week_revenue = 0
    previous_week_revenue = 0

    for p in all_pedidos:
        total = int(p.get("total", 0) or 0)
        total_revenue += total

        estado = (p.get("estado") or "recibido").lower()
        if estado in valid_statuses:
            status_dist[estado] += 1
        if estado != "entregado":
            active_orders += 1

        fecha_str = p.get("fecha_creacion") or ""
        try:
            fecha = datetime.fromisoformat(fecha_str.replace("Z", "+00:00"))
            if fecha.tzinfo is None:
                fecha = fecha.replace(tzinfo=timezone.utc)
        except Exception:
            continue

        # Últimos 7 días por día
        if fecha >= current_week_start:
            day_key = fecha.strftime("%Y-%m-%d")
            revenue_by_day_map[day_key] += total
            current_week_revenue += total
        elif prev_week_start <= fecha < prev_week_end:
            previous_week_revenue += total

        if fecha >= cutoff_24h:
            orders_by_hour[fecha.hour] += 1

        for item in p.get("pedido_items", []) or []:
            name = item.get("nombre_item")
            qty = int(item.get("cantidad", 0) or 0)
            if name and qty > 0:
                product_counter[name] += qty

    revenue_by_day = []
    for i in range(6, -1, -1):
        d = (today_utc - timedelta(days=i)).date()
        key = d.strftime("%Y-%m-%d")
        revenue_by_day.append({
            "date": key,
            "label": d.strftime("%a %d"),
            "revenue": revenue_by_day_map.get(key, 0),
        })

    top3 = product_counter.most_common(3)
    top_products = [{"name": name, "quantity": qty} for name, qty in top3]
    avg_ticket = (total_revenue // total_orders) if total_orders > 0 else 0

    # Growth % (frente a semana anterior). Si la pasada fue 0, growth=∞ → cap a 100%.
    if previous_week_revenue > 0:
        growth_pct = round(((current_week_revenue - previous_week_revenue) / previous_week_revenue) * 100, 1)
    elif current_week_revenue > 0:
        growth_pct = 100.0
    else:
        growth_pct = 0.0

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "avg_ticket": avg_ticket,
        "active_orders": active_orders,
        "revenue_by_day": revenue_by_day,
        "orders_by_hour": orders_by_hour,
        "top_products": top_products,
        "status_distribution": status_dist,
        "current_week_revenue": current_week_revenue,
        "previous_week_revenue": previous_week_revenue,
        "growth_pct": growth_pct,
    }


@router.post(
    "/reset-demo",
    summary="🎭 Modo presentación: limpia pedidos y re-seedea datos demo enriquecidos",
)
async def reset_demo(user: AuthUser = Depends(require_roles("admin"))):
    """
    Borra TODOS los pedidos y items de la BD y los reemplaza con datos demo
    enriquecidos (~70 pedidos en últimos 14 días). Pensado para presentaciones
    en vivo: deja la BD en un estado limpio + visualmente impactante.

    Solo admin. NO usar en producción con datos reales.
    """
    if not (supabase_client and SUPABASE_AVAILABLE):
        raise HTTPException(status_code=503, detail="BD no disponible")

    try:
        # 1. Limpiar TODOS los pedidos (no solo BY-DEMO*)
        all_orders = supabase_client.table("pedidos").select("id").execute().data or []
        for o in all_orders:
            supabase_client.table("pedido_items").delete().eq("id_pedido", o["id"]).execute()
        if all_orders:
            supabase_client.table("pedidos").delete().neq("id", "__sentinel__").execute()
        deleted = len(all_orders)

        # 2. Ejecutar el seed enriquecido como subprocess (aísla el contexto y carga limpia)
        script = Path(__file__).resolve().parent.parent.parent / "scripts" / "seed_demo_orders.py"
        if not script.exists():
            raise HTTPException(status_code=500, detail=f"Seed script no encontrado: {script}")

        result = subprocess.run(
            [sys.executable, str(script)],
            capture_output=True,
            text=True,
            timeout=90,
        )
        if result.returncode != 0:
            logger.error("Seed falló: %s", result.stderr[:500])
            raise HTTPException(status_code=500, detail="Error ejecutando seed demo")

        # 3. Contar lo seedeado
        new_count = (
            supabase_client.table("pedidos").select("id", count="exact").execute().count or 0
        )

        return {
            "ok": True,
            "deleted": deleted,
            "seeded": new_count,
            "by": user.email,
            "at": datetime.now(timezone.utc).isoformat(),
        }
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="El seed tardó demasiado")
    except Exception as e:
        logger.error("Error en reset-demo: %s", e)
        raise HTTPException(status_code=500, detail=f"Error: {e}")
