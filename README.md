# Odhad nemovitostí Olomouc – redesign

Statický web (čisté HTML/CSS/JS, bez frameworku a bez buildu) – nahrajete na jakýkoli hosting přes FTP a funguje. Žádný CMS, žádná databáze, minimální údržba.

## Co je potřeba před nasazením doplnit

Web obsahuje placeholdery, které je nutné nahradit reálnými údaji (hledejte `XXX` a `[...]`):

- **Telefon** – všechny výskyty `+420XXXXXXXXX` (odkazy `tel:` i zobrazený text) v `index.html`, `odhad-bytu-olomouc.html`, `odhad-pro-dedicke-rizeni.html`.
- **E-mail** – `info@odhadnemovitostiolomouc.cz` v `index.html`, pokud chcete jinou adresu.
- **Odkaz na RK Mára** – aktuálně `https://rkmara.cz/`, upravte na skutečnou doménu.
- **Formulář poptávky** (`#poptavkaForm` v `index.html`, obsluha ve `script.js`) – teď jen zobrazí děkovací hlášku. Je potřeba napojit na skutečné odeslání, např.:
  - [Formspree](https://formspree.io/) / [Web3Forms](https://web3forms.com/) – zdarma, bez backendu, stačí přidat `action` atributu formuláře.
  - nebo vlastní PHP skript na hostingu, který pošle e-mail.
- **Mapa** – v `index.html` je vložená obecná mapa Olomouce (`google.com/maps?q=Olomouc`), doporučuji nahradit odkazem na konkrétní adresu/Google Business profil.
- **Reference** – tři ukázkové recenze v `index.html` nahraďte reálnými (ideálně prokliknutelné na Google recenze).
- **Statistiky** (500+ odhadů, 15+ let praxe, 4.9★) – nahraďte reálnými čísly, ať nejde o nic nepravdivého.
- **og-image.jpg** – v `<head>` `index.html` je odkaz na `og-image.jpg` (náhled při sdílení na Facebook/WhatsApp) – je potřeba vytvořit a nahrát obrázek 1200×630 px.

## SEO – co je uděláno a jak pokračovat

- Každá stránka má vlastní `<title>` a `meta description` cílené na konkrétní frázi (long-tail).
- Homepage + podstránky mají strukturovaná data (`schema.org`: `ProfessionalService`, `FAQPage`, `BreadcrumbList`) – pomáhá to na zobrazení hvězdiček/FAQ přímo ve výsledcích Google.
- `sitemap.xml` a `robots.txt` jsou připravené – po nasazení je potřeba přidat web do Google Search Console a sitemapu tam odeslat.
- Sekce „Kde působíme" cíleně vyjmenovává okolní města (Šternberk, Litovel, Uničov, Prostějov, Přerov, Konice, Šumperk) – to jsou samostatné long-tail fráze typu „odhad nemovitosti Šternberk".

### Jak přidávat další long-tail landing stránky

Zkopírujte `odhad-bytu-olomouc.html` jako šablonu a upravte:
1. `<title>` a `meta description` na novou frázi (např. „odhad nemovitosti pro hypotéku Olomouc").
2. `<h1>` a obsah článku (co dané téma řeší, kdy se hodí, jak postupujeme).
3. `canonical` a `BreadcrumbList` JSON-LD odkaz.
4. Přidejte novou stránku do `sitemap.xml` a jako kartu/odkaz do `#sluzby` na hlavní stránce.

Doporučené další stránky: `odhad-pro-hypoteku.html`, `odhad-pro-exekuci.html`, `odhad-pozemku-olomouc.html`, a časem blogové články typu „Kolik stojí odhad nemovitosti v Olomouci" nebo „Odhad vs. znalecký posudek – jaký je rozdíl".

## Nasazení

1. Nahrajte všechny soubory (`index.html`, `*.html`, `styles.css`, `script.js`, `robots.txt`, `sitemap.xml`) do kořenové složky hostingu.
2. Ověřte, že web běží na HTTPS (dnes standard u každého hostingu).
3. Přidejte web do Google Search Console a Google Business Profile (klíčové pro lokální SEO v Olomouci).
