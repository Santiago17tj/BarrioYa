import re

def get_body_content(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract <main>...</main> and any section immediately after it if it belongs to the page
    main_match = re.search(r'<main[^>]*>(.*?)</main>', content, re.DOTALL)
    if not main_match:
        return ''
    main_content = main_match.group(1)
    
    # Check for whatsapp-section in servicios
    if 'whatsapp-section' in content:
        wa_match = re.search(r'<section class="whatsapp-section section">.*?</section>', content, re.DOTALL)
        if wa_match:
            main_content += '\n' + wa_match.group(0)
            
    return main_content

servicios_html = get_body_content('servicios.html')
checkout_html = get_body_content('checkout.html')
tracking_html = get_body_content('tracking.html')

with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

# Replace the body content of index.html with the new SPA structure
hero_start = index_content.find('<section class="hero" id="inicio">')
modal_start = index_content.find('<!-- ═══════════════════ WAITLIST MODAL ═══════════════════ -->')

if hero_start == -1 or modal_start == -1:
    print('Could not find injection points in index.html')
    exit(1)

original_home_content = index_content[hero_start:modal_start]

spa_content = f"""
  <main id="app-container">
    <!-- HOME VIEW -->
    <div id="home-view" class="spa-view active">
{original_home_content}
    </div>

    <!-- SERVICES VIEW -->
    <div id="services-view" class="spa-view" style="display: none;">
{servicios_html}
    </div>

    <!-- CHECKOUT VIEW -->
    <div id="checkout-view" class="spa-view" style="display: none;">
{checkout_html}
    </div>

    <!-- TRACKING VIEW -->
    <div id="tracking-view" class="spa-view" style="display: none;">
{tracking_html}
    </div>
  </main>
"""

bottom_nav = """
  <!-- ═══════════════════ BOTTOM NAVIGATION ═══════════════════ -->
  <nav class="bottom-nav">
    <a href="#home" class="bottom-nav-item active">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Inicio</span>
    </a>
    <a href="#services" class="bottom-nav-item">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span>Buscar</span>
    </a>
    <a href="#" class="bottom-nav-item" onclick="event.preventDefault(); if(window.cartUI) window.cartUI.togglePanel();">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy=\"21\" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      <span>Carrito</span>
    </a>
    <a href="#profile" class="bottom-nav-item" onclick="event.preventDefault(); alert('Sección Perfil próximamente');">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>Perfil</span>
    </a>
  </nav>

"""

new_index_content = index_content[:hero_start] + spa_content + bottom_nav + index_content[modal_start:]

if 'leaflet.js' not in new_index_content:
    head_end = new_index_content.find('</head>')
    leaflet_css = '''
  <!-- Leaflet CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    crossorigin="" />
'''
    new_index_content = new_index_content[:head_end] + leaflet_css + new_index_content[head_end:]
    
if 'js/tracking.js' not in new_index_content:
    scripts_end = new_index_content.find('</body>')
    tracking_scripts = '''
  <!-- Leaflet JS -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    crossorigin=""></script>
  <script src="js/tracking.js"></script>
  <script src="js/checkout.js"></script>
  <script src="js/menu-page.js"></script>
  <script src="js/router.js"></script>
'''
    new_index_content = new_index_content[:scripts_end] + tracking_scripts + new_index_content[scripts_end:]

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_index_content)
    
print('index.html updated successfully with SPA structure')
