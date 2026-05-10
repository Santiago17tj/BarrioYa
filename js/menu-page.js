/* ==========================================================
   BarrioYa — Menu/Catalog Page (Servicios)
   Products + Services grid with "Add to Cart" integration
   Covers: Domicilios, Mascotas, Mandados, Técnicos
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ══════════════════════════════════════
  // FULL SUPERAPP CATALOG
  // ══════════════════════════════════════

  let CATALOG = {};
  
  // Usamos la URL base definida en config.js
  const API_BASE = window.API_BASE_URL || '';

  async function loadCatalog() {
    const grid = document.getElementById('productGrid');
    const tabs = document.getElementById('menuTabs');
    
    // Mostrar Skeletons
    grid.innerHTML = Array(4).fill(0).map(() => `
      <div class="product-card skeleton-card">
        <div class="skeleton-emoji"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
        <div class="skeleton-btn"></div>
      </div>
    `).join('');
    tabs.innerHTML = '<div class="skeleton-tabs"></div>';

    try {
      const response = await fetch(`${API_BASE}/api/catalogo`);
      if (!response.ok) throw new Error('Error cargando catálogo');
      const data = await response.json();
      
      // Transformar array de businesses al formato object que usa el frontend
      CATALOG = {}; // Reset
      data.businesses.forEach(biz => {
        CATALOG[biz.id] = {
          name: biz.name,
          emoji: biz.emoji,
          category: biz.category,
          zone: biz.zone,
          items: biz.items
        };
      });
      
      renderTabs();
      renderProducts();
    } catch (error) {
      console.error('Error:', error);
      grid.innerHTML = `
        <div class="error-container">
          <p class="error-msg">⚠️ No pudimos conectar con el servidor.</p>
          <button class="btn btn-secondary" onclick="location.reload()">Reintentar</button>
        </div>
      `;
    }
  }

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

  // renderTabs();
  // renderProducts();
  loadCatalog();

  // Listen for hash changes
  window.addEventListener('hashchange', () => {
    selectedBusiness = getInitialCategory();
    renderTabs();
    renderProducts();
  });
});
