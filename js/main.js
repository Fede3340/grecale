document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover)').matches;

gsap.registerPlugin(ScrollTrigger, SplitText);

const lenis = new Lenis({ anchors: true });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

/* Grove sequence: 96 frames scrubbed by the intro scroll */

const GROVE_FRAMES = 96;
const canvas = document.querySelector('.intro__canvas');
const ctx = canvas.getContext('2d');
const poster = document.querySelector('.intro__poster');
const frames = [];
const playhead = { frame: 0 };

function nearestFrame(index) {
  for (let d = 0; d < GROVE_FRAMES; d++) {
    if (frames[index - d]) return frames[index - d];
    if (frames[index + d]) return frames[index + d];
  }
  return null;
}

function drawGrove() {
  const img = nearestFrame(Math.round(playhead.frame));
  if (!img) return;
  const { width, height } = canvas;
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  poster.classList.add('is-hidden');
}

function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio, 2);
  canvas.width = canvas.clientWidth * dpr;
  canvas.height = canvas.clientHeight * dpr;
  drawGrove();
}

for (let i = 0; i < GROVE_FRAMES; i++) {
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    frames[i] = img;
    if (Math.abs(i - playhead.frame) < 2) drawGrove();
  };
  img.src = `assets/seq/grove/${String(i).padStart(3, '0')}.webp`;
}

window.addEventListener('resize', sizeCanvas);
sizeCanvas();

/* Header colour follows the section underneath */

const header = document.querySelector('.header');
document.querySelectorAll('main > section, footer').forEach((section) => {
  ScrollTrigger.create({
    trigger: section,
    start: 'top 40px',
    end: 'bottom 40px',
    onToggle: (self) => self.isActive && (header.dataset.theme = section.dataset.theme),
  });
});

/* Shop */

const totalEl = document.querySelector('.js-total');
const qtyEl = document.querySelector('.js-qty');
const bagCount = document.querySelector('.js-bag-count');
const ctaLabel = document.querySelector('.buy__label');
let qty = 1;
let bag = 0;

function selectedFormat() {
  return document.querySelector('input[name="format"]:checked');
}

function updateTotal() {
  qtyEl.textContent = qty;
  totalEl.textContent = Number(selectedFormat().dataset.price) * qty;
  ctaLabel.dataset.label = ctaLabel.textContent;
}

document.querySelector('.js-minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); updateTotal(); });
document.querySelector('.js-plus').addEventListener('click', () => { qty = Math.min(12, qty + 1); updateTotal(); });

document.querySelectorAll('input[name="format"]').forEach((input) => {
  input.addEventListener('change', () => {
    const current = document.querySelector('.product__item.is-active');
    const next = document.querySelector(`.product__item[data-format="${input.value}"]`);
    current.classList.remove('is-active');
    next.classList.add('is-active');
    if (!reducedMotion) {
      gsap.fromTo(next, { y: 60, rotate: -4, autoAlpha: 0 }, { y: 0, rotate: 0, autoAlpha: 1, duration: 1.1, ease: 'expo.out' });
    }
    updateTotal();
  });
});

document.querySelector('.js-add').addEventListener('click', () => {
  bag += qty;
  bagCount.textContent = bag;
  gsap.fromTo(bagCount, { yPercent: -60, rotate: -20 }, { yPercent: 0, rotate: 0, duration: 0.9, ease: 'expo.out' });
});

updateTotal();

/* Motion */

function revealLines(el, vars = {}) {
  return SplitText.create(el, {
    type: 'lines',
    mask: 'lines',
    autoSplit: true,
    onSplit: (self) => gsap.from(self.lines, {
      yPercent: 105,
      duration: 1.2,
      stagger: 0.08,
      ease: 'expo.out',
      ...vars,
    }),
  });
}

function initMotion() {
  const title = SplitText.create('.js-title', { type: 'chars' });
  const claim = SplitText.create('.js-claim', { type: 'words', mask: 'words' });
  gsap.set('.js-claim', { visibility: 'visible' });
  gsap.set(claim.words, { yPercent: 110 });

  gsap.from(title.chars, {
    rotateX: -95,
    yPercent: 30,
    autoAlpha: 0,
    transformOrigin: '50% 100%',
    duration: 1.6,
    stagger: 0.07,
    ease: 'expo.out',
    delay: 0.2,
  });

  // The wind comes from the north-east: the name blows away from its last letter.
  gsap.timeline({
    scrollTrigger: { trigger: '.intro', start: 'top top', end: 'bottom bottom', scrub: 0.6 },
  })
    .to(playhead, { frame: GROVE_FRAMES - 1, ease: 'none', duration: 1, onUpdate: drawGrove }, 0)
    .to('.intro__kicker, .intro__hint', { autoAlpha: 0, duration: 0.06 }, 0.02)
    .to(title.chars, {
      x: () => -window.innerWidth * gsap.utils.random(0.25, 0.7),
      y: () => gsap.utils.random(-260, 30),
      rotate: () => gsap.utils.random(-70, 25),
      rotateX: () => gsap.utils.random(120, 240),
      autoAlpha: 0,
      duration: 0.3,
      stagger: { each: 0.03, from: 'end' },
      ease: 'power2.in',
    }, 0.04)
    .to(claim.words, { yPercent: 0, duration: 0.18, stagger: 0.02, ease: 'power3.out' }, 0.44)
    .to(claim.words, { yPercent: -110, duration: 0.12, stagger: 0.015, ease: 'power2.in' }, 0.86);

  const leafSide = document.querySelector('.js-side');
  const leafLines = [...document.querySelectorAll('.leaf .js-lines')].map((el) => SplitText.create(el, { type: 'lines', mask: 'lines' }));
  leafLines.forEach((split) => gsap.set(split.lines, { yPercent: 105 }));

  gsap.timeline({
    scrollTrigger: {
      trigger: '.leaf',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
      onUpdate: (self) => {
        leafSide.textContent = self.progress > 0.5 ? 'Pagina inferiore' : 'Pagina superiore';
      },
    },
  })
    .fromTo('.js-leaf', { rotateX: 0, rotateZ: -9, scale: 0.86 }, { rotateX: 180, rotateZ: 5, scale: 1, ease: 'power1.inOut', duration: 1 }, 0)
    .to(leafLines[0].lines, { yPercent: 0, stagger: 0.04, duration: 0.25, ease: 'power3.out' }, 0.05)
    .to(leafLines[1].lines, { yPercent: 0, stagger: 0.04, duration: 0.25, ease: 'power3.out' }, 0.25)
    .to(leafLines[2].lines, { yPercent: 0, stagger: 0.04, duration: 0.25, ease: 'power3.out' }, 0.62);

  gsap.to('.leaf__scene', { y: 14, rotate: 1.2, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 });

  document.querySelectorAll('.js-lines').forEach((el) => {
    if (el.closest('.leaf')) return;
    revealLines(el, { scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  document.querySelectorAll('.js-parallax, .footer__image img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -9 }, {
      yPercent: 0,
      ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  gsap.from('.product__stage', {
    y: 120,
    autoAlpha: 0,
    duration: 1.6,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.product', start: 'top 70%' },
  });

  gsap.from('.dish', {
    yPercent: 40,
    autoAlpha: 0,
    duration: 1.2,
    stagger: 0.12,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.dishes', start: 'top 80%' },
  });

  if (canHover) initPreview();
}

function initPreview() {
  const preview = document.querySelector('.dishes__preview');
  const image = preview.querySelector('img');
  gsap.set(preview, { xPercent: -50, yPercent: -60, scale: 0.6 });
  const xTo = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3' });
  const yTo = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3' });

  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });

  document.querySelectorAll('.dish').forEach((dish) => {
    dish.addEventListener('mouseenter', () => {
      image.src = dish.dataset.image;
      gsap.to(preview, { autoAlpha: 1, scale: 1, rotate: gsap.utils.random(-4, 4), duration: 0.6, ease: 'expo.out' });
    });
    dish.addEventListener('mouseleave', () => {
      gsap.to(preview, { autoAlpha: 0, scale: 0.6, duration: 0.4, ease: 'power2.in' });
    });
  });
}

if (reducedMotion) {
  gsap.set('.js-claim', { visibility: 'visible' });
} else {
  document.fonts.ready.then(initMotion);
}
