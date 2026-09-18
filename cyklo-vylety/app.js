const STORAGE_KEY = "cyklo-vylety:trips:v2";

const SAMPLE_TRIPS = [
  {
    id: "sample-kopecek",
    title: "Ráno na Svatý Kopeček",
    date: "2026-09-14",
    startPlace: "Olomouc – centrum",
    endPlace: "Svatý Kopeček",
    startLat: 49.5938,
    startLng: 17.2509,
    endLat: 49.6297,
    endLng: 17.3378,
    distanceKm: 28.4,
    durationMin: 98,
    notes:
      "Káva u baziliky, zpátky přes Chválkovice. Lehký protivítr na hrázi, jinak pohoda.",
    photo: "./photos/kopecek.jpg",
  },
  {
    id: "sample-pomoravi",
    title: "Gravel Litovelským Pomoravím",
    date: "2026-09-07",
    startPlace: "Horka nad Moravou",
    endPlace: "Litovel",
    startLat: 49.6406,
    startLng: 17.2108,
    endLat: 49.7013,
    endLng: 17.0758,
    distanceKm: 46.2,
    durationMin: 175,
    notes:
      "Měkké úseky po dešti, krásné světlo v lužním lese. Občerstvení v Litovli, zpět vlakem.",
    photo: "./photos/pomoravi.jpg",
  },
  {
    id: "sample-jeseniky",
    title: "Červenohorské sedlo z Loučné",
    date: "2026-08-23",
    startPlace: "Loučná nad Desnou",
    endPlace: "Červenohorské sedlo",
    startLat: 50.0717,
    startLng: 17.1433,
    endLat: 50.1247,
    endLng: 17.1528,
    distanceKm: 38.7,
    durationMin: 168,
    notes: "Těžké nohy v posledních kilometrech, ale výhled z sedla stál za to.",
    photo: "./photos/sedlo.jpg",
  },
  {
    id: "sample-bouzov",
    title: "Za hradem Bouzov",
    date: "2026-08-10",
    startPlace: "Loštice",
    endPlace: "Bouzov",
    startLat: 49.7447,
    startLng: 16.9289,
    endLat: 49.7043,
    endLng: 16.8897,
    distanceKm: 52.1,
    durationMin: 188,
    notes: "Oběd pod hradem, zpáteční cesta už v kroupách. Jeden defekt, jinak bez dramatu.",
    photo: "./photos/bouzov.jpg",
  },
  {
    id: "sample-mtb",
    title: "Kořeny nad Šternberkem",
    date: "2026-07-19",
    startPlace: "Šternberk",
    endPlace: "Šternberk",
    startLat: 49.7304,
    startLng: 17.2989,
    endLat: 49.751,
    endLng: 17.333,
    distanceKm: 22.8,
    durationMin: 132,
    notes: "Technické sjezdy po dešti, hodně bláta. Skvělé singletracky nad městem.",
    photo: "./photos/sternberk.jpg",
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
  return [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)));
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
  return d.toLocaleDateString("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function routeLine(trip) {
  const start = (trip.startPlace || "").trim();
  const end = (trip.endPlace || "").trim();
  if (start && end && start !== end) return `${start} → ${end}`;
  return start || end || "Bez trasy";
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
  form.endPlace.value = trip?.endPlace || "";
  form.distanceKm.value = trip?.distanceKm || "";
  form.hours.value = trip ? Math.floor((trip.durationMin || 0) / 60) : "";
  form.minutes.value = trip ? Math.round((trip.durationMin || 0) % 60) : "";
  form.notes.value = trip?.notes || "";
  form.photoUrl.value = trip?.photo && !String(trip.photo).startsWith("data:") ? trip.photo : "";
  form.startCoord.value = coordString(trip?.startLat, trip?.startLng);
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
  const end = parseCoord(form.endCoord.value);
  const url = form.photoUrl.value.trim();
  return {
    id: form.id.value || uid(),
    title: form.title.value.trim() || "Bez názvu",
    date: form.date.value || today(),
    startPlace: form.startPlace.value.trim(),
    endPlace: form.endPlace.value.trim(),
    startLat: start.lat,
    startLng: start.lng,
    endLat: end.lat,
    endLng: end.lng,
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
  const url =
    "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cz&q=" +
    encodeURIComponent(query);
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

function renderMap(el, trip) {
  const points = [];
  if (trip.startLat != null && trip.startLng != null) points.push([trip.startLat, trip.startLng]);
  if (trip.endLat != null && trip.endLng != null) points.push([trip.endLat, trip.endLng]);
  if (!points.length) {
    el.className = "map-empty";
    el.textContent = "Mapa zatím chybí. V úpravě doplňte místo tlačítkem „Najít místa na mapě“.";
    return;
  }
  const map = L.map(el, { scrollWheelZoom: false, attributionControl: true });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);
  if (points[0]) L.marker(points[0], { icon: pin("start") }).addTo(map);
  if (points[1] && (points[1][0] !== points[0][0] || points[1][1] !== points[0][1])) {
    L.marker(points[1], { icon: pin("end") }).addTo(map);
    L.polyline(points, { color: "#2f6a4a", weight: 3 }).addTo(map);
    map.fitBounds(points, { padding: [18, 18], maxZoom: 13 });
  } else {
    map.setView(points[0], 12);
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
    return [trip.title, trip.startPlace, trip.endPlace, trip.notes].join(" ").toLowerCase().includes(q);
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
        : `<div class="trip-photo"><div class="ph">Bez fotky</div></div>`;
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
    if (form.endPlace.value.trim()) {
      const end = await geocode(form.endPlace.value.trim());
      if (end) form.endCoord.value = coordString(end.lat, end.lng);
    }
    geocodeStatus.textContent = form.startCoord.value || form.endCoord.value ? "Mapa doplněna." : "Místo se nenašlo.";
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
