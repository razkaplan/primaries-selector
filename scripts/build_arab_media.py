#!/usr/bin/env python3
"""Merge the Arab-media coverage research (one JSON per region) into
data/elections/arab_media.json and mirror it to app/data/elections/.

Iron rule: every item links to the article itself, carries a publication
date and the Arabic headline verbatim; every outlet names its country of
origin, and any ownership claim carries a source link. Usage:

  python3 scripts/build_arab_media.py region_a.json region_b.json ...
  python3 scripts/build_arab_media.py            # re-validate and mirror
"""
import datetime, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = f"{ROOT}/data/elections/arab_media.json"
DST = f"{ROOT}/app/data/elections/arab_media.json"
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
LISTING = re.compile(r"/(topics?|tags?|category|search)/")
TOPICS = {"disqualification", "arab_turnout", "arab_lists", "netanyahu", "opposition",
          "polls", "far_right", "crime", "war", "normalization", "other"}
TODAY = datetime.date.today().isoformat()


def fail(msg):
    raise SystemExit(f"arab_media.json: {msg}")


def validate(data):
    ids = set()
    for o in data["outlets"]:
        for k in ("id", "name_ar", "name_he", "country_he", "country_code", "type_he", "site_url"):
            if not o.get(k):
                fail(f"outlet {o.get('id')}: missing {k}")
        if o.get("ownership_he") and not str(o.get("ownership_url", "")).startswith("http"):
            fail(f"outlet {o['id']}: ownership claim without a source link")
        ids.add(o["id"])
    seen = set()
    for it in data["items"]:
        where = f"item {it.get('url')}"
        if it.get("outlet_id") not in ids:
            fail(f"{where}: unknown outlet {it.get('outlet_id')}")
        if not str(it.get("url", "")).startswith("http") or LISTING.search(it["url"]):
            fail(f"{where}: needs the article URL")
        if not DATE.match(it.get("date", "")) or it["date"] > TODAY:
            fail(f"{where}: bad date {it.get('date')}")
        if not it.get("headline_ar") or not it.get("headline_he"):
            fail(f"{where}: headline missing")
        bad = set(it.get("topics", [])) - TOPICS
        if bad or not it.get("topics"):
            fail(f"{where}: topics {bad or 'empty'}")
        if it["url"] in seen:
            fail(f"{where}: duplicate")
        seen.add(it["url"])
    return len(ids), len(seen)


def main():
    if len(sys.argv) > 1:
        merged = {"outlets": [], "items": []}
        for path in sys.argv[1:]:
            part = json.load(open(path, encoding="utf-8"))
            merged["outlets"] += part["outlets"]
            merged["items"] += part["items"]
        prev = json.load(open(SRC, encoding="utf-8")) if os.path.exists(SRC) else {}
        merged["updated"] = TODAY
        merged["_comment"] = prev.get("_comment", "")
        data = merged
    else:
        data = json.load(open(SRC, encoding="utf-8"))
    data["items"].sort(key=lambda i: i["date"], reverse=True)
    n_out, n_items = validate(data)
    for out in (SRC, DST):
        json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"arab_media.json: {n_out} outlets, {n_items} items validated and mirrored")


if __name__ == "__main__":
    main()
