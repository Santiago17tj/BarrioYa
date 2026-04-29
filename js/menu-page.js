/* ==========================================================
   BarrioYa — Menu/Product Grid (Servicios page)
   Dynamic product cards with "Add to Cart" integration
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ── Business Catalog ──
  const CATALOG = {
    panaderia: {
      name: 'Panadería Don José',
      emoji: '🧀',
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
      emoji: '🍛',
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
      emoji: '🛒',
      items: [
        { name: 'Leche entera 1L', price: 4500, emoji: '🥛' },
        { name: 'Pan tajado', price: 6000, emoji: '🍞' },
        { name: 'Huevos x12', price: 8000, emoji: '🥚' },
        { name: 'Arroz 1kg', price: 4000, emoji: '🍚' },
        { name: 'Gaseosa 1.5L', price: 5000, emoji: '🥤' },
        { name: 'Aceite 500ml', price: 7000, emoji: '🫒' }
      ]
    }
  };

  function formatPrice(price) {
    return '$' + price.toLocaleString('es-CO');
  }

  // ── Find insertion point ──
  const container = document.getElementById('productGrid');
  if (!container) return;

  // ── Render Business Tabs + Product Grid ──
  let selectedBusiness = 'panaderia';

  function renderTabs() {
    const tabsHTML = Object.entries(CATALOG).map(([key, biz]) => `
      <button class="menu-tab ${key === selectedBusiness ? 'active' : ''}" data-biz="${key}">
        ${biz.emoji} ${biz.name}
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

  function renderProducts() {
    const biz = CATALOG[selectedBusiness];
    container.innerHTML = biz.items.map((item, i) => `
      <div class="product-card" style="animation-delay: ${i * 0.05}s">
        <div class="product-emoji">${item.emoji}</div>
        <div class="product-info">
          <h4 class="product-name">${item.name}</h4>
          <p class="product-price">${formatPrice(item.price)}</p>
        </div>
        <button class="add-to-cart-btn" id="addBtn_${selectedBusiness}_${i}"
          onclick="addProductToCart('${selectedBusiness}', ${i}, this)">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar
        </button>
      </div>
    `).join('');
  }

  // ── Global Add-to-Cart Handler ──
  window.addProductToCart = function(bizKey, itemIndex, btnEl) {
    const biz = CATALOG[bizKey];
    const item = biz.items[itemIndex];
    if (!item || !window.cartUI) return;

    // Add to cart
    window.cartUI.addProduct(item, biz.name);

    // Visual feedback — button changes to check
    const originalHTML = btnEl.innerHTML;
    btnEl.classList.add('added');
    btnEl.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      ¡Agregado!
    `;

    // Reset after 1.2s
    setTimeout(() => {
      btnEl.classList.remove('added');
      btnEl.innerHTML = originalHTML;
    }, 1200);
  };

  renderTabs();
  renderProducts();

});
