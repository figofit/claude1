# navit.cz – návrh redesignu (nezávazně)

Statický web (čisté HTML/CSS/JS, bez frameworku, bez WordPressu/Elementoru) – nahrajete na hosting přes FTP a funguje. Vytvořeno jako speciální nabídka/ukázka pro firmu navit (kyberbezpečnost, školení, IT servis), ne jako zakázka – klidně to použijte jako podklad pro oslovení.

## Co je zachováno ze stávajícího webu

- Vizuální identita: tmavé pozadí + neonově zelená (`#2fe6a0`), terminálový motiv (`$ navit --sekce`).
- Struktura a texty hero/o nás/služby/školení – převzato ze screenshotů stávajícího webu.
- Název firmy a nabídka služeb (externí kyber manažer, penetrační testy, IT servis, AI pro firmy) i školení (phishing, hesla, data, incidenty).

## Co je nové / vylepšené

- **Technické SEO**, které na původním webu chybí: `schema.org` (`ProfessionalService` + `FAQPage`), meta description, Open Graph, `sitemap.xml`, `robots.txt`.
- **FAQ sekce** se strukturovanými daty – šance na rozšířené výsledky ve vyhledávání.
- **Vlastní SVG ikony** místo obecných/emoji ikon a bez stock/AI fotek – místo fotky týmu je abstraktní terminálová grafika, která víc sedí k oboru a nepůsobí jako "AI foto z internetu".
- **Sekce "Jak spolupráce probíhá"** (4 kroky) – na původním webu chyběl jasný proces, přidává důvěru před kontaktem.
- **Sticky mobilní CTA lišta** a jasnější CTA na každé sekci (konzistentně vede na `#kontakt`).
- Rychlejší, lehčí stránka bez pluginů a WP admin overheadu – nižší náklady na údržbu a hosting.

## Než se to nasadí ostře

- **Kontakty jsou placeholder** – `info@navit.cz`, `+420 000 000 000` a telefon ve `schema.org` (`+420XXXXXXXXX`) je nutné nahradit reálnými údaji (hledejte tyto řetězce ve všech souborech).
- **Adresa/IČO** ve `schema.org` bloku v `index.html` zatím chybí – doplňte, pokud chcete zvýšit důvěryhodnost v Google.
- **Reálné reference/loga klientů** – zatím žádná sekce s referencemi není, protože nemám reálná data. Doporučuji přidat, jakmile budou k dispozici (2–3 loga nebo krátké citace zvyšují konverzi).
- **Doménu/canonical** (`https://navit.cz/`) upravte, pokud by šlo o web na jiné doméně.

## Nasazení

1. Nahrajte všechny soubory z `navit-redesign/` (včetně `assets/`) do kořenové složky hostingu.
2. Ověřte HTTPS.
3. Přidejte/aktualizujte web v Google Business Profile a Search Console, odešlete `sitemap.xml`.
