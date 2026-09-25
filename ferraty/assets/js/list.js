/* Moje hory — logika stránky Výstupy (seznam/tabulka) */
(function () {
  "use strict";

  let allRecords = [];
  let sortKey = "date";
  let sortDir = "desc";

  const els = {};

  function populateSelect(select, values, formatter) {
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = formatter ? formatter(v) : v;
      select.appendChild(opt);
    });
  }

  function uniqueSorted(records, keyFn) {
    const set = new Set(records.map(keyFn).filter((v) => v !== null && v !== undefined && v !== ""));
    return Array.from(set).sort();
  }

  function uniqueSortedFlat(records, listFn) {
    const set = new Set();
    records.forEach((r) => (listFn(r) || []).forEach((v) => v && set.add(v)));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "cs"));
  }

  function currentFilters() {
    return {
      search: els.search.value.trim().toLowerCase(),
      country: els.country.value,
      year: els.year.value,
      type: els.type.value,
      companion: els.companion.value,
    };
  }

  function applyFilters(records, f) {
    return records.filter((r) => {
      if (f.country && r.country !== f.country) return false;
      if (f.year && String(Ferraty.yearOf(r.date)) !== f.year) return false;
      if (f.type && r.type !== f.type) return false;
      if (f.companion && !(r.companions || []).includes(f.companion)) return false;
      if (f.search) {
        const hay = [r.name, r.region, r.locality].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(f.search)) return false;
      }
      return true;
    });
  }

  function sortValue(r, key) {
    switch (key) {
      case "name":
        return (r.name || "").toLowerCase();
      case "country":
        return (r.country || "").toLowerCase();
      case "date":
        return r.date || "";
      case "elevationGain_m":
        return r.elevationGain_m === null || r.elevationGain_m === undefined ? -Infinity : r.elevationGain_m;
      case "altitude_m":
        return r.altitude_m === null || r.altitude_m === undefined ? -Infinity : r.altitude_m;
      default:
        return "";
    }
  }

  function applySort(records) {
    const sorted = records.slice().sort((a, b) => {
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    });
    if (sortDir === "desc") sorted.reverse();
    return sorted;
  }

  function updateSortArrows() {
    document.querySelectorAll("#ferraty-table [data-sort]").forEach((btn) => {
      const arrow = btn.querySelector(".sort-arrow");
      if (btn.dataset.sort === sortKey) {
        arrow.textContent = sortDir === "asc" ? "▲" : "▼";
      } else {
        arrow.textContent = "";
      }
    });
  }

  function renderRows(records) {
    if (!records.length) {
      els.tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Žádný výstup neodpovídá zvoleným filtrům.</td></tr>`;
      return;
    }
    els.tbody.innerHTML = records
      .map((r) => {
        const type = Ferraty.typeMeta(r.type);
        return `
        <tr>
          <td class="cell-title"><a class="row-link" href="detail.html?id=${encodeURIComponent(r.id)}">${Ferraty.escapeHtml(r.name)}</a></td>
          <td data-label="Typ"><span class="badge ${type.cls}">${type.label}</span></td>
          <td data-label="Země">${Ferraty.countryLabelHtml(r.country)}</td>
          <td class="muted-cell" data-label="Oblast">${Ferraty.escapeHtml(r.region || "—")}</td>
          <td data-label="Datum">${Ferraty.formatDate(r.date, { day: "numeric", month: "numeric", year: "numeric" })}</td>
          <td data-label="Převýšení">${Ferraty.fmtElevation(r.elevationGain_m)}</td>
          <td data-label="Výška">${Ferraty.fmtAltitude(r.altitude_m)}</td>
        </tr>`;
      })
      .join("");
  }

  function render() {
    const f = currentFilters();
    const filtered = applyFilters(allRecords, f);
    const sorted = applySort(filtered);
    renderRows(sorted);
    updateSortArrows();
    els.count.textContent = `Zobrazeno ${filtered.length} z ${allRecords.length}.`;
  }

  function resetFilters() {
    els.search.value = "";
    els.country.value = "";
    els.year.value = "";
    els.type.value = "";
    els.companion.value = "";
    render();
  }

  async function init() {
    els.search = document.getElementById("f-search");
    els.country = document.getElementById("f-country");
    els.year = document.getElementById("f-year");
    els.type = document.getElementById("f-type");
    els.companion = document.getElementById("f-companion");
    els.reset = document.getElementById("f-reset");
    els.count = document.getElementById("result-count");
    els.tbody = document.getElementById("ferraty-tbody");

    try {
      allRecords = await Ferraty.loadAll();
    } catch (err) {
      console.error(err);
      els.tbody.innerHTML = `<tr><td colspan="7" class="empty-state">Data se nepodařilo načíst. Stránku otevírej přes http(s) server, ne přímo ze souboru.</td></tr>`;
      return;
    }

    populateSelect(els.country, uniqueSorted(allRecords, (r) => r.country));
    populateSelect(
      els.year,
      uniqueSorted(allRecords, (r) => Ferraty.yearOf(r.date)).sort((a, b) => b - a),
      (v) => String(v)
    );
    populateSelect(els.companion, uniqueSortedFlat(allRecords, (r) => r.companions));

    [els.search, els.country, els.year, els.type, els.companion].forEach((el) => {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
    els.reset.addEventListener("click", resetFilters);

    document.querySelectorAll("#ferraty-table [data-sort]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.sort;
        if (sortKey === key) {
          sortDir = sortDir === "asc" ? "desc" : "asc";
        } else {
          sortKey = key;
          sortDir = key === "date" || key === "elevationGain_m" || key === "altitude_m" ? "desc" : "asc";
        }
        render();
      });
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
