// Mobilní menu
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('menu');
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  toggle.setAttribute('aria-expanded', 'false');
  nav.classList.remove('open');
}));

// Záložky s kategoriemi výrobků
const tabs = [...document.querySelectorAll('[role="tab"]')];
function selectTab(tab) {
  tabs.forEach(t => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
  });
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', e => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    const next = tabs[(i + d + tabs.length) % tabs.length];
    selectTab(next); next.focus();
  });
});

// Lightbox galerie
const lb = document.querySelector('.lightbox');
const lbImg = lb.querySelector('img');
const lbCap = lb.querySelector('.lb-caption');
let items = [], idx = 0;
function show(i) {
  idx = (i + items.length) % items.length;
  const img = items[idx].querySelector('img');
  lbImg.src = items[idx].href;
  lbImg.alt = img.alt;
  lbCap.textContent = img.alt;
}
document.querySelectorAll('.gallery a').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  items = [...a.closest('.gallery').querySelectorAll('a')];
  show(items.indexOf(a));
  lb.showModal();
}));
lb.querySelector('.lb-close').addEventListener('click', () => lb.close());
lb.querySelector('.lb-prev').addEventListener('click', () => show(idx - 1));
lb.querySelector('.lb-next').addEventListener('click', () => show(idx + 1));
lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') show(idx - 1);
  if (e.key === 'ArrowRight') show(idx + 1);
});

// Videa z YouTube se načtou až po kliknutí (rychlejší web, bez cookies předem)
document.querySelectorAll('.video').forEach(v => {
  v.querySelector('.play').addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${v.dataset.yt}?autoplay=1&rel=0`;
    f.title = v.dataset.title;
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    v.replaceChildren(f);
  });
});

// Jemné objevování sekcí při scrollu
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: .12 });
  document.querySelectorAll('.section-head, .tabs, .tech, .about > *, .contact > *').forEach(el => {
    el.classList.add('reveal'); io.observe(el);
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
