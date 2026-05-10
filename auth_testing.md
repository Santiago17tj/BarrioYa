# BarrioYa Auth Testing Playbook

## Stack
- Backend: FastAPI + Supabase Postgres (NO MongoDB)
- Frontend: Vanilla JS (NO React) — admin panel en `/admin/`
- Auth: JWT custom (PyJWT) + bcrypt + 2 roles (admin, comercio)

## Tablas Supabase nuevas
- `usuarios_admin`: id, email, password_hash, nombre, rol (admin|comercio), id_comercio (fk nullable), activo, created_at, last_login_at
- `refresh_tokens`: id, user_id, token_hash (sha256), expires_at, revoked, created_at

## Endpoints
- `POST /api/auth/login` { email, password } → { access_token, refresh_token, user }
- `POST /api/auth/refresh` { refresh_token } → { access_token }
- `POST /api/auth/logout` (auth required) → { ok: true }
- `GET  /api/auth/me` (auth required) → user object

## Endpoints protegidos
- `GET /api/pedidos` → roles: admin (todos) | comercio (filtrados por id_comercio del JWT)
- `PATCH /api/pedidos/{id}` → roles: admin | comercio (validar que el pedido es suyo)

## Credenciales de prueba (seed)
- Admin: santiago@barrioya.co / AdminBarrioYa2026*

## Curl tests

```bash
# 1. Login (debe devolver tokens)
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"santiago@barrioya.co","password":"AdminBarrioYa2026*"}'

# 2. /me con Authorization Bearer
TOKEN=$(curl -s -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"santiago@barrioya.co","password":"AdminBarrioYa2026*"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl http://localhost:8001/api/auth/me -H "Authorization: Bearer $TOKEN"

# 3. Login con password incorrecto (debe fallar 401)
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"santiago@barrioya.co","password":"wrong"}'

# 4. Brute force lockout (6 intentos en 15 min)
for i in 1 2 3 4 5 6; do
  curl -s -X POST http://localhost:8001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"santiago@barrioya.co","password":"wrong"}' \
    -w "\n[$i] HTTP %{http_code}\n"
done
# El 6to intento debe devolver 429

# 5. PATCH /api/pedidos sin token → 401
curl -X PATCH http://localhost:8001/api/pedidos/BY-12345678 \
  -H "Content-Type: application/json" \
  -d '{"status":"preparando"}'

# 6. PATCH con token de admin → 200 o 404 (no 401)
curl -X PATCH http://localhost:8001/api/pedidos/BY-12345678 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"preparando"}'
```

## Frontend tests
1. Visita `/admin/login.html` → ingresa santiago@barrioya.co + password → debe redirigir a `/admin/`
2. Refresh la página de admin → debe mantener la sesión (auto-call a /me con el token de localStorage)
3. Click en "Cerrar sesión" → debe limpiar tokens y redirigir al login
4. Después de 15 min de inactividad → la siguiente llamada debe auto-refrescar el token
