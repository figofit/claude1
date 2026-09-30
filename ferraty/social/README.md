# Obrázky pro sociální sítě

Karusel 6 obrázků (1080×1350 px, formát 4:5 pro Instagram/Facebook feed) — souhrnné
statistiky + kompletní žebříčky, ve stejné tmavé/teal grafice jako widget pro web (`../widget/`).

1. `moje-hory-social-4x5-1-stats.png` — celkové statistiky (výstupy, země, výškové kategorie)
2. `moje-hory-social-4x5-2-vrcholy-1.png` — Nej vrcholy, žebříček 1–7
3. `moje-hory-social-4x5-3-vrcholy-2.png` — Nej vrcholy, žebříček 8–14
4. `moje-hory-social-4x5-4-vrcholy-3.png` — Nej vrcholy, žebříček 15–20
5. `moje-hory-social-4x5-5-ferraty.png` — Nej ferraty
6. `moje-hory-social-4x5-6-hrebenovky.png` — Nej hřebenovky

Odpovídající `.html` soubory jsou zdrojové šablony (čísla propsaná staticky).

**Nej vrcholy zahrnuje úplně všechny TOP vrcholy** (pole `featured` u záznamů typu `vrchol`),
ne jen prvních pár — proto se to rozpadá na víc slidů. Nejde o žebříček "nejvyšších bodů na
světě", ale o osobní TOP výběr (`featured: true`) seřazený podle nadmořské výšky — takže když
tam něco chybí, zkontroluj nejdřív, jestli daný záznam vůbec má `featured: true`.

## Jak přegenerovat

Je to statický snímek, ne živá appka — čísla se propíšou v okamžiku generování. Až přibudou
nové výstupy nebo se změní seznam TOP výstupů a budeš chtít nový karusel:

```bash
cd ferraty/social
python3 generate_carousel.py   # přegeneruje slidy 2+ (vrcholy/ferraty/hřebenovky) z dat
```

Slide 1 (celkové statistiky) se zatím generuje ručně úpravou `moje-hory-social-4x5-1-stats.html`
— stejný princip, jen zatím bez samostatného skriptu.

Po úpravě `.html` šablon je potřeba udělat snímek obrazovky (1080×1350, `deviceScaleFactor: 2`
pro ostrý výstup) — o to požádej v konverzaci, screenshotovací nástroj (Playwright) v tomhle
repu není.

Seznam "Nej vrcholy" se automaticky stránkuje po `PAGE_SIZE` (7) položkách na slide, ať se
nikdy nic tiše neořízne — když TOP vrcholů přibude, prostě vznikne další slide navíc
(`moje-hory-social-4x5-<N>-vrcholy-<stránka>.html`). Ferraty a hřebenovky se zatím vejdou
na jeden slide každé; kdyby jich bylo víc než cca 7–8, budou potřebovat stejné stránkování.
