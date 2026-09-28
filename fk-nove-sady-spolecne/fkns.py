"""Společný vzhled a pomocné funkce pro souhrny sezón FK Nové Sady.

Používají ho build.py jednotlivých sezón, aby všechny díly vypadaly stejně.
CSS je napsané pro kořenový prvek #fkns; scoped() ho přejmenuje, aby šlo
mít na jedné stránce WordPressu víc bloků vedle sebe.
"""
import re
from html import escape


def plural(n, one, few, many):
    if n == 1:
        return one
    return few if 2 <= n <= 4 else many


def nb(text):
    """Nezalomitelné mezery uvnitř názvu týmu nebo jména."""
    return escape(text).replace(" ", "&nbsp;")


def typo(text):
    """Escapuje text a přidá nezalomitelnou mezeru za jednopísmenné předložky a spojky."""
    return re.sub(r"(?<!\w)([vszkouaiVSZKOUAI]) ", r"\1&nbsp;", escape(text))


def scoped(css, root_id):
    """Přejmenuje kořenový selektor #fkns na zadané id."""
    return css if root_id == "fkns" else re.sub(r"#fkns\b", "#" + root_id, css)


PITCH_SVG = (
    '<svg class="fk-lines" viewBox="0 0 68 105" aria-hidden="true" focusable="false">'
    '<rect x="2" y="2" width="64" height="101"/><line x1="2" y1="52.5" x2="66" y2="52.5"/>'
    '<circle cx="34" cy="52.5" r="9.15"/><circle class="spot" cx="34" cy="52.5" r=".7"/>'
    '<rect x="13.84" y="2" width="40.32" height="16.5"/><rect x="24.84" y="2" width="18.32" height="5.5"/>'
    '<circle class="spot" cx="34" cy="13" r=".6"/><path d="M26.69 18.5A9.15 9.15 0 0 0 41.31 18.5"/>'
    '<rect x="13.84" y="86.5" width="40.32" height="16.5"/><rect x="24.84" y="97.5" width="18.32" height="5.5"/>'
    '<circle class="spot" cx="34" cy="92" r=".6"/><path d="M26.69 86.5A9.15 9.15 0 0 1 41.31 86.5"/>'
    '</svg>'
)


def pitch(sestava, players, me, badge=None):
    """Hřiště s hráči po řadách (útok nahoře). badge(ids) může vrátit text do kolečka hráče."""
    def player(ids):
        cls = "fk-pl me" if me in ids else "fk-pl"
        label = " /<br>".join(nb(players[i]["kratce"]) for i in ids)
        dot = badge(ids) if badge else ""
        return f'<li class="{cls}"><i aria-hidden="true">{dot}</i><b>{label}</b></li>'

    rows = "".join(
        f'<ol class="fk-row r{i}">{"".join(player(ids) for ids in row)}</ol>'
        for i, row in enumerate(sestava["rady"], 1))
    return (f'<figure class="fk-pitch" aria-label="Rozestavení {escape(sestava["rozestaveni"])}">'
            f'{PITCH_SVG}{rows}</figure>')


CSS = """@import url("https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600&family=Barlow+Condensed:wght@600;700;800&family=Courier+Prime:wght@400;700&family=Caveat:wght@600&display=swap");
#fkns{--sheet:#fcfdfa;--ink:#17221b;--ink-2:#4c5a51;--muted:#6b776f;--rule:#dde3da;--rule-2:#c3ccc0;--pitch:#2f7445;--pitch-2:#367d4c;--chalk:rgba(255,255,255,.78);--marker:#ffe35a;--win:#227a3a;--draw:#e3e8e0;--loss:#b8392f;--bar:#2f7445;--pb:#aebdb2;--pen:#2340a0;--f-hand:"Caveat","Segoe Print","Bradley Hand",cursive;--f-disp:"Barlow Condensed","Roboto Condensed","Arial Narrow",sans-serif;--f-body:"Barlow",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--f-type:"Courier Prime","Courier New",Courier,monospace;container-type:inline-size;display:block;box-sizing:border-box;margin:2em 0;padding:clamp(18px,4vw,44px);background:var(--sheet);color:var(--ink);border:1px solid var(--rule);border-radius:4px;font:400 16px/1.5 var(--f-body);text-align:left;-webkit-text-size-adjust:100%}
#fkns *,#fkns *::before,#fkns *::after{box-sizing:border-box}
#fkns h2,#fkns h3,#fkns h4,#fkns p,#fkns ol,#fkns ul,#fkns li,#fkns dl,#fkns dt,#fkns dd,#fkns figure,#fkns section,#fkns header,#fkns small,#fkns mark,#fkns b,#fkns i,#fkns table,#fkns caption,#fkns thead,#fkns tbody,#fkns tr,#fkns th,#fkns td{margin:0;padding:0;border:0;background:none;font:inherit;color:inherit;letter-spacing:normal;text-transform:none;text-shadow:none;box-shadow:none;list-style:none;max-width:none;text-align:inherit}
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
#fkns .fk-g .c.hand{font:600 19px/1.2 var(--f-hand);color:var(--pen)}
#fkns .fk-g .m .fk-hand{display:block;margin-top:3px;font:600 19px/1.1 var(--f-hand);color:var(--pen)}
#fkns .fk-yc{display:inline-block;width:9px;height:12px;margin-right:7px;border-radius:1.5px;background:#f5c518;box-shadow:0 0 0 1px rgba(0,0,0,.22);transform:rotate(8deg);vertical-align:-1px}
#fkns .fk-tbl-wrap{overflow-x:auto}
#fkns .fk-tbl{width:100%;border-collapse:collapse;border-spacing:0;font-size:14px;line-height:1.3;font-variant-numeric:tabular-nums}
#fkns .fk-tbl th{padding:0 4px 6px;border-bottom:2px dashed var(--rule-2);font:700 11px/1.3 var(--f-type);letter-spacing:.06em;text-transform:uppercase;color:var(--muted);text-align:right;white-space:nowrap}
#fkns .fk-tbl td{padding:7px 4px;border-bottom:1px solid var(--rule);text-align:right;white-space:nowrap;vertical-align:top}
#fkns .fk-tbl .ps{width:2.8em;padding-left:6px;text-align:left;font:700 13px/1.5 var(--f-type);color:var(--muted)}
#fkns .fk-tbl .tm{width:100%;text-align:left}
#fkns .fk-tbl td.tm{font-weight:500}
#fkns .fk-tbl .pb{display:block;height:4px;margin-top:5px;border-radius:0 2px 2px 0;background:var(--pb)}
#fkns .fk-tbl .sk{color:var(--ink-2)}
#fkns .fk-tbl td.pts{padding-right:6px;font:700 18px/1.15 var(--f-disp)}
#fkns .fk-tbl th:last-child{padding-right:6px}
#fkns .fk-tbl tr.us td{background:var(--marker);color:var(--ink)}
#fkns .fk-tbl tr.us td.tm{font-weight:700}
#fkns .fk-tbl tr.us .pb{background:var(--bar)}
#fkns .fk-mem{display:grid;gap:14px;max-width:38em}
#fkns .fk-mem li{font:600 22px/1.3 var(--f-hand);color:var(--pen)}
#fkns .fk-foot{margin-top:32px;padding-top:14px;border-top:1px solid var(--rule);font-size:13px;line-height:1.5;color:var(--muted)}
@container (min-width:480px){#fkns .fk-form-lab{flex:0 0 56px}#fkns .fk-chip{width:26px;height:26px;font-size:14px}#fkns .fk-legend{margin-left:68px}#fkns .fk-legend .fk-chip{width:18px;height:18px;font-size:11px}}
@container (min-width:520px){#fkns .fk-facts{grid-template-columns:repeat(4,minmax(0,1fr))}#fkns .fk-tbl{font-size:15px}#fkns .fk-tbl th,#fkns .fk-tbl td{padding-left:8px;padding-right:8px}#fkns .fk-tbl .ps{padding-left:6px}#fkns .fk-mem li{font-size:24px}}
@container (min-width:600px){#fkns .fk-team{grid-template-columns:minmax(0,300px) minmax(0,1fr);align-items:start;gap:36px}}
@container (min-width:700px){#fkns .fk-cols,#fkns .fk-g{display:grid;grid-template-columns:34px 88px minmax(0,1.2fr) 100px 22px minmax(0,1fr);grid-template-areas:"k d m s r c";column-gap:12px}#fkns .fk-cols{padding-bottom:4px;border-bottom:2px dashed var(--rule-2);font:700 11px/1.3 var(--f-type);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}#fkns .fk-cols span:nth-child(4){text-align:right}#fkns .fk-g .c{padding-top:0}}
@media (prefers-reduced-motion:no-preference){#fkns .fk-bar .fill{transition:filter .15s}}"""

PAGE_CSS = """html,body{background:#e6eae2}
body{margin:0;padding:24px 16px 56px}
body #fkns{max-width:900px;margin:0 auto;box-shadow:0 1px 2px rgba(23,34,27,.06),0 12px 40px -18px rgba(23,34,27,.25)}"""


def write_outputs(folder, title, css, section, page_css, page_name):
    """Zapíše blok pro WordPress a samostatnou stránku pro náhled."""
    block = f"<style>\n{css}\n</style>\n{section}\n"
    (folder / "wordpress-blok.html").write_text(block, encoding="utf-8")
    page = f"<title>{title}</title>\n<style>\n{page_css}\n</style>\n{block}"
    (folder / page_name).write_text(page, encoding="utf-8")
