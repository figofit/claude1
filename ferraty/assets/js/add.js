/* Moje hory — logika stránky Přidat výstup (pridat.html) */
(function () {
  "use strict";

  let existingIds = new Set();

  function orNull(value) {
    const v = (value || "").trim();
    return v === "" ? null : v;
  }

  function numOrNull(value) {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  function listOrEmpty(value) {
    return (value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function extensionOf(filename) {
    const m = /\.([a-zA-Z0-9]+)$/.exec(filename.trim());
    const ext = m ? m[1].toLowerCase() : "gpx";
    return ext === "tcx" ? "tcx" : "gpx";
  }

  function baseSlug(name, date) {
    let slug = Ferraty.slugify(name);
    const year = date ? date.slice(0, 4) : null;
    if (year) slug += "-" + year;
    return slug || "ferrata";
  }

  function uniqueId(base) {
    if (!existingIds.has(base)) return base;
    let i = 2;
    while (existingIds.has(`${base}-${i}`)) i++;
    return `${base}-${i}`;
  }

  function val(id) {
    return document.getElementById(id).value;
  }

  function buildRecord() {
    const name = val("f-name").trim();
    const date = orNull(val("f-date"));
    const id = uniqueId(baseSlug(name, date));

    const lat = val("f-lat");
    const lng = val("f-lng");
    const coordinates = lat !== "" && lng !== "" ? { lat: Number(lat), lng: Number(lng) } : null;

    const days = val("f-days")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((p) => p.trim());
        return {
          day: parseInt(parts[0], 10) || null,
          date: orNull(parts[1]),
          from: orNull(parts[2]),
          to: orNull(parts[3]),
          overnightAt: orNull(parts[4]),
          note: orNull(parts[5]),
        };
      });

    const trackFileName = val("f-track").trim();
    const track = trackFileName ? { file: `gpx/${trackFileName}`, format: extensionOf(trackFileName) } : null;

    const photos = val("f-photos")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((f) => `photos/${id}/${f}`);

    const now = new Date().toISOString();

    return {
      id,
      type: val("f-type"),
      name,
      country: orNull(val("f-country")),
      region: orNull(val("f-region")),
      regionGroup: orNull(val("f-region-group")),
      locality: orNull(val("f-locality")),
      coordinates,
      date,
      length_m: numOrNull(val("f-length")),
      elevationGain_m: numOrNull(val("f-gain")),
      summit: orNull(val("f-summit")),
      altitude_m: numOrNull(val("f-altitude")),
      duration_min: numOrNull(val("f-duration")),
      featured: document.getElementById("f-featured").checked,
      highestOfCountry: document.getElementById("f-highest-of-country").checked,
      highestOfAreas: listOrEmpty(val("f-highest-of-areas")),
      milestones: listOrEmpty(val("f-milestones")),
      companions: listOrEmpty(val("f-companions")),
      volcano: document.getElementById("f-volcano").checked,
      glacier: orNull(val("f-glacier")),
      glacierName: orNull(val("f-glacier-name")),
      days,
      note: orNull(val("f-note")),
      track,
      photos,
      sourceUrl: orNull(val("f-source")),
      relatedIds: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  function showError(message) {
    const el = document.getElementById("form-error");
    el.textContent = message;
    el.hidden = false;
  }

  function hideError() {
    document.getElementById("form-error").hidden = true;
  }

  function onSubmit(evt) {
    evt.preventDefault();
    hideError();

    if (!val("f-name").trim()) {
      showError("Vyplň prosím alespoň název.");
      return;
    }

    const record = buildRecord();
    const json = JSON.stringify(record, null, 2) + ",";

    document.getElementById("result-id").textContent = record.id;
    document.getElementById("result-json").value = json;
    document.getElementById("steps-id").textContent = record.id;
    document.getElementById("result-section").hidden = false;
    document.getElementById("copy-notice").hidden = true;
    document.getElementById("result-section").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function onCopy() {
    const textarea = document.getElementById("result-json");
    textarea.select();
    navigator.clipboard
      .writeText(textarea.value)
      .then(() => {
        document.getElementById("copy-notice").hidden = false;
      })
      .catch(() => {
        document.execCommand("copy");
        document.getElementById("copy-notice").hidden = false;
      });
  }

  function onDownload() {
    const id = document.getElementById("result-id").textContent || "ferrata";
    const blob = new Blob([document.getElementById("result-json").value], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function init() {
    try {
      const records = await Ferraty.loadAll();
      existingIds = new Set(records.map((r) => r.id));
    } catch (err) {
      console.warn("Nepodařilo se načíst existující data, kontrola duplicitních ID bude vynechána.", err);
    }

    document.getElementById("add-form").addEventListener("submit", onSubmit);
    document.getElementById("btn-copy").addEventListener("click", onCopy);
    document.getElementById("btn-download").addEventListener("click", onDownload);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
