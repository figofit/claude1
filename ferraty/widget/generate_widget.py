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
    return f"{n:,.0f}".replace(",", " ")


def fmt_date(date):
    if not date:
        return ""
    try:
        d = datetime.date.fromisoformat(date)
        return d.strftime("%-d. %-m. %Y")
    except ValueError:
        return date


def country_label(r):
    flag = COUNTRY_FLAGS.get(r.get("country"), "")
    return f"{flag} {esc(r.get('country') or '')}".strip()


def biggest_single_day(records):
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
    return biggest


def is_summit(r):
    return (
        isinstance(r.get("altitude_m"), (int, float))
        and r.get("type") in ("vrchol", "ferrata")
        and r.get("reachedSummit", True) is not False
    )


def render_row(name, meta, value):
    return (
        f'<div class="mh-widget-row">'
        f'<div class="mh-widget-row__main"><span class="mh-widget-row__name">{esc(name)}</span>'
        f'<span class="mh-widget-row__meta">{meta}</span></div>'
        f'<div class="mh-widget-row__value">{esc(value)}</div>'
        f"</div>"
    )


def render_section(heading, rows_html, empty_message):
    body = "".join(rows_html) if rows_html else f'<p class="mh-widget-empty">{empty_message}</p>'
    return f"""
    <div class="mh-widget-section">
      <div class="mh-widget-section__head">{esc(heading)}</div>
      <div class="mh-widget-rows">{body}</div>
    </div>"""


def main():
    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)
    records = data["records"]

    total = len(records)
    countries = {r.get("country") for r in records if r.get("country")}
    highest = max((r for r in records if r.get("altitude_m")), key=lambda r: r["altitude_m"])

    summit_records = [r for r in records if is_summit(r)]
    above2500 = sum(1 for r in summit_records if r["altitude_m"] >= 2500)
    above3000 = sum(1 for r in summit_records if r["altitude_m"] >= 3000)
    above4000 = sum(1 for r in summit_records if r["altitude_m"] >= 4000)

    attempt_count = sum(1 for r in records if r.get("reachedSummit") is False)

    biggest = biggest_single_day(records)

    # Pozn.: souhrnné "Převýšení celkem" je záměrně vynechané — u drtivé většiny záznamů
    # zatím není elevationGain_m vyplněné, takže by součet byl zavádějící (jen zlomek reality).
    stats = [
        (fmt_num(total), "Výstupů celkem"),
        (str(len(countries)), "Zemí"),
        (f"{fmt_num(highest['altitude_m'])} m", f"Nejvýš ({esc(highest['name'])})"),
        (str(above2500), "Nad 2500 m"),
        (str(above3000), "Nad 3000 m"),
        (str(above4000), "Nad 4000 m"),
        (f"{fmt_num(biggest[0])} m" if biggest else "—", f"Nejtvrdší den ({esc(biggest[1])})" if biggest else "Nejtvrdší den"),
        (str(attempt_count), "Neúspěšných pokusů"),
    ]
    stats_html = "\n".join(
        f'<div class="mh-widget-stat"><div class="mh-widget-stat__value">{esc(v)}</div>'
        f'<div class="mh-widget-stat__label">{esc(l)}</div></div>'
        for v, l in stats
    )

    # --- Nej vrcholy / Nej ferraty / Nej hřebenovky (featured, dle typu) ---
    # Stejná logika pro všechny tři — jen tvůj vlastní výběr (pole "featured"), ne automatický
    # výpočet. "Nej vrcholy" se navíc řadí podle nadmořské výšky (u ferrat/hřebenovek podle data).
    featured = [r for r in records if r.get("featured")]

    def featured_of_type(t, limit, sort_key):
        items = [r for r in featured if r.get("type") == t]
        items.sort(key=sort_key, reverse=True)
        return items[:limit]

    vrcholy_rows = [
        render_row(r["name"], country_label(r), f"{fmt_num(r['altitude_m'])} m" if r.get("altitude_m") else "—")
        for r in featured_of_type("vrchol", 16, lambda r: r.get("altitude_m") or 0)
    ]
    ferraty_rows = [
        render_row(r["name"], country_label(r), fmt_date(r.get("date")) or "—")
        for r in featured_of_type("ferrata", 8, lambda r: r.get("date") or "")
    ]
    hrebenovky_rows = [
        render_row(r["name"], country_label(r), fmt_date(r.get("date")) or "—")
        for r in featured_of_type("hřebenovka", 8, lambda r: r.get("date") or "")
    ]

    # Pozn.: sekce "Nejnáročnější akce" (pole toughDay) je záměrně vynechaná — jednodenní
    # převýšení ještě není u všech záznamů přepočítané (viz Priel Klettersteig), takže by
    # žebříček byl zavádějící. Až budou čísla sedět, jde vrátit stejným vzorem jako ostatní
    # sekce (render_section + řazení podle elevationGain_m).

    sections_html = "".join([
        render_section("Nej vrcholy", vrcholy_rows, "Zatím žádný TOP vrchol."),
        render_section("Nej ferraty", ferraty_rows, "Zatím žádná TOP ferrata."),
        render_section("Nej hřebenovky", hrebenovky_rows, "Zatím žádná TOP hřebenovka."),
    ])

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
    max-width: 900px;
    margin: 24px 0;
    padding: 26px 26px 18px;
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
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.01em;
    margin: 0 0 18px;
    color: var(--mh-text);
  }}

  .mh-widget-stats {{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 24px;
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
    font-size: 18px;
    font-weight: 800;
    color: var(--mh-accent);
    line-height: 1.15;
  }}
  .mh-widget-stat__label {{
    font-size: 11px;
    color: var(--mh-text-muted);
    margin-top: 4px;
    line-height: 1.3;
  }}

  .mh-widget-sections {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 20px;
  }}
  .mh-widget-section__head {{
    font-family: var(--mh-font-head);
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--mh-text);
    margin: 0 0 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--mh-border);
  }}
  .mh-widget-rows {{
    display: grid;
    gap: 1px;
  }}
  .mh-widget-row {{
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 6px 0;
    border-bottom: 1px solid var(--mh-border);
  }}
  .mh-widget-row:last-child {{ border-bottom: none; }}
  .mh-widget-row__main {{ min-width: 0; }}
  .mh-widget-row__name {{
    font-weight: 700;
    font-size: 13.5px;
    color: var(--mh-text);
  }}
  .mh-widget-row__meta {{
    font-size: 11.5px;
    color: var(--mh-text-faint);
    margin-left: 6px;
  }}
  .mh-widget-row__value {{
    font-family: var(--mh-font-head);
    font-weight: 700;
    font-size: 12.5px;
    color: var(--mh-accent);
    white-space: nowrap;
    flex-shrink: 0;
  }}
  .mh-widget-empty {{
    font-size: 12.5px;
    color: var(--mh-text-faint);
    margin: 0;
  }}

  .mh-widget-foot {{
    font-size: 11.5px;
    color: var(--mh-text-faint);
    text-align: right;
    margin-top: 18px;
  }}

  @media (max-width: 640px) {{
    .mh-widget-stats {{ grid-template-columns: repeat(2, 1fr); }}
    .mh-widget-sections {{ grid-template-columns: 1fr; }}
  }}
</style>

<div class="mh-widget-eyebrow">Osobní horský deník</div>
<h3 class="mh-widget-title">Moje hory — souhrn</h3>

<div class="mh-widget-stats">
{stats_html}
</div>

<div class="mh-widget-sections">{sections_html}
</div>

<div class="mh-widget-foot">Snímek k {today}</div>
</div>
"""

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Written to {OUT_PATH} ({len(html)} bytes)")


if __name__ == "__main__":
    main()
