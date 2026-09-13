// @ts-check
import { defineConfig } from 'astro/config';

// Čistě statický web - žádný framework pro UI, žádný server.
// Interaktivita (mapa, filtry) je řešená jako obyčejné TS moduly
// běžící v prohlížeči, natažené přímo do .astro stránek.
export default defineConfig({
  output: 'static',
  trailingSlash: 'never',
  compressHTML: true,
});
