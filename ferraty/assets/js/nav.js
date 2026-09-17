/*
 * Moje hory — společná hlavička a patička.
 * Každá stránka má <body data-page="..."> a prázdné <div id="app-header">/<div id="app-footer">.
 * Menu se tak upravuje jen na jednom místě.
 */
(function () {
  "use strict";

  const NAV_ITEMS = [
    { page: "prehled", href: "index.html", label: "Přehled" },
    { page: "ferraty", href: "ferraty.html", label: "Výstupy" },
    { page: "mapa", href: "mapa.html", label: "Mapa" },
    { page: "statistiky", href: "statistiky.html", label: "Statistiky" },
    { page: "tatry", href: "tatry.html", label: "Tatry" },
    { page: "pridat", href: "pridat.html", label: "Přidat výstup" },
  ];

  function renderHeader(current) {
    const links = NAV_ITEMS.map((item) => {
      const current_ = item.page === current ? ' aria-current="page"' : "";
      return `<a href="${item.href}"${current_}>${item.label}</a>`;
    }).join("");

    return `
      <div class="site-header__inner">
        <a class="brand" href="index.html">
          <span class="brand__mark" aria-hidden="true">⛰</span>
          <span>Moje hory</span>
        </a>
        <button class="nav-toggle" type="button" aria-label="Otevřít menu" aria-expanded="false">☰</button>
        <nav class="nav">${links}</nav>
      </div>
    `;
  }

  function renderFooter() {
    const year = new Date().getFullYear();
    return `
      <div class="container">
        <p>Moje hory — osobní evidence absolvovaných ferrat, vrcholů a hřebenovek. Data v <code>data/ferraty.json</code>, žádná databáze ani backend.</p>
        <p>&copy; ${year}</p>
      </div>
    `;
  }

  function init() {
    const current = document.body.getAttribute("data-page") || "";
    const headerEl = document.getElementById("app-header");
    const footerEl = document.getElementById("app-footer");
    if (headerEl) {
      headerEl.innerHTML = renderHeader(current);
      const toggle = headerEl.querySelector(".nav-toggle");
      const nav = headerEl.querySelector(".nav");
      if (toggle && nav) {
        toggle.addEventListener("click", () => {
          const open = nav.classList.toggle("is-open");
          toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });
      }
    }
    if (footerEl) footerEl.innerHTML = renderFooter();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
