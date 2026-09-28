#!/usr/bin/env python3
"""Sestaví HTML souhrn sezóny 2001/2002 ze sezona.json.

Výstupy (vedle tohoto skriptu):
  wordpress-blok.html    – vložit do bloku „Vlastní HTML“ ve WordPressu
  sezona-2001-2002.html  – samostatná stránka pro náhled

Spuštění: python3 build.py
"""
import json
import sys
from collections import Counter, defaultdict
from datetime import date
from html import escape
from pathlib import Path

DIR = Path(__file__).parent
sys.path.insert(0, str(DIR.parent / "fk-nove-sady-spolecne"))
from fkns import CSS, PAGE_CSS, nb, pitch, plural, typo, write_outputs  # noqa: E402

DATA = json.loads((DIR / "sezona.json").read_text(encoding="utf-8"))
TEAM = "Nové Sady"
PLAYERS = DATA["hraci"]
ME = next(pid for pid, p in PLAYERS.items() if p.get("ja"))
DNY = ["po", "út", "st", "čt", "pá", "so", "ne"]


def mark_me(pid, text):
    return f'<mark class="fk-me">{text}</mark>' if pid == ME else text


# ---------- výpočty ----------
games = []
for m in DATA["zapasy"]:
    h, a = map(int, m["skore"].split(":"))
    home = m["domaci"] == TEAM
    gf, ga = (h, a) if home else (a, h)
    res = "v" if gf > ga else ("r" if gf == ga else "p")
    games.append({**m, "gf": gf, "ga": ga, "res": res, "home": home,
                  "opp": m["hoste"] if home else m["domaci"]})


def record(gs):
    c = Counter(g["res"] for g in gs)
    return {"z": len(gs), "v": c["v"], "r": c["r"], "p": c["p"],
            "gf": sum(g["gf"] for g in gs), "ga": sum(g["ga"] for g in gs),
            "b": 3 * c["v"] + c["r"]}


total = record(games)
halves = {c: record([g for g in games if g["cast"] == c]) for c in ("podzim", "jaro")}

unbeaten = next((i for i, g in enumerate(games) if g["res"] == "p"), len(games))
streak = best = 0
for g in games:
    streak = streak + 1 if g["res"] == "v" else 0
    best = max(best, streak)
clean = sum(1 for g in games if g["ga"] == 0)
big = max(games, key=lambda g: (g["gf"] - g["ga"], g["gf"]))

tally = Counter()
by_opp = defaultdict(Counter)
for g in games:
    for pid, n in g["strelci"] or []:
        tally[pid] += n
        by_opp[pid][g["opp"]] += n
known = sum(tally.values())
missing = [g for g in games if g["strelci"] is None]

# Kontrola proti tomu, co jsme spolu prošli.
assert (total["v"], total["r"], total["p"], total["b"]) == (17, 3, 2, 54), total
assert (total["gf"], total["ga"]) == (75, 24), total
assert (unbeaten, best, clean) == (20, 12, 10), (unbeaten, best, clean)
assert (big["opp"], big["gf"], big["ga"]) == ("Velký Týnec", 8, 0), big
assert known == 48 and len(missing) == 9, (known, len(missing))
for g in games:
    if g["strelci"] is not None:
        assert sum(n for _, n in g["strelci"]) == g["gf"], g["n"]

TABLE = DATA["tabulka_po_19_kole"]
TOP21 = DATA["tabulka_po_21_kole_prvnich_7"]
for _, team, z, v, r, pr, sk, b in TABLE + TOP21:
    assert z == v + r + pr and b == 3 * v + r, team
assert sum(row[3] for row in TABLE) == sum(row[5] for row in TABLE)
assert sum(int(row[6].split(":")[0]) for row in TABLE) == sum(int(row[6].split(":")[1]) for row in TABLE)


# ---------- HTML ----------
def name_of(pid):
    return "vlastní gól" if pid == "vlastni" else PLAYERS[pid]["kratce"]


def scorers_text(g):
    if g["strelci"] is None:
        return '<span class="c none">střelci neuvedeni</span>'
    if not g["strelci"]:
        return '<span class="c none">bez gólů</span>'
    parts = []
    for pid, n in g["strelci"]:
        label = nb(name_of(pid)) + (f"&nbsp;{n}" if n > 1 else "")
        parts.append(mark_me(pid, label))
    if g.get("strelci_pozn"):
        parts.append(escape(g["strelci_pozn"]))
    cls = "c hand" if g.get("strelci_zdroj") == "pamet" else "c"
    return f'<span class="{cls}">{", ".join(parts)}</span>'


RES_WORD = {"v": "výhra", "r": "remíza", "p": "prohra"}


def chip(res, tag="li", extra=""):
    return (f'<{tag} class="fk-chip {res}"{extra}>'
            f'{res.upper()}</{tag}>')


def form_row(label, cast):
    chips = "".join(
        chip(g["res"], extra=f' title="{g["n"]}. {escape(g["domaci"])} – '
             f'{escape(g["hoste"])} {g["skore"]}" aria-label="{g["n"]}. zápas: '
             f'{RES_WORD[g["res"]]} {g["gf"]}:{g["ga"]}"')
        for g in games if g["cast"] == cast)
    return (f'<div class="fk-form-row"><span class="fk-form-lab">{label}</span>'
            f'<ol class="fk-chips">{chips}</ol></div>')


def game_row(g):
    d = ""
    if g.get("datum"):
        dt = date.fromisoformat(g["datum"])
        d = f'<span class="d">{DNY[dt.weekday()]} {dt.day}.&nbsp;{dt.month}.</span>'
    home = nb(g["domaci"])
    away = nb(g["hoste"])
    if g["home"]:
        home = f"<b>{home}</b>"
    else:
        away = f"<b>{away}</b>"
    note = f'<small>{escape(g["pozn"])}</small>' if g.get("pozn") else ""
    if g.get("moje"):
        card = '<i class="fk-yc" aria-hidden="true"></i>' if g.get("zluta") else ""
        note += f'<small class="fk-hand">{card}{typo(g["moje"])}</small>'
    ht = f'<small>({g["polocas"]})</small>' if g.get("polocas") else ""
    res_title = ' title="' + RES_WORD[g["res"]] + '"'
    return (f'<li class="fk-g"><span class="k">{g["n"]}.</span>{d}'
            f'<span class="m">{home} – {away}{note}</span>'
            f'<span class="s">{g["skore"]}{ht}</span>'
            f'{chip(g["res"], tag="span", extra=res_title)}'
            f'{scorers_text(g)}</li>')


def half_block(title, cast):
    r = halves[cast]
    summary = (f'{r["v"]} {plural(r["v"], "výhra", "výhry", "výher")} · '
               f'{r["r"]} {plural(r["r"], "remíza", "remízy", "remíz")} · '
               f'{r["p"]} {plural(r["p"], "prohra", "prohry", "proher")} · '
               f'skóre {r["gf"]}:{r["ga"]} · {r["b"]} {plural(r["b"], "bod", "body", "bodů")}')
    rows = "".join(game_row(g) for g in games if g["cast"] == cast)
    return (f'<div class="fk-half"><div class="fk-half-h"><h4>{title}</h4><p>{summary}</p></div>'
            f'<div class="fk-cols" aria-hidden="true"><span>kolo</span><span>datum</span>'
            f'<span>zápas</span><span>skóre</span><span></span><span>naši střelci</span></div>'
            f'<ol class="fk-list">{rows}</ol></div>')


POSTS = [("brankář", "Brankáři"), ("obránce", "Obránci"),
         ("záložník", "Záložníci"), ("útočník", "Útočníci"), (None, "Hrál také")]


def roster():
    groups = []
    for post, label in POSTS:
        dds = []
        for pid, p in PLAYERS.items():
            if p["post"] != post:
                continue
            n = tally[pid]
            goals = f'<span class="g">{n} {plural(n, "gól", "góly", "gólů")}</span>' if n else ""
            if p.get("role"):
                goals = f'<span class="g">{escape(p["role"])}</span>'
            dds.append(f'<dd><span>{mark_me(pid, nb(p["jmeno"]))}</span>{goals}</dd>')
        if dds:
            groups.append(f'<div class="fk-grp"><dt>{label}</dt>{"".join(dds)}</div>')
    groups.append(f'<div class="fk-grp"><dt>Trenér</dt><dd><span>{nb(DATA["trener"])}</span></dd></div>')
    return (f'<div class="fk-roster"><h4>Soupiska · {len(PLAYERS)} hráčů</h4>'
            f'<dl>{"".join(groups)}</dl></div>')


def league_table(rows, caption):
    top = max(row[7] for row in TABLE + TOP21)  # stejné měřítko pruhů pro obě tabulky
    body = []
    for pos, team, z, v, r, pr, sk, b in rows:
        cls = ' class="us"' if team == "N. Sady" else ""
        body.append(
            f'<tr{cls}><td class="ps">{pos}.</td><td class="tm">{nb(team)}'
            f'<span class="pb" style="width:{b / top * 100:.1f}%" aria-hidden="true"></span></td>'
            f'<td>{z}</td><td>{v}</td><td>{r}</td><td>{pr}</td><td class="sk">{sk}</td>'
            f'<td class="pts">{b}</td></tr>')
    head = ('<thead><tr><th class="ps"><span class="fk-sr">Pořadí</span></th><th class="tm">Tým</th>'
            '<th title="zápasy">Z</th><th title="výhry">V</th><th title="remízy">R</th>'
            '<th title="prohry">P</th><th>Skóre</th><th>Body</th></tr></thead>')
    return (f'<div class="fk-tbl-wrap"><table class="fk-tbl"><caption class="fk-sr">{caption}</caption>'
            f'{head}<tbody>{"".join(body)}</tbody></table></div>')


def scorer_bars():
    top = max(tally.values())
    order = sorted((pid for pid in tally if pid != "vlastni"),
                   key=lambda pid: (-tally[pid], PLAYERS[pid]["kratce"]))
    rows = []
    for pid in order + (["vlastni"] if "vlastni" in tally else []):
        n = tally[pid]
        width = f"{n / top * 100:.1f}%"
        if pid == "vlastni":
            nm, cls, tip = "vlastní gól soupeře", "fk-bar og", ""
        else:
            nm, cls = PLAYERS[pid]["kratce"], "fk-bar"
            opp = sorted(by_opp[pid].items(), key=lambda kv: -kv[1])
            tip = ('<span class="fk-tip" role="tooltip">Góly podle soupeře: '
                   + " · ".join(f"{nb(o)}&nbsp;<b>{k}</b>" for o, k in opp) + "</span>")
        label = mark_me(pid, nb(nm))
        rows.append(
            f'<li class="{cls}" tabindex="0" aria-label="{escape(nm)}: {n} '
            f'{plural(n, "gól", "góly", "gólů")}"><span class="nm">{label}</span>'
            f'<span class="track" aria-hidden="true"><span class="fill" style="width:{width}"></span>'
            f'<span class="val">{n}</span></span>{tip}</li>')
    return f'<ol class="fk-bars">{"".join(rows)}</ol>'


t = total
facts = [
    (str(unbeaten), "zápasů v řadě bez porážky od začátku sezóny"),
    (str(best), "výher za sebou"),
    (str(clean), "zápasů bez obdrženého gólu"),
    (f'{big["gf"]}:{big["ga"]}', "nejvyšší výhra, ve&nbsp;Velkém Týnci"),
]
facts_html = "".join(f'<li class="fk-fact"><b>{v}</b><span>{txt}</span></li>' for v, txt in facts)

line_sr = (f'Konečné pořadí: 1. místo. {t["z"]} {plural(t["z"], "zápas", "zápasy", "zápasů")}, '
           f'{t["v"]} {plural(t["v"], "výhra", "výhry", "výher")}, '
           f'{t["r"]} {plural(t["r"], "remíza", "remízy", "remíz")}, '
           f'{t["p"]} {plural(t["p"], "prohra", "prohry", "proher")}, skóre {t["gf"]}:{t["ga"]}, '
           f'{t["b"]} {plural(t["b"], "bod", "body", "bodů")}.')
line_cells = ["1.", "N.&nbsp;Sady", t["z"], t["v"], t["r"], t["p"], f'{t["gf"]}:{t["ga"]}', t["b"]]
line_html = (
    '<div class="fk-line" aria-hidden="true">'
    '<span class="h"></span><span class="h"></span><span class="h">Z</span><span class="h">V</span>'
    '<span class="h">R</span><span class="h">P</span><span class="h">Skóre</span><span class="h">Body</span>'
    + "".join(f'<span class="c{" team" if i == 1 else ""}{" pos" if i == 0 else ""}">{v}</span>'
              for i, v in enumerate(line_cells))
    + f'</div><p class="fk-sr">{line_sr}</p>')

missing_goals = sum(g["gf"] for g in missing)
memory_notes = " ".join(typo(g["pamet_veta"]) for g in games if g.get("pamet_veta"))
us19 = next(row for row in TABLE if row[1] == "N. Sady")
lead19 = us19[7] - TABLE[1][7]
us21, second21 = TOP21[0], TOP21[1]
assert us21[1] == "N. Sady" and second21[1] == "Černovír"
lead21 = us21[7] - second21[7]
mem_html = "".join(f"<li>{typo(m)}</li>" for m in DATA["vzpominky"])
lede = (f'Vítězové I.&nbsp;třídy, skupiny A. Ročníky {typo(DATA["rocniky"])}, '
        f'trenér {nb(DATA["trener"])}.')
me_name = PLAYERS[ME]["jmeno"]

SECTION = f"""<section id="fkns" lang="cs" aria-labelledby="fkns-h">
<header class="fk-hero">
<p class="fk-eyebrow">Starší žáci</p>
<h2 id="fkns-h" class="fk-title">FK Nové Sady <span>2001/2002</span></h2>
<p class="fk-lede">{lede}</p>
{line_html}
<div class="fk-form">{form_row("Podzim", "podzim")}{form_row("Jaro", "jaro")}<p class="fk-legend">{chip("v", "span", ' aria-hidden="true"')} výhra {chip("r", "span", ' aria-hidden="true"')} remíza {chip("p", "span", ' aria-hidden="true"')} prohra</p></div>
<ul class="fk-facts">{facts_html}</ul>
</header>
<section class="fk-sec" aria-labelledby="fkns-tabulka">
<div class="fk-sec-head"><h3 id="fkns-tabulka" class="fk-h3">Tabulka</h3><p class="fk-kicker">podle novin</p></div>
<p class="fk-intro">Čísla jsou přesně tak, jak je noviny otiskly.</p>
<div class="fk-half"><div class="fk-half-h"><h4>Po 19. kole</h4><p>Nové Sady po {us19[2]} zápasech vedly o {lead19} {plural(lead19, "bod", "body", "bodů")} před Černovírem.</p></div>
{league_table(TABLE, "Tabulka po 19. kole")}</div>
<div class="fk-half"><div class="fk-half-h"><h4>Po 21. kole</h4><p>Výstřižek končí 7. místem. Nové Sady po {us21[2]} zápasech vedly o {lead21} {plural(lead21, "bod", "body", "bodů")}, {us21[7]} proti {second21[7]}.</p></div>
{league_table(TOP21, "Tabulka po 21. kole, prvních 7 míst")}</div>
</section>
<section class="fk-sec" aria-labelledby="fkns-sestava">
<div class="fk-sec-head"><h3 id="fkns-sestava" class="fk-h3">Základní sestava</h3><p class="fk-kicker">4–3–3</p></div>
<div class="fk-team">{pitch(DATA['sestava'], PLAYERS, ME)}{roster()}</div>
<p class="fk-note">{escape(DATA["sestava"]["poznamka"])}</p>
</section>
<section class="fk-sec" aria-labelledby="fkns-strelci">
<div class="fk-sec-head"><h3 id="fkns-strelci" class="fk-h3">Střelci</h3><p class="fk-kicker">{known} z {t["gf"]} gólů</p></div>
<p class="fk-intro">Podle novinových zpráv. {memory_notes} U {len(missing)} zápasů střelci chybí, takže {missing_goals} gólů zůstává bez jména.</p>
{scorer_bars()}
</section>
<section class="fk-sec" aria-labelledby="fkns-zapasy">
<div class="fk-sec-head"><h3 id="fkns-zapasy" class="fk-h3">Všech {t["z"]} zápasů</h3><p class="fk-kicker">v pořadí, jak se hrály</p></div>
{half_block("Podzim 2001", "podzim")}
{half_block("Jaro 2002", "jaro")}
</section>
<section class="fk-sec" aria-labelledby="fkns-vzpominky">
<div class="fk-sec-head"><h3 id="fkns-vzpominky" class="fk-h3">Vzpomínky</h3><p class="fk-kicker">{nb(me_name)}</p></div>
<ul class="fk-mem">{mem_html}</ul>
</section>
<p class="fk-foot">Sestaveno z novinových výstřižků (I.&nbsp;tř., sk.&nbsp;A – žáci starší), ručně psaného rozlosování a tištěného rozpisu zápasů. V závorce je poločas, pokud ho noviny uvedly.</p>
</section>"""

write_outputs(DIR, "Nové Sady 2001/02", CSS, SECTION, PAGE_CSS, "sezona-2001-2002.html")

print(f"Bilance {t['v']}-{t['r']}-{t['p']}, skóre {t['gf']}:{t['ga']}, {t['b']} bodů")
print("Střelci:", ", ".join(f"{name_of(p)} {n}" for p, n in tally.most_common()))
print("Zapsáno: wordpress-blok.html, sezona-2001-2002.html")
