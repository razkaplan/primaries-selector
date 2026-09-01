#!/usr/bin/env python3
"""Scrape prediction-market odds on the 2026 Israeli election from
Polymarket (Gamma API) and Kalshi (public trade API v2) into
data/elections/markets.json (mirrored to app/data/elections/), and append
each run to markets_history.jsonl so odds can be charted over time.

Both endpoints are public read-only APIs; no keys required.
Usage: python3 scripts/scrape_markets.py
"""
import datetime, json, os, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/data/elections"
NOW = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
UA = {"User-Agent": "primaries-selector/1.0 (https://github.com/razkaplan/primaries-selector)"}

POLYMARKET_SLUGS = [
    "who-will-be-the-next-prime-minister-of-israel-after-the-next-election",
]
KALSHI_SERIES = ["KXISRAELPM"]

# English candidate/outcome names -> Hebrew (extend as new strikes appear)
NAMES_HE = {
    "Gadi Eizenkot": "גדי איזנקוט", "Gadi Eisenkot": "גדי איזנקוט",
    "Benjamin Netanyahu": "בנימין נתניהו", "Naftali Bennett": "נפתלי בנט",
    "Avigdor Lieberman": "אביגדור ליברמן", "Yair Lapid": "יאיר לפיד",
    "Benny Gantz": "בני גנץ", "Yariv Levin": "יריב לוין",
    "Yair Golan": "יאיר גולן", "Itamar Ben Gvir": "איתמר בן גביר",
    "Yossi Cohen": "יוסי כהן", "Israel Katz": "ישראל כץ",
    "Gideon Sa'ar": "גדעון סער", "Gideon Sa’ar": "גדעון סער",
    "Ayelet Shaked": "איילת שקד", "Amir Ohana": "אמיר אוחנה",
    "Moshe Feiglin": "משה פייגלין", "Yoaz Hendel": "יועז הנדל",
    "Nir Barkat": "ניר ברקת", "Yuli Edelstein": "יולי אדלשטיין",
    "Ofer Winter": "עופר וינטר", "No one": "אף אחד (לא תקום ממשלה)",
    "Other": "אחר", "Someone else": "מישהו אחר",
}


def get_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=45) as r:
        return json.load(r)


def polymarket_event(slug):
    data = get_json(f"https://gamma-api.polymarket.com/events?slug={slug}")
    ev = data[0]
    outcomes = []
    for m in ev.get("markets", []):
        name = (m.get("groupItemTitle") or m.get("question") or "").strip()
        try:
            prices = json.loads(m.get("outcomePrices") or "[]")
        except json.JSONDecodeError:
            prices = []
        prob = float(prices[0]) if prices else None
        if prob is None:
            continue
        outcomes.append({"name": name, "name_he": NAMES_HE.get(name, name),
                         "prob": round(prob, 4),
                         "volume_usd": round(float(m.get("volume") or 0))})
    outcomes.sort(key=lambda o: -o["prob"])
    return {
        "platform": "polymarket",
        "id": slug,
        "question_en": ev.get("title"),
        "url": f"https://polymarket.com/event/{slug}",
        "volume_usd": round(float(ev.get("volume") or 0)),
        "end_date": (ev.get("endDate") or "")[:10] or None,
        "currency": "USD",
        "outcomes": outcomes,
    }


def kalshi_event(series_ticker):
    data = get_json(
        "https://api.elections.kalshi.com/trade-api/v2/events"
        f"?series_ticker={series_ticker}&with_nested_markets=true&status=open")
    ev = data["events"][0]
    outcomes = []
    total_vol = 0.0
    for m in ev.get("markets", []):
        name = (m.get("yes_sub_title") or m.get("custom_strike", {}).get("Person") or "").strip()
        prob = float(m.get("last_price_dollars") or 0)
        vol = float(m.get("volume_fp") or 0)
        total_vol += vol
        outcomes.append({"name": name, "name_he": NAMES_HE.get(name, name),
                         "prob": round(prob, 4), "volume_usd": round(vol)})
    outcomes.sort(key=lambda o: -o["prob"])
    return {
        "platform": "kalshi",
        "id": ev.get("event_ticker"),
        "question_en": ev.get("title"),
        "url": f"https://kalshi.com/markets/{series_ticker.lower()}",
        "volume_usd": round(total_vol),
        "end_date": (ev.get("markets") or [{}])[0].get("close_time", "")[:10] or None,
        "currency": "USD (contracts)",
        "outcomes": outcomes,
    }


def main():
    markets = []
    for slug in POLYMARKET_SLUGS:
        try:
            markets.append(polymarket_event(slug))
            print(f"polymarket {slug}: ok")
        except Exception as e:
            print(f"polymarket {slug}: FAILED {e}")
    for st in KALSHI_SERIES:
        try:
            markets.append(kalshi_event(st))
            print(f"kalshi {st}: ok")
        except Exception as e:
            print(f"kalshi {st}: FAILED {e}")
    if not markets:
        raise SystemExit("no markets fetched; keeping previous snapshot")

    snapshot = {"fetched_at": NOW, "markets": markets}
    for out in (f"{OUT}/markets.json", f"{ROOT}/app/data/elections/markets.json"):
        json.dump(snapshot, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open(f"{OUT}/markets_history.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(snapshot, ensure_ascii=False) + "\n")
    print(f"markets.json: {len(markets)} markets @ {NOW}")


if __name__ == "__main__":
    main()
