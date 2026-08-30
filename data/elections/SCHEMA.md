# data/elections — 2026 Knesset election: all parties, candidates and polls

Produced by `python3 scripts/scrape_elections.py` (add `--offline` to reparse
the cached HTML in `data/elections/raw/` without refetching). Sources are the
English-Wikipedia pages for the 2026 Israeli legislative election (party
lists page + the four opinion-polling pages covering 2022–2026), fetched as
Parsoid HTML from the Wikimedia REST API. Raw HTML is cached locally and not
committed.

## party_lists.json

One entry per party that has published a ranked slate (until the 9 September
2026 submission deadline, parties without a published list are absent):

```json
{
  "party": "democrats",            // canonical key, shared with polls.json
  "party_section": "The Democrats",// section title on the source page
  "candidates": [
    {"rank": 1, "name": "Yair Golan",
     "wikipedia": "https://en.wikipedia.org/wiki/Yair_Golan"}  // null if none
  ]
}
```

## polls.json

`{"polls": [...], "events": [...]}`. Each poll row:

```json
{
  "date_raw": "26–27 Aug",     // verbatim fieldwork date from the table
  "date": "2026-08-27",        // best-effort ISO end date (null if unparseable)
  "kind": "seat_projection",   // see kinds below
  "firm": "Lazar", "publisher": "Maariv", "sample": 500,
  "results": {"likud": 21, "yashar": 23, "blue_white": 0, "raam": null},
  "below_threshold_pct": {"blue_white": 1.1},  // vote % for 0-seat parties,
                                               // when the source gives it
  "others": 2, "gov_bloc": 59, "lead": 4,      // whichever columns exist
  "scenario": "Yoav Segalovitz joins Ra'am",   // scenario polls only
  "source_page": "polls_2026"
}
```

- `results` values: seats (`seat_projection`, `scenario`, `arab_voters`),
  percentages (`voting_intention_pct`, `preferred_pm`, `coalition`, `other`).
  `null` = party not included/not reported; `0` with `below_threshold_pct` =
  polled under the 3.25% threshold.
- Keys in `results` are canonical party keys where recognized; for
  question-style tables they are slugs of the column headers
  (e.g. `netanyahu`, `would_like`, `don_t_know`).
- kinds: `seat_projection`, `voting_intention_pct`, `scenario`,
  `arab_voters`, `preferred_pm`, `coalition`, `other`.
- Election-result baseline rows (firm = "2022 legislative election") are kept.
- `events`: campaign milestones interleaved in the poll tables
  (`{date_raw, date, event}`).

## parties.json

Registry of every party seen in seat/vote-share poll columns or with a
published list: `{key, name_he, name_en, has_list}`. Hypothetical parties
from scenario polls are excluded; `name_he` is null for minor parties not in
the curated name table in the script.
