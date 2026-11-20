# Nový web pro Auto Vodný (Olomouc): postup a nabídka

> Pozn.: současný web autovodny.cz se mi z pracovního prostředí nepodařilo otevřít, takže v prototypu jsou **ukázková auta a zástupné kontakty** (zvýrazněné žlutě). Před tím, než ho ukážeš, doplň aspoň telefon, adresu a otevírací dobu.

## Co je v prototypu (`prototyp.html`)

**Veřejný web**
- Úvod s jasným sdělením („ojeté auto od člověka, kterého znáte“) a živým přehledem skladu (počet vozů, cena od).
- Nabídka vozů: filtr podle značky, paliva a ceny, řazení, štítky *Skladem / Rezervováno / Prodáno*.
- Detail vozu: parametry, výbava, popis, fotogalerie, **tlačítko „Kompletní inzerát“** (odkaz na Sauto/Tipcars…) a krátký formulář „Mám zájem“.
- Služby (výkup, financování, prověření historie, auto na přání), postup nákupu, o nás, kontakt.
- Funguje na mobilu, světlý i tmavý režim.

**Administrace** (odkaz nahoře „Administrace (ukázka)“)
- Přidat / upravit / smazat vůz, nahrát fotky, změnit stav jedním kliknutím.
- V prototypu se změny ukládají jen v prohlížeči. V ostré verzi bude přihlášení a data na serveru.

## Postup krok za krokem

1. **Oslovení**: krátká zpráva přes Messenger (návrh níže) + odkaz na prototyp. Nic netlačit, nabídnout kafe a ukázku.
2. **Schůzka (30 min)**: zjistit:
   - kde dnes inzeruje (Sauto, Tipcars, Bazoš, FB Marketplace) a kolik aut má průměrně skladem,
   - jestli používá nějaký program na hromadné inzerování (pak se dá napojit automatický import, viz varianta B),
   - kdo bude auta na web zadávat (on sám? z mobilu?),
   - doménu a hosting autovodny.cz: kdo je spravuje, přístupy,
   - jaké služby opravdu nabízí (výkup, leasing, dovoz…), aby web neslibovat nic navíc.
3. **Úprava návrhu**: jeho logo/barvy, skutečné texty, fotka majitele, reálná auta.
4. **Vývoj ostré verze** (1–2 týdny po večerech).
5. **Obsah**: zadat aktuální auta, nafotit provozovnu, pár vět o něm.
6. **Spuštění**: přesměrovat doménu, Google vizitka (Firemní profil), Search Console, měření návštěvnosti.
7. **Předání**: 20 min zaškolení do administrace + jednoduchý návod.

## Technické varianty administrace

| Varianta | Jak funguje | Pro | Proti |
|---|---|---|---|
| **A) Vlastní jednoduchá administrace** *(doporučuji na start)* | Web + malá administrace (PHP + databáze) na běžném českém hostingu. Zadává auta z mobilu. | Levný provoz, přesně na míru, rychlé | Auta zadává ručně (kromě inzerce na Sauto) |
| **B) Automatický import** | Pokud používá inzertní software s exportem (XML feed), web si auta stahuje sám. | Nulová práce navíc | Závisí na jeho softwaru, zjistit na schůzce |
| **C) WordPress + plugin** | Hotový redakční systém | Známé prostředí | Těžší, pomalejší, nutné aktualizace a zabezpečení |

## Orientační cena (doladit podle rozsahu)

- Prototyp: zdarma.
- Ostrý web + administrace (varianta A): **cca 15–30 tis. Kč** jednorázově.
- Hosting + doména: **cca 1–3 tis. Kč / rok** (doménu už má).
- Volitelná správa (zálohy, drobné úpravy): **cca 500–1 000 Kč / měsíc**.

## Návrh první zprávy (Messenger)

> Ahoj, tady [jméno], myslím, že se známe od vidění z Olomouce 🙂 Všiml jsem si, že prodáváš auta. Dělám weby a zkusil jsem pro tebe nanečisto připravit, jak by mohl vypadat nový web autobazaru: s přehlednou nabídkou aut, odkazy na tvoje inzeráty a jednoduchou administrací, kde si auta přidáváš sám i z mobilu. Ukázka je tady: [odkaz]. Kdyby tě to zaujalo, rád to probereme u kafe. Je to nezávazné.

*(Jméno a tón si uprav podle sebe.)*
