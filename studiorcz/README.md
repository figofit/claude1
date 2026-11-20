# STUDIO R (studiorcz.cz) – návrh redesignu

Statický jednostránkový web (čisté HTML/CSS/JS, bez frameworku a bez buildu). Stačí nahrát složku přes FTP.

## Původní stav webu (listopad 2026)
- Běží jen na **HTTP**, bez HTTPS (prohlížeče ho označují jako „nezabezpečený“).
- **Není responzivní**: chybí `meta viewport` a layout má pevnou šířku zhruba 924 px.
- Technologie z let 2010–2011: jQuery 1.5, Cufon fonty, Nivo Slider, podmínky pro IE6–IE9.
- Kódování windows-1250. Meta description je pořád šablonová: „add description …“.
- Obsah je slabý: sekce Reference „připravujeme“, výrobky jsou jen galerie bez textu a CNC obrábění nemá žádný popis.

## Co nový web řeší
- Plně responzivní (ověřeno na šířce 1440 px i na iPhonu) a moderní tmavý „industriální“ vzhled.
- Zachovaná značka: logo „STUDIO R / design & manufacture“ (bílá + neonově zelená, strojopisné písmo), převedené do textu, takže je ostré na každém displeji.
- Jedna přehledná stránka: Úvod → Výrobky (4 kategorie v záložkách + lightbox) → Technologie (s videi z YouTube) → O firmě (časová osa) → Kontakt.
- Videa z YouTube se načtou až po kliknutí (rychlejší web, žádné cookies předem).
- Fotky jsou převedené do WebP (celkem asi 400 kB).
- SEO: smysluplný title a description, Open Graph a `schema.org/LocalBusiness`.

## Co je potřeba ověřit s klientem
- **Texty u kategorií výrobků** a podtitulek v úvodu jsou můj návrh podle fotografií a uvedených technologií. Původní web u výrobků žádné texty neměl.
- **„Goodway GS‑280YS“** je model stroje přečtený z fotografie v původním slideru. Potvrdit, případně doplnit další stroje.
- **IČ / DIČ** na původním webu chybí. Doplnit do patičky (u podnikatele to vyžaduje zákon).
- **Kontaktní formulář** je nahrazený odkazem `mailto:` a telefonem, protože statický hosting neumí odesílat e-maily. Pokud ho chtějí, lze napojit např. Formspree.
- **Reference**: na původním webu je sekce prázdná. Až dodají loga nebo jména klientů, můžeme ji přidat.
- **Fotky** jsou z původního webu a mají jen 640 px na šířku. Pro větší dojem by pomohlo nafotit výrobky a dílnu znovu ve vyšším rozlišení.
- **HTTPS**: při nasazení zapnout certifikát (Let's Encrypt bývá u hostingu zdarma). Canonical a OG už počítají s `https://`.
