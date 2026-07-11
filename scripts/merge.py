#!/usr/bin/env python3
"""Merge roster (data/candidates.json) with per-candidate profiles
(data/profiles/<id>.json), electability signals (data/wiki_signals.json,
data/news_signals.json, data/popularity/<id>.json) and per-axis percentile
ranks into app/data/candidates.json."""
import json, math, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AXES = ["peace_diplomacy","religion_state","socioeconomic","democracy_law","arab_jewish",
        "climate_env","periphery","security","gender_lgbtq","education_health"]

roster = json.load(open(f"{ROOT}/data/candidates.json", encoding="utf-8"))
WIKI = json.load(open(f"{ROOT}/data/wiki_signals.json", encoding="utf-8"))
NEWS = json.load(open(f"{ROOT}/data/news_signals.json", encoding="utf-8"))
out, missing, problems = [], [], []


def load_pop(pid):
    p = f"{ROOT}/data/popularity/{pid}.json"
    if not os.path.exists(p):
        return {}
    try:
        return json.load(open(p, encoding="utf-8"))["signals"]
    except Exception:
        return {}


def percentile_map(pairs):
    """pairs: (pid, value|None) -> pid: percentile [0,1] among known values.
    Tied values share their midrank (standard treatment), so equal evidence
    yields equal percentiles instead of arbitrary id-order separation."""
    known = [(v, pid) for pid, v in pairs if v is not None]
    n = len(known)
    if n == 0:
        return {}
    if n == 1:
        return {known[0][1]: 0.5}
    by_val = {}
    for rank, (v, pid) in enumerate(sorted(known, key=lambda t: t[0])):
        by_val.setdefault(v, []).append((rank, pid))
    res = {}
    for v, group in by_val.items():
        mid = sum(r for r, _ in group) / len(group)
        for _, pid in group:
            res[pid] = mid / (n - 1)
    return res


ids = [c["id"] for c in roster]
followers = {pid: load_pop(pid).get("followers", {}).get("total_known") for pid in ids}
prior_nat = {pid: load_pop(pid).get("prior_national_list") for pid in ids}

wiki_pct = percentile_map([
    (pid, math.log10((WIKI.get(pid, {}).get("monthly_views_avg") or 0) + 1))
    if WIKI.get(pid, {}).get("exists") else (pid, None)
    for pid in ids
])
foll_pct = percentile_map([
    (pid, math.log10(followers[pid] + 1) if followers[pid] else None) for pid in ids
])
news_pct = percentile_map([
    (pid, NEWS.get(pid, {}).get("major_domains_top20")) for pid in ids
])


def electability(pid):
    """Weighted composite. Key distinctions:
    - No Wikipedia page is EVIDENCE of low salience (scored 0.15), not missing
      data: every candidate was checked against he.wikipedia the same way.
    - Followers are genuinely missing-at-random (only some were scraped before
      the collection agents died), so a null excludes that component rather
      than penalizing.
    - News presence was measured uniformly for all 51, always included.
    """
    W = {"wiki": 0.4, "news": 0.4, "followers": 0.2}
    comps = {}
    comps["wiki"] = 0.3 + 0.7 * wiki_pct[pid] if pid in wiki_pct else 0.15
    comps["news"] = news_pct.get(pid, 0.5)
    if pid in foll_pct:
        comps["followers"] = foll_pct[pid]
    wsum = sum(W[k] for k in comps)
    score = sum(W[k] * v for k, v in comps.items()) / wsum
    if prior_nat.get(pid):
        score = min(1.0, score + 0.1)
    signals = {
        "wikipedia_monthly_views": WIKI.get(pid, {}).get("monthly_views_avg"),
        "followers_total": followers.get(pid),
        "news_domains": NEWS.get(pid, {}).get("major_domains_top20"),
        "prior_national_list": bool(prior_nat.get(pid)),
        "coverage": len(comps),
    }
    return round(score * 5, 2), signals


# per-axis percentile ranks (statistical normalization for scoring)
profiles = {}
for c in roster:
    p = f"{ROOT}/data/profiles/{c['id']}.json"
    if os.path.exists(p):
        profiles[c["id"]] = json.load(open(p, encoding="utf-8"))

axes_pct_map = {}
for ax in AXES:
    ranked = percentile_map([(pid, prof["axes"].get(ax, 0)) for pid, prof in profiles.items()])
    for pid, pct in ranked.items():
        axes_pct_map.setdefault(pid, {})[ax] = round(pct, 3)

for c in roster:
    pid = c["id"]
    p = profiles.get(pid)
    if p is None:
        missing.append(f"{pid} {c['name']}")
        continue
    axes = p.get("axes", {})
    attrs = p.get("attrs", {})
    bad = [a for a in AXES if not isinstance(axes.get(a), (int, float)) or not 0 <= axes[a] <= 5]
    if bad:
        problems.append(f"{pid} {c['name']}: bad axes {bad}")
        continue
    elect, elect_signals = electability(pid)
    out.append({
        "id": pid,
        "name": c["name"],
        "bio": c["bio"],
        "photo": c.get("photo"),
        "website": c.get("website"),
        "cv": c.get("cv"),
        "socials": c.get("socials", {}),
        "axes": {a: axes[a] for a in AXES},
        "axes_pct": axes_pct_map.get(pid, {}),
        "attrs": attrs,
        "electability": elect,
        "electability_signals": elect_signals,
        "summary_he": p.get("summary_he", ""),
        "highlights_he": p.get("highlights_he", []),
        "sources": p.get("sources", []),
    })

json.dump(out, open(f"{ROOT}/app/data/candidates.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"merged {len(out)}/{len(roster)} candidates -> app/data/candidates.json")
if missing:
    print("MISSING PROFILES:", *missing, sep="\n  ")
if problems:
    print("PROBLEMS:", *problems, sep="\n  ")
sys.exit(1 if missing or problems else 0)
