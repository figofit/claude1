#!/usr/bin/env python3
"""Generuje samostatný HTML/CSS widget (statický snímek) z ferraty.json,
vhodný pro vložení do WordPress (Custom HTML blok) na michaldokoupil.cz.
"""
import json
import datetime
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, "..", "data", "ferraty.json")
OUT_PATH = os.path.join(SCRIPT_DIR, "moje-hory-widget.html")

COUNTRY_FLAGS = {
    "Rakousko": "🇦🇹", "Německo": "🇩🇪", "Švýcarsko": "🇨🇭", "Lichtenštejnsko": "🇱🇮",
    "Itálie": "🇮🇹", "Francie": "🇫🇷", "Španělsko": "🇪🇸", "Portugalsko": "🇵🇹",
    "Andorra": "🇦🇩", "Slovinsko": "🇸🇮", "Slovensko": "🇸🇰", "Česko": "🇨🇿",
    "Polsko": "🇵🇱", "Rumunsko": "🇷🇴", "Bulharsko": "🇧🇬", "Řecko": "🇬🇷",
    "Bosna a Hercegovina": "🇧🇦", "Srbsko": "🇷🇸", "Černá Hora": "🇲🇪",
    "Severní Makedonie": "🇲🇰", "Albánie": "🇦🇱", "Kosovo": "🇽🇰", "Gruzie": "🇬🇪",
    "Arménie": "🇦🇲", "Maroko": "🇲🇦", "Egypt": "🇪🇬", "Kypr": "🇨🇾", "Malta": "🇲🇹",
    "Monako": "🇲🇨", "Vatikán": "🇻🇦", "Gibraltar": "🇬🇮",
}

TYPE_LABELS = {"ferrata": "Ferrata", "vrchol": "Vrchol", "hřebenovka": "Hřebenovka"}


def esc(s):
    if s is None:
        return ""
    return (
        str(s)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def fmt_num(n):
    return f"{n:,}".replace(",", " ")


def main():
    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)
    records = data["records"]

    total = len(records)
    countries = {r.get("country") for r in records if r.get("country")}

    highest = max((r for r in records if r.get("altitude_m")), key=lambda r: r["altitude_m"])

    def is_summit(r):
        return (
            isinstance(r.get("altitude_m"), (int, float))
            and r.get("type") in ("vrchol", "ferrata")
            and r.get("reachedSummit", True) is not False
        )

    summit_records = [r for r in records if is_summit(r)]
    above2500 = sum(1 for r in summit_records if r["altitude_m"] >= 2500)
    above3000 = sum(1 for r in summit_records if r["altitude_m"] >= 3000)
    above4000 = sum(1 for r in summit_records if r["altitude_m"] >= 4000)

    biggest = None  # (gain, name)
    for r in records:
        days = r.get("days") or []
        if len(days) <= 1:
            g = r.get("elevationGain_m")
            if isinstance(g, (int, float)) and (biggest is None or g > biggest[0]):
                biggest = (g, r["name"])
        else:
            for d in days:
                g = d.get("elevationGain_m")
                if isinstance(g, (int, float)) and (biggest is None or g > biggest[0]):
                    biggest = (g, r["name"])

    featured = [r for r in records if r.get("featured")]
    featured.sort(key=lambda r: r.get("date") or "", reverse=True)
    top_list = featured[:6]

    stats = [
        (fmt_num(total), "Výstupů celkem"),
        (str(len(countries)), "Zemí"),
        (f"{fmt_num(highest['altitude_m'])} m", f"Nejvýš ({esc(highest['name'])})"),
        (str(above3000), "Vrcholů nad 3000 m"),
        (str(above2500), "Vrcholů nad 2500 m"),
        (f"{fmt_num(biggest[0])} m" if biggest else "—", f"Nejtvrdší den ({esc(biggest[1])})" if biggest else "Nejtvrdší den"),
    ]

    items_html = []
    for r in top_list:
        flag = COUNTRY_FLAGS.get(r.get("country"), "")
        type_label = TYPE_LABELS.get(r.get("type"), "")
        date = r.get("date")
        date_label = ""
        if date:
            try:
                d = datetime.date.fromisoformat(date)
                date_label = d.strftime("%-d. %-m. %Y")
            except ValueError:
                date_label = date
        sub = " · ".join(x for x in [f"{flag} {esc(r.get('country') or '')}".strip(), date_label] if x.strip())
        items_html.append(
            f'<li class="mh-widget-item">'
            f'<span class="mh-widget-item__name">{esc(r["name"])}</span>'
            f'<span class="mh-widget-item__type">{esc(type_label)}</span>'
            f'<span class="mh-widget-item__sub">{sub}</span>'
            f"</li>"
        )

    stats_html = "\n".join(
        f'<div class="mh-widget-stat"><div class="mh-widget-stat__value">{esc(v)}</div>'
        f'<div class="mh-widget-stat__label">{esc(l)}</div></div>'
        for v, l in stats
    )

    today = datetime.date.today().strftime("%-d. %-m. %Y")

    html = f"""<div class="mh-widget">
<style>
  .mh-widget {{
    --mh-bg: #f6f3ec;
    --mh-surface: #ffffff;
    --mh-border: #ddd6c1;
    --mh-text: #2a2a24;
    --mh-text-muted: #6b6a5c;
    --mh-text-faint: #93917f;
    --mh-accent: #af5330;
    --mh-accent-tint: #f5e6dc;
    --mh-forest: #33513c;
    --mh-radius: 12px;
    --mh-font-head: "Fraunces", Georgia, serif;
    --mh-font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

    box-sizing: border-box;
    max-width: 720px;
    margin: 24px 0;
    padding: 20px 22px 18px;
    background: var(--mh-bg);
    border: 1px solid var(--mh-border);
    border-radius: var(--mh-radius);
    font-family: var(--mh-font-body);
    color: var(--mh-text);
    font-size: 15px;
    line-height: 1.5;
  }}
  .mh-widget *, .mh-widget *::before, .mh-widget *::after {{ box-sizing: border-box; }}
  .mh-widget a {{ color: var(--mh-accent); text-decoration: none; }}
  .mh-widget a:hover {{ text-decoration: underline; }}

  .mh-widget-eyebrow {{
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mh-text-faint);
    margin: 0 0 2px;
  }}
  .mh-widget-title {{
    font-family: var(--mh-font-head);
    font-size: 21px;
    font-weight: 600;
    margin: 0 0 14px;
    color: var(--mh-forest);
  }}

  .mh-widget-stats {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }}
  .mh-widget-stat {{
    background: var(--mh-surface);
    border: 1px solid var(--mh-border);
    border-radius: calc(var(--mh-radius) - 4px);
    padding: 10px 10px;
    text-align: center;
  }}
  .mh-widget-stat__value {{
    font-family: var(--mh-font-head);
    font-size: 19px;
    font-weight: 600;
    color: var(--mh-accent);
    line-height: 1.15;
  }}
  .mh-widget-stat__label {{
    font-size: 11.5px;
    color: var(--mh-text-muted);
    margin-top: 2px;
    line-height: 1.3;
  }}

  .mh-widget-list-head {{
    font-family: var(--mh-font-head);
    font-size: 15px;
    font-weight: 600;
    color: var(--mh-forest);
    margin: 0 0 8px;
  }}
  .mh-widget-list {{
    list-style: none;
    margin: 0 0 14px;
    padding: 0;
    border-top: 1px solid var(--mh-border);
  }}
  .mh-widget-item {{
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 8px 2px;
    border-bottom: 1px solid var(--mh-border);
    font-size: 14px;
    flex-wrap: wrap;
  }}
  .mh-widget-item__name {{
    font-weight: 600;
    color: var(--mh-text);
  }}
  .mh-widget-item__type {{
    font-size: 11px;
    color: var(--mh-accent);
    background: var(--mh-accent-tint);
    border-radius: 999px;
    padding: 1px 8px;
  }}
  .mh-widget-item__sub {{
    font-size: 12.5px;
    color: var(--mh-text-faint);
    margin-left: auto;
  }}

  .mh-widget-foot {{
    font-size: 11.5px;
    color: var(--mh-text-faint);
    text-align: right;
  }}

  @media (max-width: 480px) {{
    .mh-widget-stats {{ grid-template-columns: repeat(2, 1fr); }}
    .mh-widget-item {{ flex-direction: column; align-items: flex-start; gap: 2px; }}
    .mh-widget-item__sub {{ margin-left: 0; }}
  }}
</style>

<div class="mh-widget-eyebrow">Osobní horský deník</div>
<h3 class="mh-widget-title">Moje hory — přehled</h3>

<div class="mh-widget-stats">
{stats_html}
</div>

<div class="mh-widget-list-head">Poslední TOP výstupy</div>
<ul class="mh-widget-list">
{chr(10).join(items_html)}
</ul>

<div class="mh-widget-foot">Snímek k {today}</div>
</div>
"""

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Written to {OUT_PATH} ({len(html)} bytes)")


if __name__ == "__main__":
    main()
