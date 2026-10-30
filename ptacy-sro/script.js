const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Header: solid on scroll, mobile menu */
const hdr = $('#hdr');
const burger = $('#burger');
const nav = $('#nav');
const onScrollHeader = () => hdr.classList.toggle('solid', scrollY > 40);
onScrollHeader();

burger.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  hdr.classList.toggle('menu', open);
});
nav.addEventListener('click', e => {
  if (!e.target.closest('a')) return;
  nav.classList.remove('open');
  burger.setAttribute('aria-expanded', false);
  hdr.classList.remove('menu');
});

$('#year').textContent = new Date().getFullYear();

/* Motto: split into words, light them up while scrolling */
const motto = $('#motto');
const accent = ['víme,', 'kam', 'obrátit.'];
motto.innerHTML = motto.textContent.trim().split(/\s+/)
  .map(w => `<span class="w${accent.includes(w) ? ' hl' : ''}">${w}</span>`).join(' ');
const words = $$('.w', motto);

/* Process timeline fill */
const timeline = $('#timeline');
const tlFill = $('#tl-fill');
const tlSteps = $$('.tl-step', timeline);

function onScroll() {
  onScrollHeader();
  const vh = innerHeight;

  const mr = motto.getBoundingClientRect();
  const mp = Math.min(1, Math.max(0, (vh * 0.85 - mr.top) / (mr.height + vh * 0.35)));
  const lit = reduced ? words.length : Math.round(mp * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < lit));

  const tr = timeline.getBoundingClientRect();
  const tp = Math.min(1, Math.max(0, (vh * 0.75 - tr.top) / (tr.height + vh * 0.2)));
  tlFill.style.width = `${tp * 100}%`;
  tlSteps.forEach((s, i) => s.classList.toggle('on', tp >= i / tlSteps.length + 0.02 || reduced));
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
onScroll();

/* Reveal on view + one-shot triggers */
const revealEls = $$('.sec-head, .svc, .tile, .vet, .tl-step, .contact > *, .reach-grid > div, .egg-item figcaption');
revealEls.forEach(el => el.classList.add('rv'));
const once = new Set([$('#eggs'), $('.tile-tubes'), $('.radar'), ...$$('.big-num')]);

const io = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    el.classList.add('in');
    if (el.matches('.big-num')) countUp(el);
    io.unobserve(el);
  });
}, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });
[...revealEls, ...once].forEach(el => io.observe(el));

function countUp(el) {
  const target = +el.dataset.count;
  if (reduced) { el.textContent = target; return; }
  const t0 = performance.now();
  const step = t => {
    const p = Math.min(1, (t - t0) / 1200);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* Services: floating photo preview that follows the cursor */
const peek = $('#peek');
const peekImg = $('img', peek);
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let x = 0, y = 0, cx = 0, cy = 0, raf = 0;
  const loop = () => {
    cx += (x - cx) * 0.18;
    cy += (y - cy) * 0.18;
    peek.style.left = `${cx}px`;
    peek.style.top = `${cy}px`;
    raf = requestAnimationFrame(loop);
  };
  $$('.svc').forEach(svc => {
    svc.addEventListener('mouseenter', e => {
      peekImg.src = svc.dataset.img;
      x = cx = e.clientX; y = cy = e.clientY;
      peek.classList.add('show');
      if (!raf) loop();
    });
    svc.addEventListener('mousemove', e => { x = e.clientX + 160; y = e.clientY; });
    svc.addEventListener('mouseleave', () => {
      peek.classList.remove('show');
      cancelAnimationFrame(raf); raf = 0;
    });
  });
}

/* Vaccination tabs */
const vaxTile = $('.tile-vax');
const vaxText = $('#vax-text');
const vaxCopy = [
  'Hromadná aplikace přes napájecí systém – šetrná ke zvířatům a vhodná pro velká hejna.',
  'Rozprašování vakcíny nad hejnem – rychlé pokrytí, ideální pro respirační onemocnění u mladé drůbeže.',
  'Individuální injekční aplikace – přesná dávka pro každý kus, typicky v rozmnožovacích chovech.'
];
$$('.vax-tabs button').forEach(btn => btn.addEventListener('click', () => {
  $$('.vax-tabs button').forEach(b => b.setAttribute('aria-selected', b === btn));
  const i = +btn.dataset.vax;
  vaxTile.dataset.mode = i;
  vaxText.style.opacity = 0;
  setTimeout(() => { vaxText.textContent = vaxCopy[i]; vaxText.style.opacity = 1; }, 200);
}));
