-- ═══════════════════════════════════════════════════════════
--  BarrioYa — Migration 002: Auth Tables
--  Crea las tablas necesarias para autenticación JWT con 2 roles.
--  Ejecutar en Supabase SQL Editor o vía scripts/run_sql.py.
-- ═══════════════════════════════════════════════════════════

-- ── Tipo enumerado de roles ──
DO $$ BEGIN
  CREATE TYPE rol_usuario AS ENUM ('admin', 'comercio');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ── Tabla de usuarios del panel admin ──
CREATE TABLE IF NOT EXISTS usuarios_admin (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  nombre          TEXT NOT NULL DEFAULT '',
  rol             rol_usuario NOT NULL DEFAULT 'comercio',
  id_comercio     TEXT REFERENCES comercios(id) ON DELETE SET NULL,
  activo          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_usuarios_admin_email ON usuarios_admin (lower(email));
CREATE INDEX IF NOT EXISTS idx_usuarios_admin_id_comercio ON usuarios_admin (id_comercio);

-- ── Refresh tokens (hasheados) ──
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES usuarios_admin(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens (expires_at);

-- ── Login attempts (rate limit / brute force) ──
CREATE TABLE IF NOT EXISTS login_attempts (
  id              BIGSERIAL PRIMARY KEY,
  identifier      TEXT NOT NULL,        -- formato: "{ip}:{email}"
  attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  success         BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts (identifier, attempted_at DESC);

-- ── Limpieza automática (cron-friendly): elimina attempts > 24h ──
-- Ejecutar manualmente o via pg_cron si está habilitado:
-- DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '24 hours';
-- DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked = true;
