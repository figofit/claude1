# Obrázky pro sociální sítě

Karusel 4 obrázků (1080×1350 px, formát 4:5 pro Instagram/Facebook feed) — souhrnné
statistiky + tři žebříčky, ve stejné tmavé/teal grafice jako widget pro web (`../widget/`).

1. `moje-hory-social-4x5-1-stats.png` — celkové statistiky (výstupy, země, výškové kategorie)
2. `moje-hory-social-4x5-2-vrcholy.png` — Nej vrcholy (top 7 podle nadmořské výšky)
3. `moje-hory-social-4x5-3-ferraty.png` — Nej ferraty
4. `moje-hory-social-4x5-4-hrebenovky.png` — Nej hřebenovky

Odpovídající `.html` soubory jsou zdrojové šablony (čísla propsaná staticky).

## Jak přegenerovat

Je to statický snímek, ne živá appka — čísla se propíšou v okamžiku generování. Až přibudou
nové výstupy a budeš chtít nový karusel:

```bash
cd ferraty/social
python3 generate_carousel.py   # přegeneruje slidy 2–4 (vrcholy/ferraty/hřebenovky) z dat
```

Slide 1 (celkové statistiky) se zatím generuje ručně úpravou `moje-hory-social-4x5-1-stats.html`
— stejný princip, jen zatím bez samostatného skriptu.

Po úpravě `.html` šablon je potřeba udělat snímek obrazovky (1080×1350, `deviceScaleFactor: 2`
pro ostrý výstup) — o to požádej v konverzaci, screenshotovací nástroj (Playwright) v tomhle
repu není.

Pokud se seznam TOP vrcholů rozroste, žebříček v `generate_carousel.py` je omezený na top 7,
ať se vejde do 1350 px výšky bez přetečení (ferraty/hřebenovky mají zatím míň položek, takže
tam limit neřeší).
