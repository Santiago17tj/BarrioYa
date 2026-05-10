"""
BarrioYa — Ruta: Recepción de Pedidos
POST /api/pedidos — Recibe y valida el JSON generado por CartManager.
"""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from models.pedidos import OrderCreate, OrderResponse, OrderStatusUpdate
from config.db import supabase_client, SUPABASE_AVAILABLE

logger = logging.getLogger("barrioya.pedidos")

router = APIRouter(prefix="/api", tags=["Pedidos"])

# ── Almacenamiento en memoria (fallback local) ──
orders_store: list[dict] = []


@router.post(
    "/pedidos",
    response_model=OrderResponse,
    status_code=200,
    summary="Recibir un pedido del frontend",
    description=(
        "Recibe el JSON generado por CartManager.generateOrderJSON() en el frontend. "
        "Valida la estructura, almacena temporalmente en memoria y devuelve "
        "un ID de orden con estado 'received'."
    ),
)
async def create_pedido(order: OrderCreate):
    """
    Endpoint de recepción de pedidos.

    Validaciones automáticas (vía Pydantic):
    - `order_id` debe tener formato "BY-XXXXXXXX"
    - `items` debe tener al menos 1 elemento
    - Cada item debe tener quantity >= 1 y <= 20
    - Precios deben ser >= 0

    Validaciones adicionales:
    - El total declarado debe coincidir con subtotal + delivery_fee
    - El subtotal debe coincidir con la suma de los totales de items
    """

    # ── Validación de integridad: subtotal ──
    calculated_subtotal = sum(item.total for item in order.items)
    if calculated_subtotal != order.subtotal:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Subtotal no coincide: declarado ${order.subtotal:,}, "
                f"calculado ${calculated_subtotal:,}"
            ),
        )

    # ── Validación de integridad: total ──
    calculated_total = order.subtotal + order.delivery_fee
    if calculated_total != order.total:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Total no coincide: declarado ${order.total:,}, "
                f"esperado ${calculated_total:,} (subtotal + delivery_fee)"
            ),
        )

    # ── Validación de integridad: unit_price * quantity = total por item ──
    for item in order.items:
        expected = item.unit_price * item.quantity
        if expected != item.total:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Total del item '{item.name}' no coincide: "
                    f"declarado ${item.total:,}, "
                    f"esperado ${expected:,} ({item.unit_price} × {item.quantity})"
                ),
            )

    # ── Almacenar pedido ──
    order_data = order.model_dump()
    order_data["received_at"] = datetime.now(timezone.utc).isoformat()
    order_data["internal_status"] = "received"
    
    if supabase_client and SUPABASE_AVAILABLE:
        try:
            # 1. Insertar orden
            supabase_client.table("pedidos").insert({
                "id": order.order_id,
                "id_comercio": order.business,
                "subtotal": order.subtotal,
                "costo_envio": order.delivery_fee,
                "total": order.total,
                "estado": "recibido",
                "datos_cliente": {} # Placeholder para futura info del cliente
            }).execute()
            
            # 2. Insertar items
            items_to_insert = []
            for item in order.items:
                items_to_insert.append({
                    "id_pedido": order.order_id,
                    "nombre_item": item.name,
                    "cantidad": item.quantity,
                    "subtotal": item.total
                })
            
            supabase_client.table("pedido_items").insert(items_to_insert).execute()
        except Exception as e:
            logger.error("❌ Error guardando pedido en Supabase: %s", e)
            # Guardamos en memoria como fallback para que no falle la app
            orders_store.append(order_data)
    else:
        # Fallback si no hay conexión a BD
        orders_store.append(order_data)

    logger.info(
        "📦 Pedido recibido: %s | %s | %d items | Total: $%s",
        order.order_id,
        order.business,
        len(order.items),
        f"{order.total:,}",
    )

    # ── Determinar tiempo estimado ──
    has_products = any(item.type == "product" for item in order.items)
    estimated = "20-35 min" if has_products else "Según horario seleccionado"

    return OrderResponse(
        order_id=order.order_id,
        status="received",
        message="Pedido recibido exitosamente. Un comercio lo preparará pronto.",
        estimated_time=estimated,
    )


@router.get(
    "/pedidos",
    summary="Listar pedidos recibidos (Admin)",
    tags=["Admin"],
)
async def list_pedidos():
    """Endpoint para el panel de administración."""
    if supabase_client and SUPABASE_AVAILABLE:
        try:
            # Traer pedidos con sus items
            res = supabase_client.table("pedidos").select("*, pedido_items(*)").order("fecha_creacion", desc=True).execute()
            return res.data
        except Exception as e:
            logger.error("❌ Error consultando pedidos en Supabase: %s", e)
            return orders_store
            
    return orders_store


@router.patch(
    "/pedidos/{order_id}",
    summary="Actualizar estado de un pedido",
    tags=["Admin"],
)
async def update_pedido_status(order_id: str, update: OrderStatusUpdate):
    """
    Actualiza el estado de un pedido específico.
    """
    new_status = update.status
    updated_in_db = False

    # 1. Actualizar en Supabase si está disponible
    if supabase_client and SUPABASE_AVAILABLE:
        try:
            res = supabase_client.table("pedidos").update({"estado": new_status}).eq("id", order_id).execute()
            if res.data:
                updated_in_db = True
                logger.info("✅ Estado de pedido %s actualizado a %s en Supabase", order_id, new_status)
            else:
                logger.warning("⚠️  Pedido %s no encontrado en Supabase, intentando fallback", order_id)
        except Exception as e:
            logger.error("❌ Error actualizando pedido en Supabase: %s", e)

    # 2. Actualizar en memoria (fallback/local)
    found = False
    for order in orders_store:
        if order.get("order_id") == order_id or order.get("id") == order_id:
            order["internal_status"] = new_status
            order["estado"] = new_status
            found = True
            break

    # 404 sólo si NO se actualizó en BD ni en memoria
    if not updated_in_db and not found:
        raise HTTPException(status_code=404, detail=f"Pedido {order_id} no encontrado")

    return {"status": "success", "order_id": order_id, "new_status": new_status}
