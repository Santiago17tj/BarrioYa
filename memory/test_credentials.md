# BarrioYa — Test Credentials

## Frontend
- **PIN Admin** (acceso al panel `/admin/` o `#admin`): `1234`
  - Sobreescribible vía `window.BARYO_ADMIN_PIN` (definir antes de cargar `router.js`)
  - ⚠️ TODO PRODUCCIÓN: migrar a JWT + `/api/auth/login`

## Backend
- **WhatsApp Verify Token** (config Meta Webhook): `barrioya_verify_2026`
  - Configurable vía `WHATSAPP_VERIFY_TOKEN` en `backend/.env`
- **WhatsApp App Secret** (validación HMAC X-Hub-Signature-256): vacío en dev (modo bypass)
  - Configurable vía `WHATSAPP_APP_SECRET` en `backend/.env`
  - ⚠️ OBLIGATORIO en producción

## Base de datos
- **Supabase**: NO configurado en este entorno
  - El backend usa `orders_store` en memoria como fallback
  - Para activar: definir `SUPABASE_URL` + `SUPABASE_ANON_KEY` en `backend/.env`
  - Schema en `database_setup_es.sql`

## Endpoints útiles para test manual
```bash
# Health
curl http://localhost:8001/api/health

# Catálogo
curl http://localhost:8001/api/catalogo
curl http://localhost:8001/api/catalogo?categoria=mascotas

# Crear pedido
curl -X POST http://localhost:8001/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{"order_id":"BY-12345678","business":"Test","items":[{"name":"X","emoji":"X","type":"product","quantity":1,"unit_price":100,"total":100}],"subtotal":100,"delivery_fee":2500,"total":2600,"created_at":"2026-01-15T10:00:00Z"}'

# Listar pedidos
curl http://localhost:8001/api/pedidos

# Actualizar estado
curl -X PATCH http://localhost:8001/api/pedidos/BY-12345678 \
  -H "Content-Type: application/json" \
  -d '{"status":"preparando"}'

# WhatsApp verify
curl "http://localhost:8001/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=barrioya_verify_2026&hub.challenge=12345"
```
