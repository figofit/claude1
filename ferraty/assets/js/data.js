/*
 * Moje hory — načítání dat a sdílené pomocné funkce.
 * Načteno jako obyčejný <script> na každé stránce, vystavuje globální objekt `Ferraty`.
 * Stránka musí běžet přes http(s) (fetch nefunguje z file://) — viz README.md.
 */
(function (global) {
  "use strict";

  const DATA_URL = "data/ferraty.json";

  const COUNTRY_FLAGS = {
    "Rakousko": "🇦🇹",
    "Německo": "🇩🇪",
    "Švýcarsko": "🇨🇭",
    "Lichtenštejnsko": "🇱🇮",
    "Itálie": "🇮🇹",
    "Francie": "🇫🇷",
    "Španělsko": "🇪🇸",
    "Portugalsko": "🇵🇹",
    "Andorra": "🇦🇩",
    "Slovinsko": "🇸🇮",
    "Slovensko": "🇸🇰",
    "Česko": "🇨🇿",
    "Polsko": "🇵🇱",
    "Maďarsko": "🇭🇺",
    "Rumunsko": "🇷🇴",
    "Bulharsko": "🇧🇬",
    "Řecko": "🇬🇷",
    "Chorvatsko": "🇭🇷",
    "Slovinsko ": "🇸🇮",
    "Bosna a Hercegovina": "🇧🇦",
    "Srbsko": "🇷🇸",
    "Černá Hora": "🇲🇪",
    "Severní Makedonie": "🇲🇰",
    "Albánie": "🇦🇱",
    "Kosovo": "🇽🇰",
    "Gruzie": "🇬🇪",
    "Arménie": "🇦🇲",
    "Ázerbájdžán": "🇦🇿",
    "Rusko": "🇷🇺",
    "Turecko": "🇹🇷",
    "Maroko": "🇲🇦",
    "Alžírsko": "🇩🇿",
    "Tunisko": "🇹🇳",
    "Egypt": "🇪🇬",
    "Kypr": "🇨🇾",
    "Norsko": "🇳🇴",
    "Švédsko": "🇸🇪",
    "Finsko": "🇫🇮",
    "Island": "🇮🇸",
    "Velká Británie": "🇬🇧",
    "Irsko": "🇮🇪",
    "Nizozemsko": "🇳🇱",
    "Belgie": "🇧🇪",
    "Lucembursko": "🇱🇺",
    "Ukrajina": "🇺🇦",
    "Bělorusko": "🇧🇾",
    "Moldavsko": "🇲🇩",
    "Malta": "🇲🇹",
    "Dánsko": "🇩🇰",
    "Monako": "🇲🇨",
    "Vatikán": "🇻🇦",
    "Gibraltar": "🇬🇮",
  };

  function countryFlag(country) {
    return COUNTRY_FLAGS[country] || "";
  }

  // Vrátí escapovaný název země s emoji vlaječkou (pokud ji známe), pro přímé vložení do HTML.
  function countryLabelHtml(country) {
    if (!country) return "—";
    const flag = countryFlag(country);
    const name = escapeHtml(country);
    return flag ? `${flag} ${name}` : name;
  }

  let cache = null;

  async function loadAll() {
    if (cache) return cache;
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) {
      throw new Error("Nepodařilo se načíst data/ferraty.json (HTTP " + res.status + ")");
    }
    const json = await res.json();
    cache = (json.records || []).map(normalizeRecord);
    return cache;
  }

  async function byId(id) {
    const all = await loadAll();
    return all.find((r) => r.id === id) || null;
  }

  // Doplní chybějící vnořené objekty jako null, ať šablony nemusí kontrolovat
  // existenci na každém kroku. Nikdy nedosazuje smysluplné hodnoty — jen strukturu.
  function normalizeRecord(r) {
    return Object.assign(
      {
        country: null,
        region: null,
        regionGroup: null,
        locality: null,
        coordinates: null,
        date: null,
        length_m: null,
        elevationGain_m: null,
        summit: null,
        altitude_m: null,
        duration_min: null,
        featured: false,
        highestOfCountry: false,
        highestOfAreas: [],
        milestones: [],
        companions: [],
        volcano: false,
        glacier: false,
        days: [],
        note: null,
        track: null,
        photos: [],
        sourceUrl: null,
        relatedIds: [],
      },
      r
    );
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slugify(str) {
    return String(str || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const TYPE_META = {
    ferrata: { label: "Ferrata", cls: "badge--type-ferrata" },
    vrchol: { label: "Vrchol", cls: "badge--type-vrchol" },
    "hřebenovka": { label: "Hřebenovka", cls: "badge--type-hrebenovka" },
  };

  function typeMeta(type) {
    return TYPE_META[type] || { label: type || "Neuvedeno", cls: "badge--muted" };
  }

  function formatDate(iso, opts) {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return "—";
    const options = opts || { day: "numeric", month: "long", year: "numeric" };
    return new Intl.DateTimeFormat("cs-CZ", options).format(d);
  }

  function yearOf(iso) {
    if (!iso) return null;
    const m = /^(\d{4})-/.exec(iso);
    return m ? parseInt(m[1], 10) : null;
  }

  function fmtNumber(n) {
    return new Intl.NumberFormat("cs-CZ").format(n);
  }

  function fmtLength(m) {
    return m === null || m === undefined ? "—" : `${fmtNumber(m)} m`;
  }

  function fmtElevation(m) {
    return m === null || m === undefined ? "—" : `${fmtNumber(m)} m`;
  }

  function fmtAltitude(m) {
    return m === null || m === undefined ? "—" : `${fmtNumber(m)} m n. m.`;
  }

  function fmtDuration(min) {
    if (min === null || min === undefined) return "—";
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  // ---- Statistiky ----

  function computeStats(records) {
    const total = records.length;

    const countrySet = new Set(records.map((r) => r.country).filter(Boolean));

    const byCountry = countMap(records, (r) => r.country);
    const byYear = countMap(records, (r) => yearOf(r.date));
    const byType = countMap(records, (r) => r.type || null);

    let highestAltitude = null;
    records.forEach((r) => {
      if (r.altitude_m === null || r.altitude_m === undefined) return;
      if (!highestAltitude || r.altitude_m > highestAltitude.altitude_m) highestAltitude = r;
    });

    const withGain = records.filter((r) => r.elevationGain_m !== null && r.elevationGain_m !== undefined);
    const totalElevationGain = withGain.reduce((sum, r) => sum + r.elevationGain_m, 0);

    const withGpx = records.filter((r) => r.track && r.track.file).length;
    const withPhotos = records.filter((r) => r.photos && r.photos.length > 0).length;
    const volcanoCount = records.filter((r) => r.volcano).length;
    const glacierCount = records.filter((r) => r.glacier).length;

    return {
      total,
      countriesCount: countrySet.size,
      byCountry,
      byYear,
      byType,
      highestAltitude,
      totalElevationGain,
      elevationGainKnownCount: withGain.length,
      withGpx,
      withPhotos,
      volcanoCount,
      glacierCount,
    };
  }

  // Vrátí pole [{key, count}] seřazené sestupně dle počtu; null klíče (neuvedeno) na konec.
  function countMap(records, keyFn) {
    const map = new Map();
    records.forEach((r) => {
      const key = keyFn(r);
      map.set(key, (map.get(key) || 0) + 1);
    });
    const entries = Array.from(map.entries()).map(([key, count]) => ({ key, count }));
    entries.sort((a, b) => {
      if (a.key === null || a.key === undefined) return 1;
      if (b.key === null || b.key === undefined) return -1;
      return b.count - a.count;
    });
    return entries;
  }

  global.Ferraty = {
    loadAll,
    byId,
    escapeHtml,
    slugify,
    typeMeta,
    countryFlag,
    countryLabelHtml,
    formatDate,
    yearOf,
    fmtNumber,
    fmtLength,
    fmtElevation,
    fmtAltitude,
    fmtDuration,
    computeStats,
  };
})(window);
