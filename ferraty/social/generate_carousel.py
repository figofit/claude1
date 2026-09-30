#!/usr/bin/env python3
"""Generuje další slidy karuselu (Nej vrcholy / Nej ferraty / Nej hřebenovky)
ve stejném stylu jako moje-hory-social-4x5 (stats slide)."""
import json
import datetime
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = "/home/user/claude1/ferraty/data/ferraty.json"
OUT_DIR = SCRIPT_DIR

COUNTRY_FLAGS = {
    "Rakousko": "🇦🇹", "Německo": "🇩🇪", "Švýcarsko": "🇨🇭", "Lichtenštejnsko": "🇱🇮",
    "Itálie": "🇮🇹", "Francie": "🇫🇷", "Španělsko": "🇪🇸", "Portugalsko": "🇵🇹",
    "Andorra": "🇦🇩", "Slovinsko": "🇸🇮", "Slovensko": "🇸🇰", "Česko": "🇨🇿",
    "Polsko": "🇵🇱", "Rumunsko": "🇷🇴", "Bulharsko": "🇧🇬", "Řecko": "🇬🇷",
    "Gruzie": "🇬🇪", "Arménie": "🇦🇲", "Maroko": "🇲🇦",
}


def esc(s):
    if s is None:
        return ""
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def fmt_num(n):
    return f"{n:,.0f}".replace(",", " ")


def fmt_date(date):
    if not date:
        return "—"
    try:
        d = datetime.date.fromisoformat(date)
        return d.strftime("%-d. %-m. %Y")
    except ValueError:
        return date


def flag(country):
    return COUNTRY_FLAGS.get(country, "")


TEMPLATE = """<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>{title_plain}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
  :root {{
    --bg: #0a0b12; --surface: #1a1d2c; --border: rgba(255,255,255,0.08);
    --text: #f4f5f9; --text-muted: #9aa1b8; --text-faint: #6c7288;
    --accent: #5eead4;
  }}
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  html, body {{
    width: 1080px; height: 1350px;
    background: radial-gradient(120% 90% at 50% -10%, #16192a 0%, var(--bg) 55%);
    font-family: 'Inter', -apple-system, sans-serif; color: var(--text); overflow: hidden;
  }}
  .canvas {{ position: relative; width: 1080px; height: 1350px; display: flex; flex-direction: column; padding: 76px 76px 0; }}
  .eyebrow {{ font-size: 24px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); }}
  .eyebrow::before {{ content: "— "; }}
  .title {{ font-size: 84px; font-weight: 900; letter-spacing: -0.02em; line-height: 1.02; margin-top: 10px; color: var(--text); }}
  .tagline {{ margin-top: 16px; font-size: 24px; font-weight: 400; color: var(--text-muted); max-width: 860px; }}

  .ranklist {{ margin-top: 48px; display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 2; }}
  .rank-row {{
    display: flex; align-items: center; gap: 26px;
    background: rgba(26, 29, 44, 0.72); border: 1px solid var(--border);
    border-radius: 20px; padding: 22px 28px;
  }}
  .rank-num {{ font-size: 34px; font-weight: 900; color: var(--accent); width: 62px; flex-shrink: 0; }}
  .rank-main {{ flex: 1; min-width: 0; }}
  .rank-name {{ font-size: 32px; font-weight: 800; color: var(--text); line-height: 1.15; }}
  .rank-meta {{ margin-top: 4px; font-size: 20px; color: var(--text-faint); }}
  .rank-value {{ font-size: 30px; font-weight: 800; color: var(--accent); white-space: nowrap; flex-shrink: 0; }}

  .mountains {{ position: absolute; left: 0; right: 0; bottom: 0; height: 340px; z-index: 1; opacity: 0.9; }}
  .footer {{ position: absolute; left: 76px; right: 76px; bottom: 44px; display: flex; align-items: center; justify-content: space-between; z-index: 3; }}
  .footer__brand {{ font-size: 24px; font-weight: 700; color: var(--text); }}
  .footer__brand span {{ color: var(--accent); }}
  .footer__site {{ font-size: 20px; color: var(--text-faint); }}
</style>
</head>
<body>
<div class="canvas">
  <div class="eyebrow">{eyebrow}</div>
  <div class="title">{title}</div>
  <div class="tagline">{tagline}</div>

  <div class="ranklist">
{rows}
  </div>

  <svg class="mountains" viewBox="0 0 1080 340" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0,340 L0,240 L140,150 L230,210 L340,95 L430,195 L560,65 L660,180 L760,130 L860,210 L960,120 L1080,195 L1080,340 Z" fill="#151827" opacity="0.9"/>
    <path d="M0,340 L0,275 L120,225 L220,265 L320,195 L420,250 L540,160 L640,240 L740,200 L860,260 L960,185 L1080,240 L1080,340 Z" fill="#1c2033"/>
    <path d="M0,340 L0,305 L160,275 L280,300 L400,260 L520,290 L640,250 L760,290 L880,265 L1000,295 L1080,280 L1080,340 Z" fill="#232842"/>
  </svg>

  <div class="footer">
    <div class="footer__brand">Moje<span>hory</span></div>
    <div class="footer__site">michaldokoupil.cz</div>
  </div>
</div>
</body>
</html>
"""


def render_slide(eyebrow, title, tagline, items, out_name, start_rank=1):
    rows = []
    for i, (name, meta, value) in enumerate(items, start_rank):
        rows.append(f"""    <div class="rank-row">
      <div class="rank-num">{i:02d}</div>
      <div class="rank-main"><div class="rank-name">{esc(name)}</div><div class="rank-meta">{meta}</div></div>
      <div class="rank-value">{esc(value)}</div>
    </div>""")
    html = TEMPLATE.format(
        title_plain=title,
        eyebrow=esc(eyebrow),
        title=esc(title),
        tagline=esc(tagline),
        rows="\n".join(rows),
    )
    out_path = os.path.join(OUT_DIR, out_name)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Written {out_path}")


PAGE_SIZE = 7  # kolik řádků se pohodlně vejde na jeden slide (1080x1350) bez přetečení


def main():
    with open(DATA_PATH, encoding="utf-8") as f:
        data = json.load(f)
    records = data["records"]
    featured = [r for r in records if r.get("featured")]

    vrcholy = sorted([r for r in featured if r["type"] == "vrchol" and r.get("altitude_m")], key=lambda r: -r["altitude_m"])
    ferraty = sorted([r for r in featured if r["type"] == "ferrata"], key=lambda r: r.get("date") or "", reverse=True)
    hrebenovky = sorted([r for r in featured if r["type"] == "hřebenovka"], key=lambda r: r.get("date") or "", reverse=True)

    # Nej vrcholy — všechny TOP vrcholy, stránkované po PAGE_SIZE (žádné tiché ořezání seznamu).
    pages = [vrcholy[i:i + PAGE_SIZE] for i in range(0, len(vrcholy), PAGE_SIZE)]
    slide_num = 2
    for page_idx, page in enumerate(pages):
        start_rank = page_idx * PAGE_SIZE + 1
        tagline = "Nejvyšší vrcholy z mého osobního výběru TOP výstupů."
        if len(pages) > 1:
            tagline += f" ({page_idx + 1}/{len(pages)})"
        render_slide(
            "Osobní horský deník", "Nej vrcholy", tagline,
            [(r["name"], f"{flag(r.get('country'))} {esc(r.get('country') or '')}".strip(), f"{fmt_num(r['altitude_m'])} m") for r in page],
            f"moje-hory-social-4x5-{slide_num}-vrcholy-{page_idx + 1}.html",
            start_rank=start_rank,
        )
        slide_num += 1

    render_slide(
        "Osobní horský deník", "Nej ferraty",
        "Moje TOP via ferraty — od klasik po nejdelší v Rakousku.",
        [(r["name"], f"{flag(r.get('country'))} {esc(r.get('country') or '')}".strip(), fmt_date(r.get("date"))) for r in ferraty],
        f"moje-hory-social-4x5-{slide_num}-ferraty.html",
    )
    slide_num += 1
    render_slide(
        "Osobní horský deník", "Nej hřebenovky",
        "Moje TOP hřebenové přechody napříč Evropou.",
        [(r["name"], f"{flag(r.get('country'))} {esc(r.get('country') or '')}".strip(), fmt_date(r.get("date"))) for r in hrebenovky],
        f"moje-hory-social-4x5-{slide_num}-hrebenovky.html",
    )


if __name__ == "__main__":
    main()
