# Widget pro michaldokoupil.cz (WordPress)

Samostatný HTML/CSS "výcuc" ze statistik a přehledu appky — pro vložení do WordPress
stránky (Custom HTML blok / Elementor HTML widget apod.), bez nutnosti tahat celou appku
na web.

## Jak to funguje

`generate_widget.py` přečte `../data/ferraty.json`, spočítá pár klíčových čísel
(výstupy celkem, země, nejvyšší bod, vrcholy nad 2500/3000 m, nejnáročnější jednodenní
převýšení) a posledních pár TOP výstupů, a vygeneruje `moje-hory-widget.html` —
kompletně samostatný kus HTML + `<style>` (vše naschované pod třídou `.mh-widget`,
ať se to nebije s tématem WP a nic z okolí naopak nepřebírá).

**Je to statický snímek, ne živá appka** — čísla se propíšou v okamžiku generování.
Když přibudou nové výstupy a chceš aktualizovat widget na webu:

```bash
cd ferraty/widget
python3 generate_widget.py
```

a obsah souboru `moje-hory-widget.html` znovu vlož do WP na místo starého kódu.

## Vzhled

Použitá paleta i fonty (Fraunces + Inter/systémové) kopírují barvy appky "Moje hory"
(zemitá/horská paleta — `--mh-accent: #af5330`, `--mh-forest: #33513c` atd., definované
jako CSS proměnné přímo v `<style>` widgetu). Pokud se to má sladit přesněji s designem
michaldokoupil.cz, stačí v `generate_widget.py` v bloku `--mh-*` proměnných přepsat hex
kódy a název fontu — nic jiného se měnit nemusí.
