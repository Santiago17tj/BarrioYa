"""
BarrioYa — Modelos Pydantic: Catálogo
Refleja la estructura del CATALOG definido en menu-page.js del frontend.
"""

from pydantic import BaseModel


class CatalogItem(BaseModel):
    """Un producto o servicio dentro de un negocio/categoría."""
    name: str
    price: int
    emoji: str
    type: str = "product"            # "product" | "service"
    provider: str | None = None      # Solo para servicios
    zone: str | None = None          # Zona del proveedor
    duration: str | None = None      # Duración estimada del servicio


class Business(BaseModel):
    """Un negocio o categoría de servicio del catálogo hiperlocal."""
    id: str                          # Key interna (ej. "panaderia", "mascotas")
    name: str                        # Nombre visible (ej. "Panadería Don José")
    emoji: str
    category: str                    # "domicilios" | "mascotas" | "mandados" | "tecnicos"
    zone: str
    items: list[CatalogItem]


class CatalogResponse(BaseModel):
    """Respuesta completa del catálogo."""
    businesses: list[Business]
    total_businesses: int
    total_items: int
