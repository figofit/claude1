#!/usr/bin/env python3
"""Sestaví HTML souhrn sezóny 2003/2004 ze sezona.json (3. díl, první rok v dorostu).

Výstupy (vedle tohoto skriptu):
  wordpress-blok.html    – vložit do bloku „Vlastní HTML“ ve WordPressu
  sezona-2003-2004.html  – samostatná stránka pro náhled

Spuštění: python3 build.py
"""
import json
import sys
from collections import Counter
from datetime import date
from html import escape
from pathlib import Path

DIR = Path(__file__).parent
sys.path.insert(0, str(DIR.parent / "fk-nove-sady-spolecne"))
from fkns import CSS, PAGE_CSS, nb, plural, scoped, typo, write_outputs  # noqa: E402

ROOT = "fkns0304"
TEAM = "Nové Sady"
DATA = json.loads((DIR / "sezona.json").read_text(encoding="utf-8"))
DNY = ["po", "út", "st", "čt", "pá", "so", "ne"]
RES_WORD = {"v": "výhra", "r": "remíza", "p": "prohra"}

games = []
for g in DATA["zapasy"]:
    gf, ga = map(int, g["skore"].split(":"))  # Nové Sady : soupeř
    games.append({**g, "gf": gf, "ga": ga, "res": "v" if gf > ga else ("r" if gf == ga else "p")})
assert len(games) == 26 and [g["kolo"] for g in games] == list(range(1, 27))

c = Counter(g["res"] for g in games)
team = {"v": c["v"], "r": c["r"], "p": c["p"], "gf": sum(g["gf"] for g in games),
        "ga": sum(g["ga"] for g in games)}
played = [g for g in games if g["min"] > 0]
minutes = round(sum(g["min"] for g in games))
goals = sum(g.get("goly", 0) for g in games)
full = sum(1 for g in games if g["min"] >= 90)
half_min = {p: round(sum(g["min"] for g in games if g["cast"] == p)) for p in ("podzim", "jaro")}
assert (len(played), minutes, goals, full) == (25, 872, 4, 3), (len(played), minutes, goals, full)


def when(g):
    dt = date.fromisoformat(g["datum"])
    return f"{DNY[dt.weekday()]} {dt.day}.&nbsp;{dt.month}."


def minutes_label(g):
    m = g["min"]
    if m >= 90:
        return "celý zápas"
    if m == 0.5:
        return "30 sekund"
    if m == 0:
        return "nehrál jsem"
    if "2. poločas" in g["pozn"]:
        return "celý 2. poločas"
    if g["pozn"].startswith("hrál jsem celé"):
        return "celé 2 minuty"
    if "–" in g["pozn"]:
        return g["pozn"].replace("hrál jsem ", "")
    return f"{'cca ' if 'cca' in g['pozn'] or 'asi' in g['pozn'] else ''}{round(m)} minut"


def match_title(g):
    us, them = "<b>Nové&nbsp;Sady</b>", nb(g["souper"])
    return (f"{us} – {them}", f'{g["gf"]}:{g["ga"]}') if g["doma"] else (f"{them} – {us}", f'{g["ga"]}:{g["gf"]}')


def chip(res, tag="span", extra=""):
    return f'<{tag} class="fk-chip {res}"{extra}>{res.upper()}</{tag}>'


def form_row(label, part):
    chips = "".join(
        chip(g["res"], "li", f' title="{g["kolo"]}. kolo: {escape(g["souper"])} {g["skore"]}"'
                             f' aria-label="{g["kolo"]}. kolo: {RES_WORD[g["res"]]} {g["skore"]}"')
        for g in games if g["cast"] == part)
    return (f'<div class="fk-form-row"><span class="fk-form-lab">{label}</span>'
            f'<ol class="fk-chips">{chips}</ol></div>')


def bar(g):
    h = g["min"] / 90 * 100
    title, score = match_title(g)
    goal = g.get("goly", 0)
    gl = f'<span class="gl">{goal}</span>' if goal else ""
    goal_txt = f' · <b>{goal} {plural(goal, "gól", "góly", "gólů")}</b>' if goal else ""
    tip = (f'<span class="tip" role="tooltip">{g["kolo"]}. kolo · {title} {score} · '
           f'{minutes_label(g)}{goal_txt}</span>')
    fill = f'<span class="fill" style="height:{h:.1f}%"></span>' if g["min"] > 0 else '<span class="zero"></span>'
    aria = f'{g["kolo"]}. kolo, {g["souper"]}: {minutes_label(g)}' + (f', {goal} {plural(goal, "gól", "góly", "gólů")}' if goal else "")
    return (f'<li class="col" tabindex="0" aria-label="{escape(aria)}"><span class="plot">{gl}{fill}</span>'
            f'<span class="kn">{g["kolo"]}</span>{tip}</li>')


def chart():
    groups = "".join(
        f'<div class="grp"><ol class="bars">{"".join(bar(g) for g in games if g["cast"] == part)}</ol>'
        f'<p class="lab">{label} · {half_min[part]} minut</p></div>'
        for part, label in (("podzim", "Podzim 2003"), ("jaro", "Jaro 2004")))
    return (f'<figure class="fk-min" aria-label="Moje minuty v jednotlivých zápasech">'
            f'<span class="ax a90">90</span><span class="ax a45">45</span>'
            f'<div class="grid"><span class="g90"></span><span class="g45"></span></div>'
            f'<div class="grps">{groups}</div></figure>')


def game_row(g):
    title, score = match_title(g)
    goal = g.get("goly", 0)
    mine = minutes_label(g) + (f', {goal} {plural(goal, "gól", "góly", "gólů")} ({g["gol_pozn"]})' if goal else "")
    res_title = ' title="' + RES_WORD[g["res"]] + '"'
    return (f'<li class="fk-g"><span class="k">{g["kolo"]}.</span><span class="d">{when(g)}</span>'
            f'<span class="m">{title}</span><span class="s">{score}</span>'
            f'{chip(g["res"], extra=res_title)}'
            f'<span class="c hand">{typo(mine)}</span></li>')


def half_block(title, part):
    gs = [g for g in games if g["cast"] == part]
    cc = Counter(g["res"] for g in gs)
    summary = (f'{cc["v"]} {plural(cc["v"], "výhra", "výhry", "výher")} · {cc["r"]} {plural(cc["r"], "remíza", "remízy", "remíz")} · '
               f'{cc["p"]} {plural(cc["p"], "prohra", "prohry", "proher")} · skóre {sum(g["gf"] for g in gs)}:{sum(g["ga"] for g in gs)}')
    return (f'<div class="fk-half"><div class="fk-half-h"><h4>{title}</h4><p>{summary}</p></div>'
            f'<div class="fk-cols" aria-hidden="true"><span>kolo</span><span>datum</span><span>zápas</span>'
            f'<span>skóre</span><span></span><span>já</span></div>'
            f'<ol class="fk-list">{"".join(game_row(g) for g in gs)}</ol></div>')


stats = [(str(len(played)), f"{plural(len(played), 'zápas', 'zápasy', 'zápasů')} na hřišti z {len(games)}"),
         (f"≈&nbsp;{minutes}", "odehraných minut"),
         (str(goals), f"{plural(goals, 'gól', 'góly', 'gólů')}, všechny na jaře"),
         (str(full), f"{plural(full, 'celý zápas', 'celé zápasy', 'celých zápasů')}")]
stats_html = "".join(f'<li class="fk-fact"><b>{v}</b><span>{t}</span></li>' for v, t in stats)
mem_html = "".join(f"<li>{typo(m)}</li>" for m in DATA["vzpominky"])

SECTION = f"""<section id="{ROOT}" lang="cs" aria-labelledby="{ROOT}-h">
<header class="fk-hero">
<p class="fk-eyebrow">Dorost</p>
<h2 id="{ROOT}-h" class="fk-title">FK Nové Sady <span>2003/2004</span></h2>
<p class="fk-lede">{typo(DATA["soutez"].replace(" – dorost", ""))}. První sezóna v dorostu, třetí rok mé kariéry.</p>
<div class="fk-mine" aria-hidden="true"><span><b>{len(played)}</b>zápasů</span><span><b>≈{minutes}</b>minut</span><span><b>{goals}</b>góly</span></div>
<p class="fk-sr">Odehrál jsem {len(played)} zápasů, zhruba {minutes} minut, a dal {goals} góly.</p>
<div class="fk-form">{form_row("Podzim", "podzim")}{form_row("Jaro", "jaro")}<p class="fk-legend">{chip("v", extra=' aria-hidden="true"')} výhra {chip("r", extra=' aria-hidden="true"')} remíza {chip("p", extra=' aria-hidden="true"')} prohra</p><p class="fk-team-rec">Tým celkem {team["v"]} {plural(team["v"], "výhra", "výhry", "výher")}, {team["r"]} {plural(team["r"], "remíza", "remízy", "remíz")}, {team["p"]} {plural(team["p"], "prohra", "prohry", "proher")}, skóre {team["gf"]}:{team["ga"]}.</p></div>
</header>
<section class="fk-sec" aria-labelledby="{ROOT}-minuty">
<div class="fk-sec-head"><h3 id="{ROOT}-minuty" class="fk-h3">Moje minuty</h3><p class="fk-kicker">zápas = 90 minut</p></div>
<p class="fk-intro">Na podzim jsem většinou naskakoval na pár minut, na jaře už jsem hrál víc a přišly první góly. Žluté číslo nad sloupcem jsou moje góly.</p>
{chart()}
<ul class="fk-facts">{stats_html}</ul>
</section>
<section class="fk-sec" aria-labelledby="{ROOT}-zapasy">
<div class="fk-sec-head"><h3 id="{ROOT}-zapasy" class="fk-h3">Všech {len(games)} zápasů</h3><p class="fk-kicker">1.&nbsp;třída, sk.&nbsp;B</p></div>
{half_block("Podzim 2003", "podzim")}
{half_block("Jaro 2004", "jaro")}
</section>
<section class="fk-sec" aria-labelledby="{ROOT}-vzpominky">
<div class="fk-sec-head"><h3 id="{ROOT}-vzpominky" class="fk-h3">Vzpomínky</h3><p class="fk-kicker">Michal „Figo“ Dokoupil</p></div>
<ul class="fk-mem">{mem_html}</ul>
</section>
<p class="fk-foot">Sestaveno z&nbsp;rozpisu zápasů s&nbsp;mými poznámkami. Minuty jsou odhad podle poznámek.</p>
</section>"""

EXTRA_CSS = """#fkns .fk-mine{position:relative;display:flex;flex-wrap:wrap;align-items:flex-end;gap:4px clamp(18px,5cqi,48px);width:max-content;max-width:100%;margin:26px 0 12px;padding:0 6px}
#fkns .fk-mine::before{content:"";position:absolute;inset:8% -12px 30% -12px;background:var(--marker);border-radius:3px 14px 5px 12px/12px 4px 10px 6px;transform:rotate(-.7deg);z-index:0}
#fkns .fk-mine span{position:relative;z-index:1;display:flex;flex-direction:column;font:700 12px/1.3 var(--f-type);letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
#fkns .fk-mine b{font:800 clamp(44px,10vw,84px)/1 var(--f-disp);font-size:clamp(44px,12cqi,84px);letter-spacing:0;text-transform:none;color:var(--ink)}
#fkns .fk-min{position:relative;margin:10px 0 0;padding:0 0 0 26px}
#fkns .fk-min .grid{position:absolute;left:26px;right:0;top:2px;height:170px;pointer-events:none;z-index:0}
#fkns .fk-min .grid span{position:absolute;left:0;right:0;border-top:1px solid var(--rule)}
#fkns .fk-min .g90{top:0}
#fkns .fk-min .g45{top:50%}
#fkns .fk-min .ax{position:absolute;left:0;font:700 11px/1 var(--f-type);color:var(--muted)}
#fkns .fk-min .a90{top:-4px}
#fkns .fk-min .a45{top:81px}
#fkns .fk-min .grps{position:relative;z-index:1;display:grid;grid-template-columns:1fr 1fr;gap:10px}
#fkns .fk-min .bars{display:grid;grid-template-columns:repeat(13,minmax(0,1fr));gap:2px}
#fkns .fk-min .col{display:flex;flex-direction:column;align-items:center;outline:none;cursor:default;border-radius:3px}
#fkns .fk-min .plot{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;width:100%;height:172px;padding-top:2px;border-bottom:1px solid var(--rule-2)}
#fkns .fk-min .fill{display:block;width:min(18px,80%);min-height:2px;background:var(--bar);border-radius:3px 3px 0 0}
#fkns .fk-min .zero{display:block;width:min(18px,80%);height:0;border-top:2px dotted var(--rule-2)}
#fkns .fk-min .gl{display:grid;place-items:center;width:18px;height:18px;margin-bottom:3px;border-radius:50%;background:var(--marker);font:800 12px/1 var(--f-disp);color:var(--ink)}
#fkns .fk-min .kn{margin-top:4px;font:400 10px/1 var(--f-type);color:var(--muted)}
#fkns .fk-min .lab{margin-top:8px;font:700 11px/1.3 var(--f-type);letter-spacing:.06em;text-transform:uppercase;color:var(--ink-2)}
#fkns .fk-min .tip{position:absolute;left:0;right:0;bottom:calc(100% + 6px);z-index:5;display:none;padding:7px 10px;border-radius:4px;background:var(--ink);color:#fff;font-size:13px;line-height:1.4;pointer-events:none}
#fkns .fk-min .tip b{color:var(--marker)}
#fkns .fk-min .col:hover .fill,#fkns .fk-min .col:focus-visible .fill{filter:brightness(1.15)}
#fkns .fk-min .col:focus-visible{box-shadow:inset 0 0 0 2px var(--ink)}
#fkns .fk-min .col:hover .tip,#fkns .fk-min .col:focus .tip{display:block}
#fkns .fk-min + .fk-facts{margin-top:18px}
#fkns .fk-g .c.hand{font:600 18px/1.2 var(--f-hand);color:var(--pen)}
#fkns .fk-chips{gap:2px}
#fkns .fk-chips .fk-chip{width:19px;height:19px;font-size:12px}
#fkns .fk-team-rec{margin-top:4px;font-size:13px;color:var(--muted)}
@container (min-width:480px){#fkns .fk-chips{gap:3px}#fkns .fk-chips .fk-chip{width:26px;height:26px;font-size:14px}#fkns .fk-team-rec{margin-left:68px}}
@container (max-width:479px){#fkns .fk-min .kn{font-size:8px}}"""

write_outputs(DIR, "Nové Sady 2003/04", scoped(CSS + "\n" + EXTRA_CSS, ROOT), SECTION,
              scoped(PAGE_CSS, ROOT), "sezona-2003-2004.html")
print(f"Tým {team['v']}-{team['r']}-{team['p']} {team['gf']}:{team['ga']}; já {len(played)} zápasů, {minutes} min, {goals} góly")
print("Zapsáno: wordpress-blok.html, sezona-2003-2004.html")
