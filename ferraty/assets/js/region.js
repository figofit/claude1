/*
 * Moje hory — sdílená logika pro regionální podstránky (tatry.html, beskydy.html, ...).
 * Každá regionální stránka jen zavolá Ferraty.Region.init(config) se svým regionGroup a nadpisy.
 */
(function () {
  "use strict";

  function renderStatRow(stats, countLabel) {
    const tiles = [
      { value: stats.total, label: countLabel },
      {
        value: stats.highestAltitude ? Ferraty.fmtNumber(stats.highestAltitude.altitude_m) + " m" : "—",
        label: "Nejvyšší dosažený bod",
        note: stats.highestAltitude ? Ferraty.escapeHtml(stats.highestAltitude.name) : "zatím neznámo",
      },
      { value: stats.byType.length, label: "Různých typů výstupů" },
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

  function renderTable(records, emptyMessage) {
    if (!records.length) {
      return `<p class="empty-state">${emptyMessage}</p>`;
    }
    const sorted = records.slice().sort((a, b) => (a.date || "") < (b.date || "") ? 1 : -1);
    const rows = sorted
      .map((r) => {
        const type = Ferraty.typeMeta(r.type);
        return `
        <tr>
          <td class="cell-title"><a class="row-link" href="detail.html?id=${encodeURIComponent(r.id)}">${Ferraty.escapeHtml(r.name)}</a></td>
          <td data-label="Typ"><span class="badge ${type.cls}">${type.label}</span></td>
          <td data-label="Země">${Ferraty.countryLabelHtml(r.country)}</td>
          <td data-label="Datum">${Ferraty.formatDate(r.date, { day: "numeric", month: "numeric", year: "numeric" })}</td>
          <td data-label="Výška">${Ferraty.fmtAltitude(r.altitude_m)}</td>
        </tr>`;
      })
      .join("");
    return `
      <div class="table-scroll">
        <table class="ferraty-table">
          <thead><tr><th>Název</th><th>Typ</th><th>Země</th><th>Datum</th><th>Výška</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // config: { regionGroup, countLabel, emptyMessage }
  async function init(config) {
    try {
      const all = await Ferraty.loadAll();
      const records = all.filter((r) => r.regionGroup === config.regionGroup);
      const stats = Ferraty.computeStats(records);
      document.getElementById("stat-row").innerHTML = renderStatRow(stats, config.countLabel);
      document.getElementById("region-table").innerHTML = renderTable(records, config.emptyMessage);
    } catch (err) {
      console.error(err);
      document.getElementById("stat-row").innerHTML = "";
      document.getElementById("region-table").innerHTML =
        `<p class="empty-state">Data se nepodařilo načíst. Stránku musíš otevřít přes http(s) server (ne přímo jako soubor).</p>`;
    }
  }

  window.Ferraty = window.Ferraty || {};
  window.Ferraty.Region = { init };
})();
