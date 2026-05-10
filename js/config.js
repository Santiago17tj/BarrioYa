/* ==========================================================
   BarrioYa — Configuración Global del Frontend
   Variables centralizadas que se usan en todos los scripts.
   ========================================================== */

// ── Backend API URL ──
// En localhost apunta al backend local (puerto 8000 cuando se corre `python main.py`,
// 8001 cuando se corre vía supervisor). En producción usa rutas relativas (Vercel rewrites).
const API_BASE_URL = (() => {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    // Auto-detect 8000 (dev local) vs 8001 (entorno Emergent)
    return window.location.port === '3000' ? 'http://localhost:8001' : 'http://localhost:8000';
  }
  return ''; // Producción: rutas relativas
})();

// ── Datos de contacto centralizados ──
// Cambiar AQUÍ si cambia el número (antes estaba duplicado en cart.js, checkout.js, etc.)
const BARYO_PHONE = '573046279171';
const BARYO_PHONE_DISPLAY = '+57 304 627 9171';

// ── Configuración del negocio ──
const DELIVERY_FEE = 2500;          // Costo fijo de envío en COP
const MAX_QTY_PER_ITEM = 20;        // Máximo de cantidad por producto en el carrito

// ── Exportar a window (vanilla JS, sin bundler) ──
window.API_BASE_URL = API_BASE_URL;
window.BARYO_PHONE = BARYO_PHONE;
window.BARYO_PHONE_DISPLAY = BARYO_PHONE_DISPLAY;
window.DELIVERY_FEE = DELIVERY_FEE;
window.MAX_QTY_PER_ITEM = MAX_QTY_PER_ITEM;
