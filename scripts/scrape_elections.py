#!/usr/bin/env python3
"""Scrape the 2026 Israeli legislative election: every party's candidate list
and every published poll (seat projections, voting-intention percentages,
scenario/leadership/coalition polls) from English Wikipedia.

Sources (Parsoid HTML via the Wikimedia REST API, cached in data/elections/raw/):
  - Party lists for the 2026 Israeli legislative election
  - Opinion polling for the 2026 Israeli legislative election (2026 tables)
  - 2025 / 2024 / 2022-2023 opinion polling subpages

Outputs (see data/elections/SCHEMA.md), mirrored to app/data/elections/ for
the Next.js pages:
  - data/elections/party_lists.json  ranked slate per party
  - data/elections/polls.json        one record per poll row, keyed by table header
  - data/elections/parties.json      registry of parties seen in lists + polls

Usage: python3 scripts/scrape_elections.py [--offline]
  --offline  parse the cached HTML in data/elections/raw/ without refetching
"""
import datetime, json, os, re, sys, urllib.request
from html.parser import HTMLParser

TODAY = datetime.date.today().isoformat()

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = f"{ROOT}/data/elections/raw"
OUT = f"{ROOT}/data/elections"
API = "https://en.wikipedia.org/api/rest_v1/page/html/"
UA = {"User-Agent": "primaries-selector/1.0 (https://github.com/razkaplan/primaries-selector)"}

PAGES = {
    "party_lists": "Party_lists_for_the_2026_Israeli_legislative_election",
    "polls_2026": "Opinion_polling_for_the_2026_Israeli_legislative_election",
    "polls_2025": "2025_opinion_polling_for_the_2026_Israeli_legislative_election",
    "polls_2024": "2024_opinion_polling_for_the_2026_Israeli_legislative_election",
    "polls_2022_2023": "2022%E2%80%932023_opinion_polling_for_the_2026_Israeli_legislative_election",
}

# poll-table header text -> canonical party key (+ Hebrew/English names below).
# Headers drift across table eras (mergers, renames), so aliases matter.
ALIASES = {
    "likud": "likud", "together": "together", "rzp": "rzp",
    "religious zionist": "rzp", "religious zionist party": "rzp",
    "otzma": "otzma_yehudit",
    "otzma yehudit": "otzma_yehudit", "blue & white": "blue_white",
    "blue and white": "blue_white", "national unity": "blue_white",
    "shas": "shas", "utj": "utj", "united torah judaism": "utj",
    "yisrael beiteinu": "yisrael_beiteinu", "ra'am": "raam", "raam": "raam",
    "united arab list": "raam",
    "joint list": "joint_list", "dems": "democrats", "the democrats": "democrats",
    "yashar": "yashar", "zionist home": "zionist_home", "unity": "unity",
    "amcha yisrael": "amcha_yisrael", "winter party": "amcha_yisrael",
    "yesh atid": "yesh_atid", "bennett 2026": "bennett_2026",
    "reserv.": "reservists", "reservists": "reservists",
    "the reservists": "reservists", "labor": "labor", "meretz": "meretz",
    "new hope": "new_hope", "hadash-ta'al": "hadash_taal",
    "hadash–ta'al": "hadash_taal", "hadash": "hadash", "ta'al": "taal",
    "balad": "balad", "nep": "nep", "new economic party": "nep",
    "israel first": "israel_first", "noam": "noam",
}

PARTY_NAMES = {  # canonical key -> [name_he, name_en]
    "likud": ["הליכוד", "Likud"],
    "together": ["ביחד", "Together (Bennett–Lapid)"],
    "rzp": ["הציונות הדתית", "Religious Zionist Party"],
    "otzma_yehudit": ["עוצמה יהודית", "Otzma Yehudit"],
    "blue_white": ["כחול לבן", "Blue and White (National Unity)"],
    "shas": ["ש\"ס", "Shas"],
    "utj": ["יהדות התורה", "United Torah Judaism"],
    "yisrael_beiteinu": ["ישראל ביתנו", "Yisrael Beiteinu"],
    "raam": ["רע\"ם", "Ra'am (United Arab List)"],
    "joint_list": ["הרשימה המשותפת", "Joint List"],
    "democrats": ["הדמוקרטים", "The Democrats"],
    "yashar": ["ישר", "Yashar"],
    "zionist_home": ["הבית הציוני – המילואימניקים", "Zionist Home – The Reservists"],
    "unity": ["האחדות", "Unity"],
    "amcha_yisrael": ["עמך ישראל", "Amcha Yisrael"],
    "yesh_atid": ["יש עתיד", "Yesh Atid"],
    "bennett_2026": ["בנט 2026", "Bennett 2026"],
    "reservists": ["המילואימניקים", "The Reservists"],
    "labor": ["העבודה", "Labor"],
    "meretz": ["מרצ", "Meretz"],
    "new_hope": ["תקווה חדשה", "New Hope"],
    "hadash_taal": ["חד\"ש-תע\"ל", "Hadash–Ta'al"],
    "hadash": ["חד\"ש", "Hadash"],
    "taal": ["תע\"ל", "Ta'al"],
    "balad": ["בל\"ד", "Balad"],
    "nep": ["המפלגה הכלכלית החדשה", "New Economic Party"],
    "israel_first": ["ישראל ראשונה", "Israel First"],
    "noam": ["נעם", "Noam"],
}

KIND_BY_H2 = {
    "Seat_projections": "seat_projection",
    "Voting_intention_polls_(reported_as_percentages)": "voting_intention_pct",
    "Scenario_polls": "scenario",
    "Arab_voters": "arab_voters",
    "Preferred_prime_minister": "preferred_pm",
    "Coalition_polls": "coalition",
    "Other_questions": "other",
}
META_COLS = {"fieldworkdate": "date", "fieldwork date": "date", "date": "date",
             "polling firm": "firm", "pollster": "firm", "publisher": "publisher",
             "samplesize": "sample", "sample size": "sample"}
NON_PARTY_KEYS = {"don_t_know", "other", "others", "undecided", "won_t_vote",
                  "no_answer", "none", "refused", "not_sure"}
TAIL_COLS = {"others": "others", "gov.": "gov_bloc", "lead": "lead"}
MONTHS = {m: i + 1 for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun",
     "jul", "aug", "sep", "oct", "nov", "dec"])}


class PageParser(HTMLParser):
    """Collect (a) every <table> as a rowspan/colspan-expanded grid and
    (b) every top-level <ol> outside tables, each tagged with the nearest
    preceding h2/h3/h4 heading ids."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables, self.lists = [], []
        self.heads = {"h2": None, "h3": None, "h4": None}
        self._t = self._row = self._cell = None
        self._depth = 0
        self._ol = self._li = None
        self._pend_head = None
        self._mute = 0  # inside <style>/<script>

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("style", "script"):
            self._mute += 1
        elif tag in ("h2", "h3", "h4"):
            if "id" in a:
                self._set_head(tag, a["id"])
            else:  # index.php HTML keeps the id on an inner span
                self._pend_head = tag
        elif tag == "span" and self._pend_head and "id" in a:
            self._set_head(self._pend_head, a["id"])
            self._pend_head = None
        elif tag == "table":
            self._depth += 1
            if self._depth == 1:
                self._t = {"heading": dict(self.heads),
                           "class": a.get("class", ""), "rows": []}
        elif self._t and self._depth == 1:
            if tag == "tr":
                self._row = []
            elif tag in ("td", "th") and self._row is not None:
                self._cell = {"tag": tag, "text": [], "links": [],
                              "rowspan": int(a.get("rowspan") or 1),
                              "colspan": int(a.get("colspan") or 1)}
            elif tag == "a" and self._cell is not None and a.get("href"):
                self._cell["links"].append(a["href"])
            elif tag == "br" and self._cell is not None:
                self._cell["text"].append(" ")
        elif tag == "ol" and self._depth == 0:
            self._ol = {"heading": dict(self.heads), "items": []}
        elif self._ol is not None:
            if tag == "li" and self._li is None:
                self._li = {"text": [], "links": []}
            elif tag == "a" and self._li is not None and a.get("href"):
                self._li["links"].append(a["href"])

    def _set_head(self, tag, hid):
        self.heads[tag] = hid
        if tag == "h2":
            self.heads["h3"] = self.heads["h4"] = None
        elif tag == "h3":
            self.heads["h4"] = None

    def handle_endtag(self, tag):
        if tag in ("style", "script"):
            self._mute = max(0, self._mute - 1)
        elif tag == "table":
            if self._depth == 1 and self._t is not None:
                self._t["grid"] = expand(self._t.pop("rows"))
                self.tables.append(self._t)
                self._t = None
            self._depth = max(0, self._depth - 1)
        elif self._t and self._depth == 1:
            if tag == "tr" and self._row is not None:
                self._t["rows"].append(self._row)
                self._row = None
            elif tag in ("td", "th") and self._cell is not None:
                self._cell["text"] = squash(self._cell["text"])
                if self._row is not None:
                    self._row.append(self._cell)
                self._cell = None
        elif tag == "li" and self._li is not None:
            self._li["text"] = squash(self._li["text"])
            self._ol["items"].append(self._li)
            self._li = None
        elif tag == "ol" and self._ol is not None:
            self.lists.append(self._ol)
            self._ol = None

    def handle_data(self, data):
        if self._mute:
            return
        if self._cell is not None:
            self._cell["text"].append(data)
        elif self._li is not None:
            self._li["text"].append(data)


def squash(parts):
    return re.sub(r"\s+", " ", "".join(parts)).strip()


def expand(rows):
    """Expand rowspan/colspan into a rectangular grid of cell dicts."""
    grid, pending = [], {}
    for ri, row in enumerate(rows):
        out, ci, it = [], 0, iter(row)
        while True:
            while (ri, ci) in pending:
                out.append(pending.pop((ri, ci)))
                ci += 1
            c = next(it, None)
            if c is None:
                while (ri, ci) in pending:
                    out.append(pending.pop((ri, ci)))
                    ci += 1
                break
            for _ in range(c["colspan"]):
                out.append(c)
                for rr in range(1, c["rowspan"]):
                    pending[(ri + rr, ci)] = c
                ci += 1
        grid.append(out)
    return grid


def clean(text):
    """Drop footnote markers ([12], [ac]), filler chars and stray whitespace."""
    text = re.sub(r"[ㅤ ​]", " ", re.sub(r"\[[a-z0-9]{1,4}\]", "", text))
    return re.sub(r"\s+", " ", text).strip()


def wiki_url(links):
    for href in links:
        m = re.search(r"(?:en\.wikipedia\.org)?/wiki/([^#?]+)", href)
        if m and not m.group(1).startswith(("File:", "Special:", "Template:")):
            return "https://en.wikipedia.org/wiki/" + m.group(1)
    return None


def party_key(header):
    h = clean(header).lower().replace("–", "-").replace("’", "'")
    h = re.sub(r"\s*-\s*", "-", h).strip()
    return ALIASES.get(h) or re.sub(r"[^a-z0-9]+", "_", h).strip("_")


def parse_value(text):
    """Seat counts and percentages; '-'/empty (not running) -> None.
    '(2.9)' means below the electoral threshold: that vote share is returned
    as ('below_threshold', pct) and stored separately from seat counts."""
    t = clean(text).replace("%", "").replace("−", "-").replace(",", "")
    if not t or t in "-–—?" or t.lower() in ("n/a", "-n/a", "—n/a", "tba"):
        return None
    m = re.fullmatch(r"\(\s*[<>~]?(\d+(?:\.\d+)?)\s*\)", t)
    if m:
        return ("below_threshold", float(m.group(1)))
    m = re.fullmatch(r"(\d+)\s*\(\d+(?:\.\d+)?\)", t)  # '4(3.5)': seats(votes)
    if m:
        return int(m.group(1))
    m = re.fullmatch(r"[<>~]?(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?", t)
    if not m:
        return t  # keep unusual cells verbatim
    if m.group(2):  # a "26-28" style range -> midpoint
        return round((float(m.group(1)) + float(m.group(2))) / 2, 2)
    v = float(m.group(1))
    return int(v) if v.is_integer() and "." not in m.group(1) else v


DATE_RE = re.compile(
    r"(?:(\d{1,2})(?:\s*[-–—]\s*\d{0,2}\s*\w*)?\s+)?"
    r"([A-Za-z]{3})[a-z]*\.?\s*(\d{2,4})?$")


def parse_date(raw, years):
    """Best-effort ISO end date. '26-27 Aug' -> last day; year comes from the
    table's section heading (single year) or month-order heuristics for the
    2022-2023 page."""
    t = clean(raw)
    last = re.split(r"[-–—]", t)[-1].strip()  # end of a range
    m = DATE_RE.search(last)
    if not m:
        return None
    day, mon, yr = m.group(1), MONTHS.get(m.group(2).lower()[:3]), m.group(3)
    if not mon:
        return None
    if yr:
        year = int(yr) if len(yr) == 4 else 2000 + int(yr)
    elif len(years) == 1:
        year = years[0]
    else:  # 2022-2023 span: the Knesset was elected Nov 2022
        year = years[0] if mon >= 11 else years[-1]
    iso = f"{year:04d}-{mon:02d}-{int(day or 1):02d}"
    if not yr and iso > TODAY:  # scenario tables mix years without marking them
        iso = f"{year - 1:04d}{iso[4:]}"
    return iso


def section_years(heading, default):
    for h in ("h4", "h3", "h2"):
        found = re.findall(r"(20\d\d)", heading.get(h) or "")
        if found:
            return [int(y) for y in found]
    return default


def is_event_row(cells):
    """Milestone rows ('17 Aug - Likud primary') span the table via colspan,
    so after expansion one cell object repeats across the row."""
    return len(cells) > 2 and len({id(c) for c in cells[1:]}) == 1


def parse_poll_table(table, default_years):
    grid = [r for r in table["grid"] if r]
    if not grid:
        return []
    # headers can span several rows (a bloc tier over a party tier, plus a
    # colour-legend row): merge the leading all-<th> rows, keeping the last
    # non-empty text per column so sub-party names win over bloc labels
    n_head = 0
    while n_head < len(grid) and all(c["tag"] == "th" for c in grid[n_head]):
        n_head += 1
    if not n_head:
        return []
    width = len(grid[0])
    header = []
    for i in range(width):
        texts = [clean(r[i]["text"]) for r in grid[:n_head] if i < len(r)]
        texts = [t for t in texts if t]
        header.append(texts[-1] if texts else "")
    if "date" not in header[0].lower().replace("fieldwork", "date"):
        return []
    # column roles; duplicate party headers (Joint List sub-columns) get _2/_3
    cols, seen = [], {}
    for h in header:
        hl = h.lower()
        if hl in META_COLS:
            cols.append(("meta", META_COLS[hl]))
        elif hl in TAIL_COLS:
            cols.append(("tail", TAIL_COLS[hl]))
        elif not h:
            cols.append(("skip", None))
        else:
            k = party_key(h)
            seen[k] = seen.get(k, 0) + 1
            cols.append(("result", k if seen[k] == 1 else f"{k}_{seen[k]}"))
    years = section_years(table["heading"], default_years)
    kind = KIND_BY_H2.get(table["heading"]["h2"], "other")
    polls, events = [], []
    for row in grid[n_head:]:
        cells = row
        first = clean(cells[0]["text"])
        if not first or all(c["tag"] == "th" for c in cells):
            continue  # repeated header / colour-legend rows
        if is_event_row(cells):
            events.append({"date_raw": first, "date": parse_date(first, years),
                           "event": clean(cells[1]["text"])})
            continue
        if len(cells) != len(cols):
            continue
        rec = {"date_raw": first, "date": parse_date(first, years),
               "kind": kind, "results": {}}
        if kind == "scenario":
            rec["scenario"] = (table["heading"].get("h4")
                               or table["heading"].get("h3") or "").replace("_", " ")
        used = set()  # a cell colspanning several party columns counts once
        for (role, key), cell in zip(cols, cells):
            if role == "meta" and key != "date":
                v = clean(cell["text"])
                rec[key] = parse_value(v) if key == "sample" else (v or None)
            elif role == "result":
                if id(cell) in used:
                    continue
                used.add(id(cell))
                v = parse_value(cell["text"])
                if isinstance(v, tuple):  # below-threshold vote share
                    rec.setdefault("below_threshold_pct", {})[key] = v[1]
                    v = 0
                rec["results"][key] = v
            elif role == "tail":
                v = parse_value(cell["text"])
                rec[key] = 0 if isinstance(v, tuple) else v
        if any(v is not None for v in rec["results"].values()):
            polls.append(rec)
    return polls, events


def parse_party_lists(parser):
    """One h2 section per party; the section's single <ol> is the ranked slate."""
    out = []
    for ol in parser.lists:
        sec = ol["heading"]["h2"]
        if not sec or sec in ("Notes", "References", "External_links", "See_also"):
            continue
        candidates = []
        for rank, li in enumerate(ol["items"], 1):
            name = clean(re.sub(r"\[\d+\]", "", li["text"]))
            if not name:
                continue
            candidates.append({"rank": rank, "name": name,
                               "wikipedia": wiki_url(li["links"])})
        if candidates:
            out.append({"party": party_key(sec.replace("_", " ")),
                        "party_section": sec.replace("_", " "),
                        "candidates": candidates})
    return out


def fetch(key, title):
    os.makedirs(RAW, exist_ok=True)
    path = f"{RAW}/{key}.html"
    req = urllib.request.Request(API + title, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        html = r.read().decode("utf-8")
    open(path, "w", encoding="utf-8").write(html)
    print(f"fetched {key}: {len(html)} bytes")


def load(key):
    path = f"{RAW}/{key}.html"
    if not os.path.exists(path):
        print(f"MISSING {path} (run without --offline to fetch)")
        return None
    p = PageParser()
    p.feed(open(path, encoding="utf-8").read())
    return p


def main():
    offline = "--offline" in sys.argv
    if not offline:
        for key, title in PAGES.items():
            fetch(key, title)

    # candidate lists
    lists_page = load("party_lists")
    party_lists = parse_party_lists(lists_page) if lists_page else []
    json.dump(party_lists, open(f"{OUT}/party_lists.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    n_cand = sum(len(p["candidates"]) for p in party_lists)
    print(f"party_lists.json: {len(party_lists)} parties, {n_cand} candidates")

    # polls (all pages, all table kinds)
    polls, events = [], []
    for key, default_years in [("polls_2026", [2026]), ("polls_2025", [2025]),
                               ("polls_2024", [2024]),
                               ("polls_2022_2023", [2022, 2023])]:
        page = load(key)
        if not page:
            continue
        for t in page.tables:
            if "wikitable" not in t["class"]:
                continue
            parsed = parse_poll_table(t, default_years)
            if parsed:
                p, e = parsed
                for rec in p:
                    rec["source_page"] = key
                polls.extend(p)
                events.extend(e)
    polls.sort(key=lambda r: r["date"] or "", reverse=True)
    json.dump({"polls": polls, "events": events},
              open(f"{OUT}/polls.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    by_kind = {}
    for rec in polls:
        by_kind[rec["kind"]] = by_kind.get(rec["kind"], 0) + 1
    print(f"polls.json: {len(polls)} polls {by_kind}, {len(events)} events")

    # party registry: seat/vote-share poll columns and published lists only
    # (preferred-PM and coalition tables have people/answers as columns)
    keys = {k for rec in polls for k in rec["results"]
            if rec["kind"] in ("seat_projection", "voting_intention_pct")}
    keys |= {p["party"] for p in party_lists}
    keys -= NON_PARTY_KEYS
    parties = []
    for k in sorted(keys):
        base = re.sub(r"_\d$", "", k)  # duplicate-column suffix (_2/_3) only
        names = PARTY_NAMES.get(base)
        parties.append({"key": k, "name_he": names[0] if names else None,
                        "name_en": names[1] if names else base.replace("_", " ").title(),
                        "has_list": any(p["party"] == k for p in party_lists)})
    json.dump(parties, open(f"{OUT}/parties.json", "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"parties.json: {len(parties)} parties")

    # mirror for the app (same pattern as merge.py -> app/data)
    app_out = f"{ROOT}/app/data/elections"
    os.makedirs(app_out, exist_ok=True)
    for name in ("party_lists", "polls", "parties"):
        with open(f"{OUT}/{name}.json", encoding="utf-8") as src:
            open(f"{app_out}/{name}.json", "w", encoding="utf-8").write(src.read())
    print(f"mirrored to {app_out}/")


if __name__ == "__main__":
    main()
