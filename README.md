# בוחרים בפריימריז

כלי עזר לא רשמי לחברות וחברי מפלגת הדמוקרטים לקראת הפריימריז (20.7.2026):
שאלון קצר, דירוג מותאם אישית של 51 המועמדים, ובניית פתק מאוזן.

**האתר:** https://elections.gtmascode.dev

## למה הקוד פתוח?

כי כל הטענה של הכלי היא שקיפות. מנוע הדירוג, הנתונים, בדיקות ההטיה
והתיעוד הסטטיסטי, הכל כאן, פתוח לביקורת.

- מנוע הדירוג: [app/lib/scoring.ts](app/lib/scoring.ts) (כ-200 שורות קריאות)
- פתק מאוזן (MMR על גרף דמיון): [app/lib/ballot.ts](app/lib/ballot.ts)
- תיעוד סטטיסטי מלא של המודל: [docs/MODEL.md](docs/MODEL.md)
- סקירת ספרות מדע המדינה: [docs/political-science-review.md](docs/political-science-review.md)
- בדיקת הטיה (30 פרסונות): [app/scripts/simulate.ts](app/scripts/simulate.ts)
- פרופילי המועמדים והמקורות: [data/profiles/](data/profiles/)

## איך מציעים שיפור?

ראו [CONTRIBUTING.md](CONTRIBUTING.md). בקצרה: Issues לרעיונות ודיווחים,
Pull Requests לשינויים. מיזוג נעשה רק על ידי בעל המאגר.

## הרצה מקומית

```bash
cd app && npm install && npm run dev        # האפליקציה
npx tsx scripts/simulate.ts                 # בדיקת ההטיה (מתוך app/)
python3 scripts/merge.py                    # בנייה מחדש של הדאטה (מהשורש)
python3 scripts/scrape_elections.py         # כל המפלגות: רשימות מועמדים וסקרים
```

## נתוני הבחירות הכלליות (כל המפלגות)

לקראת הבחירות לכנסת ה-26 (27.10.2026), `scripts/scrape_elections.py` אוסף
מוויקיפדיה האנגלית את רשימות המועמדים של כל המפלגות ואת כל הסקרים שפורסמו
מאז בחירות 2022: הקצאות מנדטים, אחוזי הצבעה, סקרי תרחישים, ראש ממשלה מועדף
וסקרי קואליציה. הפלט נשמר ב-[data/elections/](data/elections/) ומתועד
ב-[data/elections/SCHEMA.md](data/elections/SCHEMA.md).

## גילוי נאות

- הכלי אינו קשור למפלגת הדמוקרטים ואינו ממליץ על מועמדים.
- המידע נאסף ממקורות פומביים (אתר המפלגה, אתרי מועמדים, ויקיפדיה,
  חדשות, רשתות חברתיות) באמצעות [Bright Data](https://brightdata.com).
  ציוני הצירים נוצרו בסיוע LLM לפי רובריקה אחידה ([data/PROFILE_SCHEMA.md](data/PROFILE_SCHEMA.md)).
- ייתכנו אי-דיוקים. מצאתם טעות בפרופיל שלכם או של מועמד/ת שאתם מכירים?
  פתחו Issue ותקבלו עדיפות גבוהה.
- תמונות וביוגרפיות רשמיות שייכות למפלגה ולמועמדים ומשמשות כאן לצורך
  מידע ציבורי. בקשות הסרה: פתחו Issue.

---

## English summary

An unofficial, open-source candidate-matching tool for the Israeli
HaDemokratim party primaries (July 20, 2026). Short questionnaire,
transparent weighted-linear ranking over 51 researched candidate profiles,
diversity-aware ballot builder (MMR), 30-persona bias audit, full model
documentation in [docs/MODEL.md](docs/MODEL.md). Built with Next.js;
data collected from public sources via Bright Data. Maintainer-only merges;
suggestions welcome via Issues and PRs.

For the general election (26th Knesset, October 27, 2026),
`scripts/scrape_elections.py` scrapes every party's candidate list and all
published polls (seat projections, vote shares, scenario/leadership/coalition
polls, 2022–2026) from English Wikipedia into
[data/elections/](data/elections/); schema in
[data/elections/SCHEMA.md](data/elections/SCHEMA.md).

Made with <3 by [Raz Kaplan](https://il.linkedin.com/in/razkaplan)
