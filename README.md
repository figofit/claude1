# Odhad nemovitostí Olomouc – redesign (Realitní kancelář MARA)

Statický web (čisté HTML/CSS/JS, bez frameworku a bez buildu) – nahrajete na hosting přes FTP a funguje. Žádný CMS, žádná databáze, minimální údržba.

## Co se změnilo oproti původnímu webu

Zachovaná je **podstata i logika** původní stránky – jde o jednostránkovou "lapací" stránku pro Google, která poptávku po odhadu nepředělává sama, ale přesměrovává ji na formulář `rkmara.cz/odhad-nemovitosti/` a na telefon +420 732 835 902. Zachované jsou i **barvy a logo** (tmavě modrá `#1b2467` + červená `#b32017`, logo MARA).

Co je nové:
- Jiná kompozice hero sekce (plnobarevný pás + "trust" karta se statistikami přesahující dolů, místo dvou bílých panelů vedle sebe).
- Přehlednější členění na sekce: Proč odhad → Jak to funguje → Reference/CTA → Kde působíme → FAQ.
- Přidaná sekce FAQ se strukturovanými daty (`schema.org FAQPage`) – šance na rozšířené výsledky ve vyhledávání.
- Přidané `schema.org` údaje o firmě (`RealEstateAgent`) včetně hodnocení 4,9 / 42 recenzí.
- Dvě ukázkové long-tail podstránky (`odhad-bytu-olomouc.html`, `odhad-pro-dedicke-rizeni.html`) cílené na konkrétní fráze – obě rovněž vedou na stejný formulář/telefon, nic si "nevymýšlí" navíc.
- Logo je teď vektorové (`assets/logo-mara.svg` + světlá varianta `logo-mara-white.svg` do patičky) – ostré na jakékoli obrazovce, na rozdíl od rastrového obrázku.

## Než nahrajete na ostrý hosting

- **Titulek a H1** jsou schválně blízké původním (`Odhad nemovitosti Olomouc | Zdarma a nezávazně`), aby web nepřišel o pozice, na kterých případně už v Googlu je. Pokud chcete titulek měnit výrazněji, dělejte to postupně a sledujte dopad v Search Console.
- **Fotka makléře** – `.profile-photo` teď zobrazuje jen iniciály "MŠ" (Marek Špunda). Pokud existuje reálná fotka, nahraďte `<div class="profile-photo">MŠ</div>` v `index.html` na `<img src="assets/marek-spunda.jpg" alt="Marek Špunda" class="profile-photo">` (a upravte CSS `.profile-photo` na `object-fit: cover`).
- **Hodnocení 4,9 / 42 recenzí** – převzato z původního webu. Časem aktualizujte na aktuální číslo z Google vizitky.
- **Odkaz na formulář** – všechna CTA vedou na `https://www.rkmara.cz/odhad-nemovitosti/`. Pokud se tato adresa změní, nahraďte ji ve všech `.html` souborech (hledejte `rkmara.cz/odhad-nemovitosti`).
- **Telefon** `+420 732 835 902` je použit v `tel:` odkazech i v zobrazeném textu na všech stránkách.

## SEO

- `sitemap.xml` a `robots.txt` jsou připravené – po nasazení přidejte web do Google Search Console a sitemapu tam odešlete.
- Sekce „Kde působíme“ obsahuje varianty klíčové fráze (byt/dům/pozemek/dědictví) – dvě z nich už mají vlastní podstránku, zbylé můžete časem také rozpracovat podle stejné šablony.

### Jak přidat další long-tail landing stránku

Zkopírujte `odhad-bytu-olomouc.html` a upravte:
1. `<title>`, `meta description`, `canonical` a `BreadcrumbList` JSON-LD na novou frázi.
2. `<h1>` a text článku.
3. Přidejte novou stránku do `sitemap.xml` a jako odkaz do sekce „Kde působíme“ na hlavní stránce.

Doporučené další stránky: `odhad-domu-olomouc.html`, `odhad-pozemku-olomouc.html`.

## Nasazení

1. Nahrajte všechny soubory a složku `assets/` do kořenové složky hostingu.
2. Ověřte HTTPS.
3. Přidejte/aktualizujte web v Google Business Profile a Search Console.
