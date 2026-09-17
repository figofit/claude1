/* Moje hory — logika stránky Statistiky (statistiky.html) */
(function () {
  "use strict";

  function renderStatRow(stats) {
    const avgLabel = stats.avgOverall !== null ? stats.avgOverall.toFixed(1) : "—";
    const tiles = [
      { value: stats.total, label: "Výstupů celkem" },
      { value: stats.countriesCount, label: "Zemí" },
      {
        value: stats.highestAltitude ? Ferraty.fmtNumber(stats.highestAltitude.altitude_m) + " m" : "—",
        label: "Nejvyšší dosažený bod",
        note: stats.highestAltitude ? Ferraty.escapeHtml(stats.highestAltitude.name) : "zatím neznámo",
      },
      {
        value: avgLabel,
        label: "Průměrné hodnocení",
        note: stats.ratedOverallCount ? `z ${stats.ratedOverallCount} hodnocených` : "zatím žádné hodnocení",
      },
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

  function renderBreakdown(entries, formatKey, opts) {
    opts = opts || {};
    if (!entries.length) return `<p class="text-faint">Zatím žádná data.</p>`;
    const max = Math.max(...entries.map((e) => e.count));
    return `<div class="breakdown-list">${entries
      .map((e) => {
        const label = e.key === null || e.key === undefined ? "Neuvedeno" : formatKey(e.key);
        const pct = max ? Math.round((e.count / max) * 100) : 0;
        return `
        <div class="breakdown-row">
          <div class="breakdown-row__label">${Ferraty.escapeHtml(label)}</div>
          <div class="breakdown-row__bar-bg"><div class="breakdown-row__bar" style="width:${pct}%"></div></div>
          <div class="breakdown-row__count">${e.count}</div>
        </div>`;
      })
      .join("")}</div>`;
  }

  function renderMisc(stats) {
    const hardestLine = stats.hardest
      ? `<a href="detail.html?id=${encodeURIComponent(stats.hardest.id)}">${Ferraty.escapeHtml(stats.hardest.name)}</a> — ${Ferraty.escapeHtml(Ferraty.formatDifficulty(stats.hardest.difficulty))}`
      : "zatím žádný výstup se známou obtížností";

    const elevationLine = stats.elevationGainKnownCount
      ? `${Ferraty.fmtNumber(stats.totalElevationGain)} m <span class="text-faint">(součet ${stats.elevationGainKnownCount} z ${stats.total}, u zbylých převýšení neznámo)</span>`
      : `neznámo <span class="text-faint">(u žádného výstupu není vyplněné převýšení)</span>`;

    return `
      <div class="fact-list" style="grid-template-columns:1fr;padding:0;border:none;background:none;">
        ${fact("Nejtěžší ferrata", hardestLine)}
        ${fact("Celkové převýšení", elevationLine)}
        ${fact("Se zaznamenanou GPX trasou", `${stats.withGpx} z ${stats.total}`)}
        ${fact("S fotografiemi", `${stats.withPhotos} z ${stats.total}`)}
      </div>
    `;
  }

  function renderAltitudeRanking(records) {
    const ranked = records
      .filter((r) => typeof r.altitude_m === "number")
      .sort((a, b) => b.altitude_m - a.altitude_m);
    if (!ranked.length) return `<p class="text-faint">Zatím žádný záznam s vyplněnou nadmořskou výškou.</p>`;
    const rows = ranked
      .map(
        (r, i) => `
        <tr>
          <td>${i + 1}.</td>
          <td class="cell-title"><a class="row-link" href="detail.html?id=${encodeURIComponent(r.id)}">${Ferraty.escapeHtml(r.name)}</a></td>
          <td data-label="Země">${Ferraty.countryLabelHtml(r.country)}</td>
          <td data-label="Nadmořská výška">${Ferraty.fmtAltitude(r.altitude_m)}</td>
        </tr>`
      )
      .join("");
    return `
      <div class="table-scroll">
        <table class="ferraty-table">
          <thead><tr><th>#</th><th>Název</th><th>Země</th><th>Nadmořská výška</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function fact(label, value) {
    return `<div class="fact"><div class="fact__label">${label}</div><div class="fact__value">${value}</div></div>`;
  }

  function sortByDifficultyRank(entries) {
    return entries
      .slice()
      .sort((a, b) => {
        const ra = a.key === null ? Infinity : Ferraty.difficultyRank({ grade: a.key });
        const rb = b.key === null ? Infinity : Ferraty.difficultyRank({ grade: b.key });
        return ra - rb;
      });
  }

  async function init() {
    let records;
    try {
      records = await Ferraty.loadAll();
    } catch (err) {
      console.error(err);
      document.getElementById("stat-row").innerHTML =
        `<p class="empty-state">Data se nepodařilo načíst. Stránku otevírej přes http(s) server, ne přímo ze souboru.</p>`;
      return;
    }

    const stats = Ferraty.computeStats(records);

    document.getElementById("stat-row").innerHTML = renderStatRow(stats);
    document.getElementById("by-type").innerHTML = renderBreakdown(stats.byType, (k) => Ferraty.typeMeta(k).label);
    document.getElementById("by-country").innerHTML = renderBreakdown(stats.byCountry, (k) => {
      const flag = Ferraty.countryFlag(k);
      return flag ? `${flag} ${k}` : k;
    });
    document.getElementById("by-difficulty").innerHTML = renderBreakdown(sortByDifficultyRank(stats.byDifficulty), (k) => k);
    const byYearSorted = stats.byYear.slice().sort((a, b) => {
      if (a.key === null) return 1;
      if (b.key === null) return -1;
      return b.key - a.key;
    });
    document.getElementById("by-year").innerHTML = renderBreakdown(byYearSorted, (k) => String(k));
    document.getElementById("misc-stats").innerHTML = renderMisc(stats);
    document.getElementById("altitude-ranking").innerHTML = renderAltitudeRanking(records);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
