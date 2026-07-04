#!/usr/bin/env python3
"""Merge roster (data/candidates.json) with per-candidate profiles
(data/profiles/<id>.json) into app/data/candidates.json."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AXES = ["peace_diplomacy","religion_state","socioeconomic","democracy_law","arab_jewish",
        "climate_env","periphery","security","gender_lgbtq","education_health"]

roster = json.load(open(f"{ROOT}/data/candidates.json", encoding="utf-8"))
out, missing, problems = [], [], []

for c in roster:
    pid = c["id"]
    ppath = f"{ROOT}/data/profiles/{pid}.json"
    if not os.path.exists(ppath):
        missing.append(f"{pid} {c['name']}")
        continue
    try:
        p = json.load(open(ppath, encoding="utf-8"))
    except Exception as e:
        problems.append(f"{pid} {c['name']}: bad json {e}")
        continue
    axes = p.get("axes", {})
    for a in AXES:
        v = axes.get(a)
        if not isinstance(v, (int, float)) or not (0 <= v <= 5):
            problems.append(f"{pid} {c['name']}: axis {a}={v!r}")
            axes[a] = 0
    attrs = p.get("attrs", {})
    attrs.setdefault("gender", "m")
    attrs.setdefault("sector", "jewish")
    attrs.setdefault("origin", "new")
    attrs.setdefault("region", "center")
    attrs.setdefault("experience", "professional")
    attrs.setdefault("age", None)
    out.append({
        "id": pid,
        "name": c["name"],
        "bio": c["bio"],
        "photo": c.get("photo"),
        "website": c.get("website"),
        "cv": c.get("cv"),
        "socials": c.get("socials", {}),
        "axes": {a: axes[a] for a in AXES},
        "attrs": attrs,
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
sys.exit(1 if missing else 0)
