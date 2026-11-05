# Srub Pleče – nový web (návrh)

Statický jednostránkový web (HTML/CSS/JS, bez frameworku a bez buildu) pro roubený srub
Srub Pleče, Jindřichov 423. Nahrajete ho na libovolný hosting a funguje. Platí se jen
doména a hosting, ne měsíční předplatné jako u Lodgify.

Lokální náhled: `python3 -m http.server` ve složce `srub-plece/` a otevřít `http://localhost:8000`.

## Co web umí

- Hero s animovanou ilustrací srubu (kouř z komína, světla v oknech, světlušky). Nepotřebuje žádnou fotku.
- Sekce: vybavení, příběh stavby (podle reportáže v časopise Dřevostavby), galerie s lightboxem,
  ceník, kalendář obsazenosti s výběrem termínu, poptávkový formulář, hodnocení, okolí, FAQ, kontakt s mapou.
- Termín vybraný v kalendáři se sám vyplní do poptávky. Formulář otevře e-mail s předvyplněnou poptávkou na `srub.plece@gmail.com`.
- Mobilní verze s plovoucím tlačítkem „Ověřit volný termín“, data `schema.org/LodgingBusiness` pro Google, OG tagy.

## Fotky (chybí, je potřeba je doplnit)

Dokud fotka chybí, ukáže se na jejím místě stylová zástupná dlaždice s popiskem.
Stačí nahrát soubory pod těmito názvy do `images/` (JPG, ideálně na šířku 1600–2000 px):

| soubor | co na ní má být |
|---|---|
| `exterier.jpg` | srub zvenku (hlavní fotka) |
| `obyvak.jpg` | obývák s krbem |
| `sauna.jpg` | sauna |
| `kad.jpg` | venkovní káď (fotka na výšku) |
| `kuchyne.jpg` | kuchyně |
| `loznice.jpg` | ložnice |
| `potok.jpg` | potok / pozemek |
| `zima.jpg` | srub v zimě |
| `stavba.jpg` | fotka ze stavby 2021 (sekce Příběh, na výšku) |
| `og.jpg` | náhled pro sdílení na Facebooku, 1200×630 |

## Než web pustíme ven: ověřit s majitelkou

Údaje jsem posbíral z veřejných inzerátů (e-chalupy.cz, Firmy.cz, Google, Dřevostavby).
Některé si mezi sebou odporují nebo můžou být zastaralé:

- **Psi**: e-chalupy a Google uvádějí „mazlíčci vítáni“, Triping/Booking „zvířata nejsou povolena“.
- **Ceník**: převzatý z e-chalup (léto 20 000 / 35 000, zima 15 000 / 30 000, mimo sezónu 15 000 / 28 000,
  Vánoce 35 000, Silvestr 45 000, noc od 4 000 Kč). Vánoce a Silvestr byly vypsané pro 2025/26.
  Doplnit, které měsíce patří do jaké sezóny.
- **Hodnocení**: Google 5,0 / 10 recenzí, e-chalupy 5,0 / 4. Počet recenzí na Firmy.cz neznám.
- **Parkování zdarma**, **venkovní káď**, **pračka**, **dětský koutek**: ověřit, že platí.
- **Příběh**: text je podle reportáže v Dřevostavbách. Zeptat se, jestli chce být víc osobní (jméno, fotka).
- **Okolí**: tipy na výlety jsou bez kilometrů a časů. Případně doplnit podle mapy.

## Obsazenost

V `script.js` je nahoře pole `OBSAZENO`, kam se zapisují obsazené termíny ve tvaru `["příjezd", "odjezd"]`.
Pokud bude chtít kalendář synchronizovat s Bookingem nebo e-chalupami automaticky, lze ho napojit
na jejich iCal export malým skriptem na hostingu (PHP/cron), který pole generuje.

## Ostrý provoz

1. Ověřit na https://www.nic.cz/whois/ držitele a expiraci domény `srubplece.cz`. Pokud expirovala, hned ji obnovit.
2. Nahrát obsah `srub-plece/` do kořene hostingu a zapnout HTTPS.
3. Formulář: místo `mailto:` napojit na službu, která pošle e-mail přímo (např. Web3Forms nebo PHP `mail()` na hostingu).
4. Nastavit adresu webu v Google vizitce, Firmy.cz a na e-chalupách.
