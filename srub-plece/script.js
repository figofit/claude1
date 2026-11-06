/* Srub Pleče – interactions (no dependencies) */
(function () {
  "use strict";

  /* ------------------------------------------------------------
     OBSAZENOST – sem patří obsazené termíny (noci).
     Formát: ["příjezd", "odjezd"] – den odjezdu je zase volný.
     Po spuštění lze plnit automaticky z iCal (Booking / e-chalupy).
     ------------------------------------------------------------ */
  var OBSAZENO = [
    // UKÁZKA – po spuštění se načte automaticky z iCal (e-chalupy / Booking)
    ["2026-11-20", "2026-11-22"],
    ["2026-12-04", "2026-12-06"],
    ["2026-12-23", "2026-12-27"],
    ["2026-12-30", "2027-01-02"],
    ["2027-01-15", "2027-01-17"],
    ["2027-02-06", "2027-02-13"]
  ];
  var EMAIL = "srub.plece@gmail.com";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------------- nav ---------------- */
  var nav = $("#nav"), burger = $("#burger");
  function onScroll() { nav.classList.toggle("scrolled", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  $$("#menu a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* ---------------- hero scene ---------------- */
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function tree(parent, x, baseY, h) {
    var w = h * 0.4;
    el("use", { href: "#spruce", x: x - w / 2, y: baseY - h, width: w, height: h }, parent);
  }
  (function scene() {
    var stars = $("#stars"), far = $("#forest-far"), near = $("#forest-near"), fence = $("#fence"), ff = $("#fireflies");
    if (!stars) return;
    for (var i = 0; i < 90; i++) {
      var c = el("circle", { cx: (rnd() * 1600).toFixed(1), cy: (rnd() * 380).toFixed(1), r: (rnd() * 1.4 + 0.4).toFixed(2), opacity: (rnd() * 0.6 + 0.3).toFixed(2) }, stars);
      c.style.animationDelay = (rnd() * 4).toFixed(2) + "s";
    }
    // far forest along the second ridge
    for (var x = -20; x < 1620; x += 9 + rnd() * 10) {
      var y = 560 + Math.sin(x / 160) * 18 + Math.cos(x / 70) * 8 + 40 + rnd() * 30;
      tree(far, x, y + 50, 40 + rnd() * 50);
    }
    // near forest – denser on the left and behind the cabin
    for (var x2 = -30; x2 < 1640; x2 += 14 + rnd() * 18) {
      if (x2 > 1010 && x2 < 1440 && rnd() < 0.75) continue; // keep cabin visible
      if (x2 > 840 && x2 < 1010 && rnd() < 0.6) continue;
      var h = 90 + rnd() * 120 + (x2 < 500 ? 70 : 0);
      tree(near, x2, 700 + rnd() * 26, h);
    }
    // big foreground spruces on the edges
    [[-10, 930, 420], [70, 945, 330], [1530, 930, 380], [1610, 940, 440], [600, 920, 180]].forEach(function (t) { tree(near, t[0], t[1], t[2]); });
    // fence
    var fy = 800;
    el("path", { d: "M900 " + (fy - 18) + "H1560M900 " + (fy - 6) + "H1560" }, fence);
    for (var fx = 900; fx <= 1560; fx += 30) el("path", { d: "M" + fx + " " + (fy - 30) + "V" + fy }, fence);
    // fireflies
    for (var j = 0; j < 22; j++) {
      var f = el("circle", { cx: (rnd() * 1000 + 300).toFixed(0), cy: (730 + rnd() * 150).toFixed(0), r: (rnd() * 1.8 + 1).toFixed(1) }, ff);
      f.style.animationDelay = (rnd() * 6).toFixed(2) + "s";
      f.style.animationDuration = (4 + rnd() * 4).toFixed(2) + "s";
    }
  })();

  /* ---------------- photos with fallback ---------------- */
  $$(".photo[data-src]").forEach(function (box) {
    var img = new Image();
    img.alt = box.getAttribute("data-label") || "";
    img.loading = "lazy";
    img.decoding = "async";
    img.onload = function () { box.appendChild(img); box.classList.add("loaded"); };
    img.src = box.getAttribute("data-src");
  });

  /* ---------------- lightbox ---------------- */
  var lb = $("#lightbox"), lbImg = $("#lbImg"), lbCap = $("#lbCap"), idx = 0, items = [];
  function openLb(i) {
    items = $$("#gallery .photo.loaded");
    if (!items.length) return;
    idx = (i + items.length) % items.length;
    var it = items[idx];
    lbImg.src = it.getAttribute("data-src");
    lbImg.alt = lbCap.textContent = it.getAttribute("data-label");
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; }
  $$("#gallery .photo").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!b.classList.contains("loaded")) return;
      openLb($$("#gallery .photo.loaded").indexOf(b));
    });
  });
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbPrev").addEventListener("click", function () { openLb(idx - 1); });
  $("#lbNext").addEventListener("click", function () { openLb(idx + 1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") openLb(idx - 1);
    if (e.key === "ArrowRight") openLb(idx + 1);
  });

  /* ---------------- calendar ---------------- */
  var MONTHS = ["leden", "únor", "březen", "duben", "květen", "červen", "červenec", "srpen", "září", "říjen", "listopad", "prosinec"];
  var DOW = ["po", "út", "st", "čt", "pá", "so", "ne"];
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function fmt(d) { return d.getDate() + ". " + (d.getMonth() + 1) + ". " + d.getFullYear(); }

  var busy = {};
  OBSAZENO.forEach(function (r) {
    for (var d = parse(r[0]); d < parse(r[1]); d = addDays(d, 1)) busy[iso(d)] = true;
  });

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var view = new Date(today.getFullYear(), today.getMonth(), 1);
  var selStart = null, selEnd = null;
  var monthsBox = $("#calMonths"), prev = $("#calPrev"), next = $("#calNext");
  var fOd = $("#fOd"), fDo = $("#fDo"), pill = $("#datesPill"), msg = $("#formMsg");
  fOd.min = fDo.min = iso(today);

  function rangeFree(a, b) {
    for (var d = new Date(a); d < b; d = addDays(d, 1)) if (busy[iso(d)]) return false;
    return true;
  }

  function renderMonth(first) {
    var box = document.createElement("div");
    box.className = "cal-month";
    box.innerHTML = "<h4>" + MONTHS[first.getMonth()] + " " + first.getFullYear() + "</h4>";
    var grid = document.createElement("div");
    grid.className = "cal-grid";
    DOW.forEach(function (d) { var s = document.createElement("span"); s.className = "dow"; s.textContent = d; grid.appendChild(s); });
    var offset = (first.getDay() + 6) % 7;
    for (var i = 0; i < offset; i++) grid.appendChild(document.createElement("span"));
    var dim = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    for (var day = 1; day <= dim; day++) {
      var d = new Date(first.getFullYear(), first.getMonth(), day);
      var key = iso(d);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "day";
      b.textContent = day;
      b.dataset.date = key;
      b.setAttribute("aria-label", fmt(d));
      if (d < today) b.disabled = true;
      if (busy[key]) { b.classList.add("busy"); b.setAttribute("aria-label", fmt(d) + " – obsazeno"); }
      if (+d === +today) b.classList.add("today");
      if (selStart && +d === +selStart) b.classList.add("sel-start");
      if (selEnd && +d === +selEnd) b.classList.add("sel-end");
      if (selStart && selEnd && d > selStart && d < selEnd) b.classList.add("in-range");
      grid.appendChild(b);
    }
    box.appendChild(grid);
    return box;
  }

  function render() {
    monthsBox.innerHTML = "";
    monthsBox.appendChild(renderMonth(view));
    monthsBox.appendChild(renderMonth(new Date(view.getFullYear(), view.getMonth() + 1, 1)));
    prev.disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    updatePill();
  }

  function updatePill() {
    if (selStart && selEnd) {
      var n = Math.round((selEnd - selStart) / 864e5);
      pill.innerHTML = "<strong>" + fmt(selStart) + " – " + fmt(selEnd) + "</strong> · " + n + (n === 1 ? " noc" : n < 5 ? " noci" : " nocí");
      pill.classList.add("ok");
    } else if (selStart) {
      pill.textContent = "Příjezd " + fmt(selStart) + " – teď vyberte den odjezdu";
      pill.classList.remove("ok");
    } else {
      pill.textContent = "Zatím nemáte vybraný termín";
      pill.classList.remove("ok");
    }
  }

  monthsBox.addEventListener("click", function (e) {
    var b = e.target.closest(".day");
    if (!b || b.disabled) return;
    var d = parse(b.dataset.date);
    msg.textContent = "";
    if (!selStart || selEnd || d <= selStart) {
      if (busy[iso(d)]) { msg.textContent = "Tento den je už obsazený."; return; }
      selStart = d; selEnd = null;
    } else {
      if (!rangeFree(selStart, d)) { msg.textContent = "Ve vybraném termínu je obsazená noc. Zkuste prosím jiný."; return; }
      selEnd = d;
    }
    fOd.value = selStart ? iso(selStart) : "";
    fDo.value = selEnd ? iso(selEnd) : "";
    render();
  });
  prev.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); render(); });
  next.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); render(); });

  function fromInputs() {
    selStart = fOd.value ? parse(fOd.value) : null;
    selEnd = fDo.value ? parse(fDo.value) : null;
    if (selStart && selEnd && selEnd <= selStart) selEnd = null;
    if (selStart) view = new Date(selStart.getFullYear(), selStart.getMonth(), 1);
    render();
  }
  fOd.addEventListener("change", fromInputs);
  fDo.addEventListener("change", fromInputs);
  render();

  /* ---------------- inquiry form ---------------- */
  $("#inquiry").addEventListener("submit", function (e) {
    e.preventDefault();
    var form = e.target, ok = true;
    ["#fOd", "#fDo", "#fJmeno", "#fEmail"].forEach(function (s) {
      var f = $(s), bad = !f.value || (f.type === "email" && !/^\S+@\S+\.\S+$/.test(f.value));
      f.classList.toggle("invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { msg.textContent = "Doplňte prosím termín, jméno a e-mail."; return; }
    if (parse(fDo.value) <= parse(fOd.value)) { msg.textContent = "Odjezd musí být po příjezdu."; return; }
    if (!rangeFree(parse(fOd.value), parse(fDo.value))) { msg.textContent = "Ve vybraném termínu je obsazená noc."; return; }

    var body = [
      "Dobrý den,",
      "",
      "mám zájem o pobyt ve Srubu Pleče.",
      "",
      "Termín: " + fmt(parse(fOd.value)) + " – " + fmt(parse(fDo.value)),
      "Počet osob: " + form.osoby.value,
      "Pes: " + (form.pes.checked ? "ano" : "ne"),
      "Jméno: " + form.jmeno.value,
      "E-mail: " + form.email.value,
      "Telefon: " + (form.tel.value || "–"),
      "",
      form.zprava.value
    ].join("\n");
    var subject = "Poptávka " + fmt(parse(fOd.value)) + " – " + form.jmeno.value;
    window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    msg.textContent = "Otevírá se váš e-mail s předvyplněnou poptávkou. Stačí ji odeslat.";
  });

  /* ---------------- lazy map ---------------- */
  var map = $("#map");
  function loadMap() {
    if (map.dataset.loaded) return;
    map.dataset.loaded = "1";
    map.innerHTML = '<iframe title="Mapa – Srub Pleče, Jindřichov 423" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="' + map.dataset.src + '"></iframe>';
  }
  $("#mapLoad").addEventListener("click", loadMap);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en, o) { if (en[0].isIntersecting) { loadMap(); o.disconnect(); } }, { rootMargin: "300px" }).observe(map);
  }

  /* ---------------- reveal + mobile CTA ---------------- */
  var targets = $$(".section-head, .feature, .amenities, .story-text, .story-photo, .gallery, .price-card, .booking-cal, .review-card, .around-col, .faq, .contact-grid > *");
  if ("IntersectionObserver" in window) {
    targets.forEach(function (t) { t.classList.add("reveal"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  }

  var cta = $(".mobile-cta"), hero = $(".hero"), booking = $("#rezervace");
  function ctaState() {
    var past = hero.getBoundingClientRect().bottom < 0;
    var r = booking.getBoundingClientRect();
    var inBooking = r.top < window.innerHeight && r.bottom > 0;
    cta.classList.toggle("show", past && !inBooking);
  }
  var toTop = $("#toTop");
  function scrollUi() {
    ctaState();
    toTop.classList.toggle("show", window.scrollY > window.innerHeight * 0.8);
  }
  window.addEventListener("scroll", scrollUi, { passive: true });
  scrollUi();

  /* ---------------- demo notice ---------------- */
  var modal = $("#demoModal"), lastFocus = null;
  var savedY = 0;
  function lockScroll() {
    savedY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = -savedY + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
  }
  function unlockScroll() {
    document.body.style.position = document.body.style.top = document.body.style.left = document.body.style.right = "";
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, savedY);
    document.documentElement.style.scrollBehavior = "";
  }
  function openDemo() {
    if (!modal.hidden) return;
    lastFocus = document.activeElement;
    lockScroll();
    modal.hidden = false;
    try { $("#demoGo").focus({ preventScroll: true }); } catch (e) {}
  }
  function closeDemo() {
    if (modal.hidden) return;
    modal.hidden = true;
    unlockScroll();
    try { sessionStorage.setItem("demoSeen", "1"); } catch (e) {}
    if (lastFocus && lastFocus !== document.body && lastFocus.focus) {
      try { lastFocus.focus({ preventScroll: true }); } catch (e) {}
    }
  }
  $("#demoOpen").addEventListener("click", openDemo);
  $("#demoClose").addEventListener("click", closeDemo);
  $("#demoGo").addEventListener("click", closeDemo);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeDemo(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeDemo(); });
  var seen = false;
  try { seen = sessionStorage.getItem("demoSeen") === "1"; } catch (e) {}
  if (!seen) setTimeout(openDemo, 1400);

  $("#year").textContent = new Date().getFullYear();
})();
