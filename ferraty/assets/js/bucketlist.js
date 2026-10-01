/* Moje hory — logika stránky Bucket list (bucketlist.html) */
(function () {
  "use strict";

  const DATA_URL = "data/bucketlist.json";

  async function loadItems() {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Nepodařilo se načíst data/bucketlist.json (HTTP " + res.status + ")");
    }
    const json = await res.json();
    return json.items || [];
  }

  function renderCard(item) {
    const metaParts = [item.region, Ferraty.countryLabelHtml(item.country)].filter(Boolean);
    if (item.altitude_m) metaParts.push(Ferraty.fmtAltitude(item.altitude_m));
    const meta = metaParts.join(" · ");
    const inner = `
      <span class="region-tile__name">${Ferraty.escapeHtml(item.name)}</span>
      <span class="region-tile__desc">${meta}</span>
      ${item.note ? `<p class="bucketlist-note">${Ferraty.escapeHtml(item.note)}</p>` : ""}
    `;
    if (item.sourceUrl) {
      return `<a class="region-tile" href="${Ferraty.escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener">${inner}</a>`;
    }
    return `<div class="region-tile">${inner}</div>`;
  }

  function render(items) {
    const grid = document.getElementById("bucketlist-grid");
    const countEl = document.getElementById("bucketlist-count");
    if (!items.length) {
      grid.innerHTML = `<p class="empty-state">Zatím nic v bucket listu — přidej, kam by ses chtěl podívat.</p>`;
      countEl.textContent = "";
      return;
    }
    grid.innerHTML = items.map(renderCard).join("");
    countEl.textContent = `${items.length} ${items.length === 1 ? "nápad" : items.length < 5 ? "nápady" : "nápadů"} v bucket listu.`;
  }

  async function init() {
    const grid = document.getElementById("bucketlist-grid");
    try {
      const items = await loadItems();
      render(items);
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<p class="empty-state">Data se nepodařilo načíst. Stránku otevírej přes http(s) server, ne přímo ze souboru.</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
