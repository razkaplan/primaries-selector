"""Data-integrity tests: the site's iron rule (every published fact carries
a date and a link to the item that reports it), mirrors in sync, and the
scraper edge cases that have broken refresh runs before.

Run: python3 -m unittest discover -s tests -v
"""
import datetime, glob, json, os, re, sys, unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))

import scrape_elections  # noqa: E402

DATA = os.path.join(ROOT, "data", "elections")
APP_DATA = os.path.join(ROOT, "app", "data", "elections")
ISO = re.compile(r"^\d{4}-\d{2}-\d{2}$")
LISTING = re.compile(r"/(topics?|tags?|category|search)/")
TODAY = datetime.date.today().isoformat()
ELECTION_DAY = "2026-10-27"


def load(name, base=DATA):
    with open(os.path.join(base, name), encoding="utf-8") as fh:
        return json.load(fh)


def sourced(test, rec, where):
    """A record the site presents as fact: link + real, non-future date."""
    test.assertTrue(rec.get("url", "").startswith("http"), f"{where}: missing url")
    test.assertNotRegex(rec["url"], LISTING, f"{where}: links to a listing page, not the item")
    test.assertRegex(rec.get("as_of", ""), ISO, f"{where}: missing/invalid as_of")
    test.assertLessEqual(rec["as_of"], TODAY, f"{where}: dated in the future")


class Mirrors(unittest.TestCase):
    def test_app_copies_match_sources(self):
        for path in glob.glob(os.path.join(APP_DATA, "*.json")):
            name = os.path.basename(path)
            with self.subTest(file=name):
                self.assertEqual(load(name, APP_DATA), load(name), f"{name}: run the build script to re-mirror")


class Polls(unittest.TestCase):
    def setUp(self):
        self.polls = load("polls.json")["polls"]
        self.scraped = load("meta.json")["scraped_at"]

    def test_no_poll_dated_after_scrape(self):
        future = [(p["date_raw"], p["firm"]) for p in self.polls if p.get("date") and p["date"] > self.scraped]
        self.assertEqual(future, [])

    def test_dates_are_iso(self):
        for p in self.polls:
            if p.get("date"):
                self.assertRegex(p["date"], ISO)

    def test_every_poll_names_firm_and_page(self):
        for p in self.polls:
            self.assertTrue(p.get("firm"), p)
            self.assertTrue(p.get("source_page"), p)


class Scraper(unittest.TestCase):
    def test_span_tolerates_markup_errors(self):
        span = scrape_elections._span
        self.assertEqual(span('2data-sort-value=""'), 2)
        self.assertEqual(span("3"), 3)
        for bad in (None, "", "abc", "0"):
            self.assertEqual(span(bad), 1)

    def test_explicit_future_date_is_rejected(self):
        self.assertIsNone(scrape_elections.parse_date("Nov 2099", [2099]))

    def test_range_takes_end_date(self):
        self.assertEqual(scrape_elections.parse_date("23–24 Sep", [2026]), "2026-09-24")


class Quotes(unittest.TestCase):
    def test_quotes_link_to_the_item(self):
        for q in load("quotes.json"):
            with self.subTest(who=q["candidate_id"], url=q["url"]):
                self.assertTrue(q["url"].startswith("http"))
                self.assertNotRegex(q["url"], LISTING)
                if q.get("date"):
                    self.assertRegex(q["date"], ISO)
                    self.assertLessEqual(q["date"], TODAY)

    def test_social_posts_are_dated(self):
        # SCHEMA.md: date may be null only when a news outlet doesn't report one.
        for q in load("quotes.json"):
            if q["source_type"] not in ("news", "youtube"):
                self.assertTrue(q.get("date"), q)


class Money(unittest.TestCase):
    def setUp(self):
        self.m = load("money.json")

    def test_every_record_is_sourced(self):
        for key in ("funding_unit", "formula", "headline"):
            sourced(self, self.m[key], key)
        for party, rec in self.m["outgoing_seats"].items():
            sourced(self, rec, f"outgoing_seats.{party}")
        for key, recs in self.m.items():
            if isinstance(recs, list):
                for i, rec in enumerate(recs):
                    sourced(self, rec, f"{key}[{i}]")

    def test_advance_parts_add_up(self):
        for a in self.m["advances"]:
            with self.subTest(party=a["party"]):
                self.assertAlmostEqual(sum(v for _, v in a["parts"]), a["amount_nis"], delta=100_000)

    def test_self_guarantee_within_total(self):
        for t in self.m["private_totals"]:
            self.assertLessEqual(t["self_nis"], t["guarantees_nis"], t["party"])

    def test_named_guarantors_do_not_exceed_reported_totals(self):
        totals = {t["party"]: t["guarantees_nis"] for t in self.m["private_totals"]}
        named = {}
        for p in self.m["private_financing"]:
            if p["category"] in ("backer", "self"):
                named[p["party"]] = named.get(p["party"], 0) + p["amount_nis"]
        for party, s in named.items():
            with self.subTest(party=party):
                self.assertIn(party, totals)
                self.assertLessEqual(s, totals[party] * 1.02)


class Notices(unittest.TestCase):
    def test_every_fact_is_sourced(self):
        for n in load("notices.json")["notices"]:
            self.assertRegex(n["as_of"], ISO)
            for f in n["facts"]:
                self.assertTrue(f["sources"], f["text"])
                for s in f["sources"]:
                    sourced(self, s, f"{n['id']}: {f['text'][:30]}")

    def test_active_notice_rests_on_several_outlets(self):
        for n in load("notices.json")["notices"]:
            if n["active"]:
                outlets = {s["source_name"] for f in n["facts"] for s in f["sources"]}
                self.assertGreaterEqual(len(outlets), 3, n["id"])


class Coalition(unittest.TestCase):
    def test_stances_are_sourced(self):
        for s in load("coalition_stances.json")["stances"]:
            with self.subTest(who=s["who"]):
                self.assertTrue(s["url"].startswith("http"))
                self.assertRegex(s["date"], ISO)
                self.assertLessEqual(s["date"], ELECTION_DAY)


class CandidateFacts(unittest.TestCase):
    def test_facts_and_connections_have_sources(self):
        meta = load("candidates_meta.json")
        for rec in meta["facts"] + meta["connections"]:
            self.assertTrue(rec.get("source", "").startswith("http"), rec)


if __name__ == "__main__":
    unittest.main()
