# BarrioYa — Test Credentials

## Usuarios JWT (panel admin)
| Rol | Email | Password | id_comercio |
|---|---|---|---|
| admin | `santiago@barrioya.co` | `AdminBarrioYa2026*` | `null` (ve TODO) |
| comercio | `donjose@barrioya.co` | `Panaderia2026*` | `panaderia` |

> ⚠️ Estos son valores de DEV/seed. **Rotar en producción** antes del cutover.
> El admin se crea/actualiza al correr `python /app/scripts/seed_admin.py` (lee de `.env`).

## Backend
- **WhatsApp Verify Token** (Meta Webhook): `barrioya_verify_2026` → `WHATSAPP_VERIFY_TOKEN`
- **WhatsApp App Secret** (HMAC): vacío en dev (modo bypass). En prod: `WHATSAPP_APP_SECRET`.
- **JWT_SECRET**: hex de 64 chars en `/app/backend/.env` (rotar antes de prod)

## Base de datos
- **Supabase**: `https://gxpyfvzwienmswstrfld.supabase.co`
- Service role key: en `/app/backend/.env` como `SUPABASE_ANON_KEY`
- Tablas: `comercios`, `catalogo`, `pedidos`, `pedido_items`, `usuarios_admin`, `refresh_tokens`, `login_attempts`

## Endpoints útiles para test manual

```bash
API="http://localhost:8001"

# Health
curl $API/api/health

# Catálogo (público)
curl $API/api/catalogo

# Crear pedido (público — checkout)
curl -X POST $API/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{"order_id":"BY-12345678","business":"Panadería Don José","items":[{"name":"Pan","emoji":"🥖","type":"product","quantity":1,"unit_price":1000,"total":1000}],"subtotal":1000,"delivery_fee":2500,"total":3500,"created_at":"2026-01-15T10:00:00Z"}'

# Login (admin)
TOKEN=$(curl -s -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"santiago@barrioya.co","password":"AdminBarrioYa2026*"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# Listar pedidos (admin → todos)
curl $API/api/pedidos -H "Authorization: Bearer $TOKEN"

# /me
curl $API/api/auth/me -H "Authorization: Bearer $TOKEN"

# Login como comercio → solo ve pedidos de panaderia
TOKEN_COM=$(curl -s -X POST $API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"donjose@barrioya.co","password":"Panaderia2026*"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl $API/api/pedidos -H "Authorization: Bearer $TOKEN_COM"

# Actualizar estado de un pedido (admin o comercio dueño)
curl -X PATCH $API/api/pedidos/BY-12345678 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"preparando"}'
```

## Limpieza si rate limit bloquea

```python
from supabase import create_client
import os
c = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_ANON_KEY'])
c.table('login_attempts').delete().neq('id', 0).execute()
```
