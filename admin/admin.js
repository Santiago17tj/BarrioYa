/* ==========================================================
   BarrioYa — Admin Dashboard JS (v2 · Control Room)
   - JWT auth (window.barrioyaAuth.authFetch)
   - Analytics fetch + Chart.js + count-up animations
   - Live clock, time-based greeting, status pills
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ── Auth guard ──
  if (!window.barrioyaAuth || !window.barrioyaAuth.requireAuth(['admin', 'comercio'])) {
    return;
  }

  const user = window.barrioyaAuth.getUser();
  const API = (window.API_BASE_URL || '').replace(/\/$/, '');
  const isAdmin = user.rol === 'admin';

  // ── User info en sidebar ──
  const initials = (user.nombre || user.email || '?')
    .split(/\s+/).map(s => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '·';
  document.getElementById('userAvatar').textContent = initials;
  document.getElementById('userName').textContent = user.nombre || user.email;
  document.getElementById('userRole').textContent = isAdmin
    ? 'BarrioYa · Admin'
    : (user.id_comercio ? `${user.id_comercio} · Comercio` : 'Comercio');

  // ── Welcome banner: greeting + name ──
  const hour = new Date().getHours();
  let greeting = 'Buenas noches';
  if (hour >= 5 && hour < 12) greeting = 'Buenos días';
  else if (hour >= 12 && hour < 19) greeting = 'Buenas tardes';
  document.getElementById('welcomeGreeting').textContent = greeting;
  document.getElementById('welcomeName').textContent = (user.nombre || user.email).split(' ')[0] + ' 👋';
  document.getElementById('welcomeSubtext').textContent = isAdmin
    ? 'Centro de control en tiempo real — ves todos los pedidos del barrio.'
    : `Panel del comercio · ${user.id_comercio || 'sin asignar'}`;

  // ── Live clock ──
  const clockTime = document.getElementById('clockTime');
  const clockDate = document.getElementById('clockDate');
  const dateOpts = { weekday: 'short', day: '2-digit', month: 'short' };
  function tickClock() {
    const now = new Date();
    clockTime.textContent = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    clockDate.textContent = now.toLocaleDateString('es-CO', dateOpts);
  }
  tickClock();
  setInterval(tickClock, 1000);

  // ── Logout ──
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (!confirm('¿Cerrar sesión?')) return;
    await window.barrioyaAuth.logout();
    window.location.href = '/admin/login.html';
  });

  // ══════════════════════════════
  // CHART.JS GLOBAL THEME
  // ══════════════════════════════
  if (window.Chart) {
    Chart.defaults.font.family = "'Outfit', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#A1A1AA';
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = '#161618';
    Chart.defaults.plugins.tooltip.titleColor = '#F8F8F8';
    Chart.defaults.plugins.tooltip.bodyColor = '#A1A1AA';
    Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 12;
    Chart.defaults.plugins.tooltip.cornerRadius = 10;
    Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 12 };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 11 };
    Chart.defaults.plugins.tooltip.displayColors = false;
  }

  // ══════════════════════════════
  // COUNT-UP NUMBERS
  // ══════════════════════════════
  function fmtMoney(n) {
    return '$' + Math.round(n).toLocaleString('es-CO');
  }

  function animateCounter(el, target, duration = 1500) {
    const startTime = performance.now();
    const startValue = 0;
    const format = el.dataset.format;

    function frame(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (target - startValue) * eased;

      if (format === 'money') {
        el.textContent = fmtMoney(current);
      } else {
        el.textContent = Math.round(current).toLocaleString('es-CO');
      }

      if (progress < 1) requestAnimationFrame(frame);
      else {
        // Final exact value
        el.textContent = format === 'money' ? fmtMoney(target) : Math.round(target).toLocaleString('es-CO');
      }
    }

    requestAnimationFrame(frame);
  }

  // ══════════════════════════════
  // ANALYTICS FETCH + RENDER
  // ══════════════════════════════
  let charts = {};
  let allOrders = [];

  async function fetchAnalytics() {
    if (!isAdmin) {
      // Comercio no tiene acceso a /analytics/summary.
      // Construimos resumen propio desde /api/pedidos (filtrado por backend).
      return null;
    }
    try {
      const r = await window.barrioyaAuth.authFetch(`${API}/api/analytics/summary`);
      if (!r.ok) return null;
      return await r.json();
    } catch { return null; }
  }

  async function fetchOrders() {
    try {
      const r = await window.barrioyaAuth.authFetch(`${API}/api/pedidos`);
      if (!r.ok) return [];
      return await r.json();
    } catch { return []; }
  }

  function summaryFromOrders(orders) {
    // Fallback para rol comercio: calcula resumen desde sus propios pedidos
    let total_revenue = 0;
    const status_dist = { recibido: 0, preparando: 0, enviado: 0, entregado: 0 };
    const productCounter = {};
    const byHour = new Array(24).fill(0);
    const byDayMap = {};
    const now = new Date();
    const cutoff7d = new Date(now); cutoff7d.setDate(cutoff7d.getDate() - 7);
    const cutoff24h = new Date(now); cutoff24h.setHours(cutoff24h.getHours() - 24);

    orders.forEach(o => {
      total_revenue += o.total || 0;
      const est = (o.estado || 'recibido').toLowerCase();
      status_dist[est] = (status_dist[est] || 0) + 1;
      const d = o.fecha_creacion ? new Date(o.fecha_creacion) : null;
      if (d) {
        if (d >= cutoff7d) {
          const k = d.toISOString().slice(0, 10);
          byDayMap[k] = (byDayMap[k] || 0) + (o.total || 0);
        }
        if (d >= cutoff24h) byHour[d.getHours()]++;
      }
      (o.pedido_items || []).forEach(it => {
        const n = it.nombre_item;
        if (n) productCounter[n] = (productCounter[n] || 0) + (it.cantidad || 0);
      });
    });

    const revenue_by_day = [];
    const today = new Date(); today.setHours(0,0,0,0);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      revenue_by_day.push({
        date: k,
        label: d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit' }),
        revenue: byDayMap[k] || 0
      });
    }

    const top_products = Object.entries(productCounter)
      .sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([name, quantity]) => ({ name, quantity }));

    const total_orders = orders.length;
    const active_orders = total_orders - status_dist.entregado;

    return {
      total_revenue,
      total_orders,
      avg_ticket: total_orders ? Math.round(total_revenue / total_orders) : 0,
      active_orders,
      revenue_by_day,
      orders_by_hour: byHour,
      top_products,
      status_distribution: status_dist
    };
  }

  function renderKPIs(s) {
    const elRev = document.getElementById('kpiRevenue');
    const elOrd = document.getElementById('kpiOrders');
    const elAvg = document.getElementById('kpiAvgTicket');
    const elAct = document.getElementById('kpiActive');

    // Render INMEDIATO con el valor final (evita el race del count-up).
    // La animación luego sobreescribe desde 0 hasta target con ease-out.
    elRev.textContent = fmtMoney(s.total_revenue);
    elOrd.textContent = s.total_orders.toLocaleString('es-CO');
    elAvg.textContent = fmtMoney(s.avg_ticket);
    elAct.textContent = s.active_orders.toLocaleString('es-CO');

    elRev.dataset.target = s.total_revenue;
    elOrd.dataset.target = s.total_orders;
    elAvg.dataset.target = s.avg_ticket;
    elAct.dataset.target = s.active_orders;

    // Pequeño delay para que el "fadeInUp" del card termine antes del count-up
    setTimeout(() => {
      animateCounter(elRev, s.total_revenue);
      animateCounter(elOrd, s.total_orders);
      animateCounter(elAvg, s.avg_ticket);
      animateCounter(elAct, s.active_orders);
    }, 250);

    document.getElementById('kpiRevenueMeta').textContent = `${s.total_orders} pedidos en total`;
    document.getElementById('kpiOrdersMeta').textContent = s.total_orders > 0 ? 'Histórico completo' : 'Sin pedidos aún';

    const weekTotal = s.revenue_by_day.reduce((a, d) => a + d.revenue, 0);
    document.getElementById('weekRevenueTotal').textContent = fmtMoney(weekTotal);

    const trend = s.revenue_by_day.slice(-3).reduce((a,d)=>a+d.revenue,0) -
                  s.revenue_by_day.slice(0,3).reduce((a,d)=>a+d.revenue,0);
    const chip = document.getElementById('weekTrendChip');
    chip.textContent = trend >= 0 ? `↗ ${fmtMoney(Math.abs(trend))}` : `↘ ${fmtMoney(Math.abs(trend))}`;
    chip.className = 'chip ' + (trend >= 0 ? 'chip--success' : '');

    const peakHour = s.orders_by_hour.indexOf(Math.max(...s.orders_by_hour));
    const peakChip = document.getElementById('peakHourChip');
    if (Math.max(...s.orders_by_hour) > 0) {
      peakChip.textContent = `⚡ pico ${peakHour}:00h`;
    } else {
      peakChip.textContent = '⚡ sin actividad 24h';
    }
  }

  function renderRevenueChart(s) {
    const ctx = document.getElementById('chartRevenueByDay').getContext('2d');
    if (charts.revenue) charts.revenue.destroy();

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 260);
    gradient.addColorStop(0, 'rgba(0, 200, 83, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 200, 83, 0)');

    charts.revenue = new Chart(ctx, {
      type: 'line',
      data: {
        labels: s.revenue_by_day.map(d => d.label),
        datasets: [{
          data: s.revenue_by_day.map(d => d.revenue),
          borderColor: '#00C853',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#00E676',
          pointHoverBorderColor: '#070707',
          pointHoverBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, border: { display: false } },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            border: { display: false },
            ticks: { callback: (v) => '$' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v) }
          }
        },
        plugins: {
          tooltip: {
            callbacks: { label: (c) => '  ' + fmtMoney(c.parsed.y) }
          }
        }
      }
    });
  }

  function renderHourlyChart(s) {
    const ctx = document.getElementById('chartOrdersByHour').getContext('2d');
    if (charts.hourly) charts.hourly.destroy();

    const max = Math.max(...s.orders_by_hour, 1);
    const colors = s.orders_by_hour.map(v => v >= max * 0.7 ? '#00C853' : (v > 0 ? '#27272A' : '#1C1C1F'));

    charts.hourly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from({length: 24}, (_, i) => `${i}h`),
        datasets: [{
          data: s.orders_by_hour,
          backgroundColor: colors,
          hoverBackgroundColor: '#00E676',
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: '#71717A', maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, border: { display: false }, ticks: { precision: 0 } }
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: (items) => `${items[0].label}`,
              label: (c) => `  ${c.parsed.y} pedidos`
            }
          }
        }
      }
    });
  }

  function renderStatusDonut(s) {
    const ctx = document.getElementById('chartStatusDonut').getContext('2d');
    if (charts.donut) charts.donut.destroy();

    const labels = ['Recibido', 'Preparando', 'Enviado', 'Entregado'];
    const keys = ['recibido', 'preparando', 'enviado', 'entregado'];
    const values = keys.map(k => s.status_distribution[k] || 0);
    const colors = ['#3B82F6', '#F59E0B', '#FF6F00', '#00C853'];

    charts.donut = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#0F0F11',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          tooltip: {
            callbacks: { label: (c) => `  ${c.label}: ${c.parsed}` }
          }
        }
      }
    });

    const total = values.reduce((a, b) => a + b, 0);
    document.getElementById('donutCenterValue').textContent = total;

    // Render legend
    const legend = document.getElementById('statusLegend');
    legend.innerHTML = labels.map((l, i) =>
      `<li style="--legend-color: ${colors[i]}">
         <span>${l}</span>
         <span class="legend-count">${values[i]}</span>
       </li>`
    ).join('');
  }

  function renderPodium(s) {
    const top = s.top_products || [];
    const slots = [
      { name: 'podium1Name', qty: 'podium1Qty' },
      { name: 'podium2Name', qty: 'podium2Qty' },
      { name: 'podium3Name', qty: 'podium3Qty' },
    ];

    slots.forEach((slot, i) => {
      const t = top[i];
      document.getElementById(slot.name).textContent = t ? t.name : '—';
      document.getElementById(slot.qty).textContent = t ? t.quantity : '0';
    });
  }

  function renderRecentOrders(orders, filter = 'all') {
    const tbody = document.getElementById('ordersTableBody');
    const recent = orders
      .filter(o => filter === 'all' || (o.estado || '').toLowerCase() === filter)
      .slice(0, 10);

    if (recent.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="empty-state">
        <div class="empty-state-icon">📭</div>
        Aún no hay pedidos en este filtro.
      </td></tr>`;
      return;
    }

    tbody.innerHTML = recent.map(o => {
      const items = (o.pedido_items || []).map(it => `${it.cantidad}× ${it.nombre_item}`).join(', ');
      const fecha = o.fecha_creacion ? new Date(o.fecha_creacion).toLocaleString('es-CO', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      }) : '—';
      const estado = (o.estado || 'recibido').toLowerCase();
      return `
        <tr>
          <td><span class="order-id">${o.id || ''}</span></td>
          <td>${o.id_comercio || '—'}</td>
          <td title="${items}">${items.length > 40 ? items.slice(0, 40) + '…' : items || '—'}</td>
          <td class="order-total">${fmtMoney(o.total || 0)}</td>
          <td><span class="status-pill status-pill--${estado}">${estado}</span></td>
          <td style="font-family:'JetBrains Mono', monospace; font-size: 0.7rem; color: var(--text-tertiary);">${fecha}</td>
        </tr>`;
    }).join('');
  }

  // ══════════════════════════════
  // LOAD & RENDER
  // ══════════════════════════════
  async function loadDashboard() {
    const [analytics, orders] = await Promise.all([fetchAnalytics(), fetchOrders()]);
    allOrders = orders || [];

    const summary = analytics || summaryFromOrders(allOrders);

    renderKPIs(summary);
    renderRevenueChart(summary);
    renderHourlyChart(summary);
    renderStatusDonut(summary);
    renderPodium(summary);
    renderRecentOrders(allOrders);
  }

  loadDashboard();

  // Auto-refresh every 30s (sin animación de count-up para no distraer)
  setInterval(async () => {
    const [analytics, orders] = await Promise.all([fetchAnalytics(), fetchOrders()]);
    allOrders = orders || [];
    const summary = analytics || summaryFromOrders(allOrders);

    // Update KPIs without count-up
    document.getElementById('kpiRevenue').textContent = fmtMoney(summary.total_revenue);
    document.getElementById('kpiOrders').textContent = summary.total_orders.toLocaleString('es-CO');
    document.getElementById('kpiAvgTicket').textContent = fmtMoney(summary.avg_ticket);
    document.getElementById('kpiActive').textContent = summary.active_orders.toLocaleString('es-CO');

    renderRevenueChart(summary);
    renderHourlyChart(summary);
    renderStatusDonut(summary);
    renderPodium(summary);
    renderRecentOrders(allOrders);
  }, 30000);

  // ── Filtros de tabla ──
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderRecentOrders(allOrders, btn.dataset.filter);
    });
  });

  // ── Sidebar nav (sections) ──
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const section = item.dataset.section;
      if (!section) return; // Items externos como bot-demo
      e.preventDefault();

      document.querySelectorAll('.sidebar-nav .nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
      const target = document.getElementById('section' + section.charAt(0).toUpperCase() + section.slice(1));
      if (target) target.classList.add('active');

      const titles = { dashboard: 'Dashboard', orders: 'Pedidos', menu: 'Mi menú', drivers: 'Domiciliarios', analytics: 'Analítica' };
      document.getElementById('pageTitle').textContent = titles[section] || section;
    });
  });

  // Sidebar toggle (mobile)
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }
});
