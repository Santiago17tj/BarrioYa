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
    affiliationForm.addEventListener('submit', (e) => {
      // Simple validation
      let isValid = true;
      const requiredFields = affiliationForm.querySelectorAll('[required]');

      requiredFields.forEach(field => {
        const errorEl = field.parentElement.querySelector('.form-error');
        
        if (!field.value.trim()) {
          field.classList.add('error');
          if (errorEl) errorEl.classList.add('show');
          isValid = false;
        } else {
          field.classList.remove('error');
          if (errorEl) errorEl.classList.remove('show');
        }
      });

      if (!isValid) {
        e.preventDefault();
        return;
      }

      // If using Formspree (form has action attribute), let it submit natively
      if (affiliationForm.getAttribute('action') && affiliationForm.getAttribute('action').includes('formspree')) {
        // Allow native form submission to Formspree
        return;
      }

      // Fallback: show success modal for non-Formspree forms
      e.preventDefault();
      if (successModal) {
        successModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        affiliationForm.reset();
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

  // ── Waitlist Modal Handling ──
  const waitlistModal = document.getElementById('waitlistModal');
  const closeWaitlistBtn = document.getElementById('closeWaitlist');

  if (closeWaitlistBtn && waitlistModal) {
    closeWaitlistBtn.addEventListener('click', () => {
      waitlistModal.classList.remove('active');
      document.body.style.overflow = '';
    });

    waitlistModal.addEventListener('click', (e) => {
      if (e.target === waitlistModal) {
        waitlistModal.classList.remove('active');
        document.body.style.overflow = '';
      }
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
  }

});
