/* ==========================================================
   BarrioYa — Auth helper (Vanilla JS)
   - localStorage para tokens (clave: barrioya_auth)
   - authFetch(url, options): wrapper de fetch con Bearer + auto-refresh on 401
   - getUser(): user del JWT (sin llamar al backend)
   - logout(): revoca refresh token + limpia local
   ========================================================== */

(function () {
  const STORAGE_KEY = 'barrioya_auth';
  const API = (window.API_BASE_URL || '').replace(/\/$/, '');

  function load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }

  function save(data) {
    if (data) localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    else localStorage.removeItem(STORAGE_KEY);
  }

  function getAccessToken() { return (load() || {}).access_token || null; }
  function getRefreshToken() { return (load() || {}).refresh_token || null; }
  function getUser() { return (load() || {}).user || null; }
  function isAuthenticated() { return !!getAccessToken(); }

  async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) return null;
    try {
      const r = await fetch(`${API}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!r.ok) {
        if (r.status === 401) save(null); // refresh inválido → kick out
        return null;
      }
      const data = await r.json();
      const cur = load() || {};
      cur.access_token = data.access_token;
      save(cur);
      return data.access_token;
    } catch {
      return null;
    }
  }

  async function authFetch(url, options = {}) {
    const opts = { ...options };
    opts.headers = { ...(options.headers || {}) };
    const token = getAccessToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;

    let resp = await fetch(url, opts);
    if (resp.status === 401 && token) {
      // Intentar refresh y reintentar UNA vez
      const newToken = await refreshAccessToken();
      if (newToken) {
        opts.headers['Authorization'] = `Bearer ${newToken}`;
        resp = await fetch(url, opts);
      } else {
        // Refresh falló → forzar logout local + redirect a login
        save(null);
        if (!window.location.pathname.endsWith('/login.html')) {
          window.location.href = '/admin/login.html';
        }
      }
    }
    return resp;
  }

  async function login(email, password) {
    const r = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const detail = (data && data.detail) || 'Error al iniciar sesión';
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
    save({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    });
    return data.user;
  }

  async function logout() {
    const refresh = getRefreshToken();
    const access = getAccessToken();
    if (refresh && access) {
      try {
        await fetch(`${API}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${access}`,
          },
          body: JSON.stringify({ refresh_token: refresh }),
        });
      } catch { /* ignoramos errores de red */ }
    }
    save(null);
  }

  // Guard: redirige a login si no hay token. Usar en páginas protegidas.
  function requireAuth(allowedRoles = null) {
    const user = getUser();
    if (!user || !getAccessToken()) {
      window.location.href = '/admin/login.html';
      return false;
    }
    if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.rol)) {
      alert(`No tienes permiso para acceder. Tu rol: ${user.rol}`);
      window.location.href = '/admin/login.html';
      return false;
    }
    return true;
  }

  window.barrioyaAuth = {
    login,
    logout,
    refreshAccessToken,
    authFetch,
    getUser,
    getAccessToken,
    isAuthenticated,
    requireAuth,
  };
})();
