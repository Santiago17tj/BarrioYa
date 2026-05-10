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
  const fullscreenViews = ['admin', 'bot-demo'];
  // Views that require PIN auth
  const protectedViews = ['admin', 'bot-demo'];

  window.adminUnlocked = false;

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

    // Mapeo especial para categorías de servicios
    const validViews = Object.keys(views);
    const serviceCategories = ['domicilios', 'mascotas', 'mandados', 'tecnicos'];

    if (serviceCategories.includes(viewId)) {
      viewId = 'services';
    } else if (!validViews.includes(viewId)) {
      viewId = 'home';
    }

    // Protected view guard
    if (protectedViews.includes(viewId) && !window.adminUnlocked) {
      viewId = 'profile';
      history.replaceState(null, '', '#profile');
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
      e.preventDefault();
      history.pushState(null, '', href);
      renderView(href);
    }
  });

  // Manejar botón "Atrás" del navegador
  window.addEventListener('popstate', () => {
    renderView(window.location.hash);
  });

  // ═══════════════════ PIN MODAL LOGIC ═══════════════════
  const pinModal = document.getElementById('pinModal');
  const pinDigits = [
    document.getElementById('pin1'),
    document.getElementById('pin2'),
    document.getElementById('pin3'),
    document.getElementById('pin4')
  ];
  const pinError = document.getElementById('pinError');
  const pinSubmitBtn = document.getElementById('pinSubmitBtn');
  const pinCancelBtn = document.getElementById('pinCancelBtn');

  // Auto-focus next input on digit entry
  pinDigits.forEach((input, idx) => {
    if (!input) return;
    input.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length > 1) e.target.value = val.slice(-1);
      if (val && idx < 3) pinDigits[idx + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        pinDigits[idx - 1].focus();
      }
      if (e.key === 'Enter') {
        validatePin();
      }
    });
  });

  function validatePin() {
    const pin = pinDigits.map(d => d.value).join('');
    // ⚠️  TODO PRODUCCIÓN: este PIN está hardcodeado por ser una demo.
    // Migrar a auth real con backend (JWT + endpoint /api/auth/login) antes de salir.
    // Permite sobreescribir vía window.BARYO_ADMIN_PIN para staging/dev distintos.
    const validPin = (typeof window.BARYO_ADMIN_PIN === 'string' && window.BARYO_ADMIN_PIN) || '1234';
    if (pin === validPin) {
      // Success!
      window.adminUnlocked = true;
      pinModal.classList.remove('active');
      pinDigits.forEach(d => { d.value = ''; d.classList.remove('error'); });
      pinError.textContent = '';
      history.pushState(null, '', '#admin');
      renderView('#admin');
    } else {
      // Error
      pinError.textContent = 'PIN incorrecto. Intenta de nuevo.';
      pinDigits.forEach(d => {
        d.classList.add('error');
        d.value = '';
      });
      pinDigits[0].focus();
      setTimeout(() => {
        pinDigits.forEach(d => d.classList.remove('error'));
      }, 600);
    }
  }

  if (pinSubmitBtn) pinSubmitBtn.addEventListener('click', validatePin);
  if (pinCancelBtn) {
    pinCancelBtn.addEventListener('click', () => {
      pinModal.classList.remove('active');
      pinDigits.forEach(d => { d.value = ''; d.classList.remove('error'); });
      pinError.textContent = '';
    });
  }

  // Close pin modal on overlay click
  if (pinModal) {
    pinModal.addEventListener('click', (e) => {
      if (e.target === pinModal) {
        pinModal.classList.remove('active');
        pinDigits.forEach(d => { d.value = ''; });
        pinError.textContent = '';
      }
    });
  }

  // Render inicial
  renderView(window.location.hash);
});
