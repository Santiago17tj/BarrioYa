"""
BarrioYa — Datos Semilla del Catálogo
Migración exacta del objeto CATALOG definido en js/menu-page.js.
Estos datos alimentan el endpoint GET /api/catalogo.

En una fase futura, estos datos vivirán en una base de datos
y serán editables desde el panel de administración.
"""

from models.catalogo import Business, CatalogItem


# ═══════════════════════════════════════════════════════════
#  CATÁLOGO COMPLETO — SUPERAPP HIPERLOCAL
# ═══════════════════════════════════════════════════════════

CATALOG: list[Business] = [

    # ── Domicilios: Panadería Don José ──
    Business(
        id="panaderia",
        name="Panadería Don José",
        emoji="🧀",
        category="domicilios",
        zone="Cabecera del Llano",
        items=[
            CatalogItem(name="Pan de bono", price=1000, emoji="🧀"),
            CatalogItem(name="Empanada de carne", price=2000, emoji="🥟"),
            CatalogItem(name="Buñuelo", price=1500, emoji="🍩"),
            CatalogItem(name="Arepa de huevo", price=3000, emoji="🌮"),
            CatalogItem(name="Jugo de lulo", price=2500, emoji="🧃"),
            CatalogItem(name="Almojábana", price=1800, emoji="🥐"),
            CatalogItem(name="Pandebono especial", price=2000, emoji="🧀"),
            CatalogItem(name="Café con leche", price=2000, emoji="☕"),
        ],
    ),

    # ── Domicilios: Restaurante La Sazón ──
    Business(
        id="restaurante",
        name="Restaurante La Sazón",
        emoji="🍛",
        category="domicilios",
        zone="La Ciudadela",
        items=[
            CatalogItem(name="Bandeja paisa", price=15000, emoji="🍛"),
            CatalogItem(name="Arroz con pollo", price=12000, emoji="🍗"),
            CatalogItem(name="Sancocho", price=10000, emoji="🍲"),
            CatalogItem(name="Hamburguesa artesanal", price=14000, emoji="🍔"),
            CatalogItem(name="Limonada de coco", price=4000, emoji="🥥"),
            CatalogItem(name="Ceviche de camarón", price=16000, emoji="🦐"),
        ],
    ),

    # ── Domicilios: Tienda Doña Carmen ──
    Business(
        id="tienda",
        name="Tienda Doña Carmen",
        emoji="🛒",
        category="domicilios",
        zone="Provenza",
        items=[
            CatalogItem(name="Leche entera 1L", price=4500, emoji="🥛"),
            CatalogItem(name="Pan tajado", price=6000, emoji="🍞"),
            CatalogItem(name="Huevos x12", price=8000, emoji="🥚"),
            CatalogItem(name="Arroz 1kg", price=4000, emoji="🍚"),
            CatalogItem(name="Gaseosa 1.5L", price=5000, emoji="🥤"),
            CatalogItem(name="Aceite 500ml", price=7000, emoji="🫒"),
        ],
    ),

    # ── Mascotas (Servicios) ──
    Business(
        id="mascotas",
        name="Mascotas",
        emoji="🐾",
        category="mascotas",
        zone="Tu barrio",
        items=[
            CatalogItem(
                name="Paseo de perro", price=8000, emoji="🐕",
                type="service", provider="Andrea G.",
                zone="Cabecera del Llano", duration="1 hora",
            ),
            CatalogItem(
                name="Cuidado diurno", price=25000, emoji="🏠",
                type="service", provider="Valentina S.",
                zone="Provenza", duration="2 horas",
            ),
            CatalogItem(
                name="Baño canino", price=20000, emoji="🛁",
                type="service", provider="Carlos R.",
                zone="La Ciudadela",
            ),
            CatalogItem(
                name="Entrenamiento básico", price=35000, emoji="🎓",
                type="service", provider="Luis P.",
                zone="Cabecera del Llano", duration="1.5 horas",
            ),
        ],
    ),

    # ── Mandados (Servicios) ──
    Business(
        id="mandados",
        name="Mandados",
        emoji="🏃",
        category="mandados",
        zone="Tu barrio",
        items=[
            CatalogItem(
                name="Pago de recibos", price=3000, emoji="📄",
                type="service", provider="Josué L.",
                zone="Cabecera del Llano",
            ),
            CatalogItem(
                name="Recogida de paquete", price=5000, emoji="📦",
                type="service", provider="Daniela R.",
                zone="La Ciudadela",
            ),
            CatalogItem(
                name="Compra de mercado", price=8000, emoji="🛍️",
                type="service", provider="Santiago M.",
                zone="Provenza",
            ),
            CatalogItem(
                name="Fila en banco/EPS", price=10000, emoji="🏦",
                type="service", provider="Camila O.",
                zone="Cabecera del Llano",
            ),
            CatalogItem(
                name="Envío de documentos", price=4000, emoji="✉️",
                type="service", provider="Pedro M.",
                zone="La Ciudadela",
            ),
        ],
    ),

    # ── Técnicos & Tutores (Servicios) ──
    Business(
        id="tecnicos",
        name="Técnicos & Tutores",
        emoji="🔧",
        category="tecnicos",
        zone="Tu barrio",
        items=[
            CatalogItem(
                name="Plomería general", price=25000, emoji="🔧",
                type="service", provider="Miguel T.",
                zone="Cabecera del Llano", duration="1 hora",
            ),
            CatalogItem(
                name="Electricista", price=30000, emoji="⚡",
                type="service", provider="Andrés V.",
                zone="La Ciudadela", duration="1 hora",
            ),
            CatalogItem(
                name="Cerrajería", price=20000, emoji="🔑",
                type="service", provider="Paula C.",
                zone="Provenza",
            ),
            CatalogItem(
                name="Reparación electrodomésticos", price=35000, emoji="🔌",
                type="service", provider="Sofía H.",
                zone="Cabecera del Llano", duration="1.5 horas",
            ),
            CatalogItem(
                name="Tutor de matemáticas", price=20000, emoji="📐",
                type="service", provider="Laura D.",
                zone="La Ciudadela", duration="1 hora",
            ),
            CatalogItem(
                name="Tutor de inglés", price=22000, emoji="📚",
                type="service", provider="Ana R.",
                zone="Provenza", duration="1 hora",
            ),
        ],
    ),
]
