/* ==========================================================
   BarrioYa – GSAP Animations Engine
   Estilo Spylt Premium: Animaciones fluidas, staggers y paralaje
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Verificar si GSAP está cargado
  if (typeof gsap === 'undefined') {
    console.warn("GSAP no está cargado.");
    return;
  }

  // Registrar ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // ─────────────────────────────────────────────────────────
  // 1. ANIMACIONES DE INDEX.HTML (Hero & Secciones)
  // ─────────────────────────────────────────────────────────
  const heroContent = document.querySelector('.hero-content');
  
  if (heroContent) {
    // Seleccionar elementos del Hero
    const heroElements = [
      '.hero-badge', 
      '.hero-content h1', 
      '.hero-content p', 
      '.hero-actions', 
      '.hero-mockup-wrapper'
    ];

    // Ocultar elementos inicialmente para evitar flash
    gsap.set(heroElements.join(', '), { y: 50, opacity: 0 });

    // Timeline sincronizado con el preloader (2.8s)
    const tlHero = gsap.timeline({ delay: 2.8 });

    // Animar elementos en cascada (stagger)
    tlHero.to(heroElements.join(', '), {
      y: 0,
      opacity: 1,
      duration: 1.2,
      stagger: 0.15,
      ease: "expo.out",
      clearProps: "all" // Limpiar propiedades al terminar para no romper CSS nativo
    });

    // ── ANIMACIONES DE SCROLL ──
    const sectionsToAnimate = ['#servicios', '#como-funciona', '#testimonios'];

    sectionsToAnimate.forEach(selector => {
      const section = document.querySelector(selector);
      if (section) {
        // Seleccionamos los hijos directos principales (títulos, tarjetas) para un stagger
        const children = section.querySelectorAll('.section-title, .servicio-card, .paso-card, .historia-card');
        
        if (children.length > 0) {
          gsap.set(children, { y: 50, opacity: 0 });

          gsap.to(children, {
            scrollTrigger: {
              trigger: section,
              start: "top 80%", // Empieza cuando el top de la sección llega al 80% de la pantalla
              once: true,
              toggleActions: "play none none none"
            },
            y: 0,
            opacity: 1,
            duration: 1,
            stagger: 0.2,
            ease: "power2.out",
            clearProps: "all"
          });
        }
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // 2. ANIMACIONES DE LOGIN-COMERCIOS.HTML
  // ─────────────────────────────────────────────────────────
  const loginContainer = document.querySelector('.login-container');
  
  if (loginContainer) {
    // Animación en cascada del formulario
    const formElements = [
      '.brand-logo',
      '.login-header h1',
      '.login-header p',
      '.form-group',
      '.forgot-pass',
      '.btn-submit'
    ];

    gsap.fromTo(formElements.join(', '), 
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        delay: 0.2
      }
    );

    // Movimiento continuo (yoyo) para los fondos decorativos (muy sutil para no distraer)
    const bgShapes = document.querySelectorAll('.bg-shape');
    if (bgShapes.length > 0) {
      bgShapes.forEach((shape, index) => {
        gsap.to(shape, {
          y: "random(-15, 15)",
          x: "random(-10, 10)",
          rotation: "random(-10, 10)",
          duration: "random(6, 10)",
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.5
        });
      });
    }
  }

  // ─────────────────────────────────────────────────────────
  // 3. ANIMACIONES GLOBALES (Servicios, Afiliados, etc.)
  // ─────────────────────────────────────────────────────────
  const globalElements = document.querySelectorAll('.section-title, .service-detail, .impact-item, .afiliados-hero h1, .afiliados-hero p');
  if (globalElements.length > 0) {
    globalElements.forEach(el => {
      // Ignoramos si ya está animado por el Hero del index para evitar conflicto
      if (!el.closest('.hero-content')) {
        gsap.fromTo(el, 
          { y: 50, opacity: 0 },
          {
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              once: true
            },
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "expo.out",
            clearProps: "all"
          }
        );
      }
    });
  }

  // ─────────────────────────────────────────────────────────
  // 4. ANIMACIONES ESPECÍFICAS: BOT-DEMO.HTML
  // ─────────────────────────────────────────────────────────
  // Aislamos el bot-demo para no romper la IA del chat
  const botLayout = document.querySelector('.bot-layout');
  if (botLayout) {
    const demoElements = ['.demo-banner', '.bot-sidebar', '.chat-topbar', '.chat-input-area'];
    
    gsap.set(demoElements, { y: 30, opacity: 0 });
    gsap.to(demoElements, {
      y: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.2,
      ease: "expo.out",
      clearProps: "all",
      delay: 0.3
    });
  }

  // ─────────────────────────────────────────────────────────
  // ESTABILIDAD: Refrescar ScrollTrigger al final del Preloader
  // ─────────────────────────────────────────────────────────
  // Como el preloader oculta el scroll temporalmente en index.html,
  // refrescamos ScrollTrigger una vez que se restablezca el layout.
  setTimeout(() => {
    ScrollTrigger.refresh();
  }, 2900);

});
