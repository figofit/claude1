/* Moje hory — logika stránky Přehled (index.html) */
(function () {
  "use strict";

  function renderStatRow(stats) {
    const hardestLabel = stats.hardest
      ? Ferraty.formatDifficulty(stats.hardest.difficulty)
      : "—";
    const tiles = [
      { value: stats.total, label: "Výstupů celkem" },
      { value: stats.countriesCount, label: "Zemí navštíveno" },
      { value: hardestLabel, label: "Nejtěžší podle obtížnosti", note: stats.hardest ? Ferraty.escapeHtml(stats.hardest.name) : "zatím žádný" },
    ];
    return tiles
      .map(
        (t) => `
      <div class="stat-tile">
        <div class="stat-tile__value">${t.value === null || t.value === undefined ? "—" : t.value}</div>
        <div class="stat-tile__label">${t.label}</div>
        ${t.note ? `<div class="stat-tile__note">${t.note}</div>` : ""}
      </div>`
      )
      .join("");
  }

  function renderLatest(records) {
    const withDate = records.filter((r) => r.date).sort((a, b) => (a.date < b.date ? 1 : -1));
    const latest = withDate.slice(0, 5);
    if (!latest.length) {
      return `<p class="empty-state">Zatím žádné záznamy s vyplněným datem.</p>`;
    }
    const rows = latest
      .map((r) => {
        return `
        <tr>
          <td class="cell-title"><a class="row-link" href="detail.html?id=${encodeURIComponent(r.id)}">${Ferraty.escapeHtml(r.name)}</a></td>
          <td class="muted-cell" data-label="Země">${Ferraty.countryLabelHtml(r.country)}</td>
          <td data-label="Datum">${Ferraty.formatDate(r.date)}</td>
        </tr>`;
      })
      .join("");
    return `
      <div class="table-scroll">
        <table class="ferraty-table">
          <thead><tr><th>Název</th><th>Země</th><th>Datum</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderFeatured(records) {
    const featured = records.filter((r) => r.featured);
    const sectionEl = document.getElementById("featured-section");
    if (!featured.length) {
      sectionEl.hidden = true;
      return;
    }
    const rows = featured
      .map((r) => {
        const type = Ferraty.typeMeta(r.type);
        return `
        <tr>
          <td class="cell-title"><a class="row-link" href="detail.html?id=${encodeURIComponent(r.id)}">${Ferraty.escapeHtml(r.name)}</a></td>
          <td data-label="Typ"><span class="badge ${type.cls}">${type.label}</span></td>
          <td class="muted-cell" data-label="Země">${Ferraty.countryLabelHtml(r.country)}</td>
          <td data-label="Datum">${Ferraty.formatDate(r.date)}</td>
        </tr>`;
      })
      .join("");
    document.getElementById("featured-list").innerHTML = `
      <div class="table-scroll">
        <table class="ferraty-table">
          <thead><tr><th>Název</th><th>Typ</th><th>Země</th><th>Datum</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    sectionEl.hidden = false;
  }

  async function init() {
    try {
      const records = await Ferraty.loadAll();
      const stats = Ferraty.computeStats(records);
      document.getElementById("stat-row").innerHTML = renderStatRow(stats);
      renderFeatured(records);
      document.getElementById("latest-list").innerHTML = renderLatest(records);
    } catch (err) {
      console.error(err);
      document.getElementById("stat-row").innerHTML = "";
      document.getElementById("latest-list").innerHTML =
        `<p class="empty-state">Data se nepodařilo načíst. Stránku musíš otevřít přes http(s) server (ne přímo jako soubor) — viz README.md.</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
