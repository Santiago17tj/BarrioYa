/* ==========================================================
   BarrioYa — Cart Manager (Global State + UI)
   Hybrid cart: products + services, with WhatsApp handoff
   ========================================================== */

window.BARYO_PHONE = '573046279171';

// ══════════════════════════════════════
// CartManager — Singleton State Manager
// ══════════════════════════════════════

class CartManager {
  static STORAGE_KEY = 'barrioya_cart';
  static DELIVERY_FEE = 2500;

  constructor() {
    this.items = [];
    this.businessName = '';
    this._load();
    this.listeners = [];
  }

  _load() {
    try {
      const data = JSON.parse(localStorage.getItem(CartManager.STORAGE_KEY));
      if (data && Array.isArray(data.items)) {
        this.items = data.items;
        this.businessName = data.businessName || '';
      }
    } catch (e) { /* corrupt */ }
  }

  _save() {
    localStorage.setItem(CartManager.STORAGE_KEY, JSON.stringify({
      items: this.items,
      businessName: this.businessName
    }));
    this._notify();
  }

  onChange(fn) { this.listeners.push(fn); }
  _notify() { this.listeners.forEach(fn => fn(this)); }

  // ── Core Methods ──
  addToCart(item, businessName = '') {
    if (businessName && this.businessName && this.businessName !== businessName) {
      this.items = [];
    }
    if (businessName) this.businessName = businessName;

    // type: 'product' (default) or 'service'
    const type = item.type || 'product';

    const existing = this.items.find(i => i.name === item.name);
    if (existing) {
      if (type === 'product') {
        existing.qty = Math.min(existing.qty + (item.qty || 1), 20);
      }
      // services don't stack — update schedule/duration instead
      if (type === 'service' && item.schedule) existing.schedule = item.schedule;
      if (type === 'service' && item.duration) existing.duration = item.duration;
    } else {
      const entry = {
        name: item.name,
        price: item.price,
        emoji: item.emoji || '🛒',
        qty: item.qty || 1,
        type,
      };
      if (type === 'service') {
        entry.qty = 1;
        entry.schedule = item.schedule || '';
        entry.duration = item.duration || '';
        entry.zone = item.zone || '';
        entry.provider = item.provider || '';
      }
      this.items.push(entry);
    }
    this._save();
  }

  removeFromCart(name) {
    this.items = this.items.filter(i => i.name !== name);
    if (this.items.length === 0) this.businessName = '';
    this._save();
  }

  updateQuantity(name, delta) {
    const item = this.items.find(i => i.name === name);
    if (!item || item.type === 'service') return;
    item.qty = Math.max(1, Math.min(item.qty + delta, 20));
    this._save();
  }

  updateServiceOption(name, key, value) {
    const item = this.items.find(i => i.name === name);
    if (!item || item.type !== 'service') return;
    item[key] = value;
    this._save();
  }

  clear() {
    this.items = [];
    this.businessName = '';
    this._save();
  }

  getSubtotal() {
    return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  getTotal() {
    const hasProducts = this.items.some(i => i.type !== 'service');
    const fee = hasProducts ? CartManager.DELIVERY_FEE : 0;
    return this.items.length > 0 ? this.getSubtotal() + fee : 0;
  }

  getItemCount() {
    return this.items.reduce((sum, i) => sum + i.qty, 0);
  }

  isEmpty() { return this.items.length === 0; }

  hasProducts() { return this.items.some(i => (i.type || 'product') === 'product'); }
  hasServices() { return this.items.some(i => i.type === 'service'); }

  // ── Order JSON ──
  generateOrderJSON() {
    const subtotal = this.getSubtotal();
    const hasProducts = this.hasProducts();
    return {
      order_id: `BY-${Date.now().toString().slice(-8)}`,
      business: this.businessName,
      items: this.items.map(i => {
        const entry = { name: i.name, emoji: i.emoji, type: i.type || 'product', quantity: i.qty, unit_price: i.price, total: i.price * i.qty };
        if (i.type === 'service') { entry.schedule = i.schedule; entry.duration = i.duration; entry.zone = i.zone; entry.provider = i.provider; }
        return entry;
      }),
      subtotal,
      delivery_fee: hasProducts ? CartManager.DELIVERY_FEE : 0,
      total: this.getTotal(),
      created_at: new Date().toISOString()
    };
  }

  // ── WhatsApp Text Formatter ──
  formatOrderToWhatsApp() {
    if (this.isEmpty()) return '';
    const lines = [];
    lines.push('🛒 *Pedido BarrioYa*');
    if (this.businessName) lines.push(`🏪 ${this.businessName}`);
    lines.push('─────────────');

    const products = this.items.filter(i => (i.type || 'product') === 'product');
    const services = this.items.filter(i => i.type === 'service');

    if (products.length) {
      lines.push('📦 *Productos:*');
      products.forEach(p => {
        lines.push(`  ${p.emoji} ${p.qty}x ${p.name} — $${(p.price * p.qty).toLocaleString('es-CO')}`);
      });
    }

    if (services.length) {
      lines.push('🔧 *Servicios:*');
      services.forEach(s => {
        let detail = `  ${s.emoji} ${s.name} — $${s.price.toLocaleString('es-CO')}`;
        if (s.schedule) detail += ` | 🕐 ${s.schedule}`;
        if (s.duration) detail += ` | ⏱️ ${s.duration}`;
        if (s.zone) detail += ` | 📍 ${s.zone}`;
        lines.push(detail);
      });
    }

    lines.push('─────────────');
    lines.push(`💰 Subtotal: $${this.getSubtotal().toLocaleString('es-CO')}`);
    if (this.hasProducts()) lines.push(`🛵 Envío: $${CartManager.DELIVERY_FEE.toLocaleString('es-CO')}`);
    lines.push(`✅ *Total: $${this.getTotal().toLocaleString('es-CO')}*`);
    lines.push('');
    lines.push('¡Confirma mi pedido por favor! 🙏');

    return lines.join('\n');
  }
}

// Global singleton
window.cartManager = new CartManager();


// ══════════════════════════════════════
// Cart UI — FAB + Off-Canvas Panel
// ══════════════════════════════════════

(function initCartUI() {
  const path = window.location.pathname;
  if (path.includes('admin') || path.includes('tracking') || path.includes('bot-demo')) return;

  const cart = window.cartManager;

  const cartHTML = `
    <button class="cart-fab" id="cartFab" aria-label="Abrir carrito">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      <span class="cart-badge" id="cartBadge">0</span>
    </button>
    <div class="cart-overlay" id="cartOverlay"></div>
    <div class="cart-panel" id="cartPanel">
      <div class="cart-panel-header">
        <h2>🛒 Tu carrito</h2>
        <button class="cart-close" id="cartClose" aria-label="Cerrar carrito">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="cart-panel-body" id="cartPanelBody"></div>
      <div class="cart-panel-footer" id="cartPanelFooter"></div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', cartHTML);

  const fab = document.getElementById('cartFab');
  const badge = document.getElementById('cartBadge');
  const overlay = document.getElementById('cartOverlay');
  const panel = document.getElementById('cartPanel');
  const closeBtn = document.getElementById('cartClose');
  const body = document.getElementById('cartPanelBody');
  const footer = document.getElementById('cartPanelFooter');

  function openCart() { panel.classList.add('open'); overlay.classList.add('open'); document.body.style.overflow = 'hidden'; renderCart(); }
  function closeCart() { panel.classList.remove('open'); overlay.classList.remove('open'); document.body.style.overflow = ''; }

  fab.addEventListener('click', openCart);
  overlay.addEventListener('click', closeCart);
  closeBtn.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

  function fmt(price) { return '$' + price.toLocaleString('es-CO'); }

  const EMPTY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-lighter, #C8E6C9)" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`;

  const SCHEDULE_OPTIONS = ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
  const DURATION_OPTIONS = ['30 min', '1 hora', '1.5 horas', '2 horas'];

  function renderCart() {
    if (cart.isEmpty()) {
      body.innerHTML = `<div class="cart-empty">${EMPTY_SVG}<h3>Tu carrito está vacío</h3><p>Explora los negocios y servicios del barrio 🏪</p><a href="servicios.html" class="btn btn-primary" style="margin-top:1rem;font-size:0.85rem;padding:0.65rem 1.5rem;" onclick="document.getElementById('cartPanel').classList.remove('open');document.getElementById('cartOverlay').classList.remove('open');document.body.style.overflow='';">Ver servicios</a></div>`;
      footer.innerHTML = '';
      return;
    }

    body.innerHTML = `
      <div class="cart-business">${cart.businessName ? '🏪 ' + cart.businessName : ''}</div>
      ${cart.items.map(item => {
        const isService = item.type === 'service';
        return `
        <div class="cart-item ${isService ? 'cart-item--service' : ''}" data-name="${item.name}">
          <div class="cart-item-emoji">${item.emoji}</div>
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            ${isService
              ? `<div class="cart-item-meta">${item.provider ? '👤 ' + item.provider : ''}${item.zone ? ' · 📍 ' + item.zone : ''}</div>`
              : `<div class="cart-item-price">${fmt(item.price)}</div>`
            }
          </div>
          ${isService ? `
            <div class="cart-service-options">
              <select class="service-select" onchange="cartUI.updateService('${item.name}','schedule',this.value)" aria-label="Horario">
                <option value="">🕐 Horario</option>
                ${SCHEDULE_OPTIONS.map(s => `<option value="${s}" ${item.schedule === s ? 'selected' : ''}>${s}</option>`).join('')}
              </select>
              <select class="service-select" onchange="cartUI.updateService('${item.name}','duration',this.value)" aria-label="Duración">
                <option value="">⏱️ Duración</option>
                ${DURATION_OPTIONS.map(d => `<option value="${d}" ${item.duration === d ? 'selected' : ''}>${d}</option>`).join('')}
              </select>
            </div>
          ` : `
            <div class="cart-item-controls">
              <button class="qty-btn" onclick="cartUI.updateQty('${item.name}', -1)">−</button>
              <span class="qty-value">${item.qty}</span>
              <button class="qty-btn" onclick="cartUI.updateQty('${item.name}', 1)">+</button>
            </div>
          `}
          <div class="cart-item-total">${fmt(item.price * item.qty)}</div>
          <button class="cart-item-remove" onclick="cartUI.removeItem('${item.name}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>`;
      }).join('')}
    `;

    const subtotal = cart.getSubtotal();
    const total = cart.getTotal();
    const hasProducts = cart.hasProducts();
    const waText = encodeURIComponent(cart.formatOrderToWhatsApp());

    footer.innerHTML = `
      <div class="cart-summary">
        <div class="cart-summary-row"><span>Subtotal</span><span>${fmt(subtotal)}</span></div>
        ${hasProducts ? `<div class="cart-summary-row"><span>🛵 Envío</span><span>${fmt(CartManager.DELIVERY_FEE)}</span></div>` : ''}
        <div class="cart-summary-row cart-total"><span>Total</span><span>${fmt(total)}</span></div>
      </div>
      <div class="cart-actions">
        <a href="#checkout" class="cart-checkout-btn" onclick="cartUI.close();">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Ir a pagar ${fmt(total)}
        </a>
        <a href="https://wa.me/${window.BARYO_PHONE}?text=${waText}" class="cart-whatsapp-btn" id="cartWhatsAppBtn" target="_blank" rel="noopener">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Pedir por WhatsApp
        </a>
        <button class="cart-clear-btn" onclick="cartUI.clearCart()">🗑️ Vaciar carrito</button>
      </div>
    `;
  }

  function updateBadge() {
    const count = cart.getItemCount();
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
    fab.classList.remove('bounce');
    void fab.offsetWidth;
    if (count > 0) fab.classList.add('bounce');
  }

  window.cartUI = {
    updateQty(name, delta) { cart.updateQuantity(name, delta); renderCart(); },
    removeItem(name) {
      const el = document.querySelector(`.cart-item[data-name="${name}"]`);
      if (el) { el.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => { cart.removeFromCart(name); renderCart(); }, 280); }
      else { cart.removeFromCart(name); renderCart(); }
    },
    clearCart() { cart.clear(); renderCart(); },
    addProduct(product, businessName) { cart.addToCart(product, businessName); updateBadge(); if (panel.classList.contains('open')) renderCart(); },
    addService(service, businessName) { cart.addToCart({ ...service, type: 'service' }, businessName); updateBadge(); if (panel.classList.contains('open')) renderCart(); },
    updateService(name, key, value) { cart.updateServiceOption(name, key, value); },
    open: openCart,
    close: closeCart
  };

  cart.onChange(() => updateBadge());
  updateBadge();
})();
