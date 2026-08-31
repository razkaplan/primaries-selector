#!/usr/bin/env python3
"""Build data/media/roster.json: the "realistic candidates" of every party,
with social handles where known — the collection targets for collect_media.py.

Realistic = listed candidates ranked within the party's 30-day polling
average x1.25 + 2 (parties under 2 average seats: leader only), plus the
principals of parties that poll seats but have not yet published a list.
Social handles come from the Democrats profiles already in the repo
(data/candidates.json) and the curated PRINCIPALS table; the rest stay null
until filled in (data/media/handles_overrides.json is merged last, so
handles can be added without touching this script)."""
import datetime, json, math, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# principals of parties without a published list yet: (party, name_he, x url)
PRINCIPALS = [
    ("yashar", "גדי איזנקוט", "Gadi Eisenkot", None),
    ("together", "נפתלי בנט", "Naftali Bennett", "https://x.com/naftalibennett"),
    ("together", "יאיר לפיד", "Yair Lapid", "https://x.com/yairlapid"),
    ("otzma_yehudit", "איתמר בן גביר", "Itamar Ben-Gvir", "https://x.com/itamarbengvir"),
    ("shas", "אריה דרעי", "Aryeh Deri", "https://x.com/ariyederi"),
    ("utj", "משה גפני", "Moshe Gafni", None),
    ("utj", "יצחק גולדקנופף", "Yitzhak Goldknopf", None),
    ("yisrael_beiteinu", "אביגדור ליברמן", "Avigdor Lieberman", "https://x.com/AvigdorLiberman"),
    ("blue_white", "בני גנץ", "Benny Gantz", "https://x.com/gantzbe"),
    ("zionist_home", "חילי טרופר", "Hili Tropper", None),
    ("zionist_home", "יועז הנדל", "Yoaz Hendel", None),
    ("unity", "גלעד ארדן", "Gilad Erdan", "https://x.com/giladerdan1"),
    ("unity", "יולי אדלשטיין", "Yuli Edelstein", "https://x.com/YuliEdelstein"),
    ("amcha_yisrael", "עופר וינטר", "Ofer Winter", None),
    ("israel_first", "שרן השכל", "Sharren Haskel", "https://x.com/sharrenhaskel"),
    ("likud", "בנימין נתניהו", "Benjamin Netanyahu", "https://x.com/netanyahu"),
]


def slug(name):
    s = re.sub(r"\(.*?\)", "", name).strip().lower()
    return re.sub(r"[^a-z0-9]+", "_", s).strip("_") or "x"


def seat_averages(polls, since):
    sums = {}
    for p in polls:
        if p["kind"] != "seat_projection" or not p["date"] or p["date"] < since:
            continue
        for k, v in p["results"].items():
            if isinstance(v, (int, float)):
                s = sums.setdefault(k, [0, 0])
                s[0] += v
                s[1] += 1
    return {k: t / n for k, (t, n) in sums.items() if n}


def main():
    lists = json.load(open(f"{ROOT}/data/elections/party_lists.json", encoding="utf-8"))
    polls = json.load(open(f"{ROOT}/data/elections/polls.json", encoding="utf-8"))["polls"]
    meta = json.load(open(f"{ROOT}/data/elections/meta.json", encoding="utf-8"))
    latest = max(p["date"] for p in polls if p["date"] and p["kind"] == "seat_projection")
    since = (datetime.date.fromisoformat(latest) - datetime.timedelta(days=30)).isoformat()
    avg = seat_averages(polls, since)

    # the Democrats' profiles collected for the primaries tool carry socials
    dems_socials = {}
    p = f"{ROOT}/app/data/candidates.json"
    if os.path.exists(p):
        for c in json.load(open(p, encoding="utf-8")):
            dems_socials[c["name"]] = c.get("socials", {})

    roster, seen = [], set()
    for pl in lists:
        a = avg.get(pl["party"], 0)
        cut = math.ceil(a * 1.25 + 2) if a >= 2 else 1
        for c in pl["candidates"]:
            # skip unfilled slots and rotation placeholders that aren't people
            if c["rank"] > cut or c["name"] == "TBD" or c["name"].startswith("Ta'al") \
                    or c["name"].startswith("Ta’al"):
                continue
            socials = dems_socials.get(c.get("name_he") or "", {})
            roster.append({
                "id": slug(c["name"]),
                "name_he": c.get("name_he"),
                "name_en": c["name"],
                "party": pl["party"],
                "list_rank": c["rank"],
                "realistic": True,
                "wikipedia": c["wikipedia"],
                "socials": {k: v for k, v in socials.items() if v} or
                           ({"x": None}),
            })
            seen.add(slug(c["name"]))

    for party, he, en, x in PRINCIPALS:
        if slug(en) in seen:
            continue
        roster.append({"id": slug(en), "name_he": he, "name_en": en,
                       "party": party, "list_rank": None, "realistic": True,
                       "wikipedia": None, "socials": {"x": x}})

    # local handle overrides win (fill in discovered handles there)
    op = f"{ROOT}/data/media/handles_overrides.json"
    if os.path.exists(op):
        overrides = json.load(open(op, encoding="utf-8"))
        for r in roster:
            if r["id"] in overrides:
                r["socials"] = {**r["socials"], **overrides[r["id"]]}

    os.makedirs(f"{ROOT}/data/media", exist_ok=True)
    out = {"generated_from": meta, "window_start": since, "roster": roster}
    json.dump(out, open(f"{ROOT}/data/media/roster.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    with_handle = sum(1 for r in roster if any(r["socials"].values()))
    print(f"roster.json: {len(roster)} candidates, {with_handle} with at least one handle")


if __name__ == "__main__":
    main()
