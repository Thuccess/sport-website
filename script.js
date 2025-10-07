/* script.js
   - Mobile menu toggle
   - Smooth reveal on scroll (IntersectionObserver + GSAP)
   - GSAP entrance & stagger animations (Framer Motion style)
   - Match countdown timers (auto-updating)
   - Contact form validation and friendly success message
   - Theme toggle persisted in localStorage
*/

/* -------------------------
   Helpers
   ------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

/* -------------------------
   Initialize on DOMContentLoaded
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  setCurrentYear();
  setupTheme();
  setupMenuToggle();
  setupNavLinks();
  setupScrollRevealWithGSAP();
  setupCountdowns();
  setupContactForm();
  setupAccessibility();
});

/* -------------------------
   Year
   ------------------------- */
function setCurrentYear(){
  const el = document.getElementById('year');
  if(el) el.textContent = new Date().getFullYear();
}

/* -------------------------
   THEME: read/write localStorage and apply classes
   ------------------------- */
const THEME_KEY = 'sportwebsite_theme';

function applyTheme(theme){
  document.body.classList.remove('theme-dark','theme-light');
  if(theme === 'light') document.body.classList.add('theme-light');
  else document.body.classList.add('theme-dark'); // default dark
  // update icon
  const icon = document.querySelector('.theme-icon');
  if(icon) icon.textContent = (theme === 'light') ? '☀️' : '🌙';
}

function setupTheme(){
  // Initial: check localStorage -> system preference -> default dark
  const saved = localStorage.getItem(THEME_KEY);
  if(saved === 'light' || saved === 'dark'){
    applyTheme(saved);
  } else {
    // fallback to system preference
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    applyTheme(prefersLight ? 'light' : 'dark');
  }

  // Toggle button
  const toggle = document.getElementById('themeToggle');
  if(!toggle) return;
  toggle.addEventListener('click', () => {
    // Toggle between light and dark
    const current = document.body.classList.contains('theme-light') ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    // subtle click scale
    toggle.animate([{ transform: 'scale(1)' }, { transform: 'scale(.96)' }, { transform: 'scale(1)' }], { duration: 160 });
  });
}

/* -------------------------
   Mobile menu toggle
   ------------------------- */
function setupMenuToggle(){
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('mainNav');
  if(!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const opened = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!opened));
    nav.classList.toggle('mobile-open', !opened);
  });

  // Close on nav link click for mobile
  $$('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      if (window.innerWidth <= 720) {
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('mobile-open');
      }
    });
  });
}

/* -------------------------
   Smooth scrolling for nav links
   ------------------------- */
function setupNavLinks(){
  $$('.nav-link').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if(href && href.startsWith('#')){
        e.preventDefault();
        const target = document.querySelector(href);
        if(target){
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });
}

/* -------------------------
   Scroll reveal with GSAP + IntersectionObserver
   - We mark targets with .gs-initial (in CSS) then animate with GSAP
   ------------------------- */
function setupScrollRevealWithGSAP(){
  // Ensure GSAP is loaded
  if(typeof gsap === 'undefined'){
    // If GSAP not available, fallback to simple fade-in via class toggles
    $$('.player-card, .match-card, .news-card, .hero-title, .hero-subtitle, .contact-form').forEach((el, i) => {
      setTimeout(()=> el.classList.add('show'), i * 80);
    });
    return;
  }

  // Prepare elements
  const targets = [
    '.hero-title', '.hero-subtitle', '.hero-cta',
    '.player-card', '.match-card', '.news-card', '.contact-form'
  ];
  const elements = targets.flatMap(sel => $$(sel));

  // Set initial state via CSS class (already in stylesheet)
  elements.forEach(el => el.classList.add('gs-initial'));

  // IntersectionObserver to trigger animation when element visible
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      const el = entry.target;

      // staggered animation depending on type
      if(el.matches('.player-card') || el.matches('.news-card') || el.matches('.match-card')){
        gsap.to(el, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          overwrite: true
        });
      } else {
        // Slightly bouncier for hero and CTAs
        gsap.to(el, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: "elastic.out(1, 0.6)",
          overwrite: true
        });
      }

      obs.unobserve(el);
    });
  }, { threshold: 0.12 });

  // Observe each element (but stagger groups for nicer effect)
  elements.forEach((el, idx) => {
    // Stagger: delay observation slightly for groups so the entrance feels coordinated
    setTimeout(() => obs.observe(el), idx * 60);
  });

  // Additional hero svg subtle animation
  const heroSvg = document.querySelector('.hero-svg');
  if(heroSvg){
    gsap.fromTo(heroSvg, { scale: 0.98, rotation: -1 }, {
      scale: 1, rotation: 0, duration: 1.6, ease: "power2.out", repeat: -1, yoyo: true, opacity: 1
    });
  }

  // Subtle hover scale on cards using event delegation
  document.addEventListener('mouseover', (e) => {
    const card = e.target.closest('.player-card, .match-card, .news-card, .btn');
    if(card) gsap.to(card, { scale: 1.02, duration: 0.18, ease: "power1.out" });
  });
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest('.player-card, .match-card, .news-card, .btn');
    if(card) gsap.to(card, { scale: 1, duration: 0.2, ease: "power1.out" });
  });
}

/* -------------------------
   Match countdowns
   ------------------------- */
function setupCountdowns(){
  const matches = $$('.match-card[data-datetime]');
  if(matches.length === 0) return;

  function updateAll(){
    const now = new Date();
    matches.forEach(card => {
      const iso = card.getAttribute('data-datetime');
      const dt = new Date(iso);
      const countdownEl = card.querySelector('.countdown');

      if(isNaN(dt.valueOf())){
        if(countdownEl) countdownEl.textContent = 'TBD';
        return;
      }

      if(dt <= now) {
        if(card.classList.contains('match-result')){
          if(countdownEl) countdownEl.textContent = 'Final';
        } else {
          if(countdownEl) countdownEl.textContent = 'Finished';
        }
        return;
      }

      const diff = Math.max(0, dt - now);
      const days = Math.floor(diff / (1000*60*60*24));
      const hours = Math.floor((diff / (1000*60*60)) % 24);
      const minutes = Math.floor((diff / (1000*60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const parts = [];
      if(days) parts.push(`${days}d`);
      parts.push(String(hours).padStart(2,'0') + 'h');
      parts.push(String(minutes).padStart(2,'0') + 'm');
      parts.push(String(seconds).padStart(2,'0') + 's');

      if(countdownEl) countdownEl.textContent = parts.join(' ');
    });
  }

  updateAll();
  setInterval(updateAll, 1000);
}

/* -------------------------
   Contact form validation
   ------------------------- */
function setupContactForm(){
  const form = document.getElementById('contactForm');
  if(!form) return;

  const nameEl = $('#name', form);
  const emailEl = $('#email', form);
  const messageEl = $('#message', form);

  const nameError = $('#nameError', form);
  const emailError = $('#emailError', form);
  const messageError = $('#messageError', form);
  const successEl = $('#formSuccess', form);

  function validate(){
    let ok = true;
    if(!nameEl.value.trim() || nameEl.value.trim().length < 2){
      nameError.textContent = 'Please enter your name.';
      ok = false;
    } else nameError.textContent = '';

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailPattern.test(emailEl.value.trim())){
      emailError.textContent = 'Please enter a valid email.';
      ok = false;
    } else emailError.textContent = '';

    if(!messageEl.value.trim() || messageEl.value.trim().length < 6){
      messageError.textContent = 'Please enter a short message (min 6 characters).';
      ok = false;
    } else messageError.textContent = '';

    return ok;
  }

  [nameEl, emailEl, messageEl].forEach(input => input.addEventListener('input', () => {
    validate();
    successEl.textContent = '';
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if(!validate()) return;

    successEl.textContent = 'Message sent — we will get back to you shortly.';
    form.reset();
    [nameError, emailError, messageError].forEach(el => el.textContent = '');

    // Tiny success animation using GSAP if available
    if(typeof gsap !== 'undefined'){
      gsap.fromTo(successEl, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: .6, ease: "power2.out" });
    }

    setTimeout(() => { successEl.textContent = ''; }, 6000);
  });
}

/* -------------------------
   Accessibility & misc
   ------------------------- */
function setupAccessibility(){
  // Close mobile nav on ESC
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      const toggle = document.getElementById('menuToggle');
      const nav = document.getElementById('mainNav');
      if(toggle && nav){
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('mobile-open');
      }
    }
  });

  // Focus visible outline for keyboard users
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Tab') document.body.classList.add('user-is-tabbing');
  });
}
