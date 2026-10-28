#!/usr/bin/env python3
"""Build data/elections/results.json from ynet's live results feed, which
carries the Central Elections Committee count (votes per list, counting
progress) and the seat allocation including surplus-vote agreements.

The CEC site itself is geo-restricted, so the feed is fetched where it is
reachable (the update-data workflow):
  curl -sf https://ynet-election-map.yit-labs.com/api/feed/seats.json -o seats.json
  python3 scripts/build_results.py seats.json

Fails rather than publish a count that doesn't add up."""
import json, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTS = [f"{ROOT}/data/elections/results.json", f"{ROOT}/app/data/elections/results.json"]
FEED = "https://ynet-election-map.yit-labs.com/api/feed/seats.json"
# Ballot letters (as on the ballot slips) -> the site's party keys.
LETTERS = {
    "מחל": "likud", "דרך": "yashar", "ודם": "joint_list", "רק": "together",
    "אמת": "democrats", "ג": "utj", "ל": "yisrael_beiteinu", "ב": "otzma_yehudit",
    "שס": "shas", "עם": "raam", "ט": "rzp", "די": "reserv_nep", "ך": "amcha_yisrael",
}


def fail(msg):
    raise SystemExit(f"results.json: {msg}")


def main(path):
    feed = json.load(open(path, encoding="utf-8"))
    lists = []
    for l in feed["lists"]:
        key = LETTERS.get(l["letter"])
        if l["seats"] and not key:
            fail(f"list with seats but no known key: {l['letter']} {l['name']}")
        lists.append({
            "key": key, "letter": l["letter"], "name_he": l["name"], "votes": l["votes"],
            "pct": l["pct"], "seats": l["seats"], "passes": l["passes"], "partner": l.get("partner"),
        })
    if sum(l["seats"] for l in lists) != 120:
        fail("seats do not add up to 120")
    if sum(l["votes"] for l in lists) != feed["validVotes"]:
        fail("list votes do not add up to the valid votes")
    c = feed["counting"]
    out = {
        "_comment": "Live count of the 26th Knesset election, from the CEC data as published in ynet's results feed. Partial until the CEC publishes final results; double-envelope ballots are counted separately and can move seats.",
        "status": "final" if c["boxesCounted"] >= c["boxesTotal"] and feed.get("status") == "final" else "partial",
        "updated_at": feed["updatedAt"],
        "counting": c,
        "valid_votes": feed["validVotes"],
        "threshold": feed["threshold"],
        "lists": sorted(lists, key=lambda l: (-l["seats"], -l["votes"])),
        "sources": [
            {"source_name": "ynet, לפי נתוני ועדת הבחירות המרכזית", "as_of": feed["updatedAt"][:10],
             "url": "https://www.ynet.co.il/news/elections2026/article/bj5pk302zg", "feed": FEED},
            {"source_name": "ועדת הבחירות המרכזית (האתר הרשמי)", "as_of": feed["updatedAt"][:10],
             "url": "https://votes26.bechirot.gov.il/"},
        ],
    }
    for o in OUTS:
        json.dump(out, open(o, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"results.json: {c['boxesPct']}% of boxes, {sum(1 for l in lists if l['seats'])} lists in, updated {feed['updatedAt']}")


if __name__ == "__main__":
    main(sys.argv[1])
