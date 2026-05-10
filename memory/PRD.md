# BarrioYa — PRD (Product Requirements Document)

## Problema original
Usuario solicitó conectar su repo de GitHub (BarrioYa: HTML/CSS/JS + FastAPI) y realizar
revisión completa con búsqueda de errores y optimización. Se ejecutaron 3 fases de limpieza,
luego se conectó Supabase real, y finalmente se migró el PIN admin a auth JWT con 2 roles.

## Arquitectura
- **Frontend**: HTML/CSS/JS plano (vanilla) servido como sitio estático.
  - Páginas: `/` (landing), `/servicios.html`, `/checkout.html`, `/tracking.html`,
    `/bot-demo.html`, `/admin/login.html`, `/admin/`, `/afiliados.html`.
  - SPA hash routing en `index.html` para `#checkout`, `#tracking`, `#bot-demo`.
  - Static server: `serve` npm + `/app/serve.json` (cleanUrls:false + rewrites para `/admin*`).
- **Backend**: FastAPI 0.115 + Pydantic 2.13 + Supabase 2.30 + PyJWT + bcrypt.
  - Endpoints públicos: `GET /api/health`, `GET /api/catalogo`, `POST /api/pedidos`,
    `GET/POST /api/webhook/whatsapp`.
  - Endpoints autenticados: `POST/GET /api/auth/*`, `GET /api/pedidos`, `PATCH /api/pedidos/{id}`.
- **Persistencia**: Supabase Postgres (gxpyfvzwienmswstrfld). Fallback en memoria si BD cae.
- **Deploy**: Vercel (rewrites en `vercel.json` modernizado).
- **Entorno Emergent**: backend port 8001 (`server.py` re-exporta `app`),
  frontend port 3000 (vía `serve` package).

## Personas
1. **Cliente final** (público, sin auth): usa la PWA — catálogo, carrito, checkout, tracking, bot WhatsApp.
2. **Comerciante afiliado** (rol `comercio`, JWT): ve solo SUS pedidos en `/admin/`.
3. **Admin BarrioYa** (rol `admin`, JWT): ve TODOS los pedidos en `/admin/`.
4. **Operador BarrioYa**: recibe webhook de WhatsApp para procesar pedidos por chat.

## Lo implementado / corregido (10 ene 2026)

### Fase 1 — Bugs críticos (5 fixes)
- ✅ `js/main.js`: `if` cerrado, `window.limpiarCheckout` siempre definida
- ✅ `backend/config/settings.py`: CORS específico (no `*` con credentials)
- ✅ `js/bot-demo.js`: `new RegExp()` en lugar de literal con interpolación rota
- ✅ `backend/routes/whatsapp.py`: validación HMAC `X-Hub-Signature-256`
- ✅ `js/router.js`: PIN admin (luego REMOVIDO en migración a JWT)

### Fase 2 — Rendimiento + PWA (10 fixes)
- ✅ Imágenes optimizadas: 4042 KB → 33 KB (192) / 225 KB (512) / 30 KB (apple-touch)
- ✅ `manifest.json`: iconos optimizados (any + maskable)
- ✅ `sw.js`: `barrioYa-v2`, pre-cache completo
- ✅ `vercel.json`: formato moderno (`rewrites` + cache headers)
- ✅ `pedidos.py`: `datetime.now(timezone.utc)` + fix PATCH 404
- ✅ Nuevo `GET /api/health` accesible vía ingress público
- ✅ Todos los HTMLs unificados con iconos optimizados

### Fase 3 — Limpieza (5 fixes)
- ✅ Archivos `.bak` eliminados
- ✅ Scripts Python movidos a `/app/scripts/` con README
- ✅ Teléfono WhatsApp centralizado en `js/config.js`
- ✅ `.gitignore` robusto
- ✅ Originales movidos a `/app/assets/source/`

### Conexión Supabase real (11 ene 2026)
- ✅ `supabase` package upgraded 2.12 → 2.30 para soportar formato `sb_secret_*`
- ✅ Catálogo se sirve desde Supabase (6 negocios, 14 items reales)
- ✅ Pedidos se persisten en `pedidos` + `pedido_items` con FK
- ✅ FIX `id_comercio`: ahora guarda el `id` ('panaderia') en lugar del `nombre`

### Auth JWT con 2 roles (11 ene 2026)
- ✅ Tablas Supabase: `usuarios_admin`, `refresh_tokens`, `login_attempts`
- ✅ Backend: `auth/jwt_utils.py` (PyJWT HS256 + bcrypt rounds=12)
- ✅ Backend: `auth/dependencies.py` (`get_current_user`, `require_roles`)
- ✅ Backend: `auth/rate_limit.py` (5 intentos / 15 min, BD + memoria fallback)
- ✅ Endpoints: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`
- ✅ `GET /api/pedidos` filtra por `id_comercio` si rol es `comercio`
- ✅ `PATCH /api/pedidos/{id}` valida ownership (comercio no puede tocar pedidos ajenos → 403)
- ✅ `POST /api/pedidos` permanece público (lo usa el cliente final desde checkout)
- ✅ Frontend: `js/auth.js` con `authFetch` (auto-refresh on 401)
- ✅ Frontend: `/admin/login.html` con dark theme premium
- ✅ Frontend: `/admin/index.html` con guard JS al inicio
- ✅ Frontend: `admin.js` con `authFetch` + sidebar info de usuario + botón logout
- ✅ PIN modal del SPA router eliminado (ya no hay 1234)
- ✅ Seed admin idempotente: `scripts/seed_admin.py`
- ✅ Static server config arreglada: `/app/serve.json` con cleanUrls:false + rewrites

### Testing
- ✅ Iteration 1: 15/15 backend
- ✅ Iteration 2: 25/25 backend (post Fase 2+3)
- ✅ Iteration 3: 19/19 backend auth + 25/25 regression (frontend bloqueado por static server)
- ✅ Iteration 4: **9/9 frontend E2E con Playwright** (login admin/comercio, logout, role-based UI, error handling)

## Backlog priorizado

### P0 — Antes de producción
- [ ] Rotar `JWT_SECRET` en producción (el actual está versionado en .env de dev)
- [ ] Migrar `refresh_token` a httpOnly cookie (en vez de localStorage) para mitigar XSS
- [ ] Configurar `WHATSAPP_APP_SECRET` para validar firma HMAC en producción
- [ ] `seed_admin.py`: que solo rote password si `FORCE_ADMIN_PASSWORD_RESET=1`
- [ ] Sincronizar el catálogo (BD tiene 14 items, seed local 35) — script de sync

### P1 — Optimizaciones
- [ ] Reemplazar polling 10s en `admin.js` por Supabase Realtime
- [ ] Implementar payment gateway real (Wompi o MercadoPago — preparado en checkout.js)
- [ ] Implementar tracking GPS real (actualmente 100% mock en `tracking.js`)
- [ ] Webhook WhatsApp: integrar LLM en `services/whatsapp.py` (TODO marcado)
- [ ] CRUD comercios + asignación de comercio a usuario en panel admin

### P2 — Mantenibilidad / UX
- [ ] Reemplazar `window.confirm` del logout por modal in-app
- [ ] Dividir `index.html` (72 KB) en parciales/componentes
- [ ] Catálogo del bot consumir `/api/catalogo` en lugar de mock duplicado
- [ ] Validación de teléfono/email en formularios
- [ ] Cron job para limpiar `login_attempts` y `refresh_tokens` expirados (sugerencia ya en SQL)

## Próximos action items sugeridos
1. Push a GitHub usando "Save to GitHub" (cambios de auth + Supabase + serve.json)
2. P0: rotar JWT_SECRET y mover refresh a httpOnly cookie antes de producción
3. (Opcional pero alto impacto) sistema de cupones/descuentos primer pedido
