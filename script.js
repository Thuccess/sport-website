/* script.js
   - Mobile menu toggle
   - Theme toggle with localStorage persistence
   - GSAP & IntersectionObserver animations
   - Match countdown timers
   - Contact form validation
   - Product & Media modals
   - Stats counter animation
   - Sponsors carousel scroll
*/

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', () => {
  setCurrentYear();
  setupTheme();
  setupMenuToggle();
  setupNavLinks();
  setupScrollReveal();
  setupCountdowns();
  setupContactForm();
  setupStatCounters();
  setupModals();
  setupSponsorsCarousel();
  setupAccessibility();
});

/* -------------------------
   CURRENT YEAR
------------------------- */
function setCurrentYear() {
  const el = $('#year');
  if(el) el.textContent = new Date().getFullYear();
}

/* -------------------------
   THEME TOGGLE
------------------------- */
const THEME_KEY = 'sportwebsite_theme';

function applyTheme(theme) {
  document.body.classList.remove('theme-dark','theme-light');
  document.body.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
  const icon = $('.theme-icon');
  if(icon) icon.textContent = theme === 'light' ? '☀️' : '🌙';
}

function setupTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(saved === 'light' || saved === 'dark' ? saved : (prefersLight ? 'light' : 'dark'));

  const toggle = $('#themeToggle');
  if(!toggle) return;
  toggle.addEventListener('click', () => {
    const current = document.body.classList.contains('theme-light') ? 'light' : 'dark';
    const next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
    toggle.animate([{ transform:'scale(1)'},{transform:'scale(.96)'},{transform:'scale(1)'}],{duration:160});
  });
}

/* -------------------------
   MOBILE MENU TOGGLE
------------------------- */
function setupMenuToggle() {
  const toggle = $('#menuToggle');
  const nav = $('#mainNav');
  if(!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const opened = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!opened));
    nav.classList.toggle('mobile-open', !opened);
  });

  $$('.nav-link').forEach(a => {
    a.addEventListener('click', () => {
      if(window.innerWidth <= 720){
        toggle.setAttribute('aria-expanded', 'false');
        nav.classList.remove('mobile-open');
      }
    });
  });
}

/* -------------------------
   SMOOTH SCROLL FOR NAV LINKS
------------------------- */
function setupNavLinks() {
  $$('.nav-link').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if(href?.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });
}

/* -------------------------
   SCROLL REVEAL / ANIMATIONS (GSAP + IntersectionObserver)
------------------------- */
function setupScrollReveal() {
  const targets = $$('.gs-initial, .fade-in, .player-card, .news-card, .match-card, .contact-form, .stat-number, .card, .gallery img');
  if(targets.length === 0) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      const el = entry.target;

      if(typeof gsap !== 'undefined') {
        gsap.to(el, {
          opacity:1,
          y:0,
          scale:1,
          duration: el.matches('.hero-title, .hero-subtitle') ? 0.9 : 0.8,
          ease: el.matches('.hero-title, .hero-subtitle') ? "elastic.out(1,0.6)" : "power3.out",
          overwrite:true
        });
      } else {
        el.classList.add('visible');
      }

      observer.unobserve(el);
    });
  }, { threshold: 0.12 });

  targets.forEach(el => observer.observe(el));

  // Hero svg subtle animation
  const heroSvg = $('.hero-svg');
  if(heroSvg && typeof gsap !== 'undefined'){
    gsap.fromTo(heroSvg, {scale:0.98, rotation:-1}, {scale:1, rotation:0, duration:1.6, ease:"power2.out", repeat:-1, yoyo:true});
  }

  // Card hover subtle scale
  document.addEventListener('mouseover', e => {
    const card = e.target.closest('.player-card, .match-card, .news-card, .btn');
    if(card && typeof gsap !== 'undefined') gsap.to(card, {scale:1.02, duration:0.18, ease:"power1.out"});
  });
  document.addEventListener('mouseout', e => {
    const card = e.target.closest('.player-card, .match-card, .news-card, .btn');
    if(card && typeof gsap !== 'undefined') gsap.to(card, {scale:1, duration:0.2, ease:"power1.out"});
  });
}

/* -------------------------
   MATCH COUNTDOWN
------------------------- */
function setupCountdowns() {
  const matches = $$('.match-card[data-datetime]');
  if(matches.length === 0) return;

  function updateAll() {
    const now = new Date();
    matches.forEach(card => {
      const dt = new Date(card.dataset.datetime);
      const countdownEl = $('.countdown', card);
      if(isNaN(dt.valueOf())) { if(countdownEl) countdownEl.textContent='TBD'; return; }
      if(dt <= now){ if(countdownEl) countdownEl.textContent='Finished'; return; }

      const diff = Math.max(0, dt - now);
      const days = Math.floor(diff / (1000*60*60*24));
      const hours = Math.floor((diff / (1000*60*60)) % 24);
      const minutes = Math.floor((diff / (1000*60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      const parts = [];
      if(days) parts.push(`${days}d`);
      parts.push(String(hours).padStart(2,'0')+'h');
      parts.push(String(minutes).padStart(2,'0')+'m');
      parts.push(String(seconds).padStart(2,'0')+'s');

      if(countdownEl) countdownEl.textContent = parts.join(' ');
    });
  }

  updateAll();
  setInterval(updateAll, 1000);
}

/* -------------------------
   CONTACT FORM VALIDATION
------------------------- */
function setupContactForm() {
  const form = $('#contactForm'); if(!form) return;
  const nameEl = $('#name', form), emailEl = $('#email', form), messageEl = $('#message', form);
  const nameError = $('#nameError', form), emailError = $('#emailError', form), messageError = $('#messageError', form);
  const successEl = $('#formSuccess', form);

  function validate(){
    let ok=true;
    if(!nameEl.value.trim() || nameEl.value.trim().length<2){ nameError.textContent='Please enter your name.'; ok=false; } else nameError.textContent='';
    const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailPattern.test(emailEl.value.trim())){ emailError.textContent='Please enter a valid email.'; ok=false; } else emailError.textContent='';
    if(!messageEl.value.trim() || messageEl.value.trim().length<6){ messageError.textContent='Please enter a short message (min 6 characters).'; ok=false; } else messageError.textContent='';
    return ok;
  }

  [nameEl,emailEl,messageEl].forEach(input=>input.addEventListener('input', ()=>{ validate(); successEl.textContent=''; }));

  form.addEventListener('submit', e=>{
    e.preventDefault();
    if(!validate()) return;
    successEl.textContent='Message sent — we will get back to you shortly.';
    form.reset(); [nameError,emailError,messageError].forEach(el=>el.textContent='');
    if(typeof gsap!=='undefined') gsap.fromTo(successEl, {opacity:0, y:-6}, {opacity:1, y:0, duration:0.6, ease:"power2.out"});
    setTimeout(()=>{ successEl.textContent=''; }, 6000);
  });
}

/* -------------------------
   STAT COUNTERS
------------------------- */
function setupStatCounters() {
  const counters = $$('.stat-number'); if(counters.length===0) return;
  const speed = 200;

  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting) {
        const counter = entry.target;
        const updateCount = () => {
          const target = +counter.dataset.count;
          const count = +counter.innerText;
          const increment = Math.ceil(target / speed);
          if(count < target){ counter.innerText = count + increment; setTimeout(updateCount, 20); } 
          else counter.innerText = target;
        };
        updateCount();
        observer.unobserve(counter);
      }
    });
  }, {threshold:0.2});

  counters.forEach(c=>observer.observe(c));
}

/* -------------------------
   MODALS: Products + Media
------------------------- */
function setupModals() {
  const productModal = $('#productModal');
  const mediaModal = $('#mediaModal');
  const modalBody = $('#modalBody');

  if(productModal) {
    const closeBtn = $('.close-btn', productModal);
    const modalImg = $('#modalImg', productModal);
    const modalName = $('#modalName', productModal);
    const modalPrice = $('#modalPrice', productModal);
    const modalDesc = $('#modalDesc', productModal);

    $$('.view-details').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const card = e.target.closest('.product-card');
        if(!card) return;
        modalImg.src = card.querySelector('img').src;
        modalName.textContent = card.dataset.name;
        modalPrice.textContent = card.dataset.price;
        modalDesc.textContent = card.dataset.desc;
        productModal.style.display='flex';
      });
    });

    closeBtn?.addEventListener('click', ()=>productModal.style.display='none');
    window.addEventListener('click', e=>{ if(e.target===productModal) productModal.style.display='none'; });
  }

  if(mediaModal && modalBody){
    const closeBtn = $('.close-btn', mediaModal);
    $$('.media-card').forEach(card=>{
      card.addEventListener('click', ()=>{
        const type = card.dataset.type;
        const src = card.dataset.src;
        modalBody.innerHTML='';
        if(type==='image'){ const img=document.createElement('img'); img.src=src; modalBody.appendChild(img); }
        else if(type==='video'){ const video=document.createElement('video'); video.src=src; video.controls=true; video.autoplay=true; modalBody.appendChild(video); }
        mediaModal.style.display='flex';
      });
    });

    closeBtn?.addEventListener('click', ()=>{ mediaModal.style.display='none'; modalBody.innerHTML=''; });
    window.addEventListener('click', e=>{ if(e.target===mediaModal){ mediaModal.style.display='none'; modalBody.innerHTML=''; } });
  }
}

/* -------------------------
   SPONSORS CAROUSEL (desktop drag)
------------------------- */
function setupSponsorsCarousel() {
  const grid = $('.sponsors-grid'); if(!grid) return;
  let isDown=false, startX, scrollLeft;

  grid.addEventListener('mousedown', e=>{
    isDown=true; grid.classList.add('active');
    startX = e.pageX - grid.offsetLeft;
    scrollLeft = grid.scrollLeft;
  });
  grid.addEventListener('mouseleave', ()=>{ isDown=false; grid.classList.remove('active'); });
  grid.addEventListener('mouseup', ()=>{ isDown=false; grid.classList.remove('active'); });
  grid.addEventListener('mousemove', e=>{
    if(!isDown) return;
    e.preventDefault();
    const x = e.pageX - grid.offsetLeft;
    const walk = (x-startX)*2;
    grid.scrollLeft = scrollLeft - walk;
  });
}

/* -------------------------
   ACCESSIBILITY & MISC
------------------------- */
function setupAccessibility() {
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      $('#menuToggle')?.setAttribute('aria-expanded','false');
      $('#mainNav')?.classList.remove('mobile-open');
    }
    if(e.key==='Tab') document.body.classList.add('user-is-tabbing');
  });
}
