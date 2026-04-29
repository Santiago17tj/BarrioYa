/* ==========================================================
   BarrioYa — Tracking JavaScript (v2 — Premium Animations)
   Leaflet.js map with smooth real-time driver tracking
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ── Bucaramanga Coordinates ──
  // Origin: Panadería Don José (Cabecera area)
  const ORIGIN = { lat: 7.1180, lng: -73.1140 };
  // Destination: Customer (Sotomayor area)
  const DESTINATION = { lat: 7.1095, lng: -73.1060 };

  // Simulated route waypoints through Bucaramanga streets (densified for smoothness)
  const ROUTE_POINTS = [
    { lat: 7.1180, lng: -73.1140 },
    { lat: 7.11785, lng: -73.11385 },
    { lat: 7.1177, lng: -73.1137 },
    { lat: 7.11755, lng: -73.11345 },
    { lat: 7.1174, lng: -73.1132 },
    { lat: 7.1172, lng: -73.1129 },
    { lat: 7.1170, lng: -73.1126 },
    { lat: 7.1168, lng: -73.1124 },
    { lat: 7.1166, lng: -73.1122 },
    { lat: 7.1163, lng: -73.1120 },
    { lat: 7.1160, lng: -73.1118 },
    { lat: 7.1157, lng: -73.1116 },
    { lat: 7.1154, lng: -73.1114 },
    { lat: 7.1151, lng: -73.1112 },
    { lat: 7.1148, lng: -73.1110 },
    { lat: 7.1146, lng: -73.1108 },
    { lat: 7.1143, lng: -73.1106 },
    { lat: 7.1140, lng: -73.1105 },
    { lat: 7.1138, lng: -73.1103 },
    { lat: 7.1135, lng: -73.1101 },
    { lat: 7.1132, lng: -73.1099 },
    { lat: 7.1130, lng: -73.1097 },
    { lat: 7.1128, lng: -73.1095 },
    { lat: 7.1126, lng: -73.1093 },
    { lat: 7.1124, lng: -73.1091 },
    { lat: 7.1122, lng: -73.1089 },
    { lat: 7.1120, lng: -73.1087 },
    { lat: 7.1118, lng: -73.1085 },
    { lat: 7.1116, lng: -73.1083 },
    { lat: 7.1114, lng: -73.1081 },
    { lat: 7.1112, lng: -73.1079 },
    { lat: 7.1110, lng: -73.1077 },
    { lat: 7.1108, lng: -73.1075 },
    { lat: 7.1106, lng: -73.1072 },
    { lat: 7.1104, lng: -73.1070 },
    { lat: 7.1102, lng: -73.1068 },
    { lat: 7.1100, lng: -73.1065 },
    { lat: 7.1098, lng: -73.1063 },
    { lat: 7.1096, lng: -73.1061 },
    { lat: 7.1095, lng: -73.1060 }
  ];

  // ── Custom SVG Motorcycle Icon ──
  const MOTO_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18.5" cy="17.5" r="3.5"/>
      <circle cx="5.5" cy="17.5" r="3.5"/>
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/>
      <path d="M5.5 17.5h0"/>
    </svg>`;

  // ── Initialize Leaflet Map (centered on Bucaramanga) ──
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: true
  }).setView([7.1140, -73.1100], 15);

  // OpenStreetMap Tiles (free, no API key needed)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // ── Custom Icon Factory ──
  function createDivIcon(className, content) {
    return L.divIcon({
      className: '',
      html: `<div class="${className}">${content}</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -25]
    });
  }

  // ── Markers ──
  // Origin marker (restaurant/store)
  const originMarker = L.marker([ORIGIN.lat, ORIGIN.lng], {
    icon: createDivIcon('marker-origin', '🏪')
  }).addTo(map).bindPopup('<strong>Panadería Don José</strong><br>Punto de recogida');

  // Destination marker (customer)
  const destMarker = L.marker([DESTINATION.lat, DESTINATION.lng], {
    icon: createDivIcon('marker-destination', '📍')
  }).addTo(map).bindPopup('<strong>Tu ubicación</strong><br>Punto de entrega');

  // Driver marker — uses custom SVG motorcycle
  const driverMarker = L.marker([ROUTE_POINTS[0].lat, ROUTE_POINTS[0].lng], {
    icon: createDivIcon('marker-driver', MOTO_SVG),
    zIndexOffset: 1000
  }).addTo(map).bindPopup('<strong>Carlos Ramírez</strong><br>Tu domiciliario');

  // ── Draw Route Line (remaining path — dashed) ──
  const routeLatLngs = ROUTE_POINTS.map(p => [p.lat, p.lng]);
  const routeLine = L.polyline(routeLatLngs, {
    color: '#00C853',
    weight: 5,
    opacity: 0.35,
    dashArray: '10, 8',
    lineCap: 'round'
  }).addTo(map);

  // Traveled path (solid, glowing)
  const traveledLine = L.polyline([], {
    color: '#00C853',
    weight: 6,
    opacity: 1,
    lineCap: 'round'
  }).addTo(map);

  // Fit map to show entire route
  const bounds = L.latLngBounds(routeLatLngs);
  map.fitBounds(bounds.pad(0.15));

  // ── Smooth Interpolation Helper ──
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothMove(marker, from, to, duration, onComplete) {
    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);

      const lat = lerp(from.lat, to.lat, eased);
      const lng = lerp(from.lng, to.lng, eased);
      marker.setLatLng([lat, lng]);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onComplete) onComplete();
      }
    }
    requestAnimationFrame(animate);
  }

  // ── Tracking Simulation ──
  let currentPointIndex = 0;
  const totalPoints = ROUTE_POINTS.length;
  const MOVE_INTERVAL = 2000; // ms between movements
  const SMOOTH_DURATION = 1600; // ms for smooth animation
  const ETA_START = 12; // minutes

  const etaValueEl = document.getElementById('etaValue');
  const statusTimeline = document.getElementById('statusTimeline');

  function updateETA() {
    const remaining = totalPoints - currentPointIndex - 1;
    const etaMin = Math.max(1, Math.round((remaining / totalPoints) * ETA_START));

    if (etaValueEl) {
      etaValueEl.innerHTML = `${etaMin} <span>min</span>`;
    }
  }

  function updateStatus(step) {
    const steps = statusTimeline.querySelectorAll('.status-step');
    const stepMap = { confirmed: 0, preparing: 1, onway: 2, delivered: 3 };
    const idx = stepMap[step];

    steps.forEach((s, i) => {
      s.classList.remove('completed', 'active', 'pending');
      if (i < idx) {
        s.classList.add('completed');
        s.querySelector('.status-dot').textContent = '✓';
      } else if (i === idx) {
        s.classList.add('active');
      } else {
        s.classList.add('pending');
      }
    });
  }

  function animateDriver() {
    if (currentPointIndex >= totalPoints - 1) {
      // Arrived!
      updateStatus('delivered');
      if (etaValueEl) {
        etaValueEl.innerHTML = '¡Llegó! 🎉';
        etaValueEl.style.fontSize = '1.5rem';
      }

      // Update the panel header
      const panelHeader = document.querySelector('.panel-header h2');
      if (panelHeader) {
        panelHeader.textContent = '¡Tu pedido ha llegado! 🎉';
      }

      // Update delivered step info
      const deliveredStep = statusTimeline.querySelector('[data-step="delivered"]');
      if (deliveredStep) {
        deliveredStep.classList.remove('pending', 'active');
        deliveredStep.classList.add('completed');
        deliveredStep.querySelector('.status-dot').textContent = '✓';
        deliveredStep.querySelector('.status-info p').textContent = new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      }

      // Confetti-like celebration pulse
      const etaCard = document.querySelector('.eta-card');
      if (etaCard) {
        etaCard.style.background = 'linear-gradient(135deg, #C8E6C9, #A5D6A7)';
        etaCard.style.animation = 'celebratePulse 0.6s ease';
      }
      return;
    }

    const fromPoint = ROUTE_POINTS[currentPointIndex];
    currentPointIndex++;
    const toPoint = ROUTE_POINTS[currentPointIndex];

    // Smooth CSS-like movement via requestAnimationFrame
    smoothMove(driverMarker, fromPoint, toPoint, SMOOTH_DURATION, () => {
      // Update traveled path
      const traveled = ROUTE_POINTS.slice(0, currentPointIndex + 1).map(p => [p.lat, p.lng]);
      traveledLine.setLatLngs(traveled);

      // Softly center map on driver if near edge
      const driverLatLng = driverMarker.getLatLng();
      const mapBounds = map.getBounds();
      const padded = mapBounds.pad(-0.2); // Inner bounds
      if (!padded.contains(driverLatLng)) {
        map.panTo(driverLatLng, { animate: true, duration: 0.8 });
      }

      updateETA();
    });

    // Schedule next movement
    setTimeout(animateDriver, MOVE_INTERVAL);
  }

  // Start simulation after a short delay
  updateStatus('onway');
  updateETA();

  setTimeout(() => {
    animateDriver();
  }, 2000);


  // ── Resize Handler (fix Leaflet rendering on resize) ──
  window.addEventListener('resize', () => {
    setTimeout(() => map.invalidateSize(), 100);
  });

  // ── Google Maps Fallback (ready for future API key) ──
  // To switch to Google Maps:
  // 1. Add <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places,directions"> in HTML
  // 2. Call initGoogleMaps() instead of Leaflet init
  // 3. Use google.maps.Map, google.maps.Marker, google.maps.DirectionsService
  //
  // function initGoogleMaps() {
  //   const map = new google.maps.Map(document.getElementById('map'), {
  //     center: { lat: 7.1140, lng: -73.1100 },
  //     zoom: 15,
  //     styles: [/* custom map styles */]
  //   });
  //   const directionsService = new google.maps.DirectionsService();
  //   const directionsRenderer = new google.maps.DirectionsRenderer({ map });
  //   // ... rest of Google Maps implementation
  // }

  // ── WebSocket Ready (for backend integration) ──
  // function connectWebSocket(orderId) {
  //   const ws = new WebSocket(`wss://api.barrioYa.com/tracking/${orderId}`);
  //   ws.onmessage = (event) => {
  //     const data = JSON.parse(event.data);
  //     driverMarker.setLatLng([data.lat, data.lng]);
  //     updateETA(data.eta);
  //     updateStatus(data.status);
  //   };
  //   ws.onclose = () => setTimeout(() => connectWebSocket(orderId), 3000);
  // }

});
