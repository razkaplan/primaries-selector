#!/usr/bin/env python3
"""Flatten data/media/corpus/*.jsonl into app/data/elections/quotes.json
(and data/elections/quotes.json), newest first. Every record must satisfy
the corpus iron rule (date + source URL; see data/media/SCHEMA.md).
Optional record fields carried through: tags (e.g. ["controversial"])."""
import glob, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# A quote must link to the item that carries it, not to a listing page
# where it may have appeared once (readers must be able to verify it).
LISTING = re.compile(r"/(topics?|tags?|category|search)/")
FIELDS = ["candidate_id", "candidate_he", "party", "source_type",
          "source_name", "date", "url", "text", "tags"]


def main():
    rows = []
    for path in sorted(glob.glob(f"{ROOT}/data/media/corpus/*.jsonl")):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if not line:
                continue
            r = json.loads(line)
            if not r.get("url"):
                raise SystemExit(f"iron-rule violation (no url): {path}: {line[:80]}")
            if LISTING.search(r["url"]):
                raise SystemExit(f"iron-rule violation (listing page, not the item): {path}: {r['url']}")
            rows.append({k: r[k] for k in FIELDS if r.get(k) is not None})
    rows.sort(key=lambda r: r.get("date") or "", reverse=True)
    for out in (f"{ROOT}/data/elections/quotes.json",
                f"{ROOT}/app/data/elections/quotes.json"):
        json.dump(rows, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    tagged = sum(1 for r in rows if r.get("tags"))
    print(f"quotes.json: {len(rows)} records ({tagged} tagged)")


if __name__ == "__main__":
    main()
