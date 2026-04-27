# BarrioYa – Requerimientos Frontend
**Documento para desarrollador frontend**
Versión 1.0 · Bucaramanga, 2025 · Confidencial

---

## 1. Contexto del Proyecto

BarrioYa es una superapp móvil y web de servicios hiperlocales que conecta residentes de un barrio con negocios y prestadores de servicios dentro de un radio de 2 km. Integra domicilios, paseo de mascotas, mandados, servicios técnicos del hogar y tutorías, con un canal omnicanal via WhatsApp.

**Objetivo de la página web (fase 1):** Crear un sitio web completamente estático (solo frontend, sin backend) que funcione como landing page de captación y presentación de la propuesta de valor, orientado a dos públicos: consumidores finales y negocios/prestadores que quieran afiliarse.

---

## 2. Identidad Visual y Tono

| Elemento        | Definición                                                                 |
|-----------------|----------------------------------------------------------------------------|
| Nombre          | BarrioYa                                                                   |
| Slogan          | "La Superapp del Barrio"                                                   |
| Tono            | Cercano, confiable, ágil. Lenguaje informal pero profesional               |
| Audiencia       | Residentes y negocios de Bucaramanga (estratos 2–4)                        |
| Paleta sugerida | Verde vibrante (principal) + amarillo cálido (acento) + blanco/gris claro  |
| Tipografía      | Display bold para títulos + sans-serif legible para cuerpo                 |
| Estética        | App moderna, barrial y humana — NO corporativa ni fría                     |

> La identidad visual final (logo, colores exactos, tipografía) será definida por el equipo. El desarrollador puede proponer una propuesta o esperar el brandbook.

---

## 3. Estructura del Sitio (Páginas)

### 3.1 Página Principal — `/index.html`

Sección única de scroll vertical (one-page), dividida en las siguientes secciones:

#### Hero Section
- Headline principal: *"Todo tu barrio en una sola app"*
- Subtítulo con propuesta de valor resumida
- CTA principal: **"Descargar App"** (botón — link placeholder por ahora)
- CTA secundario: **"Pide por WhatsApp"** (abre chat de WhatsApp con número placeholder)
- Imagen/ilustración del barrio o mockup de la app en celular
- Fondo con textura o patrón sutil alusivo al barrio (calles, edificios estilizados)

#### Servicios (¿Qué puedes pedir?)
Cuatro tarjetas con íconos y descripción breve:
1. 🛒 **Domicilios** — Panaderías, tiendas, restaurantes del barrio
2. 🐾 **Mascotas** — Paseo y cuidado con paseadores cercanos
3. 🏃 **Mandados** — Pagos, diligencias y vueltas locales
4. 🔧 **Técnicos & Tutores** — Plomeros, electricistas, refuerzo escolar

#### ¿Cómo funciona?
Pasos numerados (3–4 pasos), con íconos ilustrativos:
1. Abre la app o escribe por WhatsApp
2. Elige tu servicio o negocio del barrio
3. Recibe en menos de 25 minutos a tu puerta

#### Canal WhatsApp (sección destacada)
- Mensaje clave: *"¿Ya pides por WhatsApp? Nosotros lo hacemos mejor"*
- Explicación breve del canal omnicanal (sin tecnicismos)
- Botón: **"Probar ahora por WhatsApp"** (link a WhatsApp)
- Ícono o mockup de conversación de WhatsApp estilizado

#### Para Negocios y Prestadores
- Titular: *"Haz crecer tu negocio del barrio"*
- Lista de beneficios (4–5 bullets):
  - Sin comisiones abusivas
  - Suscripción mensual asequible
  - Panel de gestión de pedidos
  - Clientes del mismo barrio que ya te conocen
  - Fácil de usar, sin conocimientos técnicos
- CTA: **"Afiliar mi negocio"** → redirige a formulario simple (ver 3.2)

#### Cobertura / Mercado Piloto
- Mapa estilizado o ilustración de Bucaramanga (no necesariamente funcional)
- Dato clave: *+2.000 negocios potenciales · Comunas 5, 14 y 15*
- Fase de expansión: Cúcuta, Floridablanca, Barrancabermeja (2026)

#### Testimonios o Avatares (sección social proof)
Tarjetas con los 3 avatares del plan de negocios:
- **María** – Profesional, pide domicilio del restaurante del barrio
- **Josué** – Home office, necesita paseador y mandados
- **3 Minutos** – Empresa que gestiona entregas internas

#### Footer
- Logo BarrioYa
- Links: Inicio · Servicios · Para negocios · Contacto
- Redes sociales (placeholders: Instagram, TikTok, WhatsApp)
- Texto legal: *© 2025 BarrioYa · Bucaramanga, Colombia*
- Badges de descarga app (placeholders, no funcionales aún): App Store · Google Play

---

### 3.2 Página de Afiliación de Negocios — `/afiliados.html`

Formulario estático (solo maqueta visual — sin backend):

**Campos del formulario:**
- Nombre del negocio
- Tipo de negocio (dropdown): Panadería · Tienda/Minimercado · Restaurante · Paseador de mascotas · Mandadero · Técnico del hogar · Tutor · Otro
- Nombre del contacto
- Teléfono / WhatsApp
- Barrio / Comuna
- ¿Tienes WhatsApp Business? (Sí / No)
- Mensaje opcional

**Comportamiento:**
- Al hacer clic en "Enviar", mostrar un mensaje de confirmación visual (sin envío real): *"¡Gracias! Te contactaremos pronto por WhatsApp."*
- Incluir CTA adicional hacia el grupo de WhatsApp (placeholder)

---

### 3.3 Página de Servicios — `/servicios.html` *(opcional, puede ser sección del home)*

Detalle expandido de los 4 servicios con:
- Ilustración o ícono por servicio
- Descripción de 2–3 párrafos
- Precios estimados o rango (*"Desde $2.000 COP"*)
- CTA por servicio

---

## 4. Componentes Globales

### Navbar / Menú de Navegación
- Logo BarrioYa (izquierda)
- Links: Servicios · Para negocios · ¿Cómo funciona? · Contacto
- CTA derecho: **"Descargar App"** (botón verde)
- Responsive: hamburguesa en móvil
- Comportamiento: sticky en scroll, fondo translúcido con blur

### Botón WhatsApp Flotante
- Botón fijo en esquina inferior derecha
- Ícono de WhatsApp
- Al hacer clic: abrir chat de WhatsApp con número placeholder y mensaje predeterminado: *"Hola BarrioYa, quiero pedir un domicilio"*

### Cookie / Aviso de privacidad (opcional)
- Banner inferior simple, sin funcionalidad real

---

## 5. Requerimientos Técnicos

| Ítem                  | Especificación                                              |
|-----------------------|-------------------------------------------------------------|
| Tecnología            | HTML5 + CSS3 + JavaScript Vanilla, o React (a convenir)    |
| Responsive            | Mobile-first. Breakpoints: 375px · 768px · 1280px          |
| Performance           | Imágenes optimizadas (WebP). Sin dependencias pesadas innecesarias |
| Fuentes               | Google Fonts (gratuitas). No se requiere licencia adicional |
| Íconos                | Lucide Icons, Heroicons o similares (open source)           |
| Animaciones           | CSS transitions suaves. Sin librerías pesadas               |
| Formularios           | Solo maqueta visual. Sin backend ni envío real              |
| CMS                   | No requerido en esta fase                                   |
| Hosting               | Compatible con Netlify / GitHub Pages / Vercel (archivos estáticos) |
| SEO básico            | Meta tags, Open Graph, título y descripción configurables   |
| Accesibilidad         | Alt text en imágenes, contraste adecuado, navegación por teclado básica |

---

## 6. Assets Necesarios (a proveer por el equipo BarrioYa)

El desarrollador debe solicitar o generar placeholders para:

- [ ] Logo BarrioYa (SVG o PNG con fondo transparente)
- [ ] Paleta de colores definitiva (HEX)
- [ ] Tipografías definidas (o aprobación de propuesta del dev)
- [ ] Mockup de la app (pantalla de celular) — si no existe, usar wireframe
- [ ] Ilustraciones o fotografías de barrio / negocios (o usar stock gratuito: Unsplash, Freepik)
- [ ] Número de WhatsApp definitivo para los CTAs
- [ ] Links de redes sociales

---

## 7. Flujos de Usuario Principales

### Consumidor final
1. Llega al sitio → ve Hero → entiende qué es BarrioYa
2. Scrollea → ve servicios → se identifica con uno
3. Hace clic en **"Pedir por WhatsApp"** o **"Descargar App"**

### Negocio / Prestador
1. Llega al sitio → ve sección "Para Negocios"
2. Hace clic en **"Afiliar mi negocio"** → va a formulario
3. Llena el formulario → ve mensaje de confirmación

---

## 8. Entregables Esperados del Desarrollador

1. Código fuente organizado y comentado
2. Carpeta de proyecto lista para deploy en hosting estático
3. Versión responsive validada en: Chrome · Safari · Firefox · Android · iOS
4. Tiempo estimado de entrega: a definir entre partes
5. (Opcional) Propuesta de identidad visual si no se entrega brandbook

---

## 9. Notas Finales

- Esta es la **Fase 1 (Solo Frontend)**. No se requiere backend, base de datos ni autenticación.
- Los formularios son visuales/maqueta. El equipo BarrioYa los conectará a un backend en una fase posterior.
- Los links de descarga de la app son placeholders; la app no está publicada aún.
- El WhatsApp Bot descrito en el plan de negocios NO es parte de este entregable.
- La página debe reflejar la identidad barrial y cercana de la marca — evitar estética corporativa genérica.

---

*Documento preparado con base en el Plan de Negocios BarrioYa – Fondo Emprender SENA · Bucaramanga, 2025*
