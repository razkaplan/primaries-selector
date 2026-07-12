#!/usr/bin/env python3
"""Collect Instagram/TikTok follower counts for candidates missing them,
via the Bright Data CLI (webdata instagram_profiles / tiktok_profiles).
Updates data/popularity/<id>.json in place. Numbers only from tool output."""
import json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
os.makedirs("data/followers_raw", exist_ok=True)

todo = json.load(open("data/followers_todo.json", encoding="utf-8"))


def clean_url(u):
    u = re.sub(r"[?#].*$", "", u.strip())
    return u if u.endswith("/") else u + "/"


def run_webdata(kind, url, out):
    try:
        r = subprocess.run(
            ["bdata", "webdata", kind, url, "-o", out, "--timeout", "180"],
            capture_output=True, text=True, timeout=240,
        )
        if not os.path.exists(out):
            return None
        d = json.load(open(out, encoding="utf-8"))
        rows = d if isinstance(d, list) else [d]
        if not rows:
            return None
        row = rows[0]
        for key in ("followers", "followers_count", "follower_count"):
            v = row.get(key)
            if isinstance(v, (int, float)) and v > 0:
                return int(v)
        return None
    except Exception:
        return None


results = {}
for item in todo:
    pid, name = item["id"], item["name"]
    total = 0
    found = False
    parts = {}
    if item.get("instagram"):
        v = run_webdata("instagram_profiles", clean_url(item["instagram"]),
                        f"data/followers_raw/{pid}_ig.json")
        if v:
            parts["instagram"] = v; total += v; found = True
    if item.get("tiktok"):
        v = run_webdata("tiktok_profiles", clean_url(item["tiktok"]),
                        f"data/followers_raw/{pid}_tt.json")
        if v:
            parts["tiktok"] = v; total += v; found = True

    p = f"data/popularity/{pid}.json"
    if os.path.exists(p):
        doc = json.load(open(p, encoding="utf-8"))
    else:
        doc = {"id": pid, "name": name, "signals": {
            "wikipedia": {"exists": None, "title": None, "monthly_views_avg": None},
            "followers": {"facebook": None, "instagram": None, "x": None,
                          "tiktok": None, "total_known": None},
            "news_presence": {"major_domains_top20": None, "domains": []},
            "prior_national_list": None}, "notes_he": ""}
    if found:
        f = doc["signals"]["followers"]
        for k, v in parts.items():
            f[k] = v
        f["total_known"] = sum(v for v in
                               [f.get("facebook"), f.get("instagram"),
                                f.get("x"), f.get("tiktok")] if v)
        json.dump(doc, open(p, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    results[pid] = {"name": name, "found": parts or None}
    print(f"{pid} | {name} | {parts or 'no data'}", flush=True)

json.dump(results, open("data/followers_run_log.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
ok = sum(1 for r in results.values() if r["found"])
print(f"DONE: followers found for {ok}/{len(todo)}")
