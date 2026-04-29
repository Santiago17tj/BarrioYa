/* ==========================================================
   BarrioYa — Tracking JavaScript
   Leaflet.js map with simulated real-time driver tracking
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ── Bucaramanga Coordinates ──
  // Origin: Panadería Don José (Cabecera area)
  const ORIGIN = { lat: 7.1180, lng: -73.1140 };
  // Destination: Customer (Sotomayor area)
  const DESTINATION = { lat: 7.1095, lng: -73.1060 };

  // Simulated route waypoints through Bucaramanga streets
  const ROUTE_POINTS = [
    { lat: 7.1180, lng: -73.1140 },
    { lat: 7.1175, lng: -73.1135 },
    { lat: 7.1170, lng: -73.1128 },
    { lat: 7.1165, lng: -73.1122 },
    { lat: 7.1158, lng: -73.1118 },
    { lat: 7.1150, lng: -73.1112 },
    { lat: 7.1145, lng: -73.1108 },
    { lat: 7.1138, lng: -73.1105 },
    { lat: 7.1132, lng: -73.1100 },
    { lat: 7.1128, lng: -73.1095 },
    { lat: 7.1122, lng: -73.1090 },
    { lat: 7.1118, lng: -73.1085 },
    { lat: 7.1112, lng: -73.1080 },
    { lat: 7.1108, lng: -73.1075 },
    { lat: 7.1102, lng: -73.1068 },
    { lat: 7.1098, lng: -73.1063 },
    { lat: 7.1095, lng: -73.1060 }
  ];

  // ── Initialize Leaflet Map ──
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
  function createDivIcon(className, emoji) {
    return L.divIcon({
      className: '',
      html: `<div class="${className}">${emoji}</div>`,
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

  // Driver marker (animated)
  const driverMarker = L.marker([ROUTE_POINTS[0].lat, ROUTE_POINTS[0].lng], {
    icon: createDivIcon('marker-driver', '🛵'),
    zIndexOffset: 1000
  }).addTo(map).bindPopup('<strong>Carlos Ramírez</strong><br>Tu domiciliario');

  // ── Draw Route Line ──
  const routeLatLngs = ROUTE_POINTS.map(p => [p.lat, p.lng]);
  const routeLine = L.polyline(routeLatLngs, {
    color: '#00C853',
    weight: 5,
    opacity: 0.8,
    dashArray: '10, 8',
    lineCap: 'round'
  }).addTo(map);

  // Traveled path (solid line)
  const traveledLine = L.polyline([], {
    color: '#00C853',
    weight: 5,
    opacity: 1,
    lineCap: 'round'
  }).addTo(map);

  // Fit map to show entire route
  const bounds = L.latLngBounds(routeLatLngs);
  map.fitBounds(bounds.pad(0.15));

  // ── Tracking Simulation ──
  let currentPointIndex = 0;
  const totalPoints = ROUTE_POINTS.length;
  const MOVE_INTERVAL = 2500; // ms between movements
  const ETA_START = 8; // minutes

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
      return;
    }

    currentPointIndex++;
    const point = ROUTE_POINTS[currentPointIndex];

    // Smooth movement with Leaflet
    driverMarker.setLatLng([point.lat, point.lng]);

    // Update traveled path
    const traveled = ROUTE_POINTS.slice(0, currentPointIndex + 1).map(p => [p.lat, p.lng]);
    traveledLine.setLatLngs(traveled);

    // Center map on driver if far from view
    if (!map.getBounds().contains(driverMarker.getLatLng())) {
      map.panTo(driverMarker.getLatLng());
    }

    updateETA();

    // Continue animation
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
