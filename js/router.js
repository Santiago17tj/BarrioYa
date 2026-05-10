/* ==========================================================
   BarrioYa — SPA Router
   Manejo de navegación y vistas dinámicas sin recargar la página.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const views = {
    'home': document.getElementById('home-view'),
    'services': document.getElementById('services-view'),
    'checkout': document.getElementById('checkout-view'),
    'tracking': document.getElementById('tracking-view'),
    'profile': document.getElementById('profile-view'),
    'admin': document.getElementById('admin-view'),
    'bot-demo': document.getElementById('bot-demo-view')
  };

  const navItems = document.querySelectorAll('.bottom-nav-item');
  const bottomNav = document.getElementById('bottomNav');
  const navbar = document.getElementById('navbar');

  // Views where we hide main nav and bottom bar
  const fullscreenViews = ['bot-demo'];
  // El admin ahora es una página real con auth JWT (/admin/login.html → /admin/),
  // ya no se accede vía hash routing #admin. Lo dejamos como redirect por compatibilidad.

  function updateNav(activeId) {
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href && href.replace('#', '') === activeId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function renderView(hash) {
    let viewId = hash.replace('#', '').split('?')[0];

    // #admin ahora redirige a la página real con auth
    if (viewId === 'admin') {
      window.location.href = '/admin/login.html';
      return;
    }

    // Mapeo especial para categorías de servicios
    const validViews = Object.keys(views);
    const serviceCategories = ['domicilios', 'mascotas', 'mandados', 'tecnicos'];

    if (serviceCategories.includes(viewId)) {
      viewId = 'services';
    } else if (!validViews.includes(viewId)) {
      viewId = 'home';
    }

    // Ocultar todas las vistas
    Object.values(views).forEach(view => {
      if (view) {
        view.style.display = 'none';
        view.classList.remove('active');
      }
    });

    // Mostrar la vista activa
    const activeView = views[viewId];
    if (activeView) {
      activeView.style.display = 'block';
      void activeView.offsetWidth;
      activeView.classList.add('active');
    }

    // Toggle fullscreen mode (hide navbar + bottom nav)
    const isFullscreen = fullscreenViews.includes(viewId);
    if (bottomNav) bottomNav.style.display = isFullscreen ? 'none' : '';
    if (navbar) navbar.style.display = isFullscreen ? 'none' : '';

    // Update bottom nav
    updateNav(viewId);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // If we entered admin and charts exist, re-init them
    if (viewId === 'admin' && typeof window.initAdminCharts === 'function') {
      setTimeout(() => window.initAdminCharts(), 200);
    }

    // Refresh checkout if entering it
    if (viewId === 'checkout' && typeof window.renderOrderFromCart === 'function') {
      window.renderOrderFromCart();
    }
  }

  // Secciones que viven DENTRO de la vista 'home' (anchors, no vistas SPA)
  const homeSectionIds = ['inicio','servicios','negocios','como-funciona','cobertura','whatsapp','testimonios','contacto','impacto'];

  // Interceptar clicks en enlaces locales
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');

    // Ignorar links externos
    if (!href || href.startsWith('http') || href.startsWith('tel') || href.startsWith('mailto')) return;

    // EXCEPCIÓN: Si el enlace apunta a un archivo .html, navega normalmente
    if (href.includes('.html')) {
      window.location.href = href;
      return; // Detenemos el router SPA aquí
    }

    // Hash links
    if (href.startsWith('#')) {
      const hashId = href.slice(1).split('?')[0];

      // Si es una sección de home → asegurar home view + scroll suave (sin renderView)
      if (homeSectionIds.includes(hashId)) {
        e.preventDefault();
        const homeView = views.home;
        const isOnHome = homeView && homeView.classList.contains('active');
        if (!isOnHome) {
          history.pushState(null, '', '#home');
          renderView('#home');
        }
        // Scroll suave a la sección
        const doScroll = () => {
          const target = document.getElementById(hashId);
          if (target) {
            const navOffset = (navbar && navbar.offsetHeight) ? navbar.offsetHeight + 8 : 0;
            const top = target.getBoundingClientRect().top + window.pageYOffset - navOffset;
            window.scrollTo({ top, behavior: 'smooth' });
          }
        };
        if (isOnHome) doScroll();
        else setTimeout(doScroll, 220);
        return;
      }

      e.preventDefault();
      history.pushState(null, '', href);
      renderView(href);
    }
  });

  // Manejar botón "Atrás" del navegador
  window.addEventListener('popstate', () => {
    renderView(window.location.hash);
  });

  // ═══════════════════ PIN MODAL — DEPRECADO ═══════════════════
  // El acceso al panel admin migró a JWT real (/admin/login.html).
  // El modal del PIN ya no se invoca desde el router, pero el HTML del modal
  // puede seguir presente en index.html sin afectar (no se abre por nadie).
  // Si quieres limpiar el HTML, elimina #pinModal de index.html.

  // Render inicial
  renderView(window.location.hash);
});
