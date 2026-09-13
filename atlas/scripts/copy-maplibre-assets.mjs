#!/usr/bin/env node
// MapLibre GL JS za běhu natahuje svůj web worker (a jeho "shared" závislost)
// jako dva samostatné soubory, které od sebe očekává ve stejné složce, podle
// jména bez hashe. Vite/Astro je při běžném bundlování nezachytí (worker si
// je žádá dynamicky přes vlastní import.meta.url), takže je před každým
// dev/buildem prostě zkopírujeme z nainstalovaného balíčku do public/, kde
// je Astro publikuje beze změny. Viz src/lib/map/TravelMap.ts.

import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(root, 'node_modules', 'maplibre-gl', 'dist');
const outDir = join(root, 'public');

const files = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

mkdirSync(outDir, { recursive: true });

let copied = 0;
for (const file of files) {
  const from = join(srcDir, file);
  const to = join(outDir, file);
  if (!existsSync(from)) {
    console.warn(`[maplibre] ${file} nenalezen v node_modules/maplibre-gl/dist - proběhl "npm install"?`);
    continue;
  }
  copyFileSync(from, to);
  copied++;
}
console.log(`[maplibre] zkopírováno ${copied}/${files.length} souborů do public/.`);
