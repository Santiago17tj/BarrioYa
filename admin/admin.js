/* ==========================================================
   BarrioYa — Admin Dashboard JavaScript
   Mock data, charts, sidebar nav, order management, toast
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ══════════════════════════════════════
  // MOCK DATA
  // ══════════════════════════════════════

  const ORDERS = [
    { id: 'BY-0425', customer: 'María García', items: '3x Empanada, 2x Jugo', total: 11000, status: 'nuevo', time: '11:32 AM' },
    { id: 'BY-0424', customer: 'Carlos Pérez', items: '1x Bandeja paisa', total: 15000, status: 'nuevo', time: '11:28 AM' },
    { id: 'BY-0423', customer: 'Ana Ruiz', items: '4x Pan de bono, 1x Buñuelo', total: 5500, status: 'preparando', time: '11:15 AM' },
    { id: 'BY-0422', customer: 'Josué López', items: '2x Arepa, 3x Jugo lulo', total: 13500, status: 'preparando', time: '11:02 AM' },
    { id: 'BY-0421', customer: 'Laura Díaz', items: '5x Empanada', total: 10000, status: 'enviado', time: '10:45 AM' },
    { id: 'BY-0420', customer: 'Pedro Martínez', items: '1x Hamburguesa, 1x Limonada', total: 18000, status: 'enviado', time: '10:30 AM' },
    { id: 'BY-0419', customer: 'Sofía Hernández', items: '2x Pan de bono, 2x Empanada', total: 6000, status: 'entregado', time: '10:10 AM' },
    { id: 'BY-0418', customer: 'Miguel Torres', items: '1x Sancocho', total: 10000, status: 'entregado', time: '9:45 AM' },
  ];

  const MENU_ITEMS = [
    { name: 'Empanada de carne', price: 2000, emoji: '🥟', available: true },
    { name: 'Pan de bono', price: 1000, emoji: '🧀', available: true },
    { name: 'Buñuelo', price: 1500, emoji: '🍩', available: true },
    { name: 'Arepa de huevo', price: 3000, emoji: '🌮', available: true },
    { name: 'Jugo de lulo', price: 2500, emoji: '🧃', available: true },
    { name: 'Almojábana', price: 1800, emoji: '🥐', available: false },
    { name: 'Pandebono especial', price: 2000, emoji: '🧀', available: true },
    { name: 'Café con leche', price: 2000, emoji: '☕', available: true },
  ];

  const DRIVERS = [
    { name: 'Carlos Ramírez', vehicle: 'Moto Yamaha FZ', rating: 4.9, deliveries: 156, status: 'online', emoji: '🧑' },
    { name: 'Andrea Gómez', vehicle: 'Bicicleta eléctrica', rating: 4.8, deliveries: 89, status: 'online', emoji: '👩' },
    { name: 'Luis Parra', vehicle: 'Moto Honda CB', rating: 4.7, deliveries: 204, status: 'online', emoji: '👨' },
    { name: 'Valentina Suárez', vehicle: 'Bicicleta', rating: 4.6, deliveries: 45, status: 'offline', emoji: '👩‍🦱' },
  ];

  function formatPrice(price) {
    return '$' + price.toLocaleString('es-CO');
  }

  // ══════════════════════════════════════
  // NOTIFICATION SOUND (Web Audio API)
  // ══════════════════════════════════════

  function playNotificationPing() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5
      oscillator.frequency.setValueAtTime(1100, ctx.currentTime + 0.1); // C#6
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.4);
    } catch(e) { /* Audio not supported */ }
  }

  // ══════════════════════════════════════
  // SKELETON LOADERS
  // ══════════════════════════════════════

  function showSkeletonTable() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = Array(5).fill('').map(() => `
      <tr>
        <td><div class="skeleton skeleton-row short" style="height:14px;width:80px"></div></td>
        <td><div class="skeleton skeleton-row medium" style="height:14px;width:110px"></div></td>
        <td><div class="skeleton skeleton-row full" style="height:14px;width:160px"></div></td>
        <td><div class="skeleton skeleton-row short" style="height:14px;width:70px"></div></td>
        <td><div class="skeleton skeleton-row" style="height:22px;width:90px;border-radius:50px"></div></td>
        <td><div class="skeleton skeleton-row" style="height:26px;width:70px;border-radius:6px"></div></td>
      </tr>
    `).join('');
  }

  function showSkeletonKanban() {
    const statuses = ['Nuevo', 'Preparando', 'Enviado', 'Entregado'];
    statuses.forEach(status => {
      const container = document.getElementById(`cards${status}`);
      if (container) {
        container.innerHTML = Array(2).fill('').map(() => `
          <div class="skeleton skeleton-card"></div>
        `).join('');
      }
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
      e.preventDefault();
      const section = item.dataset.section;

      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      sections.forEach(s => {
        s.classList.remove('active');
        if (s.id === `section${section.charAt(0).toUpperCase() + section.slice(1)}`) {
          s.classList.add('active');
        }
      });

      pageTitle.textContent = sectionTitles[section].title;
      pageSubtitle.textContent = sectionTitles[section].subtitle;

      // Close mobile sidebar
      sidebar.classList.remove('open');
    });
  });

  // Mobile sidebar toggle
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // ══════════════════════════════════════
  // ORDERS TABLE (Dashboard)
  // ══════════════════════════════════════

  const ordersTableBody = document.getElementById('ordersTableBody');
  const filterBtns = document.querySelectorAll('.filter-btn');

  function renderOrdersTable(filter = 'all') {
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

  // Advance order status
  window.advanceOrder = function(orderId) {
    const order = ORDERS.find(o => o.id === orderId);
    if (!order) return;

    const flow = ['nuevo', 'preparando', 'enviado', 'entregado'];
    const currentIndex = flow.indexOf(order.status);
    if (currentIndex < flow.length - 1) {
      order.status = flow[currentIndex + 1];
      renderOrdersTable(currentFilter);
      renderKanbanBoard();
      updateOrdersBadge();
      showToast(`Pedido #${orderId}`, `Estado actualizado: ${getStatusLabel(order.status)}`);
    }
  };

  let currentFilter = 'all';
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;

      // Show skeleton then render
      showSkeletonTable();
      setTimeout(() => renderOrdersTable(currentFilter), 800);
    });
  });

  // Initial load with skeleton
  showSkeletonTable();
  setTimeout(() => renderOrdersTable(), 1500);

  // ══════════════════════════════════════
  // KANBAN BOARD (Orders Section)
  // ══════════════════════════════════════

  function renderKanbanBoard() {
    const statuses = ['nuevo', 'preparando', 'enviado', 'entregado'];

    statuses.forEach(status => {
      const container = document.getElementById(`cards${status.charAt(0).toUpperCase() + status.slice(1)}`);
      const count = document.getElementById(`count${status.charAt(0).toUpperCase() + status.slice(1)}`);
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

  // Initial load with skeleton
  showSkeletonKanban();
  setTimeout(() => renderKanbanBoard(), 1500);

  // ══════════════════════════════════════
  // MENU MANAGEMENT
  // ══════════════════════════════════════

  const menuGrid = document.getElementById('menuGrid');

  function renderMenu() {
    menuGrid.innerHTML = MENU_ITEMS.map((item, i) => `
      <div class="menu-item-card">
        <div class="item-emoji">${item.emoji}</div>
        <div class="item-name">${item.name}</div>
        <div class="item-price">${formatPrice(item.price)}</div>
        <div class="item-status ${item.available ? 'available' : 'unavailable'}">
          ${item.available ? '● Disponible' : '● No disponible'}
        </div>
        <div class="item-actions">
          <button class="btn-edit">✏️ Editar</button>
          <button class="btn-toggle" onclick="toggleMenuItem(${i})">${item.available ? '⏸ Desactivar' : '▶ Activar'}</button>
        </div>
      </div>
    `).join('');
  }

  window.toggleMenuItem = function(index) {
    MENU_ITEMS[index].available = !MENU_ITEMS[index].available;
    renderMenu();
    showToast('Menú actualizado', `${MENU_ITEMS[index].name}: ${MENU_ITEMS[index].available ? 'Activado' : 'Desactivado'}`);
  };

  renderMenu();

  // ══════════════════════════════════════
  // DRIVERS
  // ══════════════════════════════════════

  const driversGrid = document.getElementById('driversGrid');

  driversGrid.innerHTML = DRIVERS.map(driver => `
    <div class="driver-card-admin">
      <div class="driver-avatar-admin">${driver.emoji}</div>
      <div class="driver-details">
        <div class="driver-name">${driver.name}</div>
        <div class="driver-vehicle">${driver.vehicle}</div>
        <div class="driver-stats">
          <span>⭐ ${driver.rating}</span>
          <span>📦 ${driver.deliveries} entregas</span>
        </div>
      </div>
      <span class="driver-status-badge ${driver.status}">${driver.status === 'online' ? '● Online' : '○ Offline'}</span>
    </div>
  `).join('');

  // ══════════════════════════════════════
  // CHARTS (Chart.js)
  // ══════════════════════════════════════

  const chartDefaults = {
    color: '#8B8FA3',
    borderColor: '#2D3140',
    font: { family: "'Segoe UI', system-ui, sans-serif" }
  };

  // Orders by hour chart
  const ordersCtx = document.getElementById('ordersChart');
  if (ordersCtx) {
    new Chart(ordersCtx, {
      type: 'bar',
      data: {
        labels: ['7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm'],
        datasets: [{
          label: 'Pedidos',
          data: [1, 3, 2, 5, 7, 8, 6, 4, 3, 5, 6, 4],
          backgroundColor: 'rgba(0, 200, 83, 0.6)',
          borderColor: '#00C853',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#2D3140' }, ticks: { color: '#8B8FA3' } },
          x: { grid: { display: false }, ticks: { color: '#8B8FA3' } }
        }
      }
    });
  }

  // Products pie chart
  const productsCtx = document.getElementById('productsChart');
  if (productsCtx) {
    new Chart(productsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Empanadas', 'Pan de bono', 'Jugos', 'Buñuelos', 'Arepas'],
        datasets: [{
          data: [35, 25, 20, 12, 8],
          backgroundColor: ['#00C853', '#FFB300', '#3B82F6', '#A78BFA', '#EF4444'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8B8FA3', padding: 12, font: { size: 11 } }
          }
        }
      }
    });
  }

  // Revenue chart (Analytics)
  const revenueCtx = document.getElementById('revenueChart');
  if (revenueCtx) {
    new Chart(revenueCtx, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
        datasets: [{
          label: 'Ingresos',
          data: [280000, 320000, 290000, 345000, 410000, 520000, 380000],
          borderColor: '#00C853',
          backgroundColor: 'rgba(0, 200, 83, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#00C853',
          pointBorderWidth: 2,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(ctx) {
                return '$' + ctx.raw.toLocaleString('es-CO');
              }
            }
          }
        },
        scales: {
          y: {
            grid: { color: '#2D3140' },
            ticks: {
              color: '#8B8FA3',
              callback: function(value) { return '$' + (value / 1000) + 'k'; }
            }
          },
          x: { grid: { display: false }, ticks: { color: '#8B8FA3' } }
        }
      }
    });
  }

  // Peak hours chart (Analytics)
  const peakCtx = document.getElementById('peakChart');
  if (peakCtx) {
    new Chart(peakCtx, {
      type: 'radar',
      data: {
        labels: ['7am', '9am', '11am', '1pm', '3pm', '5pm', '7pm'],
        datasets: [{
          label: 'Pedidos',
          data: [2, 4, 8, 6, 3, 5, 7],
          borderColor: '#FFB300',
          backgroundColor: 'rgba(255, 179, 0, 0.15)',
          pointBackgroundColor: '#FFB300'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            grid: { color: '#2D3140' },
            angleLines: { color: '#2D3140' },
            pointLabels: { color: '#8B8FA3' },
            ticks: { display: false }
          }
        }
      }
    });
  }

  // ══════════════════════════════════════
  // TOAST NOTIFICATIONS
  // ══════════════════════════════════════

  const toast = document.getElementById('toast');
  const toastTitle = document.getElementById('toastTitle');
  const toastMsg = document.getElementById('toastMsg');
  const toastClose = document.getElementById('toastClose');

  function showToast(title, msg, withSound = false) {
    toastTitle.textContent = title;
    toastMsg.textContent = msg;
    toast.classList.add('show');

    if (withSound) playNotificationPing();

    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  if (toastClose) {
    toastClose.addEventListener('click', () => toast.classList.remove('show'));
  }

  // ══════════════════════════════════════
  // SIMULATED NEW ORDER (every 15s)
  // ══════════════════════════════════════

  function updateOrdersBadge() {
    const badge = document.getElementById('ordersBadge');
    const newOrders = ORDERS.filter(o => o.status === 'nuevo').length;
    badge.textContent = newOrders;
    badge.style.display = newOrders > 0 ? 'block' : 'none';
  }

  updateOrdersBadge();

  let newOrderCounter = 0;
  const fakeCustomers = ['Daniela Ríos', 'Santiago Mesa', 'Camila Ortiz', 'Andrés Vargas', 'Paula Castro'];
  const fakeItems = [
    '2x Empanada, 1x Jugo', '1x Arepa, 2x Café', '3x Pan de bono', '1x Buñuelo, 1x Jugo',
    '2x Almojábana, 1x Café'
  ];

  setInterval(() => {
    if (newOrderCounter >= 3) return; // Limit simulated orders
    newOrderCounter++;

    const newOrder = {
      id: `BY-0${425 + ORDERS.length}`,
      customer: fakeCustomers[newOrderCounter % fakeCustomers.length],
      items: fakeItems[newOrderCounter % fakeItems.length],
      total: Math.floor(Math.random() * 15000) + 5000,
      status: 'nuevo',
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    };

    ORDERS.unshift(newOrder);
    renderOrdersTable(currentFilter);
    renderKanbanBoard();
    updateOrdersBadge();

    // Update metrics
    const totalOrdersEl = document.getElementById('totalOrders');
    if (totalOrdersEl) totalOrdersEl.textContent = parseInt(totalOrdersEl.textContent) + 1;

    const totalRevenueEl = document.getElementById('totalRevenue');
    if (totalRevenueEl) {
      const current = parseInt(totalRevenueEl.textContent.replace(/\D/g, ''));
      totalRevenueEl.textContent = formatPrice(current + newOrder.total);
    }

    showToast('🔔 Nuevo pedido', `#${newOrder.id} — ${newOrder.customer} (${formatPrice(newOrder.total)})`, true);

    // Flash notification bell
    const notifDot = document.getElementById('notifDot');
    if (notifDot) {
      notifDot.style.background = '#FFB300';
      setTimeout(() => { notifDot.style.background = 'var(--admin-danger)'; }, 1000);
    }
  }, 15000);

});
