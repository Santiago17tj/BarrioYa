-- ==========================================================
-- BarrioYa — Esquema en Español (Fase 6.2)
-- ==========================================================

-- 1. Tabla: comercios
CREATE TABLE IF NOT EXISTS public.comercios (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    emoji TEXT,
    categoria TEXT NOT NULL,
    zona TEXT,
    estado_actividad BOOLEAN DEFAULT TRUE
);

-- 2. Tabla: catalogo
CREATE TABLE IF NOT EXISTS public.catalogo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_comercio TEXT REFERENCES public.comercios(id) ON DELETE CASCADE,
    nombre_item TEXT NOT NULL,
    tipo TEXT DEFAULT 'producto', -- 'producto' o 'servicio'
    precio INTEGER NOT NULL,
    descripcion TEXT,
    emoji TEXT,
    proveedor TEXT,
    zona TEXT,
    duracion TEXT
);

-- 3. Tabla: pedidos
CREATE TABLE IF NOT EXISTS public.pedidos (
    id TEXT PRIMARY KEY, -- ej. BY-12345678
    datos_cliente JSONB, -- Para guardar nombre, cel, etc a futuro
    total INTEGER NOT NULL,
    subtotal INTEGER,
    costo_envio INTEGER,
    id_comercio TEXT NOT NULL,
    estado TEXT DEFAULT 'recibido', -- 'recibido', 'en_camino', 'completado'
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabla: pedido_items
CREATE TABLE IF NOT EXISTS public.pedido_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    id_pedido TEXT REFERENCES public.pedidos(id) ON DELETE CASCADE,
    id_item_catalogo UUID REFERENCES public.catalogo(id) ON DELETE SET NULL,
    nombre_item TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    subtotal INTEGER NOT NULL
);

-- Limpiar tablas si ya existen
TRUNCATE TABLE public.catalogo CASCADE;
TRUNCATE TABLE public.comercios CASCADE;

-- Insertar Datos Semilla (Adaptado al esquema en español)
INSERT INTO public.comercios (id, nombre, emoji, categoria, zona) VALUES
('panaderia', 'Panadería Don José', '🧀', 'domicilios', 'Cabecera del Llano'),
('restaurante', 'Restaurante La Sazón', '🍛', 'domicilios', 'La Ciudadela'),
('tienda', 'Tienda Doña Carmen', '🛒', 'domicilios', 'Provenza'),
('mascotas', 'Mascotas', '🐾', 'mascotas', 'Tu barrio'),
('mandados', 'Mandados', '🏃', 'mandados', 'Tu barrio'),
('tecnicos', 'Técnicos & Tutores', '🔧', 'tecnicos', 'Tu barrio');

INSERT INTO public.catalogo (id_comercio, nombre_item, precio, emoji, tipo, proveedor, zona, duracion) VALUES
('panaderia', 'Pan de bono', 1000, '🧀', 'producto', NULL, NULL, NULL),
('panaderia', 'Empanada de carne', 2000, '🥟', 'producto', NULL, NULL, NULL),
('panaderia', 'Buñuelo', 1500, '🍩', 'producto', NULL, NULL, NULL),
('panaderia', 'Arepa de huevo', 3000, '🌮', 'producto', NULL, NULL, NULL),
('restaurante', 'Bandeja paisa', 15000, '🍛', 'producto', NULL, NULL, NULL),
('restaurante', 'Arroz con pollo', 12000, '🍗', 'producto', NULL, NULL, NULL),
('tienda', 'Leche entera 1L', 4500, '🥛', 'producto', NULL, NULL, NULL),
('tienda', 'Pan tajado', 6000, '🍞', 'producto', NULL, NULL, NULL),
('mascotas', 'Paseo de perro', 8000, '🐕', 'servicio', 'Andrea G.', 'Cabecera del Llano', '1 hora'),
('mascotas', 'Cuidado diurno', 25000, '🏠', 'servicio', 'Valentina S.', 'Provenza', '2 horas'),
('mandados', 'Pago de recibos', 3000, '📄', 'servicio', 'Josué L.', 'Cabecera del Llano', NULL),
('mandados', 'Recogida de paquete', 5000, '📦', 'servicio', 'Daniela R.', 'La Ciudadela', NULL),
('tecnicos', 'Plomería general', 25000, '🔧', 'servicio', 'Miguel T.', 'Cabecera del Llano', '1 hora'),
('tecnicos', 'Electricista', 30000, '⚡', 'servicio', 'Andrés V.', 'La Ciudadela', '1 hora');
