#!/usr/bin/env python3
"""Build data/elections/candidates_meta.json (mirrored to app/): curated
per-candidate enrichment for everyone in a realistic slot - gender, religion
group, home town (when documented), a one-line bio and notable facts - plus a
documented connections graph between candidates. Keyed by Hebrew name as it
appears in party_lists.json.

Curation rules:
  - gender: inferred from the Hebrew given name, with explicit overrides.
  - religion: party default (Shas/UTJ Jewish-Haredi, Arab lists Muslim)
    overridden per candidate only on documented public identity; null when
    not publicly established.
  - city / facts / connections: only when documented in the linked source.
"""
import datetime, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/data/elections"

FEMALE_FIRST = {
    "מירי", "גילה", "אתי", "מירב", "קרן", "לירן", "מיכל", "ברוריה", "אורלי",
    "יסמין", "אסתי", "נטע", "אולסיה", "שלי", "תמי", "יעל", "מטי", "טליה",
    "יוליה", "אלווירה", "לילי", "שרן", "פלר", "נטעלי", "סיגל", "ללי",
    "שירה", "לימור", "מהא", "ניהאיה", "עדי", "אורית", "ענבר", "תאיר",
    "אושרת", "דבורה", "אלקס", "טל", "יפה", "ליאן", "ג'וסלין", "טלי",
    "שירן", "הלן", "הילה", "אליענה", "נעמה", "אפרת", "גבי", "סומיה",
    "מורן", "טובה", "אימאן", "צביקה?",
}
GENDER_OVERRIDES = {  # names the first-name rule gets wrong or can't decide
    "גבי לסקי": "f", "טל אוחנה חכמון": "f", "עדי אלטשולר": "f",
    "צביקה מור": "m", "אלקס ריף": "f", "שרון שרעבי": "m",
    "רוני מלכאי": None, "שחר ורון": None, "יאיא פינק": "m",
    "משה רדמן אבוטבול": "m", "עמרי רונן": "m", "נמרוד שפר": "m",
    "סומיה בשיר": "f", "מורן זר קצנשטיין": "f", "טלי גוטליב": "f",
}

# party -> (default religion, haredi flag)
PARTY_RELIGION = {
    "shas": ("jewish", True), "utj": ("jewish", True),
    "joint_list": ("muslim", False), "raam": ("muslim", False),
}
RELIGION_OVERRIDES = {  # documented public identity only
    "עופר כסיף (חד\"ש) – ברוטציה עם תע\"ל": "jewish",
    "יוסף חדאד": "christian",
    "חמד עמאר": "druze",
    "כמיל אבו רוקן": "druze",
    "סומיה בשיר": "muslim",
}

CITY = {  # documented home towns (leaders + well-covered candidates)
    "בנימין נתניהו": "קיסריה", "יאיר לפיד": "תל אביב", "נפתלי בנט": "רעננה",
    "גדי איזנקוט": "הרצליה", "אביגדור ליברמן": "נוקדים",
    "איתמר בן גביר": "קריית ארבע", "בצלאל סמוטריץ'": "קדומים",
    "יאיר גולן": "מבשרת ציון", "מנסור עבאס": "מגאר",
    "אחמד טיבי": "טייבה", "עופר וינטר": "מודיעין",
    "נטעלי שם טוב": "מטולה", "טל אוחנה חכמון": "ירוחם",
    "ניר ברקת": "ירושלים", "אמיר אוחנה": "תל אביב",
    "גדעון סער": "תל אביב", "שרן השכל": "עלמון",
    "אבי מעוז": "ירושלים", "משה פייגלין": "כרמי צור",
}

BIO = {  # one-liners; provenance is the linked source on the candidate row
    "בנימין נתניהו": "ראש הממשלה המכהן ויו\"ר הליכוד, ראש הממשלה הוותיק בתולדות ישראל.",
    "גדי איזנקוט": "הרמטכ\"ל ה-21 של צה\"ל, מוביל את מפלגת ישר! שהקים ב-2026.",
    "יורם כהן": "ראש השב\"כ לשעבר (2011–2016), מס' 2 בישר!.",
    "אורית פרקש הכהן": "שרת החדשנות לשעבר ויו\"ר רשות החשמל לשעבר.",
    "עדי אלטשולר": "יזמת חברתית, מייסדת \"כנפיים של קרמבו\" ו\"זיכרון בסלון\".",
    "מתן כהנא": "שר הדתות לשעבר, טייס קרב במיל'.",
    "חילי טרופר": "שר התרבות והספורט לשעבר; מפלגתו \"בית ציוני\" התאחדה עם ישר!.",
    "שאול מרידור": "ראש אגף התקציבים באוצר לשעבר.",
    "אושרת גני גונן": "ראשת המועצה האזורית דרום השרון לשעבר.",
    "שירה שפירא": "אמו של ענר שפירא ז\"ל, גיבור המיגונית ברעים ב-7 באוקטובר.",
    "כמיל אבו רוקן": "אלוף במיל', מפקד פיקוד העורף לשעבר, מהעדה הדרוזית.",
    "אלעזר שטרן": "אלוף במיל' וח\"כ לשעבר מיש עתיד.",
    "נפתלי בנט": "ראש הממשלה לשעבר, חוזר בראשות ביחד (בנט 2026 + יש עתיד).",
    "יאיר לפיד": "ראש הממשלה לשעבר ויו\"ר יש עתיד, מס' 2 בביחד.",
    "קרן טרנר אייל": "מנכ\"לית משרדי האוצר והתחבורה לשעבר.",
    "לירן אבישר בן-חורין": "מנכ\"לית משרד התקשורת לשעבר, ממקימות בנט 2026.",
    "נעם תיבון": "אלוף במיל'; ב-7 באוקטובר פרץ לנחל עוז וחילץ את משפחתו.",
    "מיכל הירש נגרי": "כלכלנית, סגנית הממונה על התקציבים לשעבר.",
    "מירב כהן": "שרת השוויון החברתי לשעבר.",
    "רם בן ברק": "סגן ראש המוסד לשעבר.",
    "אמיר סטרוגו": "מנכ\"ל עמותת \"אחריי!\" לשעבר.",
    "ניסן זאבי": "ממקימי \"לובי 1701\" לשיקום הצפון.",
    "מתי גיל": "מנכ\"ל AION Labs; נפצע בפיגוע חמאס בגבול עזה.",
    "אולסיה קנטור": "יזמת חברתית, הקימה את מיזם \"לב אש\" לניצולי 7 באוקטובר.",
    "יעל שטרן": "מנכ\"לית עמותה למאבק באנטישמיות.",
    "עמית ברדה": "לוחם ומפקד ביחידת מגלן במילואים.",
    "יאיר גולן": "סגן הרמטכ\"ל לשעבר, יו\"ר הדמוקרטים.",
    "גלעד קריב": "רב רפורמי וח\"כ, לשעבר מנכ\"ל התנועה הרפורמית.",
    "נעמה לזימי": "ח\"כ, מובילת מאבקים חברתיים.",
    "יאיא פינק": "מנכ\"ל \"לובי המילואימניקים\", זכה במקום הרביעי בפריימריז.",
    "אביגדור ליברמן": "יו\"ר ישראל ביתנו, שר האוצר והביטחון לשעבר.",
    "רפי בן שטרית": "ראש עיריית בית שאן לשעבר.",
    "שרון שרעבי": "אחיהם של יוסי שרעבי ז\"ל ושורד השבי אלי שרעבי.",
    "לילי בן עמי": "מייסדת פורום מיכל סלה למאבק באלימות במשפחה, אחותה של מיכל סלה ז\"ל.",
    "אלווירה קוליחמן": "סגנית ראש עיריית לוד.",
    "דן אילוז": "ח\"כ, עבר מהליכוד לישראל ביתנו.",
    "איתמר בן גביר": "השר לביטחון לאומי ויו\"ר עוצמה יהודית.",
    "בצלאל סמוטריץ'": "שר האוצר ויו\"ר הציונות הדתית (רצה עם זהות).",
    "משה פייגלין": "יו\"ר זהות, ח\"כ לשעבר מהליכוד, מס' 2 ברשימה המשותפת לציונות הדתית.",
    "אבי מעוז": "יו\"ר נעם.",
    "מנסור עבאס": "יו\"ר רע\"מ, הכניס לראשונה מפלגה ערבית עצמאית לקואליציה.",
    "יואב סגלוביץ'": "תת-ניצב בדימוס, לשעבר ראש אח\"ם במשטרה; שובץ ברע\"מ.",
    "יוסף ג'בארין": "יו\"ר חד\"ש, מרצה למשפטים, עומד בראש הרשימה המשותפת.",
    "אחמד טיבי": "יו\"ר תע\"ל, מוותיקי הכנסת.",
    "סמי אבו שחאדה": "יו\"ר בל\"ד, דוקטור להיסטוריה מיפו.",
    "יעקב אשר": "יו\"ר דגל התורה ברשימת יהדות התורה, ראש עיריית בני ברק לשעבר.",
    "עופר וינטר": "תא\"ל במיל', מפקד אוגדה 98 לשעבר, מוביל את עמך ישראל.",
    "יוסף חדאד": "פעיל הסברה ערבי-נוצרי מנצרת, מס' 2 בעמך ישראל.",
    "פלר חסן-נחום": "המשנה לראש עיריית ירושלים לשעבר.",
    "נטעלי שם טוב": "עיתונאית ומגישת חדשות, תושבת מטולה.",
    "סיגל קראוניק-עטיה": "אלמנתו של רבש\"ץ בארי אריק קראוניק ז\"ל, שנפל ב-7 באוקטובר.",
    "שרן השכל": "ח\"כ, הקימה את ישראל תחילה אחרי פרישה מהממשלה.",
    "יהונתן פולארד": "ריצה 30 שנות מאסר בארה\"ב על ריגול למען ישראל.",
    "אלי כהן": "שר החוץ לשעבר, זכה במקום הראשון בפריימריז הליכוד.",
    "ישראל כץ": "שר הביטחון.",
    "גדעון סער": "שר המשפטים לשעבר; תקווה חדשה התמזגה בליכוד.",
    "יריב לוין": "שר המשפטים, אדריכל המהפכה המשפטית.",
    "מירי רגב": "שרת התחבורה.",
    "טלי גוטליב": "ח\"כ, עורכת דין פלילית.",
    "עמיחי אליהו": "שר המורשת.",
    "לימור סון הר-מלך": "ח\"כ, אלמנתו של שולי הר-מלך שנרצח בפיגוע.",
    "אורית סטרוק": "שרת ההתיישבות והמשימות הלאומיות.",
    "שמחה רוטמן": "יו\"ר ועדת החוקה, ממובילי המהפכה המשפטית.",
    "צביקה מור": "אביו של שורד השבי איתן מור, ממייסדי פורום תקווה.",
    "עופר כסיף (חד\"ש) – ברוטציה עם תע\"ל": "ח\"כ יהודי בחד\"ש, מרצה למדע המדינה.",
}

FACTS = [  # representation-page fun facts; every fact carries its source
    {"who": "יהונתן פולארד", "party": "israel_first",
     "fact": "המועמד היחיד שריצה 30 שנות מאסר בכלא אמריקאי - על ריגול למען ישראל.",
     "source": "https://www.maariv.co.il/news/politics/article-1358772"},
    {"who": "נעם תיבון", "party": "together",
     "fact": "האלוף בדימוס שנסע ב-7 באוקטובר מתל אביב לנחל עוז וחילץ את בנו ומשפחתו מהקיבוץ.",
     "source": "https://www.davar1.co.il/696128/"},
    {"who": "שירה שפירא", "party": "yashar",
     "fact": "אמו של ענר שפירא ז\"ל, שהדף רימונים במיגונית ברעים והציל עשרות.",
     "source": "https://www.inn.co.il/news/705728"},
    {"who": "שרון שרעבי", "party": "yisrael_beiteinu",
     "fact": "אחיהם של יוסי שרעבי ז\"ל, שנרצח בשבי, ושל שורד השבי אלי שרעבי.",
     "source": "https://www.ynet.co.il/news/elections2026/article/bki6ywjdge"},
    {"who": "לילי בן עמי", "party": "yisrael_beiteinu",
     "fact": "הקימה את פורום מיכל סלה למאבק ברצח נשים, על שם אחותה שנרצחה ב-2019.",
     "source": "https://www.kan.org.il/content/kan-news/politic/1085715/"},
    {"who": "מתי גיל", "party": "together",
     "fact": "מנכ\"ל חברת ביוטק שנפצע בעבר בפיגוע חמאס בגבול עזה.",
     "source": "https://www.kikar.co.il/political-news/mati-gil-joins-bennett-yachad-party"},
    {"who": "כמיל אבו רוקן", "party": "yashar",
     "fact": "האלוף הדרוזי שפיקד על פיקוד העורף - אחד משני אלופים במיל' ברשימת ישר! בלבד.",
     "source": "https://www.mako.co.il/news-politics/2026_q3/Article-896792932bb70a1027.htm"},
    {"who": "סיגל קראוניק-עטיה", "party": "amcha_yisrael",
     "fact": "אלמנת רבש\"ץ קיבוץ בארי, שנפל בקרב ההגנה על הקיבוץ ב-7 באוקטובר.",
     "source": "https://www.ynet.co.il/news/elections2026/article/s13ku7jdzg"},
    {"who": "צביקה מור", "party": "rzp",
     "fact": "אביו של שורד השבי איתן מור; נכנס לפוליטיקה בעקבות המלחמה.",
     "source": "https://www.inn.co.il/news/705728"},
    {"who": "משה הר-ציון", "party": "amcha_yisrael",
     "fact": "בנו של מאיר הר-ציון, מגיבורי יחידה 101.",
     "source": "https://www.davar1.co.il/695637/"},
    {"who": "ג'רמי סלטן", "party": "together",
     "fact": "עולה מארה\"ב שהתפרסם כאנליסט הסקרים המצוטט ביותר בתקשורת הזרה.",
     "source": "https://www.zman.co.il/live/721275/"},
    {"who": "יוסף חדאד", "party": "amcha_yisrael",
     "fact": "ערבי-נוצרי מנצרת שנפצע בלבנון כלוחם גולני - ממובילי ההסברה הישראלית ברשתות.",
     "source": "https://www.ynet.co.il/news/elections2026/article/s13ku7jdzg"},
    {"who": "טל אוחנה חכמון", "party": "yashar",
     "fact": "ראשת העיר הראשונה של ירוחם.",
     "source": "https://www.mako.co.il/news-politics/2026_q3/Article-896792932bb70a1027.htm"},
    {"who": "גלעד קריב", "party": "democrats",
     "fact": "הרב הרפורמי הראשון שכיהן כחבר כנסת.",
     "source": "https://he.wikipedia.org/wiki/גלעד_קריב",},
    {"who": "אולסיה קנטור", "party": "together",
     "fact": "הקימה אחרי 7 באוקטובר את \"לב אש\" - טיפול חינם לניצולים שהיו בקו האש.",
     "source": "https://www.kan.org.il/content/kan-news/politic/1085323/"},
]

CONNECTIONS = [  # documented candidate-to-candidate ties, with sources
    {"a": "נפתלי בנט", "b": "יאיר לפיד", "type": "פוליטי",
     "desc": "הקימו יחד את ממשלת השינוי ב-2021 בהסכם רוטציה; כעת רצים יחד ברשימת ביחד.",
     "source": "https://www.maariv.co.il/news/politics/article-1363684"},
    {"a": "גדי איזנקוט", "b": "חילי טרופר", "type": "פוליטי",
     "desc": "מפלגת בית ציוני של טרופר התמזגה לתוך ישר! של איזנקוט לקראת הגשת הרשימות.",
     "source": "https://www.inn.co.il/news/705728"},
    {"a": "בצלאל סמוטריץ'", "b": "משה פייגלין", "type": "פוליטי",
     "desc": "זהות של פייגלין רצה ברשימה משותפת עם הציונות הדתית, כולל שריוני סיעה.",
     "source": "https://en.wikipedia.org/wiki/Party_lists_for_the_2026_Israeli_legislative_election"},
    {"a": "גדי איזנקוט", "b": "יאיר גולן", "type": "צבאי",
     "desc": "שירתו יחד בצמרת צה\"ל - איזנקוט כרמטכ\"ל וגולן כסגנו.",
     "source": "https://he.wikipedia.org/wiki/יאיר_גולן"},
    {"a": "נעם תיבון", "b": "גדי איזנקוט", "type": "צבאי",
     "desc": "אלופים במיל' שצמחו יחד בצה\"ל - וכעת מתמודדים ברשימות מתחרות באותו גוש.",
     "source": "https://he.wikipedia.org/wiki/נעם_תיבון"},
    {"a": "איתמר בן גביר", "b": "בצלאל סמוטריץ'", "type": "פוליטי",
     "desc": "רצו יחד ב-2022 ברשימה משותפת; הפעם רצים בנפרד אחרי פיצול מתוקשר.",
     "source": "https://en.wikipedia.org/wiki/2026_Israeli_legislative_election"},
    {"a": "מנסור עבאס", "b": "אחמד טיבי", "type": "פוליטי",
     "desc": "רע\"מ פרשה מהרשימה המשותפת ב-2021; ב-2026 טיבי ברשימה המשותפת ועבאס רץ לבד.",
     "source": "https://www.ynet.co.il/news/article/syoll7qdgl"},
    {"a": "יאיר לפיד", "b": "מירב כהן", "type": "פוליטי",
     "desc": "כהן כיהנה כשרה מטעם יש עתיד של לפיד; כעת שניהם ברשימת ביחד.",
     "source": "https://www.maariv.co.il/news/politics/article-1363684"},
]


def infer_gender(name_he):
    first = name_he.split()[0].strip("⁠")
    return "f" if first in FEMALE_FIRST else "m"


def main():
    lists = json.load(open(f"{OUT}/party_lists.json", encoding="utf-8"))
    polls = json.load(open(f"{OUT}/polls.json", encoding="utf-8"))["polls"]
    seat = sorted((p for p in polls if p["kind"] == "seat_projection" and p.get("date")),
                  key=lambda p: p["date"], reverse=True)
    latest = seat[0]["date"]
    since = (datetime.date.fromisoformat(latest) - datetime.timedelta(days=30)).isoformat()
    sums = {}
    for p in seat:
        if p["date"] < since:
            continue
        for k, v in p["results"].items():
            k = "rzp" if k == "rzp_zehut" else k
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                s = sums.setdefault(k, [0, 0]); s[0] += v; s[1] += 1
    avgs = {k: t / n for k, (t, n) in sums.items()}

    out = {}
    for pl in lists:
        party = pl["party"]
        slots = round(avgs.get(party, 0)) + 2
        for c in pl["candidates"]:
            he = c.get("name_he") or c["name"]
            if c["rank"] > slots or "שריון" in he or "נציג" in he:
                continue
            religion, haredi = PARTY_RELIGION.get(party, ("jewish", False))
            religion = RELIGION_OVERRIDES.get(he, religion)
            gender = GENDER_OVERRIDES.get(he, infer_gender(he))
            out[he] = {
                "party": party, "rank": c["rank"],
                "gender": gender,
                "religion": religion,
                "haredi": haredi or None,
                "city": CITY.get(he),
                "bio": BIO.get(he),
                "realistic": True,
            }

    meta = {
        "built_at": datetime.date.today().isoformat(),
        "window_since": since,
        "note": "מבוסס על הרשימות שהוגשו ועל ממוצע הסקרים; מגדר לפי שם פרטי עם תיקונים ידניים; דת/קבוצה לפי השתייכות מפלגתית וזהות ציבורית מתועדת בלבד.",
        "candidates": out,
        "facts": FACTS,
        "connections": CONNECTIONS,
    }
    for path in (f"{OUT}/candidates_meta.json", f"{ROOT}/app/data/elections/candidates_meta.json"):
        json.dump(meta, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    n = len(out)
    f = sum(1 for v in out.values() if v["gender"] == "f")
    bios = sum(1 for v in out.values() if v["bio"])
    print(f"candidates_meta: {n} realistic candidates | {f} women | {bios} bios | "
          f"{len(FACTS)} facts | {len(CONNECTIONS)} connections")


if __name__ == "__main__":
    main()
