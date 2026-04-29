/* ==========================================================
   BarrioYa — SPA Router
   Manejo de navegación y vistas dinámicas sin recargar la página.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const views = {
    'home': document.getElementById('home-view'),
    'services': document.getElementById('services-view'),
    'checkout': document.getElementById('checkout-view'),
    'tracking': document.getElementById('tracking-view')
  };

  const navItems = document.querySelectorAll('.bottom-nav-item');

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
    // Si no hay hash o es uno desconocido, por defecto ir a home
    let viewId = hash.replace('#', '').split('?')[0];
    
    // Mapeo especial para categorías de servicios (ej. #mascotas -> services-view)
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
      // Forzar reflujo para activar animación CSS
      void activeView.offsetWidth;
      activeView.classList.add('active');
    }

    // Actualizar menú inferior
    updateNav(viewId);

    // Si navegó al home o a servicios, scrollear arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Interceptar clicks en enlaces locales
  document.body.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    
    // Ignorar links externos o que apuntan a protocolos como wa.me
    if (!href || href.startsWith('http') || href.startsWith('tel') || href.startsWith('mailto')) return;

    // Si el link apunta a un HTML antiguo (ej. servicios.html#mascotas) interceptar y transformar
    if (href.includes('.html')) {
      e.preventDefault();
      
      let targetHash = 'home';
      if (href.includes('servicios.html')) {
        const parts = href.split('#');
        targetHash = parts.length > 1 ? parts[1] : 'services';
      } else if (href.includes('checkout.html')) {
        targetHash = 'checkout';
      } else if (href.includes('tracking.html')) {
        targetHash = 'tracking';
      }

      history.pushState(null, '', `#${targetHash}`);
      renderView(`#${targetHash}`);
    }
  });

  // Manejar botón "Atrás" del navegador
  window.addEventListener('popstate', () => {
    renderView(window.location.hash);
  });

  // Render inicial
  renderView(window.location.hash);
});
