const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover)').matches;

gsap.registerPlugin(ScrollTrigger, SplitText);

/* Pour sequence: 144 frames, eased with the scroll and blended in between */

const POUR_FRAMES = 144;
const canvas = document.querySelector('.js-pour');
const ctx = canvas.getContext('2d');
const frames = [];
let position = 0;
let target = 0;
let drawnPosition = -1;
let heroVisible = true;

function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio, 1.5);
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  drawnPosition = -1;
}

// blends the two nearest loaded frames around the scroll position
function draw() {
  let before = Math.floor(position);
  let after = Math.min(before + 1, POUR_FRAMES - 1);
  while (before > 0 && !frames[before]) before--;
  while (after < POUR_FRAMES - 1 && !frames[after]) after++;
  if (!frames[before]) return;
  ctx.globalAlpha = 1;
  ctx.drawImage(frames[before], 0, 0, canvas.width, canvas.height);
  if (frames[after] && after > before) {
    ctx.globalAlpha = Math.min(1, Math.max(0, (position - before) / (after - before)));
    ctx.drawImage(frames[after], 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  drawnPosition = position;
}

function loadOrder(count) {
  const order = [];
  for (const step of [16, 8, 4, 2, 1]) {
    for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i);
  }
  return order;
}

function loadFrames() {
  loadOrder(POUR_FRAMES).forEach((i) => {
    const img = new Image();
    img.decoding = 'async';
    img.src = `assets/seq/pour/${String(i).padStart(3, '0')}.webp`;
    img.decode().then(() => {
      frames[i] = img;
      drawnPosition = -1;
    }, () => {});
  });
}

ScrollTrigger.create({
  trigger: '.hero',
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (self) => { target = self.progress * (POUR_FRAMES - 1); },
});

ScrollTrigger.create({
  trigger: '.hero',
  start: 'top bottom',
  end: 'bottom top',
  onToggle: (self) => { heroVisible = self.isActive; },
});

gsap.ticker.add((time, deltaTime) => {
  if (!heroVisible) return;
  position += (target - position) * (reducedMotion ? 1 : 1 - Math.exp((-deltaTime / 1000) * 7));
  if (Math.abs(position - drawnPosition) > 0.005) draw();
});

/* Header colour follows the section underneath */

const header = document.querySelector('.header');
document.querySelectorAll('[data-theme]:not(.header)').forEach((section) => {
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
let qty = 1;
let bag = 0;

function updateTotal() {
  qtyEl.textContent = qty;
  totalEl.textContent = Number(document.querySelector('input[name="format"]:checked').dataset.price) * qty;
}

document.querySelector('.js-minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); updateTotal(); });
document.querySelector('.js-plus').addEventListener('click', () => { qty = Math.min(12, qty + 1); updateTotal(); });

document.querySelectorAll('input[name="format"]').forEach((input) => {
  input.addEventListener('change', () => {
    document.querySelectorAll('.product__item').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.format === input.value);
    });
    updateTotal();
  });
});

document.querySelector('.js-add').addEventListener('click', () => {
  bag += qty;
  bagCount.textContent = bag;
  gsap.fromTo(bagCount, { yPercent: -60 }, { yPercent: 0, duration: 0.9, ease: 'expo.out' });
});

/* Motion: text rises out of a mask, images open once, one slow parallax */

function initMotion() {
  document.querySelectorAll('.js-lines').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, {
        yPercent: 105,
        duration: 1.3,
        stagger: 0.09,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 86%', once: true },
      }),
    });
  });

  document.querySelectorAll('.js-reveal').forEach((figure) => {
    const img = figure.querySelector('img');
    gsap.timeline({ scrollTrigger: { trigger: figure, start: 'top 82%', once: true } })
      .from(img, { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' })
      .from(img, { scale: 1.12, duration: 1.8, ease: 'expo.out' }, 0.2);
  });

  gsap.fromTo('.js-parallax', { yPercent: -12 }, {
    yPercent: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.interlude', start: 'top bottom', end: 'bottom top', scrub: true },
  });

  gsap.from('.product__stage', {
    yPercent: 12,
    autoAlpha: 0,
    duration: 1.6,
    ease: 'expo.out',
    scrollTrigger: { trigger: '.product', start: 'top 70%', once: true },
  });

  gsap.from('.hero__title, .hero__kicker, .hero__hint', {
    yPercent: 30,
    autoAlpha: 0,
    duration: 1.6,
    stagger: 0.12,
    ease: 'expo.out',
    delay: 0.15,
  });

  if (canHover) initPreview();
}

function initPreview() {
  const preview = document.querySelector('.dishes__preview');
  const image = preview.querySelector('img');
  gsap.set(preview, { xPercent: -50, yPercent: -60, scale: 0.7 });
  const xTo = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3' });
  const yTo = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3' });

  window.addEventListener('pointermove', (e) => { xTo(e.clientX); yTo(e.clientY); });

  document.querySelectorAll('.dish').forEach((dish) => {
    dish.addEventListener('mouseenter', () => {
      image.src = dish.dataset.image;
      gsap.to(preview, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'expo.out' });
    });
    dish.addEventListener('mouseleave', () => {
      gsap.to(preview, { autoAlpha: 0, scale: 0.7, duration: 0.4, ease: 'power2.in' });
    });
  });
}

const fontsReady = Promise.race([
  Promise.all([document.fonts.load('300 1em Melodrama'), document.fonts.load('400 1em Switzer')]),
  new Promise((resolve) => setTimeout(resolve, 1500)),
]);

updateTotal();
sizeCanvas();
loadFrames();
window.addEventListener('resize', sizeCanvas);
fontsReady.then(() => {
  if (!reducedMotion) initMotion();
  ScrollTrigger.refresh();
});
