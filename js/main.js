/* ==========================================================
   BarrioYa – Main JavaScript
   Interactividad: navbar, menú móvil, scroll, animaciones, form
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ── Navbar Scroll Effect ──
  const navbar = document.getElementById('navbar');
  
  const handleNavbarScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll(); // Initial check

  // ── Mobile Menu Toggle ──
  const navbarToggle = document.getElementById('navbarToggle');
  const mobileMenu = document.getElementById('mobileMenu');

  if (navbarToggle && mobileMenu) {
    navbarToggle.addEventListener('click', () => {
      navbarToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close mobile menu when clicking a link
    const mobileLinks = mobileMenu.querySelectorAll('.mobile-link');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        navbarToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Smooth Scroll for Anchor Links ──
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const navbarHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ── Scroll Animations (IntersectionObserver) ──
  const animatedElements = document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
  
  if ('IntersectionObserver' in window) {
    const animationObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger animation delay for sibling elements
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          animationObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    animatedElements.forEach((el, index) => {
      // Add stagger delay for grid items
      const parent = el.parentElement;
      if (parent) {
        const siblings = parent.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right');
        if (siblings.length > 1) {
          const siblingIndex = Array.from(siblings).indexOf(el);
          el.dataset.delay = siblingIndex * 100;
        }
      }
      animationObserver.observe(el);
    });
  } else {
    // Fallback: show all elements immediately
    animatedElements.forEach(el => el.classList.add('visible'));
  }

  // ── Active Navigation Link on Scroll ──
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.navbar-links a');

  const updateActiveLink = () => {
    const scrollPos = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  };

  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // ── Affiliation Form Handling ──
  const affiliationForm = document.getElementById('affiliationForm');
  const successModal = document.getElementById('successModal');
  const closeModalBtn = document.getElementById('closeModal');

  if (affiliationForm) {
    affiliationForm.addEventListener('submit', async (e) => {
      // 1. Prevenir el comportamiento por defecto Inmediatamente
      e.preventDefault();
      
      // 2. Ejecutar la validación nativa de forma segura
      if (!affiliationForm.checkValidity()) {
          // Muestra los globos de error nativos sin bloquear el JS
          affiliationForm.reportValidity(); 
          return; // Detenemos la ejecución si hay errores
      }

      const submitBtn = affiliationForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      
      // UI state: Loading
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Enviando...';

      // If using Formspree
      const action = affiliationForm.getAttribute('action');
      if (action && action.includes('formspree')) {
        try {
          const formData = new FormData(affiliationForm);
          const response = await fetch(action, {
            method: 'POST',
            body: formData,
            headers: {
              'Accept': 'application/json'
            }
          });

          if (response.ok) {
            showSuccess();
          } else {
            const data = await response.json();
            throw new Error(data.error || 'Error al enviar el formulario');
          }
        } catch (error) {
          console.error('Formspree error:', error);
          alert('Hubo un problema al enviar tu solicitud. Por favor intenta de nuevo o contáctanos por WhatsApp.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
        return;
      }

      // Fallback: show success modal simulado
      setTimeout(() => {
          showSuccess();
      }, 1000);

      function showSuccess() {
        if (successModal) {
          successModal.classList.add('active');
          document.body.style.overflow = 'hidden';
          affiliationForm.reset();
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    });

    // Remove error on input
    affiliationForm.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(field => {
      field.addEventListener('input', () => {
        field.classList.remove('error');
        const errorEl = field.parentElement.querySelector('.form-error');
        if (errorEl) errorEl.classList.remove('show');
      });
    });
  }

  // ── Modal Close (Success Modal) ──
  if (closeModalBtn && successModal) {
    closeModalBtn.addEventListener('click', () => {
      successModal.classList.remove('active');
      document.body.style.overflow = '';
    });

    successModal.addEventListener('click', (e) => {
      if (e.target === successModal) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // ── Modal Handling (Universal) ──
  const waitlistModal = document.getElementById('waitlistModal');
  const closeWaitlistBtn = document.getElementById('closeWaitlist');

  // Open Waitlist
  document.querySelectorAll('.open-waitlist').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (waitlistModal) {
        waitlistModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Close Modals (Waitlist)
  if (closeWaitlistBtn && waitlistModal) {
    const closeWaitlist = () => {
      waitlistModal.classList.remove('active');
      document.body.style.overflow = '';
    };
    closeWaitlistBtn.addEventListener('click', closeWaitlist);
    waitlistModal.addEventListener('click', (e) => {
      if (e.target === waitlistModal) closeWaitlist();
    });
  }

  // ── Keyboard Accessibility ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close mobile menu
      if (mobileMenu && mobileMenu.classList.contains('active')) {
        navbarToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
      // Close success modal
      if (successModal && successModal.classList.contains('active')) {
        successModal.classList.remove('active');
        document.body.style.overflow = '';
      }
      // Close waitlist modal
      if (waitlistModal && waitlistModal.classList.contains('active')) {
        waitlistModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });

  // ── Parallax-like subtle effect on hero ──
  const heroImage = document.querySelector('.hero-image');
  if (heroImage && window.innerWidth > 768) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      if (scrolled < window.innerHeight) {
        heroImage.style.transform = `translateY(${scrolled * 0.1}px)`;
      }
    }, { passive: true });
  // ── Checkout Reset Function ──
  window.limpiarCheckout = function() {
    // 1. Vaciar el carrito (localStorage y memoria)
    if (window.cartManager) {
      window.cartManager.clear();
    }

    // 2. Limpiar el formulario de pago
    const buyerName = document.getElementById('buyerName');
    const buyerPhone = document.getElementById('buyerPhone');
    const buyerEmail = document.getElementById('buyerEmail');
    if (buyerName) buyerName.value = '';
    if (buyerPhone) buyerPhone.value = '';
    if (buyerEmail) buyerEmail.value = '';

    // 3. Resetear selección de método de pago
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    const defaultMethod = document.getElementById('methodNequi');
    if (defaultMethod) defaultMethod.classList.add('selected');
  };

});
