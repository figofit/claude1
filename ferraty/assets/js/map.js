/* Moje hory — logika stránky Mapa (mapa.html) */
(function () {
  "use strict";

  const TYPE_COLOR = {
    ferrata: "#33513c",
    vrchol: "#af5330",
    "hřebenovka": "#83806d",
  };

  function makeIcon(type) {
    const color = TYPE_COLOR[type] || "#83806d";
    return L.divIcon({
      className: "",
      html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,0.25);"></span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -8],
    });
  }

  function popupHtml(r) {
    const overall = Ferraty.ratingValue(r.myRating, "overall");
    const type = Ferraty.typeMeta(r.type);
    return `
      <div class="map-popup">
        <h4>${Ferraty.escapeHtml(r.name)}</h4>
        <div class="flex-wrap-gap" style="margin-bottom:6px;">
          <span class="badge ${type.cls}">${type.label}</span>
          <span class="badge badge--difficulty">${Ferraty.escapeHtml(Ferraty.formatDifficulty(r.difficulty))}</span>
        </div>
        <div class="text-muted" style="font-size:0.85rem;">
          ${Ferraty.countryLabelHtml(r.country)} · ${Ferraty.formatDate(r.date, { day: "numeric", month: "numeric", year: "numeric" })}
        </div>
        <div style="margin:6px 0;">${Ferraty.ratingStarsHtml(overall)}</div>
        <a class="btn btn--outline btn--sm" href="detail.html?id=${encodeURIComponent(r.id)}">Otevřít detail</a>
      </div>
    `;
  }

  async function init() {
    const map = L.map("map-full");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap přispěvatelé",
      maxZoom: 18,
    }).addTo(map);

    let records = [];
    try {
      records = await Ferraty.loadAll();
    } catch (err) {
      console.error(err);
      document.getElementById("map-note").textContent =
        "Data se nepodařilo načíst. Stránku otevírej přes http(s) server, ne přímo ze souboru.";
      map.setView([46.8, 10.5], 5);
      return;
    }

    const withCoords = records.filter((r) => r.coordinates && typeof r.coordinates.lat === "number" && typeof r.coordinates.lng === "number");
    const markers = [];

    withCoords.forEach((r) => {
      const marker = L.marker([r.coordinates.lat, r.coordinates.lng], { icon: makeIcon(r.type) })
        .bindPopup(popupHtml(r));
      marker.addTo(map);
      markers.push(marker);
    });

    if (markers.length) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.25));
    } else {
      map.setView([46.8, 10.5], 5);
    }

    const missing = records.length - withCoords.length;
    document.getElementById("map-note").textContent = missing
      ? `${missing} ${missing === 1 ? "záznam nemá" : "záznamů nemá"} vyplněné GPS souřadnice, takže na mapě chybí.`
      : "";
  }

  document.addEventListener("DOMContentLoaded", init);
})();
