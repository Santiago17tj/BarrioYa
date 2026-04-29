/* ==========================================================
   BarrioYa — Menu/Catalog Page (Servicios)
   Products + Services grid with "Add to Cart" integration
   Covers: Domicilios, Mascotas, Mandados, Técnicos
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ══════════════════════════════════════
  // FULL SUPERAPP CATALOG
  // ══════════════════════════════════════

  const CATALOG = {
    // ── Domicilios (Products) ──
    panaderia: {
      name: 'Panadería Don José',
      emoji: '🧀', category: 'domicilios', zone: 'Cabecera del Llano',
      items: [
        { name: 'Pan de bono', price: 1000, emoji: '🧀' },
        { name: 'Empanada de carne', price: 2000, emoji: '🥟' },
        { name: 'Buñuelo', price: 1500, emoji: '🍩' },
        { name: 'Arepa de huevo', price: 3000, emoji: '🌮' },
        { name: 'Jugo de lulo', price: 2500, emoji: '🧃' },
        { name: 'Almojábana', price: 1800, emoji: '🥐' },
        { name: 'Pandebono especial', price: 2000, emoji: '🧀' },
        { name: 'Café con leche', price: 2000, emoji: '☕' }
      ]
    },
    restaurante: {
      name: 'Restaurante La Sazón',
      emoji: '🍛', category: 'domicilios', zone: 'La Ciudadela',
      items: [
        { name: 'Bandeja paisa', price: 15000, emoji: '🍛' },
        { name: 'Arroz con pollo', price: 12000, emoji: '🍗' },
        { name: 'Sancocho', price: 10000, emoji: '🍲' },
        { name: 'Hamburguesa artesanal', price: 14000, emoji: '🍔' },
        { name: 'Limonada de coco', price: 4000, emoji: '🥥' },
        { name: 'Ceviche de camarón', price: 16000, emoji: '🦐' }
      ]
    },
    tienda: {
      name: 'Tienda Doña Carmen',
      emoji: '🛒', category: 'domicilios', zone: 'Provenza',
      items: [
        { name: 'Leche entera 1L', price: 4500, emoji: '🥛' },
        { name: 'Pan tajado', price: 6000, emoji: '🍞' },
        { name: 'Huevos x12', price: 8000, emoji: '🥚' },
        { name: 'Arroz 1kg', price: 4000, emoji: '🍚' },
        { name: 'Gaseosa 1.5L', price: 5000, emoji: '🥤' },
        { name: 'Aceite 500ml', price: 7000, emoji: '🫒' }
      ]
    },

    // ── Mascotas (Services) ──
    mascotas: {
      name: 'Mascotas',
      emoji: '🐾', category: 'mascotas', zone: 'Tu barrio',
      items: [
        { name: 'Paseo de perro', price: 8000, emoji: '🐕', type: 'service', provider: 'Andrea G.', zone: 'Cabecera del Llano', duration: '1 hora' },
        { name: 'Cuidado diurno', price: 25000, emoji: '🏠', type: 'service', provider: 'Valentina S.', zone: 'Provenza', duration: '2 horas' },
        { name: 'Baño canino', price: 20000, emoji: '🛁', type: 'service', provider: 'Carlos R.', zone: 'La Ciudadela' },
        { name: 'Entrenamiento básico', price: 35000, emoji: '🎓', type: 'service', provider: 'Luis P.', zone: 'Cabecera del Llano', duration: '1.5 horas' }
      ]
    },

    // ── Mandados (Services) ──
    mandados: {
      name: 'Mandados',
      emoji: '🏃', category: 'mandados', zone: 'Tu barrio',
      items: [
        { name: 'Pago de recibos', price: 3000, emoji: '📄', type: 'service', provider: 'Josué L.', zone: 'Cabecera del Llano' },
        { name: 'Recogida de paquete', price: 5000, emoji: '📦', type: 'service', provider: 'Daniela R.', zone: 'La Ciudadela' },
        { name: 'Compra de mercado', price: 8000, emoji: '🛍️', type: 'service', provider: 'Santiago M.', zone: 'Provenza' },
        { name: 'Fila en banco/EPS', price: 10000, emoji: '🏦', type: 'service', provider: 'Camila O.', zone: 'Cabecera del Llano' },
        { name: 'Envío de documentos', price: 4000, emoji: '✉️', type: 'service', provider: 'Pedro M.', zone: 'La Ciudadela' }
      ]
    },

    // ── Técnicos & Tutores (Services) ──
    tecnicos: {
      name: 'Técnicos & Tutores',
      emoji: '🔧', category: 'tecnicos', zone: 'Tu barrio',
      items: [
        { name: 'Plomería general', price: 25000, emoji: '🔧', type: 'service', provider: 'Miguel T.', zone: 'Cabecera del Llano', duration: '1 hora' },
        { name: 'Electricista', price: 30000, emoji: '⚡', type: 'service', provider: 'Andrés V.', zone: 'La Ciudadela', duration: '1 hora' },
        { name: 'Cerrajería', price: 20000, emoji: '🔑', type: 'service', provider: 'Paula C.', zone: 'Provenza' },
        { name: 'Reparación electrodomésticos', price: 35000, emoji: '🔌', type: 'service', provider: 'Sofía H.', zone: 'Cabecera del Llano', duration: '1.5 horas' },
        { name: 'Tutor de matemáticas', price: 20000, emoji: '📐', type: 'service', provider: 'Laura D.', zone: 'La Ciudadela', duration: '1 hora' },
        { name: 'Tutor de inglés', price: 22000, emoji: '📚', type: 'service', provider: 'Ana R.', zone: 'Provenza', duration: '1 hora' }
      ]
    }
  };

  function formatPrice(price) {
    return '$' + price.toLocaleString('es-CO');
  }

  const container = document.getElementById('productGrid');
  if (!container) return;

  // ── Category filter from URL hash ──
  function getInitialCategory() {
    const hash = window.location.hash.replace('#', '');
    const catMap = { domicilios: 'panaderia', mascotas: 'mascotas', mandados: 'mandados', tecnicos: 'tecnicos' };
    return catMap[hash] || 'panaderia';
  }

  let selectedBusiness = getInitialCategory();

  // ── Tab Rendering ──
  function renderTabs() {
    const tabsHTML = Object.entries(CATALOG).map(([key, biz]) => `
      <button class="menu-tab ${key === selectedBusiness ? 'active' : ''}" data-biz="${key}">
        ${biz.emoji} ${biz.name}
        <span class="tab-zone">${biz.zone}</span>
      </button>
    `).join('');

    const tabsContainer = document.getElementById('menuTabs');
    tabsContainer.innerHTML = tabsHTML;

    tabsContainer.querySelectorAll('.menu-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        selectedBusiness = tab.dataset.biz;
        renderTabs();
        renderProducts();
      });
    });
  }

  // ── Product/Service Card Rendering ──
  function renderProducts() {
    const biz = CATALOG[selectedBusiness];
    container.className = 'product-grid fade-enter';
    void container.offsetWidth; // trigger reflow for animation

    container.innerHTML = biz.items.map((item, i) => {
      const isService = item.type === 'service';
      return `
        <div class="product-card ${isService ? 'product-card--service' : ''}" style="animation-delay: ${i * 0.06}s">
          <div class="product-emoji">${item.emoji}</div>
          <div class="product-info">
            <h4 class="product-name">${item.name}</h4>
            ${isService && item.provider ? `<p class="product-provider">👤 ${item.provider}</p>` : ''}
            ${isService && item.zone ? `<p class="product-zone">📍 ${item.zone}</p>` : ''}
            <p class="product-price">${formatPrice(item.price)}${isService ? '/servicio' : ''}</p>
          </div>
          <button class="add-to-cart-btn" id="addBtn_${selectedBusiness}_${i}"
            onclick="addProductToCart('${selectedBusiness}', ${i}, this)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            ${isService ? 'Reservar' : 'Agregar'}
          </button>
        </div>
      `;
    }).join('');

    container.classList.add('fade-enter');
  }

  // ── Global Add Handler ──
  window.addProductToCart = function(bizKey, itemIndex, btnEl) {
    const biz = CATALOG[bizKey];
    const item = biz.items[itemIndex];
    if (!item || !window.cartUI) return;

    const isService = item.type === 'service';

    if (isService) {
      window.cartUI.addService(item, biz.name);
    } else {
      window.cartUI.addProduct(item, biz.name);
    }

    const originalHTML = btnEl.innerHTML;
    btnEl.classList.add('added');
    btnEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      ${isService ? '¡Reservado!' : '¡Agregado!'}
    `;

    setTimeout(() => {
      btnEl.classList.remove('added');
      btnEl.innerHTML = originalHTML;
    }, 1200);
  };

  renderTabs();
  renderProducts();

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    selectedBusiness = getInitialCategory();
    renderTabs();
    renderProducts();
  });
});
