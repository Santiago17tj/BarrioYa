# BarrioYa — PRD (Product Requirements Document)

## Problema original
Usuario solicitó conectar su repo de GitHub (BarrioYa: HTML/CSS/JS + FastAPI) y realizar
revisión completa con búsqueda de errores y optimización del código.

## Plan ejecutado (3 fases)
**Fase 1 (Críticos)** → **Fase 2 (Rendimiento + PWA)** → **Fase 3 (Limpieza)**

## Arquitectura
- **Frontend**: HTML/CSS/JS plano (vanilla) servido como sitio estático.
  - Rutas: `/` (landing), `/servicios.html`, `/checkout.html`, `/tracking.html`,
    `/bot-demo.html`, `/admin/`, `/afiliados.html`.
  - SPA hash routing en `index.html` para `#checkout`, `#tracking`, `#bot-demo`.
- **Backend**: FastAPI 0.115 + Pydantic 2.11 + Supabase (opcional, fallback en memoria).
  - Endpoints: `GET /`, `GET /api/health`, `GET /api/catalogo`, `POST/GET/PATCH /api/pedidos`,
    `GET/POST /api/webhook/whatsapp`.
- **Persistencia**: Supabase (Postgres) — opcional. Fallback a `orders_store` en memoria.
- **Deploy**: Vercel (rewrites en `vercel.json` modernizado).
- **Entorno Emergent**: backend en port 8001 vía supervisor (`server.py` re-exporta `app`),
  frontend en port 3000 vía `serve` package (`/app/frontend/package.json`).

## Personas
1. **Cliente final**: usa la PWA (catálogo + carrito + checkout + tracking + bot WhatsApp).
2. **Comerciante afiliado**: accede al panel `/admin/` (PIN 1234) para gestionar pedidos.
3. **Operador BarrioYa**: recibe webhook de WhatsApp para procesar pedidos por chat.

## Lo que se ha implementado / corregido (10 ene 2026)

### Fase 1 — Bugs críticos (5 fixes)
- ✅ `js/main.js`: `if` cerrado, `window.limpiarCheckout` ahora siempre definida
- ✅ `backend/config/settings.py`: CORS con orígenes específicos (no más `*` con credentials)
- ✅ `js/bot-demo.js`: `new RegExp()` en lugar de literal con interpolación rota
- ✅ `backend/routes/whatsapp.py`: validación HMAC `X-Hub-Signature-256`
- ✅ `js/router.js`: PIN admin con TODO de auth real + override `window.BARYO_ADMIN_PIN`

### Fase 2 — Rendimiento + PWA (10 fixes)
- ✅ Imágenes optimizadas: `BarrioYalogo.png` 4042 KB → `icon-192.png` 33 KB, `icon-512.png` 225 KB
  - Versiones `maskable` añadidas, `apple-touch-icon.png` 30 KB, display logo 166 KB
  - Original conservado en `/app/assets/source/BarrioYalogo-original.png`
- ✅ `manifest.json`: apunta a iconos optimizados (any + maskable)
- ✅ `sw.js`: `barrioYa-v2`, pre-cache completo (CSS + JS + HTML + iconos)
- ✅ `vercel.json`: formato moderno (`rewrites` + `headers` con cache-control)
- ✅ `backend/routes/pedidos.py`: `datetime.now(timezone.utc)` en lugar de `datetime.now()`
- ✅ FIX bug latente: PATCH `/api/pedidos/{id}` ahora devuelve 404 si no existe
- ✅ Nuevo `GET /api/health` accesible vía ingress público
- ✅ Todos los HTMLs unificados con iconos optimizados (favicon + apple-touch consistentes)

### Fase 3 — Limpieza (5 fixes)
- ✅ Eliminados archivos `.bak` en `/css/` y `/admin/`
- ✅ Scripts Python movidos a `/app/scripts/` con README explicativo
- ✅ Teléfono WhatsApp centralizado en `js/config.js` (`window.BARYO_PHONE`)
- ✅ `js/cart.js` y `js/checkout.js` consumen valores de `config.js` (no hardcoded)
- ✅ `.gitignore` robusto (Python + Node + secretos + backup + tests)

### Testing
- ✅ Iteration 1: 15/15 backend tests, frontend OK
- ✅ Iteration 2: **25/25 backend tests**, frontend 100% en flujos críticos

## Backlog priorizado (P0/P1/P2)

### P0 — Antes de producción
- [ ] Migrar PIN admin demo (`1234`) a auth real con backend (JWT + endpoint `/api/auth/login`)
- [ ] Configurar `WHATSAPP_APP_SECRET` en `.env` de producción para validar firma HMAC
- [ ] Configurar `SUPABASE_URL` + `SUPABASE_ANON_KEY` y ejecutar `database_setup_es.sql`

### P1 — Optimizaciones
- [ ] Reemplazar polling cada 10s en `admin.js` por Supabase Realtime / WebSockets
- [ ] Implementar payment gateway real (Wompi o MercadoPago — código ya preparado en checkout.js)
- [ ] Implementar tracking GPS real (actualmente 100% mock en `tracking.js`)
- [ ] Webhook WhatsApp: integrar LLM (GPT/Gemini) en `services/whatsapp.py` (TODO ya marcado)

### P2 — Mantenibilidad
- [ ] Dividir `index.html` (72 KB) en parciales/componentes
- [ ] Catálogo del bot (`bot-demo.js`) consumir `/api/catalogo` en lugar de mock duplicado
- [ ] `orders_store` global en memoria → no apto para multi-worker (sólo fallback dev)
- [ ] Validación de teléfono/email en formularios de checkout

## Próximos action items sugeridos
1. Push a GitHub usando "Save to GitHub" en la barra de chat
2. Configurar variables de entorno de Supabase para persistencia real
3. Implementar P0 (auth real) antes de cualquier deploy a producción
