/* Moje ferraty — logika stránky Ferraty (seznam/tabulka) */
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

  function currentFilters() {
    return {
      search: els.search.value.trim().toLowerCase(),
      country: els.country.value,
      difficulty: els.difficulty.value,
      year: els.year.value,
    };
  }

  function applyFilters(records, f) {
    return records.filter((r) => {
      if (f.country && r.country !== f.country) return false;
      if (f.difficulty && (!r.difficulty || r.difficulty.grade !== f.difficulty)) return false;
      if (f.year && String(Ferraty.yearOf(r.date)) !== f.year) return false;
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
      case "difficulty":
        return Ferraty.difficultyRank(r.difficulty);
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
      els.tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Žádná ferrata neodpovídá zvoleným filtrům.</td></tr>`;
      return;
    }
    els.tbody.innerHTML = records
      .map((r) => {
        const overall = Ferraty.ratingValue(r.myRating, "overall");
        return `
        <tr>
          <td class="cell-title"><a class="row-link" href="detail.html?id=${encodeURIComponent(r.id)}">${Ferraty.escapeHtml(r.name)}</a></td>
          <td data-label="Země">${Ferraty.escapeHtml(r.country || "—")}</td>
          <td class="muted-cell" data-label="Oblast">${Ferraty.escapeHtml(r.region || "—")}</td>
          <td data-label="Datum">${Ferraty.formatDate(r.date, { day: "numeric", month: "numeric", year: "numeric" })}</td>
          <td data-label="Obtížnost"><span class="badge badge--difficulty">${Ferraty.escapeHtml(Ferraty.formatDifficulty(r.difficulty))}</span></td>
          <td data-label="Hodnocení">${Ferraty.ratingStarsHtml(overall)}</td>
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
    els.count.textContent = `Zobrazeno ${filtered.length} z ${allRecords.length} ferrat.`;
  }

  function resetFilters() {
    els.search.value = "";
    els.country.value = "";
    els.difficulty.value = "";
    els.year.value = "";
    render();
  }

  async function init() {
    els.search = document.getElementById("f-search");
    els.country = document.getElementById("f-country");
    els.difficulty = document.getElementById("f-difficulty");
    els.year = document.getElementById("f-year");
    els.reset = document.getElementById("f-reset");
    els.count = document.getElementById("result-count");
    els.tbody = document.getElementById("ferraty-tbody");

    try {
      allRecords = await Ferraty.loadAll();
    } catch (err) {
      console.error(err);
      els.tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Data se nepodařilo načíst. Stránku otevírej přes http(s) server, ne přímo ze souboru.</td></tr>`;
      return;
    }

    populateSelect(els.country, uniqueSorted(allRecords, (r) => r.country));
    populateSelect(
      els.difficulty,
      uniqueSorted(allRecords, (r) => r.difficulty && r.difficulty.grade)
    );
    populateSelect(
      els.year,
      uniqueSorted(allRecords, (r) => Ferraty.yearOf(r.date)).sort((a, b) => b - a),
      (v) => String(v)
    );

    [els.search, els.country, els.difficulty, els.year].forEach((el) => {
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
          sortDir = key === "date" ? "desc" : "asc";
        }
        render();
      });
    });

    render();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
