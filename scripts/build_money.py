#!/usr/bin/env python3
"""Validate data/elections/money.json and mirror it to app/data/elections/.

Iron rule (see data/media/SCHEMA.md): every sourced record carries a date
(as_of) and a link (url). The build fails rather than publish an
unattributed number."""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = f"{ROOT}/data/elections/money.json"
DST = f"{ROOT}/app/data/elections/money.json"
DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def check(rec, where):
    if not rec.get("url", "").startswith("http"):
        raise SystemExit(f"money.json: missing url at {where}: {rec}")
    if not DATE.match(rec.get("as_of", "")):
        raise SystemExit(f"money.json: missing/invalid as_of at {where}: {rec}")


def main():
    data = json.load(open(SRC, encoding="utf-8"))
    for key in ("funding_unit", "formula", "headline"):
        check(data[key], key)
    for party, rec in data["outgoing_seats"].items():
        check(rec, f"outgoing_seats.{party}")
    n = 0
    for key in ("rules", "private_financing", "private_totals", "named_donors_capped",
                "debts", "advances", "primaries", "third_parties",
                "primaries_totals", "primaries_context"):
        for i, rec in enumerate(data.get(key, [])):
            check(rec, f"{key}[{i}]")
            n += 1
    json.dump(data, open(DST, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"money.json: {n} sourced records validated and mirrored")


if __name__ == "__main__":
    main()
