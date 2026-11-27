#!/usr/bin/env python3
"""Build data/elections/results.json from the Central Elections Committee's
own national results page: the final, official count.

The ynet feed that build_results.py reads never reported a final count (its
last state is a 96.5% "practice" file), so the site kept showing the morning-
after count for a month. This reads the committee's page directly.

The committee's site answers only from Israel and only to a browser user
agent, so run it from a machine there, not from the update-data workflow:

  curl -sL -A "Mozilla/5.0" https://votes26.bechirot.gov.il/ -o cec.html
  python3 scripts/build_results_cec.py cec.html

Refuses a page that is not marked final, or a count that does not add up."""
import datetime, html, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_results import LETTERS, OUTS, fail  # noqa: E402

URL = "https://votes26.bechirot.gov.il/"
FINAL_MARK = "תוצאות סופיות רשמיות"
THRESHOLD_PCT = 3.25


def _text(fragment):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", fragment))).strip()


def _int(s):
    return int(s.replace(",", ""))


def parse(page):
    """The committee's national page -> summary numbers and one row per list."""
    page = re.sub(r"<script.*?</script>|<style.*?</style>", "", page, flags=re.S)
    text = _text(page)

    def num(label):
        m = re.search(label + r"[^\d]{0,20}([\d,]+(?:\.\d+)?)", text)
        if not m:
            fail(f"committee page: '{label}' not found")
        return m.group(1)

    lists = []
    for row in re.findall(r"<tr.*?</tr>", page, re.S):
        cells = [_text(c) for c in re.findall(r"<td.*?</td>", row, re.S)]
        if len(cells) != 5:
            continue  # the header row uses <th>
        name, letter, seats, pct, votes = cells
        lists.append({"name": name, "letter": letter, "seats": int(seats),
                      "pct": float(pct.rstrip("%")), "votes": _int(votes)})
    if not lists:
        fail("committee page: results table not found")
    return {
        "final": FINAL_MARK in text,
        "eligible": _int(num("מספר בעלי זכות בחירה")),
        "voters": _int(num("מספר מצביעים")),
        "turnout_pct": float(num("שיעור הצבעה")),
        "valid_votes": _int(num("קולות כשרים - סופי")),
        "invalid_votes": _int(num("קולות פסולים")),
        "lists": lists,
    }


def build(parsed, previous, now_iso):
    """results.json in the shape the site reads. `previous` is the file being
    replaced: it supplies the site's short list names, the surplus-vote
    partners and the number of ballot boxes, none of which the page carries."""
    if not parsed["final"]:
        fail(f"committee page is not marked '{FINAL_MARK}'; refusing to publish it as final")
    rows = parsed["lists"]
    if sum(l["seats"] for l in rows) != 120:
        fail("seats do not add up to 120")
    if sum(l["votes"] for l in rows) != parsed["valid_votes"]:
        fail("list votes do not add up to the valid votes")
    prev = {l["letter"]: l for l in previous.get("lists", [])}
    lists = []
    for l in rows:
        key = LETTERS.get(l["letter"])
        passes = l["votes"] * 100 >= THRESHOLD_PCT * parsed["valid_votes"]
        if l["seats"] and not key:
            fail(f"list with seats but no known key: {l['letter']} {l['name']}")
        if bool(l["seats"]) != passes:
            fail(f"seats and threshold disagree for {l['letter']} {l['name']}")
        lists.append({
            "key": key, "letter": l["letter"],
            "name_he": prev.get(l["letter"], {}).get("name_he") or l["name"],
            "votes": l["votes"], "pct": l["pct"], "seats": l["seats"], "passes": passes,
            "partner": prev.get(l["letter"], {}).get("partner"),
        })
    boxes = previous.get("counting", {}).get("boxesTotal")
    today = now_iso[:10]
    return {
        "_comment": f"Final official results of the 26th Knesset election, read from the Central Elections Committee's national results page ({URL}) on {today}. Built by scripts/build_results_cec.py.",
        "status": "final",
        "updated_at": now_iso,
        "counting": {"boxesCounted": boxes, "boxesTotal": boxes, "boxesPct": 100.0,
                     "eligibleCounted": parsed["eligible"], "eligibleTotal": parsed["eligible"], "eligiblePct": 100.0},
        "turnout": {"eligible": parsed["eligible"], "voters": parsed["voters"],
                    "pct": parsed["turnout_pct"], "invalid_votes": parsed["invalid_votes"]},
        "valid_votes": parsed["valid_votes"],
        "threshold": {"pct": THRESHOLD_PCT, "votes": -(-parsed["valid_votes"] * 325 // 10000)},
        "lists": sorted(lists, key=lambda l: (-l["seats"], -l["votes"])),
        "sources": [{"source_name": "ועדת הבחירות המרכזית: תוצאות סופיות רשמיות", "as_of": today, "url": URL}],
    }


def main(path, outs=OUTS):
    previous = json.load(open(outs[0], encoding="utf-8")) if os.path.exists(outs[0]) else {}
    now = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")
    out = build(parse(open(path, encoding="utf-8", errors="replace").read()), previous, now)
    for o in outs:
        json.dump(out, open(o, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    seated = ", ".join(f"{l['name_he']} {l['seats']}" for l in out["lists"] if l["seats"])
    print(f"results.json: FINAL, {out['valid_votes']:,} valid votes, turnout {out['turnout']['pct']}%: {seated}")


if __name__ == "__main__":
    main(sys.argv[1])
