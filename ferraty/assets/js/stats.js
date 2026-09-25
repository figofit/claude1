/* Moje hory — logika stránky Statistiky (statistiky.html) */
(function () {
  "use strict";

  function renderStatRow(stats) {
    const biggest = stats.biggestSingleDay;
    const biggestNote = biggest
      ? `${Ferraty.escapeHtml(biggest.record.name)}${biggest.day ? ` (den ${biggest.day.day})` : ""}`
      : null;
    const tiles = [
      { value: stats.total, label: "Výstupů celkem" },
      { value: stats.countriesCount, label: "Zemí" },
      {
        value: stats.highestAltitude ? Ferraty.fmtNumber(stats.highestAltitude.altitude_m) + " m" : "—",
        label: "Nejvyšší dosažený bod",
        note: stats.highestAltitude ? Ferraty.escapeHtml(stats.highestAltitude.name) : "zatím neznámo",
      },
      {
        value: biggest ? Ferraty.fmtNumber(biggest.gain) + " m" : "—",
        label: "Největší jednodenní převýšení",
        note: biggestNote || "zatím neznámo",
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
    const elevationLine = stats.elevationGainKnownCount
      ? `${Ferraty.fmtNumber(stats.totalElevationGain)} m <span class="text-faint">(součet ${stats.elevationGainKnownCount} z ${stats.total}, u zbylých převýšení neznámo)</span>`
      : `neznámo <span class="text-faint">(u žádného výstupu není vyplněné převýšení)</span>`;

    return `
      <div class="fact-list" style="grid-template-columns:1fr;padding:0;border:none;background:none;">
        ${fact("Celkové převýšení", elevationLine)}
        ${fact("Se zaznamenanou GPX trasou", `${stats.withGpx} z ${stats.total}`)}
        ${fact("S fotografiemi", `${stats.withPhotos} z ${stats.total}`)}
        ${fact("Sopek", stats.volcanoCount)}
        ${fact("Míst, kde byl ledovec", stats.glacierCount)}
        ${fact("Neúspěšných pokusů", stats.attemptCount)}
      </div>
    `;
  }

  function renderElevationBands(stats) {
    const tiles = [
      { value: stats.above2500Count, label: "Nad 2500 m" },
      { value: stats.above3000Count, label: "Nad 3000 m" },
      { value: stats.above4000Count, label: "Nad 4000 m" },
    ];
    return `<div class="stat-row">${tiles
      .map(
        (t) => `
      <div class="stat-tile">
        <div class="stat-tile__value">${t.value}</div>
        <div class="stat-tile__label">${t.label}</div>
      </div>`
      )
      .join("")}</div>`;
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

  function renderCountryHighpoints(records) {
    const highpoints = records
      .filter((r) => r.highestOfCountry)
      .sort((a, b) => (a.country || "").localeCompare(b.country || "", "cs"));
    if (!highpoints.length) {
      return `<p class="text-faint">Zatím žádný záznam označený jako nejvyšší bod státu.</p>`;
    }
    const cards = highpoints
      .map((r) => {
        const flag = Ferraty.countryFlag(r.country) || "🏳";
        return `
        <a class="region-tile" href="detail.html?id=${encodeURIComponent(r.id)}">
          <span class="region-tile__name">${flag} ${Ferraty.escapeHtml(r.country || "—")}</span>
          <span class="region-tile__desc">${Ferraty.escapeHtml(r.name)} — ${Ferraty.fmtAltitude(r.altitude_m)}</span>
        </a>`;
      })
      .join("");
    return `
      <p class="text-muted"><strong>${highpoints.length}</strong> ${highpoints.length === 1 ? "nejvyšší bod státu" : "nejvyšších bodů států"}.</p>
      <div class="region-tiles">${cards}</div>
    `;
  }

  function renderAreaHighpoints(records) {
    const entries = [];
    records.forEach((r) => {
      (r.highestOfAreas || []).forEach((area) => entries.push({ area, r }));
    });
    entries.sort((a, b) => a.area.localeCompare(b.area, "cs"));
    if (!entries.length) {
      return `<p class="text-faint">Zatím žádný záznam označený jako nejvyšší bod pohoří, poloostrova nebo jiné oblasti.</p>`;
    }
    const cards = entries
      .map(
        ({ area, r }) => `
        <a class="region-tile" href="detail.html?id=${encodeURIComponent(r.id)}">
          <span class="region-tile__name">⛰ ${Ferraty.escapeHtml(area)}</span>
          <span class="region-tile__desc">${Ferraty.escapeHtml(r.name)} — ${Ferraty.fmtAltitude(r.altitude_m)}</span>
        </a>`
      )
      .join("");
    return `
      <p class="text-muted"><strong>${entries.length}</strong> ${entries.length === 1 ? "nejvyšší bod oblasti" : "nejvyšších bodů oblastí"}.</p>
      <div class="region-tiles">${cards}</div>
    `;
  }

  function renderHuts(records) {
    const entries = [];
    records.forEach((r) => {
      const huts = new Set((r.days || []).map((d) => d.overnightAt).filter(Boolean));
      huts.forEach((hut) => entries.push({ hut, r }));
    });
    entries.sort((a, b) => a.hut.localeCompare(b.hut, "cs"));
    if (!entries.length) {
      return `<p class="text-faint">Zatím žádný záznam s vyplněným nocleháním v itineráři (pole "days").</p>`;
    }
    const rows = entries
      .map(
        ({ hut, r }) => `
        <a class="region-tile" href="detail.html?id=${encodeURIComponent(r.id)}">
          <span class="region-tile__name">🏠 ${Ferraty.escapeHtml(hut)}</span>
          <span class="region-tile__desc">${Ferraty.escapeHtml(r.name)} · ${Ferraty.formatDate(r.date)}</span>
        </a>`
      )
      .join("");
    return `
      <p class="text-muted"><strong>${entries.length}</strong> ${entries.length === 1 ? "nocleh na chatě/rifugiu" : "noclehů na chatách/rifugiích"}.</p>
      <div class="region-tiles">${rows}</div>
    `;
  }

  function renderToughDays(records) {
    const entries = records.filter((r) => r.toughDay);
    if (!entries.length) {
      return `<p class="text-faint">Zatím žádný záznam označený jako nejnáročnější výkon.</p>`;
    }
    entries.sort((a, b) => {
      const ga = a.elevationGain_m === null || a.elevationGain_m === undefined ? -Infinity : a.elevationGain_m;
      const gb = b.elevationGain_m === null || b.elevationGain_m === undefined ? -Infinity : b.elevationGain_m;
      return gb - ga;
    });
    const cards = entries
      .map((r) => {
        const gainLabel = r.elevationGain_m === null || r.elevationGain_m === undefined ? "převýšení neuvedeno" : Ferraty.fmtElevation(r.elevationGain_m);
        return `
        <a class="region-tile" href="detail.html?id=${encodeURIComponent(r.id)}">
          <span class="region-tile__name">🔥 ${Ferraty.escapeHtml(r.name)}</span>
          <span class="region-tile__desc">${gainLabel} · ${Ferraty.formatDate(r.date)}</span>
        </a>`;
      })
      .join("");
    return `<div class="region-tiles">${cards}</div>`;
  }

  function renderMilestones(records) {
    const entries = [];
    records.forEach((r) => {
      (r.milestones || []).forEach((milestone) => entries.push({ milestone, r }));
    });
    entries.sort((a, b) => {
      if (!a.r.date) return 1;
      if (!b.r.date) return -1;
      return a.r.date.localeCompare(b.r.date);
    });
    if (!entries.length) {
      return `<p class="text-faint">Zatím žádný záznam označený jako osobní milník.</p>`;
    }
    const rows = entries
      .map(
        ({ milestone, r }) => `
        <a class="region-tile" href="detail.html?id=${encodeURIComponent(r.id)}">
          <span class="region-tile__name">🥇 ${Ferraty.escapeHtml(milestone)}</span>
          <span class="region-tile__desc">${Ferraty.escapeHtml(r.name)} — ${Ferraty.fmtAltitude(r.altitude_m)} · ${Ferraty.formatDate(r.date)}</span>
        </a>`
      )
      .join("");
    return `<div class="region-tiles">${rows}</div>`;
  }

  function fact(label, value) {
    return `<div class="fact"><div class="fact__label">${label}</div><div class="fact__value">${value}</div></div>`;
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
    const byYearSorted = stats.byYear.slice().sort((a, b) => {
      if (a.key === null) return 1;
      if (b.key === null) return -1;
      return b.key - a.key;
    });
    document.getElementById("by-year").innerHTML = renderBreakdown(byYearSorted, (k) => String(k));
    document.getElementById("misc-stats").innerHTML = renderMisc(stats);
    document.getElementById("elevation-bands").innerHTML = renderElevationBands(stats);
    document.getElementById("altitude-ranking").innerHTML = renderAltitudeRanking(records);
    document.getElementById("country-highpoints").innerHTML = renderCountryHighpoints(records);
    document.getElementById("area-highpoints").innerHTML = renderAreaHighpoints(records);
    document.getElementById("milestones").innerHTML = renderMilestones(records);
    document.getElementById("tough-days").innerHTML = renderToughDays(records);
    document.getElementById("huts").innerHTML = renderHuts(records);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
