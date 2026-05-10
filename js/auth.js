/* ==========================================================
   BarrioYa — Auth helper (Vanilla JS) — v2 con httpOnly cookies
   - access_token en localStorage (necesario en JS para el header Authorization)
   - refresh_token en cookie httpOnly (NO accesible desde JS — mitiga XSS)
   - authFetch(url, options) → Bearer + auto-refresh on 401 + credentials:'include'
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
  function getUser() { return (load() || {}).user || null; }
  function isAuthenticated() { return !!getAccessToken(); }

  async function refreshAccessToken() {
    // El refresh_token viaja como cookie httpOnly → necesitamos credentials:'include'
    try {
      const r = await fetch(`${API}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!r.ok) {
        if (r.status === 401) save(null);
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
    opts.credentials = 'include';                 // siempre incluir cookies
    opts.headers = { ...(options.headers || {}) };
    const token = getAccessToken();
    if (token) opts.headers['Authorization'] = `Bearer ${token}`;

    let resp = await fetch(url, opts);
    if (resp.status === 401 && token) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        opts.headers['Authorization'] = `Bearer ${newToken}`;
        resp = await fetch(url, opts);
      } else {
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
      credentials: 'include',                     // recibir la cookie httpOnly
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      const detail = (data && data.detail) || 'Error al iniciar sesión';
      throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
    }
    // ★ NO guardamos refresh_token en JS — vive solo en la cookie httpOnly
    save({
      access_token: data.access_token,
      user: data.user,
    });
    return data.user;
  }

  async function logout() {
    const access = getAccessToken();
    if (access) {
      try {
        await fetch(`${API}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include',                 // mandar cookie para revocarla
          headers: { 'Authorization': `Bearer ${access}` },
        });
      } catch { /* ignore */ }
    }
    save(null);
  }

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
