#!/usr/bin/env python3
"""Sestaví HTML souhrn sezóny 2002/2003 ze sezona.json (2. díl, stejný vzhled jako 2001/02).

Výstupy (vedle tohoto skriptu):
  wordpress-blok.html    – vložit do bloku „Vlastní HTML“ ve WordPressu
  sezona-2002-2003.html  – samostatná stránka pro náhled

Spuštění: python3 build.py
"""
import json
import sys
from html import escape
from pathlib import Path

DIR = Path(__file__).parent
sys.path.insert(0, str(DIR.parent / "fk-nove-sady-spolecne"))
from fkns import CSS, PAGE_CSS, nb, pitch, scoped, typo, write_outputs  # noqa: E402

ROOT = "fkns0203"  # vlastní id, aby šel blok dát na stejnou stránku jako 2001/02
DATA = json.loads((DIR / "sezona.json").read_text(encoding="utf-8"))
PLAYERS = DATA["hraci"]
ME = next(pid for pid, p in PLAYERS.items() if p.get("ja"))

on_pitch = [pid for row in DATA["sestava"]["rady"] for ids in row for pid in ids]
assert len(DATA["sestava"]["rady"][0]) + len(DATA["sestava"]["rady"][1]) + len(DATA["sestava"]["rady"][2]) + 1 == 11
assert all(pid in PLAYERS for pid in on_pitch)


def mark_me(pid, text):
    return f'<mark class="fk-me">{text}</mark>' if pid == ME else text


def year_badge(ids):
    years = {PLAYERS[i]["rocnik"] for i in ids}
    return f"{years.pop() % 100:02d}" if len(years) == 1 and None not in years else ""


POSTS = [("brankář", "Brankář"), ("obránce", "Obránci"), ("záložník", "Záložníci"), ("útočník", "Útočníci")]


def roster():
    groups = []
    for post, label in POSTS:
        dds = []
        for pid, p in PLAYERS.items():
            if p["post"] != post:
                continue
            year = str(p["rocnik"]) if p["rocnik"] else "?"
            dds.append(f'<dd><span>{mark_me(pid, nb(p["jmeno"]))}</span><span class="g">{year}</span></dd>')
        groups.append(f'<div class="fk-grp"><dt>{label}</dt>{"".join(dds)}</div>')
    coaches = "".join(f'<dd><span>{nb(c)}</span></dd>' for c in DATA["treneri"])
    groups.append(f'<div class="fk-grp"><dt>Trenéři</dt>{coaches}</div>')
    return (f'<div class="fk-roster"><h4>Soupiska · {len(PLAYERS)} hráčů · ročník</h4>'
            f'<dl>{"".join(groups)}</dl></div>')


def origin(key):
    return ", ".join(mark_me(pid, nb(p["kratce"])) for pid, p in PLAYERS.items() if p.get("odkud") == key)


years = DATA["rocniky"]
years_html = "".join(f"<span>’{y % 100:02d}</span>" for y in years)
years_sr = ", ".join(str(y) for y in years[:-1]) + f" a {years[-1]}"
coaches = " a ".join(nb(c) for c in DATA["treneri"])
mem_html = "".join(f"<li>{typo(m)}</li>" for m in DATA["vzpominky"])
me_name = PLAYERS[ME]["jmeno"]

SECTION = f"""<section id="{ROOT}" lang="cs" aria-labelledby="{ROOT}-h">
<header class="fk-hero">
<p class="fk-eyebrow">Starší žáci</p>
<h2 id="{ROOT}-h" class="fk-title">FK Nové Sady <span>2002/2003</span></h2>
<p class="fk-lede">Druhá sezóna. Trenéři {coaches}.</p>
<div class="fk-years" aria-hidden="true">{years_html}</div>
<p class="fk-sr">Hráli za nás ročníky {years_sr}.</p>
<p class="fk-years-cap">Tři ročníky v&nbsp;jedné sestavě. Nejmladším bylo 12–13 let a hráli proti 14–15letým.</p>
<dl class="fk-origin">
<div><dt>Ze starších žáků 2001/02</dt><dd>{origin("starsi")}</dd></div>
<div><dt>Od mladších žáků</dt><dd>{origin("mladsi")}</dd></div>
</dl>
</header>
<section class="fk-sec" aria-labelledby="{ROOT}-sestava">
<div class="fk-sec-head"><h3 id="{ROOT}-sestava" class="fk-h3">Základní sestava</h3><p class="fk-kicker">{escape(DATA["sestava"]["rozestaveni"]).replace("-", "–")}</p></div>
<div class="fk-team">{pitch(DATA["sestava"], PLAYERS, ME, badge=year_badge)}{roster()}</div>
<p class="fk-note">{typo(DATA["sestava"]["poznamka"])} Čísla v&nbsp;kolečkách jsou ročníky.</p>
</section>
<section class="fk-sec" aria-labelledby="{ROOT}-vzpominky">
<div class="fk-sec-head"><h3 id="{ROOT}-vzpominky" class="fk-h3">Vzpomínky</h3><p class="fk-kicker">{nb(me_name)}</p></div>
<ul class="fk-mem">{mem_html}</ul>
</section>
<p class="fk-foot">Sestaveno podle vzpomínek. Výsledky ani tabulka z&nbsp;téhle sezóny se zatím nenašly.</p>
</section>"""

EXTRA_CSS = """#fkns .fk-years{position:relative;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 clamp(16px,5cqi,44px);width:max-content;max-width:100%;margin:26px 0 10px;padding:0 4px}
#fkns .fk-years::before{content:"";position:absolute;inset:12% -12px 2% -12px;background:var(--marker);border-radius:3px 14px 5px 12px/12px 4px 10px 6px;transform:rotate(-.7deg);z-index:0}
#fkns .fk-years span{position:relative;z-index:1;font:800 clamp(48px,11vw,96px)/1.05 var(--f-disp);font-size:clamp(48px,13cqi,96px);color:var(--ink)}
#fkns .fk-years-cap{max-width:40em;font-size:16px;color:var(--ink-2)}
#fkns .fk-origin{display:grid;gap:12px 24px;margin-top:22px;padding-top:16px;border-top:1px solid var(--rule)}
#fkns .fk-origin dt{font:700 11px/1.4 var(--f-type);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
#fkns .fk-origin dd{margin-top:2px;font-size:16px}
#fkns .fk-pl i{display:grid;place-items:center;font:700 10px/1 var(--f-body);color:var(--ink)}
@container (min-width:520px){#fkns .fk-origin{grid-template-columns:repeat(2,minmax(0,1fr))}}"""

write_outputs(DIR, "Nové Sady 2002/03", scoped(CSS + "\n" + EXTRA_CSS, ROOT), SECTION,
              scoped(PAGE_CSS, ROOT), "sezona-2002-2003.html")
known = sum(1 for p in PLAYERS.values() if p["rocnik"])
print(f"Hráčů {len(PLAYERS)}, na hřišti {len(on_pitch)}, ročník známe u {known}")
print("Zapsáno: wordpress-blok.html, sezona-2002-2003.html")
