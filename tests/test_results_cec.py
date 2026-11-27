"""Final results come from the Central Elections Committee's own page.

Until 2026-11-27 the site showed the count from the morning after the vote:
68.9% of ballot boxes, labelled "partial", with six parties on the wrong
number of seats. The ynet feed the builder read never reported a final count
(its last state is a 96.5% "practice" file), so nothing ever replaced it.

scripts/build_results_cec.py reads the committee's national results page and
refuses anything that is not marked final or does not add up. And
build_results.py may no longer overwrite a final file with a partial feed.
"""
import copy
import json
import os
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
FIXTURE = os.path.join(ROOT, "tests", "fixtures", "cec_national_final.html")


def fixture():
    return open(FIXTURE, encoding="utf-8").read()


PREV = {
    "counting": {"boxesTotal": 13389},
    "lists": [
        {"letter": "מחל", "name_he": "הליכוד", "partner": "ט"},
        {"letter": "דרך", "name_he": "ישר!", "partner": "אמת"},
        {"letter": "שס", "name_he": 'ש"ס', "partner": "ג"},
    ],
}


class ParseCecPage(unittest.TestCase):
    def setUp(self):
        import build_results_cec
        self.m = build_results_cec
        self.p = self.m.parse(fixture())

    def test_summary_numbers(self):
        self.assertTrue(self.p["final"])
        self.assertEqual(self.p["eligible"], 7331981)
        self.assertEqual(self.p["voters"], 5717397)
        self.assertEqual(self.p["valid_votes"], 5691426)
        self.assertEqual(self.p["invalid_votes"], 25971)
        self.assertEqual(self.p["turnout_pct"], 77.98)

    def test_lists(self):
        lists = {l["letter"]: l for l in self.p["lists"]}
        self.assertEqual(len(lists), 38)
        self.assertEqual((lists["מחל"]["seats"], lists["מחל"]["votes"], lists["מחל"]["pct"]), (27, 1167591, 20.51))
        self.assertEqual((lists["דרך"]["seats"], lists["רק"]["seats"], lists["ודם"]["seats"]), (21, 12, 11))
        self.assertEqual(sum(l["seats"] for l in lists.values()), 120)
        self.assertEqual(sum(l["votes"] for l in lists.values()), 5691426)


class BuildFromCec(unittest.TestCase):
    def setUp(self):
        import build_results_cec
        self.m = build_results_cec
        self.out = self.m.build(self.m.parse(fixture()), PREV, "2026-11-27T16:00:00.000Z")

    def test_shape_the_site_reads(self):
        o = self.out
        self.assertEqual(o["status"], "final")
        self.assertEqual(o["valid_votes"], 5691426)
        self.assertEqual(o["counting"]["boxesPct"], 100.0)
        self.assertEqual(o["counting"]["boxesTotal"], 13389)
        self.assertEqual(o["turnout"], {"eligible": 7331981, "voters": 5717397, "pct": 77.98, "invalid_votes": 25971})
        self.assertEqual(o["threshold"]["pct"], 3.25)
        self.assertEqual(o["updated_at"], "2026-11-27T16:00:00.000Z")
        self.assertEqual([s["url"] for s in o["sources"]], ["https://votes26.bechirot.gov.il/"])
        self.assertEqual(o["sources"][0]["as_of"], "2026-11-27")

    def test_lists_keep_site_names_keys_and_partners(self):
        by = {l["letter"]: l for l in self.out["lists"]}
        self.assertEqual((by["מחל"]["key"], by["מחל"]["name_he"], by["מחל"]["partner"]), ("likud", "הליכוד", "ט"))
        self.assertEqual(by["שס"]["name_he"], 'ש"ס')
        self.assertEqual(by["עם"]["key"], "raam")       # no previous name on file: falls back to the committee's
        self.assertTrue(by["עם"]["name_he"])
        self.assertEqual(self.out["lists"][0]["letter"], "מחל")  # sorted by seats, then votes
        for l in self.out["lists"]:
            with self.subTest(list=l["letter"]):
                self.assertEqual(l["passes"], l["seats"] > 0)
                if l["seats"]:
                    self.assertTrue(l["key"])

    def test_refuses_a_page_not_marked_final(self):
        html = fixture().replace("תוצאות סופיות רשמיות", "תוצאות ביניים")
        with self.assertRaises(SystemExit):
            self.m.build(self.m.parse(html), PREV, "2026-11-27T16:00:00.000Z")

    def test_refuses_a_count_that_does_not_add_up(self):
        p = self.m.parse(fixture())
        bad = copy.deepcopy(p); bad["lists"][0]["seats"] -= 1
        with self.assertRaises(SystemExit):
            self.m.build(bad, PREV, "2026-11-27T16:00:00.000Z")
        bad = copy.deepcopy(p); bad["lists"][0]["votes"] += 1
        with self.assertRaises(SystemExit):
            self.m.build(bad, PREV, "2026-11-27T16:00:00.000Z")


class FeedCannotDowngradeAFinalCount(unittest.TestCase):
    FEED = {
        "status": "practice", "updatedAt": "2026-10-30T04:57:58.820Z", "validVotes": 100,
        "counting": {"boxesCounted": 9, "boxesTotal": 10, "boxesPct": 90.0, "eligibleCounted": 1, "eligibleTotal": 1, "eligiblePct": 100},
        "threshold": {"pct": 3.25, "votes": 4},
        "lists": [{"letter": "מחל", "name": "הליכוד", "votes": 100, "pct": 100.0, "seats": 120, "passes": True}],
    }

    def run_feed(self, existing):
        import build_results
        with tempfile.TemporaryDirectory() as d:
            feed = os.path.join(d, "seats.json"); out = os.path.join(d, "results.json")
            json.dump(self.FEED, open(feed, "w", encoding="utf-8"), ensure_ascii=False)
            if existing is not None:
                json.dump(existing, open(out, "w", encoding="utf-8"), ensure_ascii=False)
            build_results.main(feed, outs=[out])
            return json.load(open(out, encoding="utf-8"))

    def test_a_final_file_survives_a_partial_feed(self):
        kept = self.run_feed({"status": "final", "marker": "official"})
        self.assertEqual(kept, {"status": "final", "marker": "official"})

    def test_a_partial_file_is_still_refreshed(self):
        self.assertEqual(self.run_feed({"status": "partial"})["updated_at"], "2026-10-30T04:57:58.820Z")
        self.assertEqual(self.run_feed(None)["status"], "partial")


if __name__ == "__main__":
    unittest.main()
