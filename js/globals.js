/**
 * globals.js — Wash&Go Global JavaScript
 * Modern ES2020+ vanilla JS — no jQuery, no extra dependencies
 */

'use strict';

/* =====================================================
   1. DOM Utilities
   ===================================================== */
const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => [...ctx.querySelectorAll(selector)];

const ready = (fn) => {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
};

/* =====================================================
   2. Navigation
   ===================================================== */
function initNav() {
  const nav     = $('.nav');
  const toggle  = $('.nav__toggle');
  const menu    = $('.nav__menu');

  if (!nav) return;

  // Scroll: add/remove transparent state
  const SCROLL_THRESHOLD = 40;

  const updateNavOnScroll = () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      nav.classList.add('nav--scrolled');
      nav.classList.remove('nav--transparent');
    } else {
      nav.classList.remove('nav--scrolled');
      if (nav.dataset.transparent === 'true') {
        nav.classList.add('nav--transparent');
      }
    }
  };

  window.addEventListener('scroll', updateNavOnScroll, { passive: true });
  updateNavOnScroll();

  // Mobile toggle
  toggle?.addEventListener('click', () => {
    const isOpen = menu?.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (menu?.classList.contains('is-open') && !nav.contains(e.target)) {
      closeMenu();
    }
  });

  // Close menu on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu?.classList.contains('is-open')) closeMenu();
  });

  // Close menu on link click (mobile)
  $$('.nav__menu .nav__link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  function closeMenu() {
    menu?.classList.remove('is-open');
    toggle?.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  // Mark active nav link
  markActiveLink();
}

function markActiveLink() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav__link').forEach((link) => {
    const href = link.getAttribute('href')?.split('/').pop() || '';
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
}

/* =====================================================
   3. Smooth Scroll
   ===================================================== */
function initSmoothScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Update URL without page jump
    history.pushState(null, '', `#${id}`);
  });
}

/* =====================================================
   4. Intersection Observer — Reveal Animations
   ===================================================== */
function initRevealAnimations() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: show all
    $$('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  $$('[data-reveal]').forEach((el) => observer.observe(el));
}

/* =====================================================
   5. Counter Animation
   ===================================================== */
function initCounters() {
  const counters = $$('[data-counter]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.counter);
    const suffix = el.dataset.counterSuffix || '';
    const prefix = el.dataset.counterPrefix || '';
    const duration = 2000;
    const start = performance.now();

    const step = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = prefix + (Number.isInteger(target) ? Math.round(value) : value.toFixed(1)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* =====================================================
   6. Accordion / FAQ
   ===================================================== */
function initAccordion() {
  $$('.accordion__trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion__item');
      const isOpen = item.classList.contains('is-open');

      // Close siblings (single-open mode, can be removed for multi-open)
      const accordion = item.closest('.accordion');
      if (accordion?.dataset.multiOpen !== 'true') {
        $$('.accordion__item.is-open', accordion).forEach((openItem) => {
          if (openItem !== item) {
            openItem.classList.remove('is-open');
            openItem.querySelector('.accordion__trigger')?.setAttribute('aria-expanded', 'false');
          }
        });
      }

      item.classList.toggle('is-open', !isOpen);
      trigger.setAttribute('aria-expanded', String(!isOpen));
    });
  });
}

/* =====================================================
   7. Tabs
   ===================================================== */
function initTabs() {
  $$('.tabs').forEach((tabWidget) => {
    const tabs   = $$('.tabs__tab', tabWidget);
    const panels = $$('.tabs__panel', tabWidget);

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetPanel = tab.dataset.tab;
        tabs.forEach((t) => t.classList.remove('is-active'));
        panels.forEach((p) => p.classList.remove('is-active'));
        tab.classList.add('is-active');
        const panel = $(`[data-tab-panel="${targetPanel}"]`, tabWidget);
        panel?.classList.add('is-active');
      });
    });
  });
}

/* =====================================================
   8. Modals
   ===================================================== */
function initModals() {
  // Open
  $$('[data-modal-open]').forEach((trigger) => {
    trigger.addEventListener('click', () => openModal(trigger.dataset.modalOpen));
  });

  // Close buttons
  $$('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) closeModal(overlay.id);
    });
  });

  // Click outside
  $$('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const open = $('.modal-overlay.is-open');
      if (open) closeModal(open.id);
    }
  });
}

function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('is-open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  // Focus first focusable
  const focusable = overlay.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  focusable?.focus();
}

function closeModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.remove('is-open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* =====================================================
   9. Toast Notifications
   ===================================================== */
const Toast = (() => {
  let container;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(container);
    }
    return container;
  }

  const icons = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️',
  };

  function show({ title, message = '', type = 'info', duration = 4500 }) {
    const c     = getContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
      <span class="toast__icon" aria-hidden="true">${icons[type] || icons.info}</span>
      <div class="toast__body">
        <p class="toast__title">${title}</p>
        ${message ? `<p class="toast__msg">${message}</p>` : ''}
      </div>
      <button class="toast__close" aria-label="Close notification" style="margin-left:auto;background:none;border:none;color:inherit;cursor:pointer;font-size:1.25rem;line-height:1;padding:0.25rem;">✕</button>
    `;

    toast.querySelector('.toast__close').addEventListener('click', () => dismiss(toast));
    c.appendChild(toast);

    const timer = setTimeout(() => dismiss(toast), duration);
    toast._timer = timer;

    // Pause on hover
    toast.addEventListener('mouseenter', () => clearTimeout(toast._timer));
    toast.addEventListener('mouseleave', () => {
      toast._timer = setTimeout(() => dismiss(toast), 1500);
    });

    return toast;
  }

  function dismiss(toast) {
    clearTimeout(toast._timer);
    toast.style.animation = 'toastIn 0.3s ease reverse forwards';
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }

  return {
    show,
    success: (title, message) => show({ title, message, type: 'success' }),
    error:   (title, message) => show({ title, message, type: 'error' }),
    warning: (title, message) => show({ title, message, type: 'warning' }),
    info:    (title, message) => show({ title, message, type: 'info' }),
  };
})();

/* =====================================================
   10. Cart State Management
   ===================================================== */
const Cart = (() => {
  const STORAGE_KEY = 'washgo_cart';

  const getItems = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const save = (items) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

  const getCount = () => getItems().reduce((sum, item) => sum + item.qty, 0);
  const getTotal = () => getItems().reduce((sum, item) => sum + item.price * item.qty, 0);

  const addItem = (item) => {
    const items = getItems();
    const existing = items.find((i) => i.id === item.id);
    if (existing) {
      existing.qty += item.qty ?? 1;
    } else {
      items.push({ ...item, qty: item.qty ?? 1 });
    }
    save(items);
    updateBadge();
    Toast.success('Added to cart', item.name);
    return items;
  };

  const removeItem = (id) => {
    const items = getItems().filter((i) => i.id !== id);
    save(items);
    updateBadge();
    return items;
  };

  const updateQty = (id, qty) => {
    const items = getItems();
    const item = items.find((i) => i.id === id);
    if (item) {
      item.qty = Math.max(1, qty);
      save(items);
      updateBadge();
    }
    return items;
  };

  const clear = () => {
    save([]);
    updateBadge();
  };

  const updateBadge = () => {
    const count = getCount();
    $$('.cart-badge__count').forEach((badge) => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  };

  return { getItems, getCount, getTotal, addItem, removeItem, updateQty, clear, updateBadge };
})();

/* =====================================================
   11. Form Validation
   ===================================================== */
const FormValidator = (() => {
  const rules = {
    required: (val)  => val.trim() !== '' || 'This field is required',
    email:    (val)  => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Please enter a valid email',
    phone:    (val)  => /^[\+]?[\d\s\-\(\)]{7,15}$/.test(val.trim()) || 'Please enter a valid phone number',
    minLen:   (len)  => (val) => val.trim().length >= len || `Must be at least ${len} characters`,
    maxLen:   (len)  => (val) => val.trim().length <= len || `Must be at most ${len} characters`,
    zip:      (val)  => /^\d{5}(-\d{4})?$/.test(val.trim()) || 'Please enter a valid ZIP code',
  };

  function validateField(input) {
    const ruleNames = input.dataset.validate?.split(' ') || [];
    let error = null;

    for (const ruleName of ruleNames) {
      const [name, arg] = ruleName.split(':');
      const rule = rules[name];
      if (!rule) continue;

      const fn = typeof rule === 'function' && arg ? rule(Number(arg) || arg) : rule;
      const result = fn(input.value);
      if (result !== true) { error = result; break; }
    }

    const group = input.closest('.form-group');
    const errorEl = group?.querySelector('.form-error');

    if (error) {
      input.classList.add('is-error');
      input.setAttribute('aria-invalid', 'true');
      if (errorEl) { errorEl.textContent = error; errorEl.removeAttribute('hidden'); }
    } else {
      input.classList.remove('is-error');
      input.setAttribute('aria-invalid', 'false');
      if (errorEl) { errorEl.textContent = ''; errorEl.setAttribute('hidden', ''); }
    }

    return !error;
  }

  function validateForm(form) {
    const fields = $$('[data-validate]', form);
    return fields.map(validateField).every(Boolean);
  }

  function initForm(form, onSubmit) {
    if (!form) return;
    // Live validation on blur
    $$('[data-validate]', form).forEach((input) => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => {
        if (input.classList.contains('is-error')) validateField(input);
      });
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const valid = validateForm(form);
      if (!valid) {
        // Focus first error
        form.querySelector('.is-error')?.focus();
        return;
      }
      await onSubmit?.(form, new FormData(form));
    });
  }

  return { validateField, validateForm, initForm, rules };
})();

/* =====================================================
   12. Booking Form Handler
   ===================================================== */
function initBookingForm() {
  const form = $('#booking-form');
  if (!form) return;

  FormValidator.initForm(form, async (f, data) => {
    const btn = f.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Booking…';

    // Simulate API call
    await new Promise((r) => setTimeout(r, 1200));

    Toast.success('Booking confirmed!', 'We\'ll send you a confirmation email shortly.');
    btn.disabled = false;
    btn.textContent = 'Book Now';
    f.reset();

    // Redirect after short delay
    setTimeout(() => { window.location.href = 'thank-you.html'; }, 1500);
  });
}

/* =====================================================
   13. Contact Form Handler
   ===================================================== */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  FormValidator.initForm(form, async (f) => {
    const btn = f.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    await new Promise((r) => setTimeout(r, 1000));

    Toast.success('Message sent!', 'We\'ll get back to you within 24 hours.');
    btn.disabled = false;
    btn.textContent = 'Send Message';
    f.reset();
  });
}

/* =====================================================
   14. Checkout Form Handler
   ===================================================== */
function initCheckoutForm() {
  const form = $('#checkout-form');
  if (!form) return;

  FormValidator.initForm(form, async (f) => {
    const btn = f.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Processing…';

    await new Promise((r) => setTimeout(r, 1500));

    Cart.clear();
    window.location.href = 'thank-you.html';
  });
}

/* =====================================================
   15. Cart UI
   ===================================================== */
function initCartPage() {
  const cartList    = $('#cart-items');
  const cartEmpty   = $('#cart-empty');
  const cartSummary = $('#cart-summary');
  if (!cartList) return;

  function renderCart() {
    const items = Cart.getItems();
    cartList.innerHTML = '';

    if (items.length === 0) {
      cartList.style.display    = 'none';
      cartEmpty?.classList.remove('hidden');
      cartSummary?.classList.add('hidden');
      return;
    }

    cartList.style.display = 'block';
    cartEmpty?.classList.add('hidden');
    cartSummary?.classList.remove('hidden');

    items.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'cart-item';
      el.dataset.id = item.id;
      el.innerHTML = `
        <div class="cart-item__image" style="background:var(--color-primary-pale);display:flex;align-items:center;justify-content:center;font-size:2rem;">🚗</div>
        <div class="cart-item__info">
          <p class="cart-item__name">${item.name}</p>
          <p class="cart-item__meta">${item.meta || ''}</p>
          <div class="cart-item__actions">
            <div class="qty-control">
              <button class="qty-control__btn" data-action="dec" aria-label="Decrease quantity">−</button>
              <span class="qty-control__value">${item.qty}</span>
              <button class="qty-control__btn" data-action="inc" aria-label="Increase quantity">+</button>
            </div>
            <button class="btn btn--ghost btn--sm" data-action="remove" style="color:var(--color-error);font-size:0.75rem;">Remove</button>
          </div>
        </div>
        <p class="cart-item__price">$${(item.price * item.qty).toFixed(2)}</p>
      `;

      // Event delegation
      el.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'inc') { Cart.updateQty(item.id, item.qty + 1); renderCart(); updateSummary(); }
        if (action === 'dec') { Cart.updateQty(item.id, item.qty - 1); renderCart(); updateSummary(); }
        if (action === 'remove') { Cart.removeItem(item.id); renderCart(); updateSummary(); }
      });

      cartList.appendChild(el);
    });

    updateSummary();
  }

  function updateSummary() {
    const subtotal   = Cart.getTotal();
    const taxRate    = 0.08;
    const tax        = subtotal * taxRate;
    const total      = subtotal + tax;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set('cart-subtotal', `$${subtotal.toFixed(2)}`);
    set('cart-tax',      `$${tax.toFixed(2)}`);
    set('cart-total',    `$${total.toFixed(2)}`);
  }

  renderCart();
}

/* =====================================================
   16. Before/After Slider
   ===================================================== */
function initBeforeAfterSliders() {
  $$('.before-after').forEach((slider) => {
    const after    = slider.querySelector('.before-after__after');
    const divider  = slider.querySelector('.before-after__divider');
    if (!after || !divider) return;

    let dragging = false;

    const setPosition = (x) => {
      const rect = slider.getBoundingClientRect();
      const pos  = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
      after.style.clipPath     = `inset(0 ${(1 - pos) * 100}% 0 0)`;
      divider.style.left       = `${pos * 100}%`;
    };

    divider.addEventListener('mousedown', (e) => { dragging = true; e.preventDefault(); });
    document.addEventListener('mouseup', () => { dragging = false; });
    document.addEventListener('mousemove', (e) => { if (dragging) setPosition(e.clientX); });

    // Touch support
    divider.addEventListener('touchstart', () => { dragging = true; }, { passive: true });
    document.addEventListener('touchend',  () => { dragging = false; });
    document.addEventListener('touchmove', (e) => {
      if (dragging) setPosition(e.touches[0].clientX);
    }, { passive: true });
  });
}

/* =====================================================
   17. Service Filter
   ===================================================== */
function initServiceFilter() {
  const filterBtns = $$('[data-filter]');
  const cards      = $$('[data-category]');
  if (!filterBtns.length) return;

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      const filter = btn.dataset.filter;
      cards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });
}

/* =====================================================
   18. Number Stepper (Booking guests, hours, etc.)
   ===================================================== */
function initSteppers() {
  $$('[data-stepper]').forEach((wrap) => {
    const input  = wrap.querySelector('input[type="number"]');
    const incBtn = wrap.querySelector('[data-step="inc"]');
    const decBtn = wrap.querySelector('[data-step="dec"]');
    if (!input) return;

    const min  = parseFloat(input.min) || 0;
    const max  = parseFloat(input.max) || 999;
    const step = parseFloat(input.step) || 1;

    const update = (delta) => {
      const newVal = Math.min(max, Math.max(min, parseFloat(input.value) + delta));
      input.value = newVal;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    incBtn?.addEventListener('click', () => update(step));
    decBtn?.addEventListener('click', () => update(-step));
  });
}

/* =====================================================
   19. Date Picker Helper (min date = today)
   ===================================================== */
function initDatePickers() {
  const today = new Date().toISOString().split('T')[0];
  $$('input[type="date"]').forEach((input) => {
    if (!input.min) input.min = today;
  });
}

/* =====================================================
   20. "Add to Cart" Buttons
   ===================================================== */
function initAddToCart() {
  $$('[data-add-to-cart]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id    = btn.dataset.addToCart;
      const name  = btn.dataset.cartName || 'Service';
      const price = parseFloat(btn.dataset.cartPrice) || 0;
      const meta  = btn.dataset.cartMeta || '';
      Cart.addItem({ id, name, price, meta });
    });
  });
}

/* =====================================================
   21. Lazy Image Loading Fallback
   ===================================================== */
function initLazyImages() {
  const imgs = $$('img[data-src]');
  if (!imgs.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    }, { rootMargin: '200px' });

    imgs.forEach((img) => observer.observe(img));
  } else {
    imgs.forEach((img) => { img.src = img.dataset.src; });
  }
}

/* =====================================================
   22. Newsletter Form
   ===================================================== */
function initNewsletterForm() {
  $$('.newsletter-form').forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input  = form.querySelector('input[type="email"]');
      const btn    = form.querySelector('[type="submit"]');
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(input?.value || '')) {
        Toast.error('Invalid email', 'Please enter a valid email address.');
        input?.focus();
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Subscribing…';
      await new Promise((r) => setTimeout(r, 900));
      Toast.success('Subscribed!', 'Thanks for joining the Wash&Go newsletter.');
      btn.disabled = false;
      btn.textContent = 'Subscribe';
      form.reset();
    });
  });
}

/* =====================================================
   23. Testimonial Slider (simple auto-play)
   ===================================================== */
function initTestimonialSlider() {
  const sliders = $$('[data-testimonial-slider]');
  sliders.forEach((slider) => {
    const track  = slider.querySelector('[data-slider-track]');
    const slides = $$('[data-slide]', slider);
    const prev   = slider.querySelector('[data-slider-prev]');
    const next   = slider.querySelector('[data-slider-next]');
    const dots   = $$('[data-slider-dot]', slider);
    if (!slides.length) return;

    let current = 0;
    let timer;

    const goTo = (idx) => {
      slides[current]?.classList.remove('is-active');
      dots[current]?.classList.remove('is-active');
      current = (idx + slides.length) % slides.length;
      slides[current]?.classList.add('is-active');
      dots[current]?.classList.add('is-active');
    };

    const startAuto = () => {
      timer = setInterval(() => goTo(current + 1), 5000);
    };

    const stopAuto = () => clearInterval(timer);

    prev?.addEventListener('click', () => { stopAuto(); goTo(current - 1); startAuto(); });
    next?.addEventListener('click', () => { stopAuto(); goTo(current + 1); startAuto(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { stopAuto(); goTo(i); startAuto(); }));

    goTo(0);
    startAuto();

    // Pause on hover
    slider.addEventListener('mouseenter', stopAuto);
    slider.addEventListener('mouseleave', startAuto);
  });
}

/* =====================================================
   24. Pricing Toggle (Monthly / One-time)
   ===================================================== */
function initPricingToggle() {
  const toggle = $('#pricing-toggle');
  if (!toggle) return;

  toggle.addEventListener('change', () => {
    const isMonthly = toggle.checked;
    $$('[data-price-monthly]').forEach((el) => {
      el.textContent = isMonthly ? el.dataset.priceMonthly : el.dataset.priceOnetime;
    });
    $$('[data-price-label]').forEach((el) => {
      el.textContent = isMonthly ? 'per visit (plan)' : 'one-time';
    });
  });
}

/* =====================================================
   25. Account Page Tabs
   ===================================================== */
function initAccountTabs() {
  const tabBtns   = $$('[data-account-tab]');
  const tabPanels = $$('[data-account-panel]');
  if (!tabBtns.length) return;

  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabBtns.forEach((b) => b.classList.remove('is-active'));
      tabPanels.forEach((p) => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      const panel = document.querySelector(`[data-account-panel="${btn.dataset.accountTab}"]`);
      panel?.classList.add('is-active');
    });
  });
}

/* =====================================================
   26. Initialize Everything
   ===================================================== */
ready(() => {
  initNav();
  initSmoothScroll();
  initRevealAnimations();
  initCounters();
  initAccordion();
  initTabs();
  initModals();
  initBeforeAfterSliders();
  initServiceFilter();
  initSteppers();
  initDatePickers();
  initAddToCart();
  initLazyImages();
  initNewsletterForm();
  initTestimonialSlider();
  initPricingToggle();
  initAccountTabs();
  initBookingForm();
  initContactForm();
  initCheckoutForm();
  initCartPage();

  // Initialize cart badge on every page
  Cart.updateBadge();
});

/* =====================================================
   27. Expose public API (for page-specific scripts)
   ===================================================== */
window.WashGo = {
  Cart,
  Toast,
  FormValidator,
  openModal,
  closeModal,
};
