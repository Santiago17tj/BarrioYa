/* ==========================================================
   BarrioYa — Checkout JavaScript
   Payment method selection, card formatting, simulated payment
   Reads cart from CartManager (localStorage)
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const paymentMethods = document.querySelectorAll('.payment-method');
  const cardFields = document.getElementById('cardFields');
  const payBtn = document.getElementById('payBtn');
  const checkoutLayout = document.getElementById('checkoutLayout');
  const paymentForm = document.getElementById('paymentForm');
  const checkoutSuccess = document.getElementById('checkoutSuccess');
  const orderSidebar = document.querySelector('.order-sidebar');
  const checkoutHeader = document.querySelector('.checkout-header');

  let selectedMethod = 'nequi';

  // ══════════════════════════════════════
  // RENDER ORDER FROM CART (localStorage)
  // ══════════════════════════════════════

  function formatPrice(price) {
    return '$' + price.toLocaleString('es-CO');
  }

  window.renderOrderFromCart = renderOrderFromCart;

  function resetCheckoutUI() {
    if (paymentForm) paymentForm.style.display = '';
    if (orderSidebar) orderSidebar.style.display = '';
    if (checkoutHeader) checkoutHeader.style.display = '';
    if (checkoutSuccess) checkoutSuccess.classList.remove('show');
    payBtn.disabled = false;
    payBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      Pagar
    `;
  }

  function renderOrderFromCart() {
    const cart = window.cartManager;
    
    // Si el carrito está vacío, no renderizamos pero aseguramos que el UI esté limpio si volvemos
    if (!cart || cart.isEmpty()) {
      resetCheckoutUI();
      return;
    }

    resetCheckoutUI(); // Siempre resetear antes de renderizar un nuevo pedido

    const orderCard = document.querySelector('.order-card');
    if (!orderCard) return;

    const subtotal = cart.getSubtotal();
    const total = cart.getTotal();

    // Build items HTML
    const itemsHTML = cart.items.map(item => `
      <div class="checkout-item">
        <div class="item-name">
          <span class="item-qty">${item.qty}x</span> ${item.emoji} ${item.name}
        </div>
        <div>${formatPrice(item.price * item.qty)}</div>
      </div>
    `).join('');

    // Render full order card
    orderCard.innerHTML = `
      <h2>🛒 Tu pedido</h2>
      ${cart.businessName ? `<div class="shop-name">🏪 ${cart.businessName}</div>` : ''}
      ${itemsHTML}
      <div class="summary-divider"></div>
      <div class="summary-row">
        <span>Subtotal</span>
        <span>${formatPrice(subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Envío</span>
        <span>${formatPrice(CartManager.DELIVERY_FEE)}</span>
      </div>
      <div class="summary-row total">
        <span>Total</span>
        <span id="checkoutTotal">${formatPrice(total)}</span>
      </div>
      <div class="delivery-info">
        📍 Dirección se confirma al pagar
      </div>
    `;

    // Update pay button text
    payBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
      Pagar ${formatPrice(total)}
    `;
  }

  // Escuchar cambios en el carrito para re-renderizar el checkout si es necesario
  if (window.cartManager) {
    window.cartManager.onChange(() => {
      const checkoutView = document.getElementById('checkout-view');
      if (checkoutView && checkoutView.classList.contains('active')) {
        renderOrderFromCart();
      }
    });
  }

  renderOrderFromCart();

  // ── Payment Method Selection ──
  paymentMethods.forEach(method => {
    method.addEventListener('click', () => {
      paymentMethods.forEach(m => m.classList.remove('selected'));
      method.classList.add('selected');
      selectedMethod = method.dataset.method;

      // Show/hide card fields
      if (selectedMethod === 'card') {
        cardFields.classList.add('show');
      } else {
        cardFields.classList.remove('show');
      }
    });
  });

  // ── Card Number Formatting ──
  const cardNumber = document.getElementById('cardNumber');
  if (cardNumber) {
    cardNumber.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
      e.target.value = value.substring(0, 19);
    });
  }

  // ── Expiry Formatting ──
  const cardExpiry = document.getElementById('cardExpiry');
  if (cardExpiry) {
    cardExpiry.addEventListener('input', (e) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      e.target.value = value;
    });
  }

  // ── Pay Button ──
  payBtn.addEventListener('click', async () => {
    const buyerName = document.getElementById('buyerName').value.trim();
    const buyerPhone = document.getElementById('buyerPhone').value.trim();

    if (!buyerName || !buyerPhone) {
      alert('Por favor completa tu nombre y celular');
      return;
    }

    if (selectedMethod === 'card') {
      const cardNum = cardNumber.value.replace(/\s/g, '');
      const expiry = cardExpiry.value;
      const cvv = document.getElementById('cardCvv').value;

      if (cardNum.length < 13 || !expiry || !cvv) {
        alert('Por favor completa los datos de la tarjeta');
        return;
      }
    }

    // Estética Premium de Procesamiento
    payBtn.disabled = true;
    payBtn.style.transform = 'scale(0.96)';
    payBtn.innerHTML = `
      <svg class="checkout-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      Confirmando pedido...
    `;

    // Inyectar estilos de spinner si no están
    if (!document.getElementById('checkoutSpinStyle')) {
      const style = document.createElement('style');
      style.id = 'checkoutSpinStyle';
      style.textContent = `@keyframes checkoutSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } .checkout-spin { animation: checkoutSpin 1s linear infinite; vertical-align: middle; margin-right: 0.4rem; }`;
      document.head.appendChild(style);
    }

    // ── Handoff Híbrido: API + WhatsApp ──
    let orderId = `BY-${Date.now().toString().slice(-8)}`;
    const API_BASE = window.API_BASE_URL || '';

    try {
      const orderData = window.cartManager.generateOrderJSON();
      orderData.order_id = orderId;
      
      const response = await fetch(`${API_BASE}/api/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) throw new Error('Error en el servidor');
      
      const result = await response.json();
      orderId = result.order_id;
      
      payBtn.style.background = '#00C853';
      payBtn.innerHTML = `¡Pedido Confirmado!`;

      // Guardar último pedido para tracking
      try {
        const cartSnapshot = window.cartManager.getItems ? window.cartManager.getItems() : (window.cartManager.items || []);
        const items = cartSnapshot.map(it => ({ name: it.name, quantity: it.quantity, price: it.price }));
        const subtotal = items.reduce((s, it) => s + (it.price * it.quantity), 0);
        const lastOrder = {
          id: orderId,
          items,
          subtotal,
          delivery: orderData.costo_envio || 2500,
          total: orderData.total || (subtotal + 2500),
          shop: orderData.shop_name || orderData.id_comercio || '',
          fecha: new Date().toISOString()
        };
        localStorage.setItem('barrioya_last_order', JSON.stringify(lastOrder));
      } catch (e) { console.warn('[checkout] no se pudo guardar last_order', e); }

      await new Promise(resolve => setTimeout(resolve, 800));

      // 1. Limpiar datos
      if (window.limpiarCheckout) {
        window.limpiarCheckout();
      } else if (window.cartManager) {
        window.cartManager.clear();
      }

      // 2. Pantalla de éxito
      if (paymentForm) paymentForm.style.display = 'none';
      if (orderSidebar) orderSidebar.style.display = 'none';
      if (checkoutHeader) checkoutHeader.style.display = 'none';
      if (checkoutLayout) {
        checkoutLayout.style.display = 'block'; // Ocupar todo el ancho
      }
      if (checkoutSuccess) {
        checkoutSuccess.classList.add('show');
        checkoutSuccess.style.display = 'block'; // Asegurar visibilidad
      }

      const successP = document.getElementById('successMessage');
      if (successP) {
        successP.innerHTML = `Tu pedido <strong>#${orderId}</strong> ha sido confirmado. <br> Redirigiendo a WhatsApp para seguimiento...`;
      }

      // 3. WhatsApp Deep Link
      const waMessage = encodeURIComponent(`Hola BarrioYa! 👋 Acabo de realizar mi pedido #${orderId}. ¿Me confirman recepción?`);
      const waPhone = window.BARYO_PHONE || '573046279171';
      const waURL = `https://wa.me/${waPhone}?text=${waMessage}`;
      
      setTimeout(() => {
        window.open(waURL, '_blank');
      }, 2000);

    } catch (error) {
      console.error("Error completo:", error);
      alert(`❌ Error: ${error.message}. Verifica que el backend esté corriendo en el puerto 8000.`);
      payBtn.disabled = false;
      payBtn.innerHTML = "Reintentar Pago";
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Wompi Integration Ready ──
  // To integrate Wompi:
  // 1. Get your public key from https://comercios.wompi.co
  // 2. Add <script src="https://checkout.wompi.co/widget.js"> to the page
  // 3. Call WidgetCheckout with your configuration:
  //
  // const checkout = new WidgetCheckout({
  //   currency: 'COP',
  //   amountInCents: 1750000, // $17,500 COP
  //   reference: 'BY-2026-0429',
  //   publicKey: 'pub_test_XXXXX',
  //   redirectUrl: 'https://barrioya.com/tracking.html'
  // });
  // checkout.open((result) => {
  //   const transaction = result.transaction;
  //   if (transaction.status === 'APPROVED') { /* success */ }
  // });

  // ── MercadoPago Integration Ready ──
  // To integrate MercadoPago:
  // 1. Get your public key from https://www.mercadopago.com.co/developers
  // 2. Add <script src="https://sdk.mercadopago.com/js/v2">
  // 3. Create preference on backend, then:
  //
  // const mp = new MercadoPago('PUBLIC_KEY');
  // mp.checkout({
  //   preference: { id: 'PREFERENCE_ID_FROM_BACKEND' },
  //   render: { container: '#payment-container', label: 'Pagar' }
  // });
  // mp.checkout({
  //   preference: { id: 'PREFERENCE_ID_FROM_BACKEND' },
  //   render: { container: '#payment-container', label: 'Pagar' }
  // });
  // ── Success Home Button ──
  const successHomeBtn = document.getElementById('successHomeBtn');
  if (successHomeBtn) {
    successHomeBtn.addEventListener('click', (e) => {
      // Si estamos en checkout.html y vamos a index.html, no prevenimos (navegación real)
      if (window.location.pathname.includes('checkout.html')) {
        return; 
      }
      
      // Si es una SPA, reseteamos UI
      e.preventDefault();
      resetCheckoutUI();
      const homeView = document.getElementById('home-view');
      const checkoutView = document.getElementById('checkout-view');
      if (homeView && checkoutView) {
        checkoutView.classList.remove('active');
        checkoutView.style.display = 'none';
        homeView.classList.add('active');
        homeView.style.display = 'block';
        window.location.hash = 'home';
      }
    });
  }

});
