# בוחרים בפריימריז — כלי עזר לבחירת מועמדים (הדמוקרטים)

כלי לא רשמי שעוזר לחברות וחברי מפלגת הדמוקרטים לבחור מועמדים בפריימריז:
שאלון קצר (4 שאלות) → דירוג אישי של כל 51 המועמדים → בניית "פתק" של עד 10 מועמדים.

## מבנה

- `app/` — אפליקציית Next.js (עברית, RTL, סטטית לחלוטין — מוכנה ל-Vercel)
- `data/candidates.json` — הרוסטר הרשמי (נגזר מ-democrats.org.il/candidates)
- `data/sites/<id>.md` — תוכן שנאסף מאתרי המועמדים (Bright Data MCP)
- `data/research/<id>.md` — ממצאי מחקר חיפוש לכל מועמד (Bright Data SERP)
- `data/profiles/<id>.json` — פרופיל מובנה: ציוני 10 צירי נושא (0-5), מאפיינים, תקציר
- `data/PROFILE_SCHEMA.md` — הסכמה של הפרופילים
- `scripts/merge.py` — ממזג רוסטר + פרופילים אל `app/data/candidates.json`

## איך הדירוג עובד

ציון ההתאמה = 60% נושאים שנבחרו (מרכזיות הנושא באג'נדת המועמד) +
15% העדפת ניסיון + 15% העדפות ייצוג + 10% זיקה מפלגתית (מרצ/עבודה/חדש).
הנתונים מבוססים על מקורות פומביים בלבד; ללא המלצה מערכתית.

## הרצה

```bash
cd app && npm install && npm run dev
```

## עדכון נתונים

לאחר עדכון פרופילים תחת `data/profiles/`:

```bash
python3 scripts/merge.py && cd app && npm run build
```

## פריסה ל-Vercel

```bash
cd app && npx vercel deploy
```
