/* ==========================================================
   BarrioYa — WhatsApp Bot Demo (State Machine)
   Interactive conversational flow simulation
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const messagesContainer = document.getElementById('messagesContainer');
  const quickRepliesContainer = document.getElementById('quickRepliesContainer');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const typingIndicator = document.getElementById('typingIndicator');
  const statusText = document.getElementById('statusText');

  // ── Mock Data: Local businesses ──
  const BUSINESSES = {
    'panaderia': {
      name: 'Panadería Don José',
      items: [
        { name: 'Pan de bono', price: 1000, emoji: '🧀' },
        { name: 'Empanada de carne', price: 2000, emoji: '🥟' },
        { name: 'Buñuelo', price: 1500, emoji: '🍩' },
        { name: 'Arepa de huevo', price: 3000, emoji: '🌮' },
        { name: 'Jugo de lulo', price: 2500, emoji: '🧃' }
      ]
    },
    'restaurante': {
      name: 'Restaurante La Sazón',
      items: [
        { name: 'Bandeja paisa', price: 15000, emoji: '🍛' },
        { name: 'Arroz con pollo', price: 12000, emoji: '🍗' },
        { name: 'Sancocho', price: 10000, emoji: '🍲' },
        { name: 'Hamburguesa artesanal', price: 14000, emoji: '🍔' },
        { name: 'Limonada de coco', price: 4000, emoji: '🥥' }
      ]
    },
    'tienda': {
      name: 'Tienda Doña Carmen',
      items: [
        { name: 'Leche entera 1L', price: 4500, emoji: '🥛' },
        { name: 'Pan tajado', price: 6000, emoji: '🍞' },
        { name: 'Huevos x12', price: 8000, emoji: '🥚' },
        { name: 'Arroz 1kg', price: 4000, emoji: '🍚' },
        { name: 'Gaseosa 1.5L', price: 5000, emoji: '🥤' }
      ]
    }
  };

  // ── Cart & State ──
  let state = 'WELCOME';
  let selectedBusiness = null;
  let cart = [];
  let deliveryAddress = '';

  function getTime() {
    return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  function formatPrice(price) {
    return '$' + price.toLocaleString('es-CO');
  }

  // ── Message Rendering ──
  function smoothScrollToBottom() {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: 'smooth'
    });
  }

  function addMessage(text, type = 'bot', html = false) {
    const msg = document.createElement('div');
    msg.className = `msg ${type}`;
    msg.innerHTML = `${html ? text : escapeHtml(text)}<div class="time">${getTime()}</div>`;
    messagesContainer.appendChild(msg);
    smoothScrollToBottom();
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Typing Bubble with 3 animated dots ──
  let typingBubble = null;

  function showTypingBubble() {
    // Show topbar indicator
    typingIndicator.classList.add('show');
    statusText.style.display = 'none';

    // Create visible bubble in chat
    if (!typingBubble) {
      typingBubble = document.createElement('div');
      typingBubble.className = 'msg bot typing-bubble';
      typingBubble.innerHTML = `
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>`;
    }
    messagesContainer.appendChild(typingBubble);
    smoothScrollToBottom();
  }

  function hideTypingBubble() {
    typingIndicator.classList.remove('show');
    statusText.style.display = 'block';

    if (typingBubble && typingBubble.parentNode) {
      typingBubble.parentNode.removeChild(typingBubble);
    }
  }

  function showQuickReplies(options) {
    quickRepliesContainer.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'quick-replies';

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        quickRepliesContainer.innerHTML = '';
        handleUserMessage(opt.value || opt.label);
      });
      wrapper.appendChild(btn);
    });

    quickRepliesContainer.appendChild(wrapper);
    smoothScrollToBottom();
  }

  function clearQuickReplies() {
    quickRepliesContainer.innerHTML = '';
  }

  function botReply(text, delay = 1200, html = false) {
    return new Promise(resolve => {
      showTypingBubble();
      setTimeout(() => {
        hideTypingBubble();
        addMessage(text, 'bot', html);
        resolve();
      }, delay);
    });
  }

  // ── State Machine ──
  async function handleUserMessage(text) {
    addMessage(text, 'user');
    clearQuickReplies();

    const lower = text.toLowerCase().trim();

    switch (state) {
      case 'WELCOME':
        await processWelcome(lower);
        break;
      case 'SELECT_BUSINESS':
        await processBusinessSelection(lower);
        break;
      case 'VIEW_MENU':
        await processMenuSelection(lower, text);
        break;
      case 'ADD_MORE':
        await processAddMore(lower);
        break;
      case 'ENTER_ADDRESS':
        await processAddress(text);
        break;
      case 'CONFIRM_ORDER':
        await processConfirmation(lower);
        break;
      case 'COMPLETED':
        await processCompleted(lower);
        break;
      default:
        await botReply('Disculpa, no entendí. ¿En qué puedo ayudarte? 🤔');
    }
  }

  // ── State Handlers ──
  async function processWelcome(text) {
    if (text.includes('domicilio') || text.includes('pedir') || text.includes('comida') ||
        text.includes('hola') || text.includes('menu') || text.includes('menú') ||
        text.includes('quiero') || text === '') {
      state = 'SELECT_BUSINESS';

      await botReply('¡Hola! 👋 Soy el bot de <strong>BarrioYa</strong>. Voy a ayudarte a pedir lo que necesites de tu barrio.', 800, true);
      await botReply('¿De cuál negocio quieres pedir? 🏪', 1000);

      const html = `Estos son los negocios disponibles cerca de ti:
<ul class="menu-list">
  <li>🧀 <strong>Panadería Don José</strong> — Panes, empanadas, jugos</li>
  <li>🍛 <strong>Restaurante La Sazón</strong> — Almuerzos, hamburguesas</li>
  <li>🛒 <strong>Tienda Doña Carmen</strong> — Abarrotes, bebidas</li>
</ul>`;
      await botReply(html, 1500, true);

      showQuickReplies([
        { label: '🧀 Panadería Don José', value: 'panaderia' },
        { label: '🍛 Restaurante La Sazón', value: 'restaurante' },
        { label: '🛒 Tienda Doña Carmen', value: 'tienda' }
      ]);
    } else {
      state = 'SELECT_BUSINESS';
      await processWelcome('hola');
    }
  }

  async function processBusinessSelection(text) {
    let businessKey = null;

    if (text.includes('panadería') || text.includes('panaderia') || text.includes('josé') || text.includes('jose') || text.includes('pan')) {
      businessKey = 'panaderia';
    } else if (text.includes('restaurante') || text.includes('sazón') || text.includes('sazon') || text.includes('almuerzo')) {
      businessKey = 'restaurante';
    } else if (text.includes('tienda') || text.includes('carmen') || text.includes('abarrotes')) {
      businessKey = 'tienda';
    }

    if (businessKey) {
      selectedBusiness = BUSINESSES[businessKey];
      state = 'VIEW_MENU';

      await botReply(`¡Perfecto! 🎉 Aquí tienes el menú de <strong>${selectedBusiness.name}</strong>:`, 1000, true);

      let menuHtml = '<ul class="menu-list">';
      selectedBusiness.items.forEach((item, i) => {
        menuHtml += `<li>${item.emoji} <strong>${item.name}</strong> — ${formatPrice(item.price)}</li>`;
      });
      menuHtml += '</ul>';
      await botReply(menuHtml, 1200, true);

      await botReply('Dime qué quieres pedir. Puedes escribirlo naturalmente, por ejemplo: "Quiero 3 empanadas y 2 jugos" 🛒', 1000);

      showQuickReplies(
        selectedBusiness.items.slice(0, 4).map(item => ({
          label: `${item.emoji} ${item.name}`,
          value: item.name
        }))
      );
    } else {
      await botReply('No encontré ese negocio 🤔. Elige uno de los disponibles:', 800);
      showQuickReplies([
        { label: '🧀 Panadería Don José', value: 'panaderia' },
        { label: '🍛 Restaurante La Sazón', value: 'restaurante' },
        { label: '🛒 Tienda Doña Carmen', value: 'tienda' }
      ]);
    }
  }

  async function processMenuSelection(text, original) {
    // NLP-like: extract quantities and items
    const items = selectedBusiness.items;
    let matched = false;

    // Try to match items mentioned
    items.forEach(item => {
      const nameWords = item.name.toLowerCase().split(' ');
      const itemMentioned = nameWords.some(w => w.length > 3 && text.includes(w));

      if (itemMentioned || text.includes(item.name.toLowerCase())) {
        // Try to extract quantity
        const qtyMatch = text.match(/(\d+)\s*(?:de\s+)?(?:\w+\s+)*(?:${nameWords.join('|')})/i) ||
                         text.match(/(\d+)/);
        const qty = qtyMatch ? parseInt(qtyMatch[1]) : 1;

        cart.push({ ...item, qty: Math.min(qty, 10) });
        matched = true;
      }
    });

    if (!matched && cart.length === 0) {
      // Fallback: add first item with qty 1
      const firstItem = items.find(item =>
        item.name.toLowerCase().split(' ').some(w => text.includes(w))
      );
      if (firstItem) {
        cart.push({ ...firstItem, qty: 1 });
        matched = true;
      }
    }

    if (matched || cart.length > 0) {
      if (matched) {
        const lastAdded = cart[cart.length - 1];
        await botReply(`✅ Agregado: <strong>${lastAdded.qty}x ${lastAdded.name}</strong> (${formatPrice(lastAdded.price * lastAdded.qty)})`, 800, true);
      }

      state = 'ADD_MORE';

      let cartHtml = '🛒 <strong>Tu carrito actual:</strong>\n<ul class="menu-list">';
      let subtotal = 0;
      cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        cartHtml += `<li>${item.emoji} ${item.qty}x ${item.name} — ${formatPrice(itemTotal)}</li>`;
      });
      cartHtml += `</ul>\n<strong>Subtotal: ${formatPrice(subtotal)}</strong>\n<strong>Envío: $2.500</strong>\n<strong>Total: ${formatPrice(subtotal + 2500)}</strong>`;

      await botReply(cartHtml, 1200, true);
      await botReply('¿Quieres agregar algo más o confirmar tu pedido? 🤔', 800);

      showQuickReplies([
        { label: '✅ Confirmar pedido', value: 'confirmar' },
        { label: '➕ Agregar más', value: 'agregar mas' },
        { label: '🗑️ Vaciar carrito', value: 'vaciar' }
      ]);
    } else {
      await botReply('No encontré ese producto en el menú 🤔. Intenta escribir el nombre del producto.', 800);
      showQuickReplies(
        selectedBusiness.items.slice(0, 4).map(item => ({
          label: `${item.emoji} ${item.name}`,
          value: item.name
        }))
      );
    }
  }

  async function processAddMore(text) {
    if (text.includes('confirmar') || text.includes('listo') || text.includes('sí') || text.includes('si') || text.includes('pedir')) {
      state = 'ENTER_ADDRESS';
      await botReply('¡Genial! 🎉 Ahora necesito tu dirección de entrega.', 800);
      await botReply('Escribe tu dirección completa. Por ejemplo: "Calle 45 #28-30, Cabecera"', 1000);

      showQuickReplies([
        { label: '📍 Calle 45 #28-30, Cabecera', value: 'Calle 45 #28-30, Cabecera, Bucaramanga' },
        { label: '📍 Carrera 33 #52-10, Sotomayor', value: 'Carrera 33 #52-10, Sotomayor, Bucaramanga' },
        { label: '📍 Calle 56 #23-15, La Concordia', value: 'Calle 56 #23-15, La Concordia, Bucaramanga' }
      ]);
    } else if (text.includes('agregar') || text.includes('más') || text.includes('mas') || text.includes('otro')) {
      state = 'VIEW_MENU';
      await botReply('¡Dale! ¿Qué más quieres agregar? 🛒', 800);
      showQuickReplies(
        selectedBusiness.items.slice(0, 4).map(item => ({
          label: `${item.emoji} ${item.name}`,
          value: item.name
        }))
      );
    } else if (text.includes('vaciar') || text.includes('borrar') || text.includes('cancelar')) {
      cart = [];
      state = 'VIEW_MENU';
      await botReply('🗑️ Carrito vaciado. Dime qué quieres pedir.', 800);
      showQuickReplies(
        selectedBusiness.items.slice(0, 4).map(item => ({
          label: `${item.emoji} ${item.name}`,
          value: item.name
        }))
      );
    } else {
      // Assume they're adding more items
      state = 'VIEW_MENU';
      await processMenuSelection(text, text);
    }
  }

  async function processAddress(text) {
    if (text.length < 5) {
      await botReply('La dirección parece muy corta. Intenta con algo como: "Calle 45 #28-30, Cabecera" 📍', 800);
      return;
    }

    deliveryAddress = text;
    state = 'CONFIRM_ORDER';

    let subtotal = 0;
    cart.forEach(item => subtotal += item.price * item.qty);
    const total = subtotal + 2500;

    await botReply(`📍 Dirección: <strong>${escapeHtml(deliveryAddress)}</strong>`, 800, true);

    // Build order summary JSON
    const orderJson = {
      pedido: `#BY-${Date.now().toString().slice(-6)}`,
      negocio: selectedBusiness.name,
      items: cart.map(i => ({ producto: i.name, cantidad: i.qty, precio: i.price * i.qty })),
      subtotal,
      envio: 2500,
      total,
      direccion: deliveryAddress,
      metodo_pago: 'Contra entrega / Nequi'
    };

    const summaryHtml = `📋 <strong>Resumen de tu pedido:</strong>

🏪 ${selectedBusiness.name}
📍 ${escapeHtml(deliveryAddress)}
💰 Total: <strong>${formatPrice(total)}</strong>
⏱️ Tiempo estimado: ~15 min

<div class="order-json">${JSON.stringify(orderJson, null, 2)}</div>`;

    await botReply(summaryHtml, 1500, true);
    await botReply('¿Confirmas el pedido? 🎯', 800);

    showQuickReplies([
      { label: '✅ Sí, confirmar', value: 'si confirmar' },
      { label: '❌ Cancelar', value: 'cancelar' },
      { label: '✏️ Cambiar dirección', value: 'cambiar direccion' }
    ]);
  }

  async function processConfirmation(text) {
    if (text.includes('si') || text.includes('sí') || text.includes('confirmar') || text.includes('dale')) {
      state = 'COMPLETED';

      await botReply('🎉 <strong>¡Pedido confirmado!</strong> Tu pedido ha sido enviado al negocio.', 1000, true);
      await botReply('📦 Carlos, tu domiciliario, ya fue asignado y saldrá pronto.', 1200);

      const trackingHtml = `🗺️ <strong>Sigue tu pedido en tiempo real:</strong>\n\n<a href="tracking.html" style="color: #00C853; text-decoration: underline; font-weight: 600;">👉 Ver seguimiento en vivo</a>`;
      await botReply(trackingHtml, 1500, true);
      await botReply('¡Gracias por usar BarrioYa! Tu barrio, tu app. 💚', 1000);

      showQuickReplies([
        { label: '🗺️ Ver seguimiento', value: 'tracking' },
        { label: '🔄 Nuevo pedido', value: 'nuevo' }
      ]);
    } else if (text.includes('cancelar') || text.includes('no')) {
      cart = [];
      selectedBusiness = null;
      state = 'WELCOME';
      await botReply('Pedido cancelado. ¿En qué más puedo ayudarte? 🤔', 800);
      showQuickReplies([{ label: '🛒 Nuevo pedido', value: 'quiero pedir' }]);
    } else if (text.includes('cambiar') || text.includes('direccion') || text.includes('dirección')) {
      state = 'ENTER_ADDRESS';
      await botReply('Escribe la nueva dirección de entrega 📍', 800);
    }
  }

  async function processCompleted(text) {
    if (text.includes('tracking') || text.includes('seguimiento') || text.includes('ver')) {
      window.open('tracking.html', '_blank');
    } else if (text.includes('nuevo') || text.includes('otro') || text.includes('pedir')) {
      cart = [];
      selectedBusiness = null;
      state = 'WELCOME';
      await handleUserMessage('hola');
    } else {
      await botReply('Tu pedido está en camino 🛵. ¿Necesitas algo más?', 800);
      showQuickReplies([
        { label: '🗺️ Ver seguimiento', value: 'tracking' },
        { label: '🔄 Nuevo pedido', value: 'nuevo' }
      ]);
    }
  }

  // ── Input Handling ──
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    handleUserMessage(text);
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // ── Initial Bot Greeting ──
  async function initGreeting() {
    // Check if coming from cart panel
    const params = new URLSearchParams(window.location.search);
    const fromCart = params.get('fromCart');

    if (fromCart && window.cartManager && !window.cartManager.isEmpty()) {
      const cm = window.cartManager;

      await botReply('¡Hola! 👋 Veo que ya tienes productos en tu carrito. Déjame preparar tu pedido.', 600, true);

      // Build cart summary
      let cartHtml = `🛒 <strong>Tu pedido de ${cm.businessName}:</strong>\n<ul class="menu-list">`;
      let subtotal = 0;
      cm.items.forEach(item => {
        const t = item.price * item.qty;
        subtotal += t;
        cartHtml += `<li>${item.emoji} ${item.qty}x ${item.name} — $${t.toLocaleString('es-CO')}</li>`;
      });
      cartHtml += `</ul>\n<strong>Subtotal: $${subtotal.toLocaleString('es-CO')}</strong>\n<strong>Envío: $2.500</strong>\n<strong>Total: $${(subtotal + 2500).toLocaleString('es-CO')}</strong>`;

      await botReply(cartHtml, 1200, true);

      // Pre-populate state
      selectedBusiness = { name: cm.businessName, items: cm.items };
      cart = cm.items.map(i => ({ ...i }));
      state = 'ADD_MORE';

      await botReply('¿Quieres confirmar este pedido o modificar algo? 🤔', 800);
      showQuickReplies([
        { label: '✅ Confirmar pedido', value: 'confirmar' },
        { label: '✏️ Modificar', value: 'agregar mas' },
        { label: '🗑️ Vaciar', value: 'vaciar' }
      ]);
    } else {
      await botReply('¡Hola! 👋 Bienvenido a <strong>BarrioYa</strong>. Soy tu asistente de pedidos del barrio.', 600, true);
      await botReply('¿Qué te gustaría pedir hoy? Escríbelo naturalmente o elige una opción 👇', 1000);

      showQuickReplies([
        { label: '🛒 Pedir un domicilio', value: 'quiero pedir un domicilio' },
        { label: '📋 Ver negocios', value: 'ver negocios' },
        { label: '🐾 Paseador de mascotas', value: 'necesito un paseador' }
      ]);
    }
  }

  setTimeout(initGreeting, 500);

});
