/**
 * globals.js — Wash & Go Mobile Detailing & Cleaning Service
 *
 * Modern ES2020+ JavaScript with no external dependencies.
 * Responsibilities:
 *  - Navigation (mobile drawer, scroll-aware header)
 *  - Scroll-reveal animations (Intersection Observer)
 *  - Toast notification system
 *  - Smooth anchor scrolling
 *  - Form validation helpers
 *  - Active nav link tracking
 *  - Lazy-loaded images
 */

'use strict';

/* ============================================================
   1. DOM-ready helper
   ============================================================ */
const onReady = (fn) => {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  }
};

/* ============================================================
   2. Navigation
   ============================================================ */
const initNavigation = () => {
  const header     = document.querySelector('.site-header');
  const toggle     = document.querySelector('.nav-toggle');
  const mobileNav  = document.querySelector('.nav-mobile');

  if (!header) return;

  // ── Scroll-aware header shadow ────────────────────────────
  const handleHeaderScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 10);
  };

  window.addEventListener('scroll', handleHeaderScroll, { passive: true });
  handleHeaderScroll();

  // ── Mobile nav toggle ─────────────────────────────────────
  if (toggle && mobileNav) {
    const openNav = () => {
      toggle.classList.add('open');
      mobileNav.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    const closeNav = () => {
      toggle.classList.remove('open');
      mobileNav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    toggle.addEventListener('click', () => {
      const isOpen = toggle.classList.contains('open');
      isOpen ? closeNav() : openNav();
    });

    // Close on nav link click
    mobileNav.querySelectorAll('.nav-mobile__link').forEach((link) => {
      link.addEventListener('click', closeNav);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.classList.contains('open')) {
        closeNav();
        toggle.focus();
      }
    });

    // Close when viewport widens beyond mobile breakpoint
    const mq = window.matchMedia('(min-width: 56em)');
    mq.addEventListener('change', ({ matches }) => {
      if (matches) closeNav();
    });
  }

  // ── Active link highlighting ──────────────────────────────
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.nav-desktop__link, .nav-mobile__link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
};

/* ============================================================
   3. Scroll-Reveal (Intersection Observer)
   ============================================================ */
const initScrollReveal = () => {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  // Respect reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach((el) => el.classList.add('revealed'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -3% 0px' }
  );

  elements.forEach((el) => observer.observe(el));
};

/* ============================================================
   4. Toast Notification System
   ============================================================ */
const Toast = (() => {
  let container = null;

  const getContainer = () => {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(container);
    }
    return container;
  };

  const ICONS = {
    success: '✓',
    error:   '✕',
    info:    'ℹ',
    warning: '⚠',
  };

  /**
   * Show a toast message.
   * @param {string} message   - Text to display.
   * @param {'success'|'error'|'info'|'warning'} [type='info']
   * @param {number} [duration=4000] - Auto-dismiss duration in ms. 0 = no auto-dismiss.
   */
  const show = (message, type = 'info', duration = 4000) => {
    const c    = getContainer();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${ICONS[type] ?? ICONS.info}</span>
      <span class="toast__message">${message}</span>
      <button class="toast__close btn btn-ghost btn-icon" aria-label="Dismiss notification">✕</button>
    `;

    const dismiss = () => {
      toast.classList.add('toast--removing');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast__close').addEventListener('click', dismiss);
    c.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }

    return { dismiss };
  };

  return { show };
})();

/* ============================================================
   5. Smooth Scroll for Anchor Links
   ============================================================ */
const initSmoothScroll = () => {
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;

    const id     = anchor.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;

    e.preventDefault();

    const headerOffset = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--header-height'),
      10
    ) || 72;

    const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });

    // Update URL without triggering scroll
    history.pushState(null, '', `#${id}`);
    target.focus({ preventScroll: true });
  });
};

/* ============================================================
   6. Form Validation
   ============================================================ */

/**
 * Validate a single form field and display/clear error messages.
 * @param {HTMLElement} field
 * @returns {boolean} isValid
 */
const validateField = (field) => {
  const value    = field.value.trim();
  const type     = field.type;
  const required = field.hasAttribute('required');
  const minLen   = parseInt(field.getAttribute('minlength') || '0', 10);
  const maxLen   = parseInt(field.getAttribute('maxlength') || '0', 10);
  const pattern  = field.getAttribute('pattern');

  let errorMsg = '';

  if (required && !value) {
    errorMsg = field.dataset.errorRequired || 'This field is required.';
  } else if (value && type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errorMsg = field.dataset.errorEmail || 'Please enter a valid email address.';
  } else if (value && type === 'tel' && !/^[+\d\s\-().]{7,20}$/.test(value)) {
    errorMsg = field.dataset.errorTel || 'Please enter a valid phone number.';
  } else if (minLen && value.length < minLen) {
    errorMsg = field.dataset.errorMin || `Minimum ${minLen} characters required.`;
  } else if (maxLen && value.length > maxLen) {
    errorMsg = field.dataset.errorMax || `Maximum ${maxLen} characters allowed.`;
  } else if (pattern && value && !new RegExp(pattern).test(value)) {
    errorMsg = field.dataset.errorPattern || 'Invalid format.';
  }

  setFieldState(field, errorMsg);
  return !errorMsg;
};

/**
 * Apply valid/invalid visual state and ARIA to a field.
 * @param {HTMLElement} field
 * @param {string} errorMsg - Empty string means valid.
 */
const setFieldState = (field, errorMsg) => {
  const errId  = `${field.id}-error`;
  let errEl    = document.getElementById(errId);

  field.classList.toggle('is-invalid', !!errorMsg);
  field.classList.toggle('is-valid',   !errorMsg && !!field.value.trim());

  if (errorMsg) {
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', errId);

    if (!errEl) {
      errEl = document.createElement('span');
      errEl.id        = errId;
      errEl.className = 'form-error';
      errEl.setAttribute('role', 'alert');
      field.closest('.form-group')?.appendChild(errEl);
    }
    errEl.textContent = errorMsg;
  } else {
    field.removeAttribute('aria-invalid');
    errEl?.remove();
  }
};

/**
 * Initialise live validation on all forms with data-validate attribute.
 */
const initFormValidation = () => {
  document.querySelectorAll('form[data-validate]').forEach((form) => {
    const fields = form.querySelectorAll('input, select, textarea');

    fields.forEach((field) => {
      // Validate on blur
      field.addEventListener('blur', () => validateField(field), { passive: true });

      // Re-validate on input after first blur
      field.addEventListener('input', () => {
        if (field.classList.contains('is-invalid') || field.classList.contains('is-valid')) {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      let isFormValid = true;

      fields.forEach((field) => {
        if (!validateField(field)) isFormValid = false;
      });

      if (!isFormValid) {
        e.preventDefault();
        const firstInvalid = form.querySelector('.is-invalid');
        firstInvalid?.focus();
      }
    });
  });
};

/* ============================================================
   7. Lazy Image Loading
   ============================================================ */
const initLazyImages = () => {
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all immediately
    document.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.classList.add('loaded');
        observer.unobserve(img);
      });
    },
    { rootMargin: '200px' }
  );

  document.querySelectorAll('img[data-src]').forEach((img) => observer.observe(img));
};

/* ============================================================
   8. Booking Form (page-specific helper)
   ============================================================ */
const initBookingForm = () => {
  const form = document.querySelector('#booking-form');
  if (!form) return;

  const serviceSelect = form.querySelector('#service');
  const priceSummary  = form.querySelector('#price-summary');
  const submitBtn     = form.querySelector('[type="submit"]');

  const PRICES = {
    'car-basic':       { label: 'Basic Car Wash',          price: 29 },
    'car-standard':    { label: 'Standard Car Detail',     price: 59 },
    'car-premium':     { label: 'Premium Car Detail',      price: 99 },
    'house-basic':     { label: 'Basic Home Clean',        price: 79 },
    'house-standard':  { label: 'Standard Home Clean',     price: 129 },
    'house-premium':   { label: 'Premium Home Detail',     price: 199 },
    'car-house-combo': { label: 'Car + Home Combo',        price: 169 },
  };

  // Update price display on service change
  serviceSelect?.addEventListener('change', () => {
    const key  = serviceSelect.value;
    const info = PRICES[key];

    if (priceSummary && info) {
      priceSummary.innerHTML = `
        <span class="text-sm text-muted">Estimated price for</span>
        <strong>${info.label}</strong>:
        <span class="text-primary font-bold">$${info.price}</span>
      `;
      priceSummary.hidden = false;
    } else if (priceSummary) {
      priceSummary.hidden = true;
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Booking…';

    try {
      // Simulate API call (replace with real fetch in production)
      await simulateRequest(1500);

      Toast.show('🎉 Booking confirmed! We\'ll send a confirmation to your email.', 'success', 6000);
      form.reset();

      if (priceSummary) priceSummary.hidden = true;

      // Clear valid states
      form.querySelectorAll('.is-valid').forEach((el) => el.classList.remove('is-valid'));
    } catch {
      Toast.show('Something went wrong. Please try again or call us directly.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
};

/* ============================================================
   9. Contact Form
   ============================================================ */
const initContactForm = () => {
  const form = document.querySelector('#contact-form');
  if (!form) return;

  const submitBtn = form.querySelector('[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending…';

    try {
      await simulateRequest(1200);
      Toast.show('Message sent! We\'ll get back to you within 24 hours.', 'success', 6000);
      form.reset();
      form.querySelectorAll('.is-valid').forEach((el) => el.classList.remove('is-valid'));
    } catch {
      Toast.show('Failed to send message. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
};

/* ============================================================
   10. FAQ Accordion
   ============================================================ */
const initAccordion = () => {
  document.querySelectorAll('.accordion').forEach((accordion) => {
    const items = accordion.querySelectorAll('.accordion__item');

    items.forEach((item) => {
      const trigger = item.querySelector('.accordion__trigger');
      const panel   = item.querySelector('.accordion__panel');
      if (!trigger || !panel) return;

      // Set initial ARIA
      const id = `accordion-panel-${Math.random().toString(36).slice(2, 7)}`;
      panel.id  = id;
      trigger.setAttribute('aria-controls', id);
      trigger.setAttribute('aria-expanded', 'false');
      panel.hidden = true;

      trigger.addEventListener('click', () => {
        const isOpen = trigger.getAttribute('aria-expanded') === 'true';

        // Close sibling items (single-open accordion)
        items.forEach((sibling) => {
          const sibTrigger = sibling.querySelector('.accordion__trigger');
          const sibPanel   = sibling.querySelector('.accordion__panel');
          sibTrigger?.setAttribute('aria-expanded', 'false');
          if (sibPanel) sibPanel.hidden = true;
          sibling.classList.remove('open');
        });

        if (!isOpen) {
          trigger.setAttribute('aria-expanded', 'true');
          panel.hidden = false;
          item.classList.add('open');
        }
      });
    });
  });
};

/* ============================================================
   11. Testimonial Carousel (simple auto-rotate)
   ============================================================ */
const initTestimonialCarousel = () => {
  const carousel = document.querySelector('.testimonials-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.testimonials-carousel__track');
  const dots  = carousel.querySelectorAll('.testimonials-carousel__dot');
  if (!track || !dots.length) return;

  let current  = 0;
  let interval = null;

  const goTo = (index) => {
    current = (index + dots.length) % dots.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-selected', String(i === current));
    });
  };

  const next = () => goTo(current + 1);

  const startAuto = () => { interval = setInterval(next, 5000); };
  const stopAuto  = () => clearInterval(interval);

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); });
  });

  carousel.addEventListener('mouseenter', stopAuto);
  carousel.addEventListener('mouseleave', startAuto);

  // Touch swipe support
  let touchStartX = 0;
  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    stopAuto();
  }, { passive: true });

  track.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
    startAuto();
  }, { passive: true });

  goTo(0);
  startAuto();
};

/* ============================================================
   12. Number Counter Animation
   ============================================================ */
const initCounters = () => {
  const counters = document.querySelectorAll('[data-counter]');
  if (!counters.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    counters.forEach((el) => {
      el.textContent = el.dataset.counter;
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseFloat(el.dataset.counter);
        const suffix = el.dataset.counterSuffix ?? '';
        const duration = 2000;
        const start    = performance.now();

        const animate = (now) => {
          const elapsed  = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = Math.round(eased * target);
          el.textContent = `${value}${suffix}`;
          if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
        observer.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
};

/* ============================================================
   13. Utility: simulate async request (dev/demo only)
   ============================================================ */
const simulateRequest = (ms = 1000) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/* ============================================================
   14. Initialise everything on DOM ready
   ============================================================ */
onReady(() => {
  initNavigation();
  initScrollReveal();
  initSmoothScroll();
  initFormValidation();
  initLazyImages();
  initBookingForm();
  initContactForm();
  initAccordion();
  initTestimonialCarousel();
  initCounters();
});

/* ============================================================
   15. Expose public API for inline/page-specific scripts
   ============================================================ */
window.WashAndGo = {
  Toast,
  validateField,
  simulateRequest,
};
