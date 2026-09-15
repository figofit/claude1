/* Moje hory — logika stránky Detail výstupu (detail.html) */
(function () {
  "use strict";

  const RATING_LABELS = {
    technical: "Technická obtížnost",
    physical: "Fyzická náročnost",
    exposure: "Expozice",
    views: "Výhledy",
    overall: "Celkové hodnocení",
  };

  function fact(label, value, muted) {
    return `
      <div class="fact">
        <div class="fact__label">${label}</div>
        <div class="fact__value${muted ? " fact__value--muted" : ""}">${value}</div>
      </div>`;
  }

  function renderFacts(r) {
    return [
      fact("Datum", Ferraty.formatDate(r.date), !r.date),
      fact("Obtížnost", Ferraty.formatDifficulty(r.difficulty), !r.difficulty),
      fact("Délka", Ferraty.fmtLength(r.length_m), r.length_m === null),
      fact("Převýšení", Ferraty.fmtElevation(r.elevationGain_m), r.elevationGain_m === null),
      fact("Nejvyšší bod / cíl", r.summit || "—", !r.summit),
      fact("Nadmořská výška", Ferraty.fmtAltitude(r.altitude_m), r.altitude_m === null),
      fact("Čas", Ferraty.fmtDuration(r.duration_min), r.duration_min === null),
    ].join("");
  }

  function renderRatings(r) {
    const rating = r.myRating || {};
    return Object.keys(RATING_LABELS)
      .map((key) => {
        const value = Ferraty.ratingValue(rating, key);
        return `
        <div class="rating-item">
          <div class="rating-item__label">${RATING_LABELS[key]}</div>
          <div class="rating-item__value">${Ferraty.ratingStarsHtml(value)}</div>
        </div>`;
      })
      .join("");
  }

  function renderGallery(r, sectionEl, containerEl) {
    if (!r.photos || !r.photos.length) {
      sectionEl.hidden = false;
      containerEl.innerHTML = `<p class="text-faint">Zatím žádné fotografie u tohoto záznamu.</p>`;
      return;
    }
    containerEl.innerHTML = `<div class="gallery">${r.photos
      .map((p) => `<img src="${Ferraty.escapeHtml(p)}" alt="${Ferraty.escapeHtml(r.name)}" loading="lazy">`)
      .join("")}</div>`;
  }

  async function renderRelated(r, sectionEl, containerEl) {
    if (!r.relatedIds || !r.relatedIds.length) return;
    const all = await Ferraty.loadAll();
    const related = r.relatedIds
      .map((id) => all.find((x) => x.id === id))
      .filter(Boolean);
    if (!related.length) return;
    containerEl.innerHTML = related
      .map((rel) => {
        const type = Ferraty.typeMeta(rel.type);
        return `<a class="btn btn--outline btn--sm" href="detail.html?id=${encodeURIComponent(rel.id)}">${type.label}: ${Ferraty.escapeHtml(rel.name)}</a>`;
      })
      .join("");
    sectionEl.hidden = false;
  }

  function renderLinks(r) {
    const links = [];
    if (r.track && r.track.file) {
      links.push(`<a class="btn btn--outline btn--sm" href="${Ferraty.escapeHtml(r.track.file)}" download>⬇ Stáhnout trasu (${(r.track.format || "gpx").toUpperCase()})</a>`);
    }
    if (r.sourceUrl) {
      links.push(`<a class="btn btn--outline btn--sm source-link" href="${Ferraty.escapeHtml(r.sourceUrl)}" target="_blank" rel="noopener">↗ Zdroj / oficiální popis</a>`);
    }
    return links.length ? links.join("") : `<p class="text-faint">Žádné doplňkové odkazy.</p>`;
  }

  async function loadGpxPoints(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error("GPX se nepodařilo načíst");
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, "application/xml");
    if (xml.querySelector("parsererror")) throw new Error("GPX je poškozené");
    return Array.from(xml.getElementsByTagName("trkpt")).map((pt) => [
      parseFloat(pt.getAttribute("lat")),
      parseFloat(pt.getAttribute("lon")),
    ]);
  }

  async function renderMiniMap(r) {
    const hasCoords = r.coordinates && typeof r.coordinates.lat === "number" && typeof r.coordinates.lng === "number";
    const noteEl = document.getElementById("d-map-note");

    if (!hasCoords) {
      document.getElementById("map-mini").parentElement.style.display = "none";
      noteEl.textContent = "Souřadnice nejsou u tohoto záznamu vyplněné.";
      return;
    }

    const map = L.map("map-mini", { zoomControl: false, attributionControl: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18 }).addTo(map);
    const marker = L.marker([r.coordinates.lat, r.coordinates.lng]).addTo(map);
    let bounds = L.latLngBounds([[r.coordinates.lat, r.coordinates.lng]]);

    if (r.track && r.track.file && r.track.format === "gpx") {
      try {
        const points = await loadGpxPoints(r.track.file);
        if (points.length) {
          const line = L.polyline(points, { color: "#af5330", weight: 4 }).addTo(map);
          bounds = line.getBounds().extend(bounds);
          noteEl.textContent = "";
        }
      } catch (err) {
        console.error(err);
        noteEl.textContent = "GPX trasu se nepodařilo zobrazit.";
      }
    } else if (r.track && r.track.file) {
      noteEl.textContent = `Trasa je uložena jako ${r.track.format.toUpperCase()} — náhled na mapě zatím podporujeme jen pro GPX, soubor lze stáhnout níže.`;
    } else {
      noteEl.textContent = "K záznamu není přiložená GPX trasa.";
    }

    map.fitBounds(bounds.pad(0.3));
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) map.setZoom(13);
  }

  async function init() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const loadingEl = document.getElementById("loading-state");
    const contentEl = document.getElementById("detail-content");

    if (!id) {
      loadingEl.textContent = "Chybí ID záznamu v adrese.";
      return;
    }

    let record;
    try {
      record = await Ferraty.byId(id);
    } catch (err) {
      console.error(err);
      loadingEl.textContent = "Data se nepodařilo načíst. Stránku otevírej přes http(s) server, ne přímo ze souboru.";
      return;
    }

    if (!record) {
      loadingEl.textContent = "Záznam s tímto ID nebyl nalezen.";
      return;
    }

    document.title = `${record.name} | Moje hory`;
    document.getElementById("crumb-name").textContent = record.name;

    document.getElementById("d-name").textContent = record.name;
    const type = Ferraty.typeMeta(record.type);
    const typeBadge = document.getElementById("d-type");
    typeBadge.textContent = type.label;
    typeBadge.className = `badge ${type.cls}`;
    document.getElementById("d-difficulty").textContent = Ferraty.formatDifficulty(record.difficulty);

    const subParts = [record.locality, record.region].filter(Boolean).map((p) => Ferraty.escapeHtml(p));
    if (record.country) subParts.push(Ferraty.countryLabelHtml(record.country));
    document.getElementById("d-sub").innerHTML = subParts.length ? subParts.join(" · ") : "Lokalita neuvedena";

    document.getElementById("d-facts").innerHTML = renderFacts(record);
    document.getElementById("d-ratings").innerHTML = renderRatings(record);

    const noteEl = document.getElementById("d-note");
    noteEl.innerHTML = record.note
      ? `<div class="journal-note">${Ferraty.escapeHtml(record.note)}</div>`
      : `<p class="text-faint">Bez poznámky.</p>`;

    renderGallery(record, document.getElementById("gallery-section"), document.getElementById("d-gallery"));
    document.getElementById("d-links").innerHTML = renderLinks(record);
    renderRelated(record, document.getElementById("related-section"), document.getElementById("d-related"));

    loadingEl.hidden = true;
    contentEl.hidden = false;

    renderMiniMap(record);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
