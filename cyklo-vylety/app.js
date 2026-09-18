const STORAGE_KEY = "cyklo-vylety:trips:v4";

const SAMPLE_TRIPS = [
  {
    id: "trip-2020-kralovstvi",
    title: "Slavonín – Grygov – Les Království",
    date: "2020-06-14",
    startPlace: "Olomouc-Slavonín",
    viaPlace: "Grygov",
    endPlace: "Les Království u Grygova",
    startLat: 49.56897,
    startLng: 17.2354,
    viaLat: 49.538,
    viaLng: 17.3086,
    endLat: 49.51767,
    endLng: 17.3126,
    waypoints: [
      { name: "Slavonín", lat: 49.56897, lng: 17.2354 },
      { name: "Grygov", lat: 49.538, lng: 17.3086 },
      { name: "Velký dub u tratě", lat: 49.51767, lng: 17.3126 },
    ],
    distanceKm: 18,
    durationMin: 80,
    notes:
      "Cesta na kole ze Slavonína do Grygova do Lesa Království a zpět. Zastávka u velkého dubu u železniční tratě.",
    photo: "./photos/doplnit.svg",
  },
];

const form = document.querySelector("#trip-form");
const editor = document.querySelector("#editor");
const tripsEl = document.querySelector("#trips");
const emptyEl = document.querySelector("#empty");
const totalsEl = document.querySelector("#totals");
const searchEl = document.querySelector("#search");
const photoPreview = document.querySelector("#photo-preview");
const photoPreviewWrap = document.querySelector("#photo-preview-wrap");
const geocodeStatus = document.querySelector("#geocode-status");

let trips = loadTrips();
let photoDraft = "";
let maps = [];

function uid() {
  return crypto.randomUUID();
}

function loadTrips() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return sortTrips(parsed);
    }
  } catch {
    /* ignore broken storage */
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_TRIPS));
  return sortTrips(SAMPLE_TRIPS.map((t) => ({ ...t })));
}

function saveTrips() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

function sortTrips(list) {
  return [...list].sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
}

function formatKm(km) {
  return `${Number(km || 0).toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} km`;
}

function formatDuration(min) {
  const h = Math.floor((min || 0) / 60);
  const m = Math.round((min || 0) % 60);
  if (!h && !m) return "—";
  if (!h) return `${m} min`;
  if (!m) return `${h} h`;
  return `${h} h ${m} min`;
}

function formatDate(iso) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso || "—";
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function routeLine(trip) {
  const parts = [trip.startPlace, trip.viaPlace, trip.endPlace]
    .map((value) => (value || "").trim())
    .filter(Boolean);
  const unique = parts.filter((item, i) => item !== parts[i - 1]);
  if (unique.length >= 2) return unique.join(" → ");
  return unique[0] || "Bez trasy";
}

function parseCoord(value) {
  if (!value) return { lat: null, lng: null };
  const parts = String(value)
    .replace(";", ",")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return { lat: null, lng: null };
  return { lat, lng };
}

function coordString(lat, lng) {
  if (lat == null || lng == null || lat === "" || lng === "") return "";
  return `${lat}, ${lng}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function showEditor(trip) {
  editor.hidden = false;
  document.querySelector("#form-title").textContent = trip ? "Upravit výlet" : "Nový výlet";
  form.reset();
  photoDraft = trip?.photo || "";
  form.id.value = trip?.id || "";
  form.title.value = trip?.title || "";
  form.date.value = trip?.date || today();
  form.startPlace.value = trip?.startPlace || "";
  form.viaPlace.value = trip?.viaPlace || "";
  form.endPlace.value = trip?.endPlace || "";
  form.distanceKm.value = trip?.distanceKm || "";
  form.hours.value = trip ? Math.floor((trip.durationMin || 0) / 60) : "";
  form.minutes.value = trip ? Math.round((trip.durationMin || 0) % 60) : "";
  form.notes.value = trip?.notes || "";
  form.photoUrl.value = trip?.photo && !String(trip.photo).startsWith("data:") ? trip.photo : "";
  form.startCoord.value = coordString(trip?.startLat, trip?.startLng);
  form.viaCoord.value = coordString(trip?.viaLat, trip?.viaLng);
  form.endCoord.value = coordString(trip?.endLat, trip?.endLng);
  geocodeStatus.textContent = "";
  updatePhotoPreview();
  editor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function hideEditor() {
  editor.hidden = true;
  form.reset();
  photoDraft = "";
  updatePhotoPreview();
}

function updatePhotoPreview() {
  if (photoDraft) {
    photoPreview.src = photoDraft;
    photoPreviewWrap.hidden = false;
  } else {
    photoPreview.removeAttribute("src");
    photoPreviewWrap.hidden = true;
  }
}

function readForm() {
  const hours = Number(form.hours.value) || 0;
  const minutes = Number(form.minutes.value) || 0;
  const start = parseCoord(form.startCoord.value);
  const via = parseCoord(form.viaCoord.value);
  const end = parseCoord(form.endCoord.value);
  const url = form.photoUrl.value.trim();
  const startPlace = form.startPlace.value.trim();
  const viaPlace = form.viaPlace.value.trim();
  const endPlace = form.endPlace.value.trim();
  const waypoints = [];
  if (start.lat != null) waypoints.push({ name: startPlace || "Start", lat: start.lat, lng: start.lng });
  if (via.lat != null) waypoints.push({ name: viaPlace || "Přes", lat: via.lat, lng: via.lng });
  if (end.lat != null) waypoints.push({ name: endPlace || "Cíl", lat: end.lat, lng: end.lng });
  return {
    id: form.id.value || uid(),
    title: form.title.value.trim() || "Bez názvu",
    date: form.date.value || today(),
    startPlace,
    viaPlace,
    endPlace,
    startLat: start.lat,
    startLng: start.lng,
    viaLat: via.lat,
    viaLng: via.lng,
    endLat: end.lat,
    endLng: end.lng,
    waypoints,
    distanceKm: Number(form.distanceKm.value) || 0,
    durationMin: hours * 60 + minutes,
    notes: form.notes.value.trim(),
    photo: photoDraft || url || "",
  };
}

async function compressImage(file) {
  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = blobUrl;
    });
    const max = 1200;
    let { width, height } = img;
    if (width > max) {
      height = (height * max) / width;
      width = max;
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function geocode(query) {
  let q = query;
  if (/království/i.test(q) && !/grygov/i.test(q)) q += ", Grygov, Olomouc";
  else if (/slavonín/i.test(q) && !/olomouc/i.test(q)) q += ", Olomouc";
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cz&q=" +
    encodeURIComponent(q);
  const res = await fetch(url, { headers: { "Accept-Language": "cs" } });
  if (!res.ok) throw new Error("geocode");
  const data = await res.json();
  if (!data[0]) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

function destroyMaps() {
  maps.forEach((map) => map.remove());
  maps = [];
}

function pin(kind) {
  return L.divIcon({
    className: `pin ${kind}`,
    html: "<span></span>",
    iconSize: [16, 16],
    iconAnchor: [8, 16],
  });
}

function tripPoints(trip) {
  if (Array.isArray(trip.waypoints) && trip.waypoints.length) {
    return trip.waypoints.filter((w) => w.lat != null && w.lng != null);
  }
  const pts = [];
  if (trip.startLat != null && trip.startLng != null) {
    pts.push({ name: trip.startPlace || "Start", lat: trip.startLat, lng: trip.startLng });
  }
  if (trip.viaLat != null && trip.viaLng != null) {
    pts.push({ name: trip.viaPlace || "Přes", lat: trip.viaLat, lng: trip.viaLng });
  }
  if (trip.endLat != null && trip.endLng != null) {
    pts.push({ name: trip.endPlace || "Cíl", lat: trip.endLat, lng: trip.endLng });
  }
  return pts;
}

function renderMap(el, trip) {
  const stops = tripPoints(trip);
  if (!stops.length) {
    el.className = "map-empty";
    el.textContent = "Mapa zatím chybí. V úpravě doplňte místo tlačítkem „Najít místa na mapě“.";
    return;
  }
  const map = L.map(el, { scrollWheelZoom: false, attributionControl: true });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);
  const latlngs = stops.map((stop) => [stop.lat, stop.lng]);
  stops.forEach((stop, i) => {
    const kind = i === 0 ? "start" : i === stops.length - 1 ? "end" : "via";
    L.marker(latlngs[i], { icon: pin(kind) })
      .addTo(map)
      .bindTooltip(stop.name || "", { permanent: false });
  });
  if (latlngs.length >= 2) {
    L.polyline(latlngs, { color: "#2f6a4a", weight: 3 }).addTo(map);
    map.fitBounds(latlngs, { padding: [18, 18], maxZoom: 13 });
  } else {
    map.setView(latlngs[0], 12);
  }
  maps.push(map);
  setTimeout(() => map.invalidateSize(), 60);
}

function renderTotals(list) {
  const km = list.reduce((s, t) => s + (Number(t.distanceKm) || 0), 0);
  const min = list.reduce((s, t) => s + (Number(t.durationMin) || 0), 0);
  totalsEl.innerHTML = `
    <div><dt>Ujeto</dt><dd>${formatKm(km)}</dd></div>
    <div><dt>V sedle</dt><dd>${formatDuration(min)}</dd></div>
    <div><dt>Výletů</dt><dd>${list.length}</dd></div>
    <div><dt>S fotkou</dt><dd>${list.filter((t) => t.photo).length}</dd></div>
  `;
}

function render() {
  destroyMaps();
  const q = searchEl.value.trim().toLowerCase();
  const visible = trips.filter((trip) => {
    if (!q) return true;
    return [trip.title, trip.startPlace, trip.viaPlace, trip.endPlace, trip.notes].join(" ").toLowerCase().includes(q);
  });
  renderTotals(trips);

  if (!trips.length) {
    tripsEl.innerHTML = "";
    emptyEl.hidden = false;
    emptyEl.innerHTML =
      "<h3>Zatím tu nic není</h3><p>Přidejte první výlet — název, kudy jste jeli, kilometry a klidně i fotku.</p>";
    return;
  }
  if (!visible.length) {
    tripsEl.innerHTML = "";
    emptyEl.hidden = false;
    emptyEl.innerHTML = "<h3>Nic se nenašlo</h3><p>Zkuste jiné slovo. Výlety nikam nezmizely.</p>";
    return;
  }

  emptyEl.hidden = true;
  tripsEl.innerHTML = visible
    .map((trip) => {
      const photo = trip.photo
        ? `<div class="trip-photo"><img src="${escapeAttr(trip.photo)}" alt=""></div>`
        : `<div class="trip-photo"><div class="ph">Doplňte fotku</div></div>`;
      const notes = trip.notes ? `<p class="notes">${escapeHtml(trip.notes)}</p>` : "";
      return `<article class="trip" data-id="${trip.id}">
        ${photo}
        <div class="trip-body">
          <p class="trip-date">${escapeHtml(formatDate(trip.date))}</p>
          <h3>${escapeHtml(trip.title)}</h3>
          <p class="route">${escapeHtml(routeLine(trip))}</p>
          <p class="meta"><span>${formatKm(trip.distanceKm)}</span><span>${formatDuration(trip.durationMin)}</span></p>
          ${notes}
        </div>
        <div class="map" id="map-${trip.id}"></div>
        <div class="trip-actions">
          <button type="button" class="btn ghost" data-edit="${trip.id}">Upravit</button>
          <button type="button" class="btn danger" data-del="${trip.id}">Smazat</button>
        </div>
      </article>`;
    })
    .join("");

  visible.forEach((trip) => {
    const el = document.querySelector(`#map-${CSS.escape(trip.id)}`);
    if (el) renderMap(el, trip);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

document.querySelector("#add-btn").addEventListener("click", () => showEditor(null));
document.querySelector("#cancel-btn").addEventListener("click", hideEditor);
document.querySelector("#cancel-btn-2").addEventListener("click", hideEditor);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const next = readForm();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(next.date)) {
    alert("Datum zadejte ve formátu RRRR-MM-DD.");
    form.date.focus();
    return;
  }
  const index = trips.findIndex((t) => t.id === next.id);
  if (index >= 0) trips[index] = next;
  else trips.push(next);
  trips = sortTrips(trips);
  try {
    saveTrips();
  } catch {
    alert("Fotka je na uložení moc velká. Zkuste menší soubor nebo odkaz.");
    return;
  }
  hideEditor();
  render();
});

form.photoFile.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  photoDraft = await compressImage(file);
  form.photoUrl.value = "";
  updatePhotoPreview();
});

form.photoUrl.addEventListener("input", () => {
  if (form.photoUrl.value.trim()) {
    photoDraft = form.photoUrl.value.trim();
    updatePhotoPreview();
  }
});

document.querySelector("#clear-photo").addEventListener("click", () => {
  photoDraft = "";
  form.photoFile.value = "";
  form.photoUrl.value = "";
  updatePhotoPreview();
});

document.querySelector("#geocode-btn").addEventListener("click", async () => {
  geocodeStatus.textContent = "Hledám…";
  try {
    if (form.startPlace.value.trim()) {
      const start = await geocode(form.startPlace.value.trim());
      if (start) form.startCoord.value = coordString(start.lat, start.lng);
    }
    if (form.viaPlace.value.trim()) {
      const via = await geocode(form.viaPlace.value.trim());
      if (via) form.viaCoord.value = coordString(via.lat, via.lng);
    }
    if (form.endPlace.value.trim()) {
      const end = await geocode(form.endPlace.value.trim());
      if (end) form.endCoord.value = coordString(end.lat, end.lng);
    }
    geocodeStatus.textContent =
      form.startCoord.value || form.viaCoord.value || form.endCoord.value ? "Mapa doplněna." : "Místo se nenašlo.";
  } catch {
    geocodeStatus.textContent = "Mapu se teď nepodařilo najít. Zkuste souřadnice ručně.";
  }
});

tripsEl.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const delId = event.target.dataset.del;
  if (editId) {
    const trip = trips.find((t) => t.id === editId);
    if (trip) showEditor(trip);
  }
  if (delId) {
    const trip = trips.find((t) => t.id === delId);
    if (!trip) return;
    if (!confirm(`Opravdu smazat výlet „${trip.title}“?`)) return;
    trips = trips.filter((t) => t.id !== delId);
    saveTrips();
    render();
  }
});

searchEl.addEventListener("input", render);

document.querySelector("#export-btn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(trips, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cyklo-vylety.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

render();
