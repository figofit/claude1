#!/usr/bin/env python3
"""Sestaví HTML souhrn sezóny 2001/2002 ze sezona.json.

Výstupy (vedle tohoto skriptu):
  wordpress-blok.html    – vložit do bloku „Vlastní HTML“ ve WordPressu
  sezona-2001-2002.html  – samostatná stránka pro náhled

Spuštění: python3 build.py
"""
import json
from collections import Counter, defaultdict
from datetime import date
from html import escape
from pathlib import Path

DIR = Path(__file__).parent
DATA = json.loads((DIR / "sezona.json").read_text(encoding="utf-8"))
TEAM = "Nové Sady"
PLAYERS = DATA["hraci"]
ME = next(pid for pid, p in PLAYERS.items() if p.get("ja"))
DNY = ["po", "út", "st", "čt", "pá", "so", "ne"]


def plural(n, one, few, many):
    if n == 1:
        return one
    return few if 2 <= n <= 4 else many


def nb(text):
    """Nezalomitelné mezery uvnitř názvu týmu nebo jména."""
    return escape(text).replace(" ", "&nbsp;")


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
assert known == 45 and len(missing) == 10, (known, len(missing))
for g in games:
    if g["strelci"] is not None:
        assert sum(n for _, n in g["strelci"]) == g["gf"], g["n"]


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
    return f'<span class="c">{", ".join(parts)}</span>'


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


def player(ids):
    me = ME in ids
    label = " /<br>".join(nb(PLAYERS[i]["kratce"]) for i in ids)
    cls = "fk-pl me" if me else "fk-pl"
    return f'<li class="{cls}"><i aria-hidden="true"></i><b>{label}</b></li>'


def pitch():
    lines = (
        '<svg class="fk-lines" viewBox="0 0 68 105" aria-hidden="true" focusable="false">'
        '<rect x="2" y="2" width="64" height="101"/><line x1="2" y1="52.5" x2="66" y2="52.5"/>'
        '<circle cx="34" cy="52.5" r="9.15"/><circle class="spot" cx="34" cy="52.5" r=".7"/>'
        '<rect x="13.84" y="2" width="40.32" height="16.5"/><rect x="24.84" y="2" width="18.32" height="5.5"/>'
        '<circle class="spot" cx="34" cy="13" r=".6"/><path d="M26.69 18.5A9.15 9.15 0 0 0 41.31 18.5"/>'
        '<rect x="13.84" y="86.5" width="40.32" height="16.5"/><rect x="24.84" y="97.5" width="18.32" height="5.5"/>'
        '<circle class="spot" cx="34" cy="92" r=".6"/><path d="M26.69 86.5A9.15 9.15 0 0 1 41.31 86.5"/>'
        '</svg>')
    rows = "".join(
        f'<ol class="fk-row r{i}">{"".join(player(ids) for ids in row)}</ol>'
        for i, row in enumerate(DATA["sestava"]["rady"], 1))
    return (f'<figure class="fk-pitch" aria-label="Rozestavení {escape(DATA["sestava"]["rozestaveni"])}">'
            f'{lines}{rows}</figure>')


POSTS = [("brankář", "Brankář"), ("obránce", "Obránci"),
         ("záložník", "Záložníci"), ("útočník", "Útočníci")]


def roster():
    groups = []
    for post, label in POSTS:
        dds = []
        for pid, p in PLAYERS.items():
            if p["post"] != post:
                continue
            n = tally[pid]
            goals = f'<span class="g">{n} {plural(n, "gól", "góly", "gólů")}</span>' if n else ""
            dds.append(f'<dd><span>{mark_me(pid, nb(p["jmeno"]))}</span>{goals}</dd>')
        groups.append(f'<div class="fk-grp"><dt>{label}</dt>{"".join(dds)}</div>')
    return (f'<div class="fk-roster"><h4>Soupiska · {len(PLAYERS)} hráčů</h4>'
            f'<dl>{"".join(groups)}</dl></div>')


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

SECTION = f"""<section id="fkns" lang="cs" aria-labelledby="fkns-h">
<header class="fk-hero">
<p class="fk-eyebrow">Starší žáci</p>
<h2 id="fkns-h" class="fk-title">FK Nové Sady <span>2001/2002</span></h2>
<p class="fk-lede">Vítězové I.&nbsp;třídy, skupiny A.</p>
{line_html}
<div class="fk-form">{form_row("Podzim", "podzim")}{form_row("Jaro", "jaro")}<p class="fk-legend">{chip("v", "span", ' aria-hidden="true"')} výhra {chip("r", "span", ' aria-hidden="true"')} remíza {chip("p", "span", ' aria-hidden="true"')} prohra</p></div>
<ul class="fk-facts">{facts_html}</ul>
</header>
<section class="fk-sec" aria-labelledby="fkns-sestava">
<div class="fk-sec-head"><h3 id="fkns-sestava" class="fk-h3">Základní sestava</h3><p class="fk-kicker">4–3–3</p></div>
<div class="fk-team">{pitch()}{roster()}</div>
<p class="fk-note">{escape(DATA["sestava"]["poznamka"])}</p>
</section>
<section class="fk-sec" aria-labelledby="fkns-strelci">
<div class="fk-sec-head"><h3 id="fkns-strelci" class="fk-h3">Střelci</h3><p class="fk-kicker">{known} z {t["gf"]} gólů</p></div>
<p class="fk-intro">Podle novinových zpráv. U {len(missing)} zápasů noviny střelce neuvedly, takže {missing_goals} gólů zůstává bez jména.</p>
{scorer_bars()}
</section>
<section class="fk-sec" aria-labelledby="fkns-zapasy">
<div class="fk-sec-head"><h3 id="fkns-zapasy" class="fk-h3">Všech {t["z"]} zápasů</h3><p class="fk-kicker">v pořadí, jak se hrály</p></div>
{half_block("Podzim 2001", "podzim")}
{half_block("Jaro 2002", "jaro")}
</section>
<p class="fk-foot">Sestaveno z novinových výstřižků (I.&nbsp;tř., sk.&nbsp;A – žáci starší), ručně psaného rozlosování a tištěného rozpisu zápasů. V závorce je poločas, pokud ho noviny uvedly.</p>
</section>"""

CSS = """@import url("https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700;800&family=Courier+Prime:wght@400;700&display=swap");
#fkns{--sheet:#fcfdfa;--ink:#17221b;--ink-2:#4c5a51;--muted:#6b776f;--rule:#dde3da;--rule-2:#c3ccc0;--pitch:#2f7445;--pitch-2:#367d4c;--chalk:rgba(255,255,255,.78);--marker:#ffe35a;--win:#227a3a;--draw:#e3e8e0;--loss:#b8392f;--bar:#2f7445;--f-disp:"Barlow Condensed","Roboto Condensed","Arial Narrow",sans-serif;--f-body:"Barlow",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--f-type:"Courier Prime","Courier New",Courier,monospace;container-type:inline-size;display:block;box-sizing:border-box;margin:2em 0;padding:clamp(18px,4vw,44px);background:var(--sheet);color:var(--ink);border:1px solid var(--rule);border-radius:4px;font:400 16px/1.5 var(--f-body);text-align:left;-webkit-text-size-adjust:100%}
#fkns *,#fkns *::before,#fkns *::after{box-sizing:border-box}
#fkns h2,#fkns h3,#fkns h4,#fkns p,#fkns ol,#fkns ul,#fkns li,#fkns dl,#fkns dt,#fkns dd,#fkns figure,#fkns section,#fkns header,#fkns small,#fkns mark,#fkns b{margin:0;padding:0;border:0;background:none;font:inherit;color:inherit;letter-spacing:normal;text-transform:none;text-shadow:none;box-shadow:none;list-style:none;max-width:none;text-align:inherit}
#fkns li::marker{content:none}
#fkns b{font-weight:600}
#fkns .fk-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}
#fkns mark.fk-me{background:linear-gradient(transparent 10%,var(--marker) 10% 90%,transparent 90%);color:inherit;padding:0 .18em;margin:0 -.1em;border-radius:2px}
#fkns .fk-eyebrow{display:inline-block;margin-bottom:14px;padding-bottom:5px;border-bottom:2px dashed var(--ink-2);font:700 13px/1.2 var(--f-type);letter-spacing:.45em;text-transform:uppercase;color:var(--ink-2)}
#fkns .fk-title{font:800 clamp(34px,6vw,60px)/.95 var(--f-disp);text-transform:uppercase;letter-spacing:.005em;color:var(--ink);text-wrap:balance}
#fkns .fk-title span{color:var(--ink-2);font-weight:600}
#fkns .fk-lede{margin-top:10px;font-size:18px;color:var(--ink-2)}
#fkns .fk-line{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr) repeat(4,auto) auto auto;column-gap:clamp(8px,2.2vw,22px);column-gap:clamp(7px,2.6cqi,22px);align-items:baseline;margin:28px 0 6px;padding:0 2px}
#fkns .fk-line::before{content:"";position:absolute;grid-row:2;grid-column:1/-1;inset:6% -12px 0 -12px;background:var(--marker);border-radius:3px 14px 5px 12px/12px 4px 10px 6px;transform:rotate(-.7deg);z-index:0}
#fkns .fk-line span{position:relative;z-index:1}
#fkns .fk-line .h{padding-bottom:6px;font:700 12px/1 var(--f-type);letter-spacing:.06em;color:var(--muted);text-align:right}
#fkns .fk-line .c{font:800 clamp(22px,5.4vw,56px)/1.15 var(--f-disp);font-size:clamp(21px,7.3cqi,56px);text-align:right;white-space:nowrap}
#fkns .fk-line .pos,#fkns .fk-line .team{text-align:left}
#fkns .fk-form{display:grid;gap:8px;margin-top:22px}
#fkns .fk-form-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px}
#fkns .fk-form-lab{flex:0 0 100%;font:700 12px/1 var(--f-type);letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
#fkns .fk-chips{display:flex;flex-wrap:wrap;gap:3px}
#fkns .fk-chip{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:3px;font:700 13px/1 var(--f-disp);vertical-align:middle}
#fkns .fk-chip.v{background:var(--win);color:#fff}
#fkns .fk-chip.r{background:var(--draw);color:var(--ink)}
#fkns .fk-chip.p{background:var(--sheet);color:var(--loss);box-shadow:inset 0 0 0 2px var(--loss)}
#fkns .fk-legend{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:2px;font-size:13px;color:var(--muted)}
#fkns .fk-legend .fk-chip{width:18px;height:18px;font-size:11px;margin-left:6px}
#fkns .fk-legend .fk-chip:first-child{margin-left:0}
#fkns .fk-facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 20px;margin-top:24px;padding-top:18px;border-top:1px solid var(--rule)}
#fkns .fk-fact b{display:block;font:700 34px/1 var(--f-disp);color:var(--ink)}
#fkns .fk-fact span{display:block;margin-top:4px;font-size:14px;line-height:1.35;color:var(--ink-2)}
#fkns .fk-sec{margin-top:40px;padding-top:22px;border-top:2px solid var(--ink)}
#fkns .fk-sec-head{display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:6px 16px;margin-bottom:16px}
#fkns .fk-h3{font:800 28px/1.05 var(--f-disp);text-transform:uppercase;letter-spacing:.01em;text-wrap:balance}
#fkns .fk-kicker{font:700 13px/1.2 var(--f-type);letter-spacing:.08em;color:var(--ink-2)}
#fkns .fk-intro{max-width:40em;margin:-4px 0 18px;font-size:15px;color:var(--ink-2)}
#fkns .fk-note{max-width:40em;margin-top:16px;font-size:15px;color:var(--ink-2)}
#fkns .fk-team{display:grid;gap:24px}
#fkns .fk-pitch{position:relative;width:100%;max-width:320px;aspect-ratio:68/105;justify-self:center;overflow:hidden;border-radius:4px;background:repeating-linear-gradient(180deg,var(--pitch) 0 10%,var(--pitch-2) 10% 20%)}
#fkns .fk-lines{position:absolute;inset:0;display:block;width:100%;height:100%}
#fkns .fk-lines *{fill:none;stroke:var(--chalk);stroke-width:.45}
#fkns .fk-lines .spot{fill:var(--chalk);stroke:none}
#fkns .fk-row{position:absolute;left:2%;right:2%;display:flex;justify-content:space-evenly;align-items:flex-start;transform:translateY(-11px)}
#fkns .fk-row.r1{top:24%}
#fkns .fk-row.r2{top:43%}
#fkns .fk-row.r3{top:66%}
#fkns .fk-row.r4{top:89%}
#fkns .fk-pl{display:flex;flex:0 1 25%;flex-direction:column;align-items:center;gap:5px;min-width:0;text-align:center}
#fkns .fk-pl i{display:block;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.35)}
#fkns .fk-pl b{padding:1px 5px;border-radius:3px;background:rgba(12,44,24,.55);font:600 13px/1.2 var(--f-body);color:#fff}
#fkns .fk-pl.me i{background:var(--marker)}
#fkns .fk-pl.me b{background:var(--marker);color:var(--ink)}
#fkns .fk-roster h4{padding-bottom:8px;border-bottom:2px dashed var(--rule-2);font:700 12px/1.2 var(--f-type);letter-spacing:.12em;text-transform:uppercase;color:var(--ink-2)}
#fkns .fk-grp{display:grid;grid-template-columns:5.2em minmax(0,1fr);column-gap:12px;padding:9px 0;border-bottom:1px solid var(--rule)}
#fkns .fk-grp dt{grid-row:1/span 4;padding-top:4px;font:700 11px/1.4 var(--f-type);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
#fkns .fk-grp dd{grid-column:2;display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-size:16px;line-height:1.6}
#fkns .fk-grp dd .g{flex:none;font-size:14px;color:var(--muted);font-variant-numeric:tabular-nums}
#fkns .fk-bars{display:grid;gap:4px;max-width:640px}
#fkns .fk-bar{position:relative;display:grid;grid-template-columns:minmax(0,9.5em) minmax(0,1fr);align-items:center;gap:12px;padding:3px 4px;border-radius:3px;outline:none;cursor:default}
#fkns .fk-bar .nm{font-weight:500;line-height:1.3}
#fkns .fk-bar .track{display:flex;align-items:center;min-width:0;padding-right:2.2em}
#fkns .fk-bar .fill{flex:none;height:14px;background:var(--bar);border-radius:0 4px 4px 0}
#fkns .fk-bar .val{flex:none;margin-left:8px;font:700 18px/1 var(--f-disp);color:var(--ink)}
#fkns .fk-bar.og .nm{font-weight:400;color:var(--ink-2)}
#fkns .fk-bar.og .fill{background:var(--rule-2)}
#fkns .fk-bar:hover,#fkns .fk-bar:focus-visible{background:rgba(23,34,27,.05)}
#fkns .fk-bar:focus-visible{box-shadow:inset 0 0 0 2px var(--ink)}
#fkns .fk-tip{position:absolute;left:4px;right:4px;bottom:calc(100% + 2px);z-index:5;display:none;padding:7px 10px;border-radius:4px;background:var(--ink);color:#fff;font-size:13px;line-height:1.45;pointer-events:none;box-shadow:0 6px 18px rgba(23,34,27,.2)}
#fkns .fk-tip b{font-weight:700;color:var(--marker)}
#fkns .fk-bar:hover .fk-tip,#fkns .fk-bar:focus .fk-tip{display:block}
#fkns .fk-half+.fk-half{margin-top:28px}
#fkns .fk-half-h{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 14px;padding-bottom:8px}
#fkns .fk-half-h h4{font:800 21px/1.1 var(--f-disp);text-transform:uppercase;letter-spacing:.02em}
#fkns .fk-half-h p{font-size:14px;color:var(--ink-2)}
#fkns .fk-cols{display:none}
#fkns .fk-g{display:grid;grid-template-columns:1.9em minmax(0,1fr) auto 22px;grid-template-areas:"k m s r" ". d d d" ". c c c";align-items:baseline;column-gap:10px;padding:9px 0;border-bottom:1px solid var(--rule)}
#fkns .fk-g .k{grid-area:k;font:700 13px/1.5 var(--f-type);color:var(--muted)}
#fkns .fk-g .d{grid-area:d;font:400 13px/1.5 var(--f-type);color:var(--muted)}
#fkns .fk-g .m{grid-area:m;font-size:16px;line-height:1.35}
#fkns .fk-g .m small{display:block;font-size:13px;color:var(--muted)}
#fkns .fk-g .s{grid-area:s;font:700 21px/1.1 var(--f-disp);font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
#fkns .fk-g .s small{margin-left:5px;font:400 12px/1 var(--f-type);color:var(--muted)}
#fkns .fk-g .fk-chip{grid-area:r;align-self:center;justify-self:end;width:22px;height:22px;font-size:13px}
#fkns .fk-g .c{grid-area:c;padding-top:2px;font-size:14px;line-height:1.45;color:var(--ink-2)}
#fkns .fk-g .c.none{color:var(--muted);font-style:italic}
#fkns .fk-foot{margin-top:32px;padding-top:14px;border-top:1px solid var(--rule);font-size:13px;line-height:1.5;color:var(--muted)}
@container (min-width:480px){#fkns .fk-form-lab{flex:0 0 56px}#fkns .fk-chip{width:26px;height:26px;font-size:14px}#fkns .fk-legend{margin-left:68px}#fkns .fk-legend .fk-chip{width:18px;height:18px;font-size:11px}}
@container (min-width:520px){#fkns .fk-facts{grid-template-columns:repeat(4,minmax(0,1fr))}}
@container (min-width:600px){#fkns .fk-team{grid-template-columns:minmax(0,300px) minmax(0,1fr);align-items:start;gap:36px}}
@container (min-width:700px){#fkns .fk-cols,#fkns .fk-g{display:grid;grid-template-columns:34px 88px minmax(0,1.2fr) 100px 22px minmax(0,1fr);grid-template-areas:"k d m s r c";column-gap:12px}#fkns .fk-cols{padding-bottom:4px;border-bottom:2px dashed var(--rule-2);font:700 11px/1.3 var(--f-type);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}#fkns .fk-cols span:nth-child(4){text-align:right}#fkns .fk-g .c{padding-top:0}}
@media (prefers-reduced-motion:no-preference){#fkns .fk-bar .fill{transition:filter .15s}}"""

PAGE_CSS = """html,body{background:#e6eae2}
body{margin:0;padding:24px 16px 56px}
body #fkns{max-width:900px;margin:0 auto;box-shadow:0 1px 2px rgba(23,34,27,.06),0 12px 40px -18px rgba(23,34,27,.25)}"""

block = f"<style>\n{CSS}\n</style>\n{SECTION}\n"
(DIR / "wordpress-blok.html").write_text(block, encoding="utf-8")
page = (f"<title>Nové Sady 2001/02</title>\n<style>\n{PAGE_CSS}\n</style>\n{block}")
(DIR / "sezona-2001-2002.html").write_text(page, encoding="utf-8")

print(f"Bilance {t['v']}-{t['r']}-{t['p']}, skóre {t['gf']}:{t['ga']}, {t['b']} bodů")
print("Střelci:", ", ".join(f"{name_of(p)} {n}" for p, n in tally.most_common()))
print("Zapsáno: wordpress-blok.html, sezona-2001-2002.html")
