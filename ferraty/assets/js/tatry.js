/* Moje hory — logika stránky Tatry (tatry.html) */
(function () {
  "use strict";

  function renderStatRow(stats) {
    const tiles = [
      { value: stats.total, label: "Výstupů v Tatrách" },
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

  function renderTable(records) {
    if (!records.length) {
      return `<p class="empty-state">Zatím žádný výstup s regionem „Tatry" v datech.</p>`;
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
          <td data-label="Obtížnost"><span class="badge badge--difficulty">${Ferraty.escapeHtml(Ferraty.formatDifficulty(r.difficulty))}</span></td>
          <td data-label="Výška">${Ferraty.fmtAltitude(r.altitude_m)}</td>
        </tr>`;
      })
      .join("");
    return `
      <div class="table-scroll">
        <table class="ferraty-table">
          <thead><tr><th>Název</th><th>Typ</th><th>Země</th><th>Datum</th><th>Obtížnost</th><th>Výška</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  async function init() {
    try {
      const all = await Ferraty.loadAll();
      const records = all.filter((r) => r.regionGroup === "Tatry");
      const stats = Ferraty.computeStats(records);
      document.getElementById("stat-row").innerHTML = renderStatRow(stats);
      document.getElementById("tatry-table").innerHTML = renderTable(records);
    } catch (err) {
      console.error(err);
      document.getElementById("stat-row").innerHTML = "";
      document.getElementById("tatry-table").innerHTML =
        `<p class="empty-state">Data se nepodařilo načíst. Stránku musíš otevřít přes http(s) server (ne přímo jako soubor).</p>`;
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
