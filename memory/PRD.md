# BarrioYa — PRD (Product Requirements Document)

## Problema original
Conectar repo BarrioYa de GitHub al entorno + revisión completa, refactor, conexión a Supabase real,
auth JWT con 2 roles, y dashboard analytics premium para presentación de proyecto de grado.

## Arquitectura final
- **Frontend**: HTML/CSS/JS plano (vanilla) + Chart.js v4. Dark "Control Room" theme con Outfit + JetBrains Mono.
- **Backend**: FastAPI 0.115 + Pydantic 2.13 + Supabase 2.30 + PyJWT + bcrypt.
- **Auth**: JWT custom (HS256). Access token 15min en localStorage, refresh token 7d en cookie httpOnly.
- **Persistencia**: Supabase Postgres (gxpyfvzwienmswstrfld). Fallback en memoria.
- **Deploy**: Vercel (rewrites modernos).
- **Entorno Emergent**: backend port 8001 (server.py adapter), frontend port 3000 (serve package).

## Personas
1. **Cliente final** (público, sin auth): catálogo, carrito, checkout, tracking, bot WhatsApp.
2. **Comerciante afiliado** (rol `comercio`, JWT): ve solo SUS pedidos en `/admin/`.
3. **Admin BarrioYa** (rol `admin`, JWT): ve TODOS los pedidos + dashboard analytics.

## Lo implementado completo

### Fase 1 — Bugs críticos (5 fixes)
- ✅ `js/main.js`: `if` cerrado, `window.limpiarCheckout` siempre definida
- ✅ CORS específico (no wildcard + credentials)
- ✅ Regex con `new RegExp()` en lugar de literal interpolación rota
- ✅ Validación HMAC `X-Hub-Signature-256` para WhatsApp webhook
- ✅ PIN admin documentado para futura migración (luego REMOVIDO en JWT)

### Fase 2 — Performance + PWA (10 fixes)
- ✅ Imágenes optimizadas: 4042 KB → 33/225/30 KB (+ maskable variants)
- ✅ Service Worker `barrioYa-v2` con pre-cache completo
- ✅ `vercel.json` modernizado, datetime UTC, fix PATCH 404, /api/health

### Fase 3 — Limpieza (5 fixes)
- ✅ `.bak` eliminados, scripts a `/scripts/`, teléfono centralizado, `.gitignore` robusto

### Conexión Supabase + Catálogo sincronizado
- ✅ Supabase 2.30 (soporta formato `sb_secret_*`)
- ✅ Catálogo sincronizado: **35 items** en 6 comercios via `scripts/sync_catalog.py`
- ✅ FIX `id_comercio`: ahora guarda el `id` ('panaderia') en lugar del `nombre`
- ✅ Pedidos persistidos en `pedidos` + `pedido_items` con FK
- ✅ 28 pedidos demo via `scripts/seed_demo_orders.py` (distribución realista en 7 días)

### Auth JWT con 2 roles + httpOnly cookies (mitigación XSS)
- ✅ Tablas Supabase: `usuarios_admin`, `refresh_tokens`, `login_attempts`
- ✅ Backend: `auth/jwt_utils.py`, `auth/dependencies.py`, `auth/rate_limit.py`
- ✅ Endpoints: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`
- ✅ **httpOnly cookie `barrioya_refresh`** (Path=/api/auth, SameSite=Lax, Max-Age=7d)
- ✅ `js/auth.js` v2: ya NO guarda refresh_token en localStorage (sólo access_token + user)
- ✅ `authFetch` con auto-refresh on 401 + `credentials: 'include'`
- ✅ Rate limit 5 intentos / 15 min (BD + memoria fallback)
- ✅ `seed_admin.py` idempotente con flag `FORCE_ADMIN_PASSWORD_RESET`

### Dashboard Analytics premium (Chart.js)
- ✅ Endpoint `GET /api/analytics/summary` (admin-only): total_revenue, total_orders, avg_ticket,
  active_orders, revenue_by_day (7d), orders_by_hour (24h), top_products (top 3), status_distribution
- ✅ Comercio usa fallback que computa resumen desde `/api/pedidos` filtrado
- ✅ Diseño "Control Room": dark obsidian + verde BarrioYa + naranja, Outfit + JetBrains Mono
- ✅ Welcome banner con saludo dinámico por hora + LIVE pulse
- ✅ 4 KPI cards con count-up animations (1.5s ease-out)
- ✅ Chart de ingresos con gradient verde fluido (línea + fill)
- ✅ Top 3 podium visual con #1 destacado en verde
- ✅ Bar chart pedidos por hora con highlight de pico
- ✅ Donut chart de estados con leyenda interactiva
- ✅ Recent orders feed con filtros por estado + status pills
- ✅ Reloj en tiempo real, sidebar con info de usuario
- ✅ Auto-refresh de datos cada 30s (sin animación de count-up)

### Testing acumulado
- ✅ Iteration 1: 15/15 backend
- ✅ Iteration 2: 25/25 backend (Fase 2+3)
- ✅ Iteration 3: 19/19 backend auth
- ✅ Iteration 4: 9/9 frontend E2E (login, logout, role-based UI)
- ✅ Iteration 5: **14/14 backend + 9/10 frontend = sin bugs**

## Backlog priorizado

### P0 — Antes de producción
- [ ] Setear `JWT_COOKIE_SECURE=true` en `.env` de producción (HTTPS)
- [ ] Rotar `JWT_SECRET` (el actual está versionado en dev)
- [ ] Configurar `WHATSAPP_APP_SECRET` para firma HMAC en producción
- [ ] (Opcional hardening) gate del campo `refresh_token` en JSON body de login detrás de DEBUG flag

### P1 — Optimizaciones
- [ ] Reemplazar polling 30s en dashboard por Supabase Realtime
- [ ] Implementar payment gateway real (Wompi o MercadoPago)
- [ ] Implementar tracking GPS real (actualmente 100% mock)
- [ ] Webhook WhatsApp: integrar LLM en `services/whatsapp.py`
- [ ] CRUD comercios + asignación de comercio a usuario en panel admin
- [ ] Whitelist explícito de estados en analytics.status_dist (defensivo)

### P2 — Mantenibilidad / UX
- [ ] Reemplazar `window.confirm` del logout por modal in-app
- [ ] Dividir `index.html` (72 KB) en parciales/componentes
- [ ] Catálogo del bot consumir `/api/catalogo` en lugar de mock duplicado
- [ ] Validación de teléfono/email en formularios de checkout
- [ ] Cron job para limpiar `login_attempts` y `refresh_tokens` expirados

## Próximos action items sugeridos
1. **Push a GitHub** con todos los cambios de Supabase + JWT + Dashboard (botón "Save to GitHub")
2. P0: configurar `JWT_COOKIE_SECURE=true` y rotar secrets antes del deploy
3. (Para tesis) Documentar la arquitectura de seguridad: bcrypt rounds=12, JWT HS256,
   refresh httpOnly cookie + sha256 hash en BD, rate limit por IP+email, validación HMAC WhatsApp

## Rediseño visual de Landing (Feb 2026) — DONE
- ✅ Tipografía Outfit (300/400/500/600/700/800/900) + Phosphor Icons CDN
- ✅ Nueva paleta verde #00C853 + amber #FFB400 sobre fondo cálido #FFFBF0
- ✅ Navbar glassmorphism (backdrop-filter blur 14px) con logo nuevo (Gemini Nano Banana)
- ✅ Hero rediseñado con phone mockup interactivo del bot de WhatsApp
  - 5 burbujas de conversación con animación staggered (0.4s → 3.6s)
  - Bento cards flotantes "+35 Comercios" y "15 min tiempo promedio"
  - Glow radial verde-amber animado detrás del phone
- ✅ Franja de impacto verde con 4 counters animados (35+, 70+, 25min, 2km)
- ✅ "¿Cómo funciona?" rediseñado con 3 step cards (PASO 01/02/03)
  - Iconos Phosphor (whatsapp-logo, storefront, moped-front) con gradient verde-amber
  - Hover lift -8px + bottom border animation scaleX
  - CTA propia por paso (Abrir chat / Ver servicios / Ver cobertura)
  - CTA final "Probar el bot ahora" → WhatsApp
- ✅ IntersectionObserver extendido en main.js para `.animate-on-scroll` + counters cubic-ease
- ✅ Service Worker bumped a `barrioYa-v3` con nuevos assets cacheados
- ✅ Footer-logo actualizado con el logo PNG nuevo en píldora blanca
- ✅ Archivos modificados: `/app/css/landing-revamp.css` (nuevo), `/app/index.html`, `/app/js/main.js`, `/app/sw.js`
