/* ==========================================================
   BarrioYa — Admin Dashboard JavaScript
   Real-time data from Supabase, charts, sidebar nav, order management
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ══════════════════════════════════════
  // REAL DATA FROM API (Supabase via FastAPI)
  // ══════════════════════════════════════

  let ORDERS = [];
  const API_BASE = window.API_BASE_URL || '';

  async function fetchOrders() {
    try {
      const response = await fetch(`${API_BASE}/api/pedidos`);
      if (!response.ok) throw new Error('Error al cargar pedidos');
      const data = await response.json();
      
      const newOrdersData = data.map(o => ({
        id: o.id || o.order_id,
        customer: o.datos_cliente?.nombre || 'Cliente Anónimo',
        items: o.pedido_items?.map(i => `${i.cantidad}x ${i.nombre_item}`).join(', ') || 'Sin items',
        total: o.total,
        status: o.estado || 'nuevo',
        time: new Date(o.fecha_creacion).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      }));

      // Detectar pedidos nuevos para notificaciones
      if (ORDERS.length > 0) {
        const existingIds = new Set(ORDERS.map(o => o.id));
        newOrdersData.forEach(order => {
          if (!existingIds.has(order.id)) {
            showToast(`🚀 Nuevo Pedido #${order.id}`, `De: ${order.customer} por ${formatPrice(order.total)}`);
            if (Notification.permission === "granted") {
              new Notification("BarrioYa: Nuevo Pedido", {
                body: `${order.customer} ha realizado un pedido de ${formatPrice(order.total)}`,
                icon: "/assets/icon-192.png"
              });
            }
          }
        });
      }

      ORDERS = newOrdersData;
      renderOrdersTable(currentFilter);
      renderKanbanBoard();
      updateOrdersBadge();
      updateMetrics();
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }

  // Polling cada 10 segundos para tiempo real
  setInterval(fetchOrders, 10000);

  function formatPrice(price) {
    return '$' + price.toLocaleString('es-CO');
  }

  function updateMetrics() {
    const totalOrdersEl = document.getElementById('totalOrders');
    if (totalOrdersEl) totalOrdersEl.textContent = ORDERS.length;

    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
      const revenue = ORDERS.reduce((sum, o) => sum + o.total, 0);
      totalRevenueEl.textContent = formatPrice(revenue);
    }
  }

  // ══════════════════════════════════════
  // NOTIFICATION SOUND
  // ══════════════════════════════════════

  function playNotificationPing() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch(e) {}
  }

  // ══════════════════════════════════════
  // SKELETON LOADERS
  // ══════════════════════════════════════

  function showSkeletonTable() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;
    tbody.innerHTML = Array(5).fill('').map(() => `
      <tr>
        <td><div class="skeleton-row" style="height:14px;width:80px;background:#2D3140;border-radius:4px"></div></td>
        <td><div class="skeleton-row" style="height:14px;width:110px;background:#2D3140;border-radius:4px"></div></td>
        <td><div class="skeleton-row" style="height:14px;width:160px;background:#2D3140;border-radius:4px"></div></td>
        <td><div class="skeleton-row" style="height:14px;width:70px;background:#2D3140;border-radius:4px"></div></td>
        <td><div class="skeleton-row" style="height:22px;width:90px;background:#2D3140;border-radius:50px"></div></td>
        <td><div class="skeleton-row" style="height:26px;width:70px;background:#2D3140;border-radius:6px"></div></td>
      </tr>
    `).join('');
  }

  function showSkeletonKanban() {
    const statuses = ['Nuevo', 'Preparando', 'Enviado', 'Entregado'];
    statuses.forEach(status => {
      const container = document.getElementById(`cards${status}`);
      if (container) container.innerHTML = '<div class="skeleton-card" style="height:100px;background:#2D3140;border-radius:12px;margin-bottom:1rem"></div>';
    });
  }

  // ══════════════════════════════════════
  // SIDEBAR NAVIGATION
  // ══════════════════════════════════════

  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.content-section');
  const pageTitle = document.getElementById('pageTitle');
  const pageSubtitle = document.getElementById('pageSubtitle');
  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');

  const sectionTitles = {
    dashboard: { title: 'Dashboard', subtitle: 'Bienvenido de vuelta, Don José 👋' },
    orders: { title: 'Pedidos', subtitle: 'Gestiona los pedidos en tiempo real' },
    menu: { title: 'Mi Menú', subtitle: 'Administra tus productos y precios' },
    drivers: { title: 'Domiciliarios', subtitle: 'Equipo de entrega activo' },
    analytics: { title: 'Analítica', subtitle: 'Métricas y rendimiento del negocio' }
  };

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const section = item.dataset.section;
      if (!section) return; // Permitir que links normales (como el del Bot) funcionen
      
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      sections.forEach(s => {
        s.classList.remove('active');
        if (s.id === `section${section.charAt(0).toUpperCase() + section.slice(1)}`) s.classList.add('active');
      });
      pageTitle.textContent = sectionTitles[section].title;
      pageSubtitle.textContent = sectionTitles[section].subtitle;
      sidebar.classList.remove('open');
    });
  });

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  // ══════════════════════════════════════
  // ORDERS TABLE
  // ══════════════════════════════════════

  const ordersTableBody = document.getElementById('ordersTableBody');
  const filterBtns = document.querySelectorAll('.filter-btn');
  let currentFilter = 'all';

  function renderOrdersTable(filter = 'all') {
    if (!ordersTableBody) return;
    const filtered = filter === 'all' ? ORDERS : ORDERS.filter(o => o.status === filter);

    ordersTableBody.innerHTML = filtered.map(order => {
      const nextAction = getNextAction(order.status);
      return `
        <tr>
          <td><strong>#${order.id}</strong></td>
          <td>${order.customer}</td>
          <td style="color: var(--admin-text-muted); font-size: 0.8rem;">${order.items}</td>
          <td><strong>${formatPrice(order.total)}</strong></td>
          <td><span class="status-badge ${order.status}">${getStatusLabel(order.status)}</span></td>
          <td>
            ${nextAction ? `<button class="action-btn" onclick="advanceOrder('${order.id}')">${nextAction}</button>` : '<button class="action-btn" disabled>Completado</button>'}
          </td>
        </tr>
      `;
    }).join('');
  }

  function getStatusLabel(status) {
    const labels = { nuevo: '🆕 Nuevo', preparando: '👨‍🍳 Preparando', enviado: '🛵 Enviado', entregado: '✅ Entregado' };
    return labels[status] || status;
  }

  function getNextAction(status) {
    const actions = { nuevo: 'Preparar', preparando: 'Enviar', enviado: 'Entregar' };
    return actions[status] || null;
  }

  window.advanceOrder = async function(orderId) {
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) return;

    const flow = ['nuevo', 'preparando', 'enviado', 'entregado'];
    const currentIndex = flow.indexOf(order.status);
    if (currentIndex < flow.length - 1) {
      const nextStatus = flow[currentIndex + 1];
      
      try {
        const response = await fetch(`${API_BASE}/api/pedidos/${orderId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus })
        });

        if (!response.ok) throw new Error('No se pudo actualizar en el servidor');

        order.status = nextStatus;
        renderOrdersTable(currentFilter);
        renderKanbanBoard();
        updateOrdersBadge();
        showToast(`Pedido #${orderId}`, `Estado actualizado: ${getStatusLabel(order.status)}`);
      } catch (error) {
        console.error('Error updating order:', error);
        showToast('Error', 'No se pudo actualizar el pedido. Intenta de nuevo.');
      }
    }
  };

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderOrdersTable(currentFilter);
    });
  });

  // ══════════════════════════════════════
  // KANBAN BOARD
  // ══════════════════════════════════════

  function renderKanbanBoard() {
    const statuses = ['nuevo', 'preparando', 'enviado', 'entregado'];
    statuses.forEach(status => {
      const container = document.getElementById(`cards${status.charAt(0).toUpperCase() + status.slice(1)}`);
      const count = document.getElementById(`count${status.charAt(0).toUpperCase() + status.slice(1)}`);
      if (!container || !count) return;

      const filtered = ORDERS.filter(o => o.status === status);
      count.textContent = filtered.length;

      container.innerHTML = filtered.map(order => {
        const nextAction = getNextAction(order.status);
        return `
          <div class="board-card">
            <div class="card-header">
              <span class="card-id">#${order.id}</span>
              <span class="card-time">${order.time}</span>
            </div>
            <div class="card-customer">${order.customer}</div>
            <div class="card-items">${order.items}</div>
            <div class="card-total">${formatPrice(order.total)}</div>
            ${nextAction ? `<div class="card-action"><button class="action-btn" onclick="advanceOrder('${order.id}')">${nextAction} →</button></div>` : ''}
          </div>
        `;
      }).join('');
    });
  }

  // ══════════════════════════════════════
  // MISC UI
  // ══════════════════════════════════════

  function updateOrdersBadge() {
    const badge = document.getElementById('ordersBadge');
    if (!badge) return;
    const newOrders = ORDERS.filter(o => o.status === 'nuevo').length;
    badge.textContent = newOrders;
    badge.style.display = newOrders > 0 ? 'block' : 'none';
  }

  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMsg = document.getElementById('toastMsg');
  function showToast(title, msg) {
    if (!toast) return;
    toastTitle.textContent = title;
    toastMsg.textContent = msg;
    toast.classList.add('show');
    playNotificationPing();
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  // Solicitar permiso para notificaciones de escritorio
  if (window.Notification && Notification.permission !== "granted") {
    Notification.requestPermission();
  }

  // INITIAL LOAD
  showSkeletonTable();
  showSkeletonKanban();
  fetchOrders();

});
