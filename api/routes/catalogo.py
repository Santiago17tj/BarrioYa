"""
BarrioYa — Ruta: Catálogo Multi-Servicio
GET /api/catalogo — Devuelve el catálogo completo o filtrado por categoría.
Reemplaza los datos "mock" estáticos del frontend (menu-page.js).
"""

from fastapi import APIRouter, Query, HTTPException
from models.catalogo import CatalogResponse, Business, CatalogItem
from config.db import supabase_client

router = APIRouter(prefix="/api", tags=["Catálogo"])


@router.get(
    "/catalogo",
    response_model=CatalogResponse,
    summary="Obtener catálogo de comercios y servicios",
    description=(
        "Devuelve la lista completa de negocios y prestadores de servicios "
        "hiperlocales de BarrioYa. Opcionalmente filtra por categoría."
    ),
)
async def get_catalogo(
    categoria: str | None = Query(
        default=None,
        description="Filtrar por categoría: domicilios, mascotas, mandados, tecnicos",
        examples=["domicilios", "mascotas"],
    ),
):
    """
    Endpoint principal del catálogo.

    - Sin parámetros: devuelve TODO el catálogo.
    - Con `?categoria=domicilios`: filtra solo negocios de esa categoría.

    Las categorías válidas son:
    - `domicilios` — Panaderías, restaurantes, tiendas
    - `mascotas` — Paseos, baños, cuidado
    - `mandados` — Recados, pagos, compras
    - `tecnicos` — Plomeros, electricistas, tutores
    """
    # Si no hay cliente de base de datos (fallback temporal para dev local)
    if not supabase_client:
        from data.catalogo_seed import CATALOG as fallback_catalog
        if categoria:
            filtered = [biz for biz in fallback_catalog if biz.category == categoria.lower()]
        else:
            filtered = fallback_catalog
        total_items = sum(len(biz.items) for biz in filtered)
        return CatalogResponse(
            businesses=filtered,
            total_businesses=len(filtered),
            total_items=total_items,
        )

    try:
        # Consultar la base de datos Supabase
        if categoria:
            res_biz = supabase_client.table("comercios").select("*").eq("categoria", categoria.lower()).execute()
        else:
            res_biz = supabase_client.table("comercios").select("*").execute()
            
        businesses_data = res_biz.data
        if not businesses_data:
            return CatalogResponse(businesses=[], total_businesses=0, total_items=0)
            
        # Obtener IDs de negocios para traer los items
        biz_ids = [b["id"] for b in businesses_data]
        res_items = supabase_client.table("catalogo").select("*").in_("id_comercio", biz_ids).execute()
        items_data = res_items.data
        
        # Agrupar
        businesses = []
        for b_data in businesses_data:
            b_items_data = [item for item in items_data if item["id_comercio"] == b_data["id"]]
            
            # Map back to Pydantic model structure
            b_items = []
            for item in b_items_data:
                b_items.append(CatalogItem(
                    name=item["nombre_item"],
                    price=item["precio"],
                    emoji=item.get("emoji") or "",
                    type=item.get("tipo") or "producto",
                    provider=item.get("proveedor"),
                    zone=item.get("zona"),
                    duration=item.get("duracion")
                ))
            
            biz = Business(
                id=b_data["id"],
                name=b_data["nombre"],
                emoji=b_data.get("emoji") or "",
                category=b_data["categoria"],
                zone=b_data.get("zona"),
                items=b_items
            )
            businesses.append(biz)
            
        return CatalogResponse(
            businesses=businesses,
            total_businesses=len(businesses),
            total_items=len(items_data),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en base de datos: {str(e)}")
