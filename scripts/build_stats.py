"""Builds custom pink stat cards (stats + top languages) into dist/ for the output branch."""
import json
import os
import urllib.request

USER = os.environ.get("GITHUB_REPOSITORY_OWNER", "c0smo-55")
TOKEN = os.environ.get("GITHUB_TOKEN", "")

FONT = "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif"
BG, BORDER, TITLE, TEXT, VALUE = "#1d1430", "#ff8fab", "#ff8fab", "#cfc4e6", "#ffffff"
BAR_COLORS = ["#ff8fab", "#b197fc", "#7dd3fc", "#f7b9d4", "#ffc09f", "#f07a9b"]


def gh(url):
    headers = {"Accept": "application/vnd.github+json", "User-Agent": "stats-card"}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    with urllib.request.urlopen(urllib.request.Request(url, headers=headers)) as r:
        return json.load(r)


def card_shell(title, body):
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" width="500" height="200" role="img" aria-label="{title}">
  <defs>
    <clipPath id="r"><rect width="500" height="200" rx="18"/></clipPath>
    <filter id="b" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="32"/></filter>
  </defs>
  <g clip-path="url(#r)">
    <rect width="500" height="200" rx="18" fill="{BG}"/>
    <circle cx="475" cy="5" r="75" fill="#ff8fab" opacity="0.28" filter="url(#b)"/>
    <circle cx="20" cy="205" r="65" fill="#b197fc" opacity="0.20" filter="url(#b)"/>
    <text x="28" y="40" font-family="{FONT}" font-size="19" font-weight="700" fill="{TITLE}">{title}</text>
{body}
  </g>
  <rect x="0.5" y="0.5" width="499" height="199" rx="18" fill="none" stroke="{BORDER}" stroke-opacity="0.28"/>
</svg>
"""


def stat_row(x, y, label, value):
    return (
        f'    <text x="{x}" y="{y}" font-family="{FONT}" font-size="14">'
        f'<tspan fill="{TITLE}">&#10022;</tspan>'
        f'<tspan fill="{TEXT}"> {label}: </tspan>'
        f'<tspan fill="{VALUE}" font-weight="700">{value}</tspan></text>\n'
    )


def build():
    user = gh(f"https://api.github.com/users/{USER}")
    repos = gh(f"https://api.github.com/users/{USER}/repos?per_page=100")
    own = [r for r in repos if not r["fork"]]
    stars = sum(r["stargazers_count"] for r in own)

    try:
        commits = gh(f"https://api.github.com/search/commits?q=author:{USER}")["total_count"]
    except Exception:
        commits = "?"
    try:
        prs = gh(f"https://api.github.com/search/issues?q=author:{USER}+type:pr")["total_count"]
    except Exception:
        prs = "?"

    body = ""
    body += stat_row(28, 85, "total stars", stars)
    body += stat_row(28, 120, "total commits", commits)
    body += stat_row(28, 155, "pull requests", prs)
    body += stat_row(270, 85, "public repos", user["public_repos"])
    body += stat_row(270, 120, "followers", user["followers"])
    body += stat_row(270, 155, "following", user["following"])
    stats_svg = card_shell(f"{USER}'s github stats", body)

    langs = {}
    for r in own:
        try:
            for lang, n in gh(r["languages_url"]).items():
                langs[lang] = langs.get(lang, 0) + n
        except Exception:
            pass
    total = sum(langs.values()) or 1
    top = sorted(langs.items(), key=lambda kv: -kv[1])[:6]

    body = ""
    x = 28.0
    for i, (lang, n) in enumerate(top):
        w = max(6.0, n / total * 444)
        w = min(w, 444 - (x - 28))
        body += (
            f'    <rect x="{x:.1f}" y="62" width="{w:.1f}" height="11" rx="5.5" '
            f'fill="{BAR_COLORS[i % len(BAR_COLORS)]}"/>\n'
        )
        x += w + 3
    col_x = [28, 270]
    for i, (lang, n) in enumerate(top):
        cx = col_x[i // 3]
        cy = 105 + (i % 3) * 30
        pct = n / total * 100
        body += f'    <circle cx="{cx + 5}" cy="{cy - 5}" r="5" fill="{BAR_COLORS[i % len(BAR_COLORS)]}"/>\n'
        body += (
            f'    <text x="{cx + 18}" y="{cy}" font-family="{FONT}" font-size="13.5">'
            f'<tspan fill="{TEXT}">{lang}</tspan>'
            f'<tspan fill="{VALUE}" font-weight="700"> {pct:.1f}%</tspan></text>\n'
        )
    langs_svg = card_shell("most used languages", body)

    os.makedirs("dist", exist_ok=True)
    with open("dist/stats-card.svg", "w", encoding="utf-8") as f:
        f.write(stats_svg)
    with open("dist/top-langs.svg", "w", encoding="utf-8") as f:
        f.write(langs_svg)
    print(f"built cards: stars={stars} commits={commits} langs={[l for l, _ in top]}")


if __name__ == "__main__":
    build()
