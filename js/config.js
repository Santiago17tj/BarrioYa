/* ==========================================================
   BarrioYa — Global Configuration
   ========================================================== */

// Base URL para el backend (FastAPI)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:8000' 
    : ''; // En Vercel usamos rutas relativas

// Exportar para que otros scripts lo usen si fuera necesario
// (Aunque en Vanilla lo usamos como variable global)
window.API_BASE_URL = API_BASE_URL;
