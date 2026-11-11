const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.registerPlugin(ScrollTrigger, SplitText);

/* Header and phone menu */

const header = document.querySelector('.header');
const menu = document.getElementById('menu');
const menuToggle = document.querySelector('.js-menu-toggle');

ScrollTrigger.create({
  start: 8,
  onToggle: (self) => header.classList.toggle('is-scrolled', self.isActive),
});

function setMenu(open) {
  menu.hidden = !open;
  menuToggle.setAttribute('aria-expanded', open);
  menuToggle.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
  document.documentElement.classList.toggle('menu-open', open);
}

menuToggle.addEventListener('click', () => setMenu(menu.hidden));
menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

/* Shop */

const totalEl = document.querySelector('.js-total');
const qtyEl = document.querySelector('.js-qty');
const cartCount = document.querySelector('.js-cart-count');
let qty = 1;
let cart = 0;

function updateTotal() {
  qtyEl.textContent = qty;
  totalEl.textContent = Number(document.querySelector('input[name="format"]:checked').dataset.price) * qty;
}

document.querySelector('.js-minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); updateTotal(); });
document.querySelector('.js-plus').addEventListener('click', () => { qty = Math.min(12, qty + 1); updateTotal(); });

document.querySelectorAll('input[name="format"]').forEach((input) => {
  input.addEventListener('change', () => {
    document.querySelectorAll('.shop__item').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.format === input.value);
    });
    updateTotal();
  });
});

document.querySelector('.js-add').addEventListener('click', () => {
  cart += qty;
  cartCount.textContent = cart;
  gsap.fromTo(cartCount, { yPercent: -60 }, { yPercent: 0, duration: 0.8, ease: 'expo.out' });
});

document.querySelector('.js-newsletter').addEventListener('submit', (e) => {
  e.preventDefault();
  e.target.querySelector('.newsletter__row').hidden = true;
  e.target.querySelector('.newsletter__done').hidden = false;
});

updateTotal();

/* The bowl fills while the hero is pinned: one short video, scrubbed by the scroll */

const pour = document.querySelector('.js-pour');
let pourTarget = 0;
let pourTime = 0;

pour.play().then(() => pour.pause(), () => {});

ScrollTrigger.create({
  trigger: '.hero',
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (self) => { pourTarget = self.progress; },
});

gsap.ticker.add((time, deltaTime) => {
  if (!pour.duration) return;
  const target = pourTarget * (pour.duration - 0.05);
  pourTime += (target - pourTime) * (reducedMotion ? 1 : 1 - Math.exp((-deltaTime / 1000) * 8));
  if (Math.abs(pour.currentTime - pourTime) > 0.03 && !pour.seeking) pour.currentTime = pourTime;
});

/* Motion: only transforms and opacity, each runs once */

function initMotion() {
  gsap.from('.hero__text > *', { y: 30, autoAlpha: 0, duration: 1.4, stagger: 0.1, ease: 'expo.out' });
  gsap.from('.hero__figure .lens', { scale: 0.94, autoAlpha: 0, duration: 1.2, ease: 'expo.out', delay: 0.1 });
  gsap.from('.wind path', { xPercent: -8, yPercent: 8, autoAlpha: 0, duration: 2, stagger: 0.15, ease: 'expo.out', delay: 0.3 });

  gsap.to('.wind', {
    x: 40,
    y: -40,
    ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });

  document.querySelectorAll('.js-lines').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 105,
        duration: 0.9,
        stagger: 0.06,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 95%', once: true },
      }),
    });
  });

  gsap.utils.toArray('.js-reveal, .recipe, .shop__stage, .taste__figure').forEach((el) => {
    gsap.from(el, {
      y: 24,
      autoAlpha: 0,
      duration: 0.9,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 95%', once: true },
    });
  });
}

const fontsReady = Promise.race([
  document.fonts.load('1em Gambarino'),
  new Promise((resolve) => setTimeout(resolve, 1500)),
]);

fontsReady.then(() => {
  if (!reducedMotion) initMotion();
  ScrollTrigger.refresh();
});
