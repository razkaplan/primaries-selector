import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import { meta, partyLists, polls } from "@/lib/elections";

export const metadata: Metadata = {
  title: "מתודולוגיה ומקורות",
  description:
    "איך בחירות2026 עובד: מהיכן מגיעים הנתונים, איך מחושב ממוצע הסקרים, מה כללי הקורפוס של הציטוטים, ולמה הכול פתוח לביקורת.",
  alternates: { canonical: "/about" },
};

const PRINCIPLES = [
  {
    emoji: "🔗",
    title: "כל נתון עם מקור",
    body: "כל סקר, רשימה וציטוט מקושרים למקור שפרסם אותם. ציטוט בלי קישור למקור לא נכנס לאתר — זה כלל ברזל בקורפוס.",
  },
  {
    emoji: "📅",
    title: "כל נתון עם תאריך",
    body: "סקרים ופוסטים נושאים תאריך מדויק; פריט חדשותי שהמקור שלו לא מציין תאריך מסומן \"תאריך לא צוין\" — לא ממציאים.",
  },
  {
    emoji: "🧾",
    title: "קוד פתוח, דאטה פתוחה",
    body: "כל הקוד, צינורות האיסוף וקובצי הנתונים פומביים ב-GitHub. אפשר לשחזר כל מספר שמופיע באתר.",
  },
  {
    emoji: "⚖️",
    title: "בלי אג'נדה",
    body: "האתר לא מדרג מפלגות, לא ממליץ ולא מפרש. צבעי המפלגות הם צבעי המדיה המקובלים; סדר ההצגה נגזר מהנתונים בלבד.",
  },
];

export default function AboutPage() {
  const nCandidates = partyLists.reduce((s, p) => s + p.candidates.length, 0);
  return (
    <main className="min-h-screen">
      <KnessetNav active="/about" />

      <section className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="font-display text-4xl sm:text-5xl">איך זה עובד</h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">
          בחירות2026 הוא פרויקט עצמאי בקוד פתוח שמרכז את כל הדאטה הציבורית של
          הבחירות לכנסת ה-26 — {polls.length.toLocaleString("he-IL")} סקרים,{" "}
          {nCandidates} מועמדות ומועמדים ומאות התבטאויות מתועדות. העמוד הזה
          מסביר בדיוק מאיפה הכול מגיע ואיך זה מחושב.
        </p>
        <div className="mt-5">
          <ShareBar path="/about" text="המתודולוגיה מאחורי בחירות2026 — כל נתון עם תאריך ומקור:" />
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <div key={p.title} className="rounded-3xl border border-line bg-card p-6 shadow-sm">
              <span className="text-3xl">{p.emoji}</span>
              <h2 className="font-display mt-2 text-xl">{p.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl space-y-6 px-4 pb-12">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm">
          <h2 className="font-display text-2xl">המקורות</h2>
          <ul className="mt-3 list-disc space-y-2 pr-5 text-sm leading-relaxed text-ink-soft">
            <li>
              <b>סקרים ורשימות מועמדים:</b> עמודי הבחירות לכנסת ה-26 בוויקיפדיה
              האנגלית (רישיון CC BY-SA 4.0), שמרכזים את כל הסקרים שפורסמו בכלי
              התקשורת הישראליים מאז נובמבר 2022. שמות המועמדים בעברית נלקחים
              מוויקיפדיה העברית ומאומתים ידנית.
            </li>
            <li>
              <b>ציטוטים:</b> פוסטים פומביים ברשתות (X, פייסבוק ועוד) וכתבות
              באתרי החדשות הישראליים. טקסט קטוע מסומן ב-… והקישור מוביל תמיד
              למקור המלא.
            </li>
            <li>
              <b>עדכון אחרון:</b> {meta.scraped_at}. צינור האיסוף רץ מחדש
              תקופתית; פער עדכון אפשרי — המקור המקושר תמיד קובע.
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm">
          <h2 className="font-display text-2xl">איך מחושב ממוצע הסקרים</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            ממוצע פשוט (לא משוקלל) של כל סקרי המנדטים מ-30 הימים שקדמו לסקר
            האחרון, לכל מפלגה על פני הסקרים שכללו אותה. מפלגה שנמדדה מתחת לאחוז
            החסימה נספרת כ-0 מנדטים, ואחוז ההצבעה שנמדד לה מוצג בסוגריים.
            אין כאן מודל הסתברותי או שקלול בתי-סקר — רק הנתונים כפי שפורסמו,
            שקופים וניתנים לשחזור.
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm">
          <h2 className="font-display text-2xl">כללי קורפוס הציטוטים</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            הקורפוס מכסה את המועמדים ה"ריאליים": מי שממוקמים ברשימתם עד גובה
            ממוצע המנדטים של מפלגתם ×1.25 + 2, בתוספת ראשי מפלגות שטרם פרסמו
            רשימה. כל רשומה מחויבת בקישור למקור, והטקסט נשמר מילולית. האתר
            מציג את ההתבטאויות — השיפוט נשאר לקוראים. התיעוד המלא:{" "}
            <a
              href="https://github.com/razkaplan/primaries-selector/blob/main/data/media/SCHEMA.md"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand underline underline-offset-4"
            >
              SCHEMA.md
            </a>
            .
          </p>
        </div>

        <div className="rounded-3xl border-2 border-dashed border-brand/40 bg-brand-wash p-6">
          <h2 className="font-display text-2xl">מצאתם טעות?</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            דיוק חשוב לנו יותר מקצב.{" "}
            <a
              href="https://github.com/razkaplan/primaries-selector/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand underline underline-offset-4"
            >
              פתחו Issue ב-GitHub
            </a>{" "}
            עם קישור לנתון השגוי ולמקור הנכון — תיקונים מקבלים עדיפות עליונה.
          </p>
        </div>
      </section>

      <KnessetFooter />
    </main>
  );
}
