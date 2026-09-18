# CYKLO VÝLETY

Czech cycling-trip journal (MVP). Separate app from the property-valuation site in the repo root.

Český deník cyklistických výletů — přehled, seznam, detail, přidání / úprava / smazání. Data se ukládají v `localStorage` prohlížeče.

## Run locally

```bash
cd cyklo-vylety
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Production preview:

```bash
npm run build
npm run preview
```

## Features

- Home dashboard with totals (km, time, elevation, trip count) and recent trips
- Add / edit / delete a trip
- Search and tag filters (silnice, gravel, MTB)
- Trip detail with computed average speed
- Sample trips on first visit, empty states when filters match nothing
- Mobile-first layout with a bottom navigation on phones

## Stack

Vite + React + TypeScript. No backend.
