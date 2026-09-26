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
        country_label = f"{flag} {esc(r.get('country') or '')}".strip()
        meta = " · ".join(x for x in [type_label.upper(), date_label] if x)
        items_html.append(
            f'<li class="mh-widget-item">'
            f'<div class="mh-widget-item__meta">{esc(meta)}</div>'
            f'<div class="mh-widget-item__name">{esc(r["name"])}'
            f'<span class="mh-widget-item__country">{country_label}</span></div>'
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
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');

  .mh-widget {{
    /* Design tokens sladěné s michaldokoupil.cz (tmavé, teal akcent) — uprav tady, pokud
       se přesný odstín/font na webu časem změní. */
    --mh-bg: #12141f;
    --mh-surface: #1a1d2c;
    --mh-border: rgba(255, 255, 255, 0.09);
    --mh-text: #f4f5f9;
    --mh-text-muted: #9aa1b8;
    --mh-text-faint: #6c7288;
    --mh-accent: #5eead4;
    --mh-accent-tint: rgba(94, 234, 212, 0.12);
    --mh-radius: 18px;
    --mh-font-head: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --mh-font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

    box-sizing: border-box;
    max-width: 720px;
    margin: 24px 0;
    padding: 24px 24px 18px;
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
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--mh-accent);
    margin: 0 0 8px;
  }}
  .mh-widget-eyebrow::before {{ content: "— "; }}
  .mh-widget-title {{
    font-family: var(--mh-font-head);
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.01em;
    margin: 0 0 16px;
    color: var(--mh-text);
  }}

  .mh-widget-stats {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }}
  .mh-widget-stat {{
    background: var(--mh-surface);
    border: 1px solid var(--mh-border);
    border-radius: calc(var(--mh-radius) - 8px);
    padding: 12px 10px;
    text-align: center;
  }}
  .mh-widget-stat__value {{
    font-family: var(--mh-font-head);
    font-size: 19px;
    font-weight: 800;
    color: var(--mh-accent);
    line-height: 1.15;
  }}
  .mh-widget-stat__label {{
    font-size: 11.5px;
    color: var(--mh-text-muted);
    margin-top: 4px;
    line-height: 1.3;
  }}

  .mh-widget-list-head {{
    font-family: var(--mh-font-head);
    font-size: 14px;
    font-weight: 700;
    color: var(--mh-text);
    margin: 0 0 10px;
  }}
  .mh-widget-list {{
    list-style: none;
    margin: 0 0 16px;
    padding: 0;
    display: grid;
    gap: 8px;
  }}
  .mh-widget-item {{
    background: var(--mh-surface);
    border: 1px solid var(--mh-border);
    border-radius: calc(var(--mh-radius) - 8px);
    padding: 10px 14px;
  }}
  .mh-widget-item__meta {{
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--mh-accent);
    margin-bottom: 3px;
  }}
  .mh-widget-item__name {{
    font-weight: 700;
    color: var(--mh-text);
    font-size: 14.5px;
  }}
  .mh-widget-item__country {{
    font-weight: 400;
    font-size: 12.5px;
    color: var(--mh-text-faint);
    margin-left: 8px;
  }}

  .mh-widget-foot {{
    font-size: 11.5px;
    color: var(--mh-text-faint);
    text-align: right;
  }}

  @media (max-width: 480px) {{
    .mh-widget-stats {{ grid-template-columns: repeat(2, 1fr); }}
    .mh-widget-item__country {{ display: block; margin-left: 0; margin-top: 2px; }}
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
