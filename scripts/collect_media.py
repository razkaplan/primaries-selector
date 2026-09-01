#!/usr/bin/env python3
"""Collect the media corpus for the realistic candidates in
data/media/roster.json: social posts (X, Instagram, TikTok, Facebook) via
the Bright Data CLI, and news mentions via Google News SERP.

Every corpus record carries a date, a source URL and the verbatim text
(see data/media/SCHEMA.md) so quotes can always be traced and shared.

Usage:
  python3 scripts/collect_media.py                # everyone with handles
  python3 scripts/collect_media.py yair_golan …   # specific roster ids
  python3 scripts/collect_media.py --news-only    # skip social collection

Raw tool output is cached in data/media/raw/ (gitignored); the normalized
corpus is data/media/corpus/<id>.jsonl, one JSON record per line, newest
first, deduplicated by URL. Re-running merges instead of overwriting."""
import datetime, json, os, re, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = f"{ROOT}/data/media/raw"
CORPUS = f"{ROOT}/data/media/corpus"
NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")

WEBDATA_KINDS = {  # roster socials key -> bdata webdata dataset
    "x": "x_profile_posts",
    "instagram": "instagram_posts",
    "tiktok": "tiktok_posts",
    "facebook": "facebook_posts",
    "youtube": "youtube_videos",
}
NEWS_SITES = ["ynet.co.il", "haaretz.co.il", "maariv.co.il", "israelhayom.co.il",
              "walla.co.il", "kan.org.il", "mako.co.il", "now14.co.il",
              "zman.co.il", "globes.co.il", "calcalist.co.il"]


def bdata(args, out, timeout=240):
    try:
        subprocess.run(["bdata", *args, "-o", out, "--timeout", str(timeout - 60)],
                       capture_output=True, text=True, timeout=timeout)
        if os.path.exists(out):
            return json.load(open(out, encoding="utf-8"))
    except FileNotFoundError:
        sys.exit("bdata CLI not found - install the Bright Data CLI first")
    except Exception as e:
        print(f"    ! {e}")
    return None


def norm_date(v):
    """Best-effort ISO date from the assorted formats the datasets return."""
    if not v:
        return None
    m = re.search(r"(\d{4}-\d{2}-\d{2})", str(v))
    return m.group(1) if m else None


def social_records(kind, rows, cand):
    for row in rows if isinstance(rows, list) else [rows]:
        if not isinstance(row, dict):
            continue
        text = row.get("description") or row.get("post_text") or \
            row.get("content") or row.get("text") or ""
        url = row.get("url") or row.get("post_url") or row.get("link")
        date = norm_date(row.get("date_posted") or row.get("timestamp") or
                         row.get("create_time") or row.get("date"))
        if not (text.strip() and url and date):
            continue  # date + source URL are mandatory (SCHEMA.md)
        yield {"candidate_id": cand["id"], "candidate_he": cand["name_he"],
               "party": cand["party"], "source_type": f"social_{kind}",
               "source_name": kind, "date": date, "url": url,
               "text": text.strip()[:2000],
               "engagement": row.get("likes") or row.get("num_likes"),
               "collected_at": NOW}


def news_records(rows, cand):
    for row in (rows or {}).get("organic", []):
        url, title = row.get("link"), row.get("title") or ""
        desc = row.get("description") or ""
        date = norm_date(row.get("extensions")) or norm_date(desc)
        if not (url and title):
            continue
        yield {"candidate_id": cand["id"], "candidate_he": cand["name_he"],
               "party": cand["party"], "source_type": "news",
               "source_name": re.sub(r"^www\.", "", url.split("/")[2]),
               "date": date, "url": url,
               "text": f"{title} — {desc}".strip(" —")[:2000],
               "engagement": None, "collected_at": NOW}


def merge_corpus(cand_id, records):
    path = f"{CORPUS}/{cand_id}.jsonl"
    existing = {}
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            r = json.loads(line)
            existing[r["url"]] = r
    for r in records:
        existing[r["url"]] = r  # newest collection wins
    rows = sorted(existing.values(), key=lambda r: r["date"] or "", reverse=True)
    with open(path, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    return len(rows)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    news_only = "--news-only" in sys.argv
    os.makedirs(RAW, exist_ok=True)
    os.makedirs(CORPUS, exist_ok=True)
    roster = json.load(open(f"{ROOT}/data/media/roster.json", encoding="utf-8"))["roster"]
    targets = [r for r in roster if not args or r["id"] in args]

    for cand in targets:
        records = []
        if not news_only:
            for key, kind in WEBDATA_KINDS.items():
                url = (cand.get("socials") or {}).get(key)
                if not url:
                    continue
                print(f"{cand['id']}: {kind}")
                data = bdata(["webdata", kind, url], f"{RAW}/{cand['id']}_{key}.json")
                if data:
                    records.extend(social_records(key, data, cand))
        name = cand.get("name_he") or cand["name_en"]
        query = f'"{name}" ({" OR ".join("site:" + s for s in NEWS_SITES[:6])})'
        print(f"{cand['id']}: news serp")
        data = bdata(["serp", "google", query, "--num", "40"],
                     f"{RAW}/{cand['id']}_news.json")
        if data:
            records.extend(news_records(data, cand))
        n = merge_corpus(cand["id"], records)
        print(f"  -> {len(records)} new/updated, corpus now {n} records")


if __name__ == "__main__":
    main()
