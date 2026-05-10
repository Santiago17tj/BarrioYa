"""
BarrioYa — Modelos Pydantic: Pedidos
Refleja la estructura generada por CartManager.generateOrderJSON() en cart.js.
"""

from pydantic import BaseModel, Field


class OrderItem(BaseModel):
    """Un item individual dentro de un pedido."""
    name: str
    emoji: str
    type: str = "product"                  # "product" | "service"
    quantity: int = Field(ge=1, le=20)
    unit_price: int = Field(ge=0)
    total: int = Field(ge=0)
    # Campos opcionales para servicios
    schedule: str | None = None
    duration: str | None = None
    zone: str | None = None
    provider: str | None = None


class OrderCreate(BaseModel):
    """
    Payload que envía el frontend al crear un pedido.
    Generado por CartManager.generateOrderJSON() en cart.js.
    """
    order_id: str = Field(pattern=r"^BY-\d{8}$")    # Formato "BY-XXXXXXXX"
    business: str
    items: list[OrderItem] = Field(min_length=1)
    subtotal: int = Field(ge=0)
    delivery_fee: int = Field(ge=0)
    total: int = Field(ge=0)
    created_at: str                                   # ISO 8601


class OrderResponse(BaseModel):
    """Respuesta del servidor al recibir un pedido."""
    order_id: str
    status: str = "received"
    message: str
    estimated_time: str | None = None


class OrderStatusUpdate(BaseModel):
    """Payload para actualizar el estado de un pedido."""
    status: str
