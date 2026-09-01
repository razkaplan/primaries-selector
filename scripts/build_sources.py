#!/usr/bin/env python3
"""Build the site's complete source registry (data/elections/sources.json,
mirrored to app/data/elections/): every outlet/platform the data draws on,
grouped by kind, with record counts — feeds the "כל המקורות" listing."""
import glob, json, os
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

KIND_HE = {
    "news": "אתרי חדשות",
    "social_x": "רשתות חברתיות",
    "tiktok": "רשתות חברתיות",
    "youtube": "וידאו",
    "podcast": "פודקאסטים",
}
NAME_HE = {
    "x": "X (טוויטר)", "tiktok.com": "TikTok", "youtube.com": "YouTube",
    "ynet.co.il": "ynet", "maariv.co.il": "מעריב", "103fm.maariv.co.il": "רדיו 103FM",
    "1045fm.maariv.co.il": "רדיו 104.5FM", "walla.co.il": "וואלה", "zman.co.il": "זמן ישראל",
    "haaretz.co.il": "הארץ", "mako.co.il": "N12 (מאקו)", "israelhayom.co.il": "ישראל היום",
    "inn.co.il": "ערוץ 7", "kipa.co.il": "כיפה", "srugim.co.il": "סרוגים",
    "kan.org.il": "כאן תאגיד השידור", "calcalist.co.il": "כלכליסט", "globes.co.il": "גלובס",
    "i24news.tv": "i24NEWS", "jdn.co.il": "JDN", "kikar.co.il": "כיכר השבת",
    "ice.co.il": "אייס", "davar1.co.il": "דבר", "c14.co.il": "ערוץ 14",
    "ynet 120 ואחת": "פודקאסט \"120 ואחת\" (ynet)",
}


def main():
    counts: Counter = Counter()
    kinds: dict = {}
    for path in glob.glob(f"{ROOT}/data/media/corpus/*.jsonl"):
        for line in open(path, encoding="utf-8"):
            r = json.loads(line)
            name = r["source_name"]
            counts[name] += 1
            kinds[name] = KIND_HE.get(r["source_type"], "אתרי חדשות")

    # poll publishers (translated names live in the app layer; here keep raw)
    polls = json.load(open(f"{ROOT}/data/elections/polls.json", encoding="utf-8"))["polls"]
    publishers = Counter(p["publisher"] for p in polls if p.get("publisher") and p["publisher"] != "–")

    sources = {
        "corpus": [
            {"name": NAME_HE.get(n, n), "kind": kinds[n], "records": c}
            for n, c in counts.most_common()
        ],
        "poll_publishers": [
            {"name": n, "polls": c} for n, c in publishers.most_common()
        ],
        "reference": [
            {"name": "ויקיפדיה האנגלית — עמודי הבחירות לכנסת ה-26", "kind": "אנציקלופדי",
             "url": "https://en.wikipedia.org/wiki/2026_Israeli_legislative_election",
             "license": "CC BY-SA 4.0"},
            {"name": "ויקיפדיה העברית — הבחירות לכנסת העשרים ושש", "kind": "אנציקלופדי",
             "url": "https://he.wikipedia.org/wiki/הבחירות_לכנסת_העשרים_ושש",
             "license": "CC BY-SA 4.0"},
            {"name": "Polymarket — שוק חיזוי (רה\"מ הבא של ישראל)", "kind": "שוקי חיזוי",
             "url": "https://polymarket.com/event/who-will-be-the-next-prime-minister-of-israel-after-the-next-election",
             "license": "Gamma API ציבורי"},
            {"name": "Kalshi — בורסת חוזי אירועים (רה\"מ הבא של ישראל)", "kind": "שוקי חיזוי",
             "url": "https://kalshi.com/markets/kxisraelpm",
             "license": "Trade API v2 ציבורי"},
        ],
    }
    for out in (f"{ROOT}/data/elections/sources.json",
                f"{ROOT}/app/data/elections/sources.json"):
        json.dump(sources, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"sources.json: {len(sources['corpus'])} corpus sources, "
          f"{len(sources['poll_publishers'])} poll publishers")


if __name__ == "__main__":
    main()
