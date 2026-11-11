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

/* Motion: only transforms and opacity, each runs once */

function initMotion() {
  gsap.from('.hero__text > *', { y: 30, autoAlpha: 0, duration: 1.4, stagger: 0.1, ease: 'expo.out' });
  gsap.from('.hero__figure .lens', { scale: 0.9, autoAlpha: 0, duration: 1.6, ease: 'expo.out', delay: 0.15 });
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
        duration: 1.2,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      }),
    });
  });

  gsap.utils.toArray('.js-reveal, .recipe, .shop__stage, .taste__figure').forEach((el) => {
    gsap.from(el, {
      y: 50,
      autoAlpha: 0,
      duration: 1.3,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
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
