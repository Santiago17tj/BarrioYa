-- ==========================================================
-- BarrioYa — Supabase Schema & Seed Data
-- ==========================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase.

-- 1. Crear tabla de negocios (businesses)
CREATE TABLE IF NOT EXISTS public.businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT,
    category TEXT NOT NULL,
    zone TEXT NOT NULL
);

-- 2. Crear tabla de items del catálogo (catalog_items)
CREATE TABLE IF NOT EXISTS public.catalog_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    emoji TEXT,
    type TEXT DEFAULT 'product',
    provider TEXT,
    zone TEXT,
    duration TEXT
);

-- 3. Crear tabla de pedidos (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    order_id TEXT PRIMARY KEY, -- ej. BY-12345678
    business_id TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    delivery_fee INTEGER NOT NULL,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'received',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crear tabla de items de pedidos (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT REFERENCES public.orders(order_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT,
    type TEXT DEFAULT 'product',
    quantity INTEGER NOT NULL,
    unit_price INTEGER NOT NULL,
    total INTEGER NOT NULL,
    schedule TEXT,
    duration TEXT,
    zone TEXT,
    provider TEXT
);

-- 5. Insertar datos semilla (Seed Data)
-- Limpiar tablas primero para evitar duplicados si se corre varias veces
TRUNCATE TABLE public.catalog_items CASCADE;
TRUNCATE TABLE public.businesses CASCADE;

INSERT INTO public.businesses (id, name, emoji, category, zone) VALUES
('panaderia', 'Panadería Don José', '🧀', 'domicilios', 'Cabecera del Llano'),
('restaurante', 'Restaurante La Sazón', '🍛', 'domicilios', 'La Ciudadela'),
('tienda', 'Tienda Doña Carmen', '🛒', 'domicilios', 'Provenza'),
('mascotas', 'Mascotas', '🐾', 'mascotas', 'Tu barrio'),
('mandados', 'Mandados', '🏃', 'mandados', 'Tu barrio'),
('tecnicos', 'Técnicos & Tutores', '🔧', 'tecnicos', 'Tu barrio');

INSERT INTO public.catalog_items (business_id, name, price, emoji, type, provider, zone, duration) VALUES
-- Panaderia
('panaderia', 'Pan de bono', 1000, '🧀', 'product', NULL, NULL, NULL),
('panaderia', 'Empanada de carne', 2000, '🥟', 'product', NULL, NULL, NULL),
('panaderia', 'Buñuelo', 1500, '🍩', 'product', NULL, NULL, NULL),
('panaderia', 'Arepa de huevo', 3000, '🌮', 'product', NULL, NULL, NULL),
('panaderia', 'Jugo de lulo', 2500, '🧃', 'product', NULL, NULL, NULL),
('panaderia', 'Almojábana', 1800, '🥐', 'product', NULL, NULL, NULL),
('panaderia', 'Pandebono especial', 2000, '🧀', 'product', NULL, NULL, NULL),
('panaderia', 'Café con leche', 2000, '☕', 'product', NULL, NULL, NULL),
-- Restaurante
('restaurante', 'Bandeja paisa', 15000, '🍛', 'product', NULL, NULL, NULL),
('restaurante', 'Arroz con pollo', 12000, '🍗', 'product', NULL, NULL, NULL),
('restaurante', 'Sancocho', 10000, '🍲', 'product', NULL, NULL, NULL),
('restaurante', 'Hamburguesa artesanal', 14000, '🍔', 'product', NULL, NULL, NULL),
('restaurante', 'Limonada de coco', 4000, '🥥', 'product', NULL, NULL, NULL),
('restaurante', 'Ceviche de camarón', 16000, '🦐', 'product', NULL, NULL, NULL),
-- Tienda
('tienda', 'Leche entera 1L', 4500, '🥛', 'product', NULL, NULL, NULL),
('tienda', 'Pan tajado', 6000, '🍞', 'product', NULL, NULL, NULL),
('tienda', 'Huevos x12', 8000, '🥚', 'product', NULL, NULL, NULL),
('tienda', 'Arroz 1kg', 4000, '🍚', 'product', NULL, NULL, NULL),
('tienda', 'Gaseosa 1.5L', 5000, '🥤', 'product', NULL, NULL, NULL),
('tienda', 'Aceite 500ml', 7000, '🫒', 'product', NULL, NULL, NULL),
-- Mascotas
('mascotas', 'Paseo de perro', 8000, '🐕', 'service', 'Andrea G.', 'Cabecera del Llano', '1 hora'),
('mascotas', 'Cuidado diurno', 25000, '🏠', 'service', 'Valentina S.', 'Provenza', '2 horas'),
('mascotas', 'Baño canino', 20000, '🛁', 'service', 'Carlos R.', 'La Ciudadela', NULL),
('mascotas', 'Entrenamiento básico', 35000, '🎓', 'service', 'Luis P.', 'Cabecera del Llano', '1.5 horas'),
-- Mandados
('mandados', 'Pago de recibos', 3000, '📄', 'service', 'Josué L.', 'Cabecera del Llano', NULL),
('mandados', 'Recogida de paquete', 5000, '📦', 'service', 'Daniela R.', 'La Ciudadela', NULL),
('mandados', 'Compra de mercado', 8000, '🛍️', 'service', 'Santiago M.', 'Provenza', NULL),
('mandados', 'Fila en banco/EPS', 10000, '🏦', 'service', 'Camila O.', 'Cabecera del Llano', NULL),
('mandados', 'Envío de documentos', 4000, '✉️', 'service', 'Pedro M.', 'La Ciudadela', NULL),
-- Tecnicos
('tecnicos', 'Plomería general', 25000, '🔧', 'service', 'Miguel T.', 'Cabecera del Llano', '1 hora'),
('tecnicos', 'Electricista', 30000, '⚡', 'service', 'Andrés V.', 'La Ciudadela', '1 hora'),
('tecnicos', 'Cerrajería', 20000, '🔑', 'service', 'Paula C.', 'Provenza', NULL),
('tecnicos', 'Reparación electrodomésticos', 35000, '🔌', 'service', 'Sofía H.', 'Cabecera del Llano', '1.5 horas'),
('tecnicos', 'Tutor de matemáticas', 20000, '📐', 'service', 'Laura D.', 'La Ciudadela', '1 hora'),
('tecnicos', 'Tutor de inglés', 22000, '📚', 'service', 'Ana R.', 'Provenza', '1 hora');
