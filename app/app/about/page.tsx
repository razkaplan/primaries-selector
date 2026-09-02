import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import { meta, partyLists, polls } from "@/lib/elections";
import { publisherHe } from "@/lib/electionsHe";
import sourcesData from "@/data/elections/sources.json";

const sources = sourcesData as {
  corpus: { name: string; kind: string; records: number }[];
  poll_publishers: { name: string; polls: number }[];
  reference: { name: string; kind: string; url: string; license: string }[];
};

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
    body: "כל סקר, רשימה וציטוט מקושרים למקור שפרסם אותם. ציטוט בלי קישור למקור לא נכנס לאתר, זה כלל ברזל בקורפוס.",
  },
  {
    emoji: "📅",
    title: "כל נתון עם תאריך",
    body: "סקרים ופוסטים נושאים תאריך מדויק; פריט חדשותי שהמקור שלו לא מציין תאריך מסומן \"תאריך לא צוין\", לא ממציאים.",
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
          הבחירות לכנסת ה-26, {polls.length.toLocaleString("he-IL")} סקרים,{" "}
          {nCandidates} מועמדות ומועמדים ומאות התבטאויות מתועדות. העמוד הזה
          מסביר בדיוק מאיפה הכול מגיע ואיך זה מחושב.
        </p>
        <div className="mt-5">
          <ShareBar path="/about" text="המתודולוגיה מאחורי בחירות2026: כל נתון עם תאריך ומקור:" />
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
              <b>ציטוטים:</b> פוסטים פומביים ברשתות (X, טיקטוק ועוד), ראיונות
              וידאו ביוטיוב, פודקאסטים פוליטיים וכתבות באתרי החדשות
              הישראליים. טקסט קטוע מסומן ב-… והקישור מוביל תמיד למקור המלא.
            </li>
            <li>
              <b>עדכון אחרון:</b> {meta.scraped_at}. צינור האיסוף רץ מחדש
              תקופתית; פער עדכון אפשרי: המקור המקושר תמיד קובע.
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm">
          <h2 className="font-display text-2xl">איך מחושב ממוצע הסקרים</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            ממוצע פשוט (לא משוקלל) של כל סקרי המנדטים מ-30 הימים שקדמו לסקר
            האחרון, לכל מפלגה על פני הסקרים שכללו אותה. מפלגה שנמדדה מתחת לאחוז
            החסימה נספרת כ-0 מנדטים, ואחוז ההצבעה שנמדד לה מוצג בסוגריים.
            אין כאן מודל הסתברותי או שקלול בתי-סקר, רק הנתונים כפי שפורסמו,
            שקופים וניתנים לשחזור.
          </p>
        </div>

        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm">
          <h2 className="font-display text-2xl">כללי קורפוס הציטוטים</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            הקורפוס מכסה את המועמדים ה"ריאליים": מי שממוקמים ברשימתם עד גובה
            ממוצע המנדטים של מפלגתם ×1.25 + 2, בתוספת ראשי מפלגות שטרם פרסמו
            רשימה. כל רשומה מחויבת בקישור למקור, והטקסט נשמר מילולית. האתר
            מציג את ההתבטאויות, השיפוט נשאר לקוראים. התיעוד המלא:{" "}
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

        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm">
          <h2 className="font-display text-2xl">כל המקורות, ברשימה אחת</h2>
          <p className="mt-2 text-sm text-ink-soft">
            כל פלטפורמה וכלי תקשורת שמהם נאסף ולו נתון אחד באתר, קורפוס
            הציטוטים (רשתות, חדשות, וידאו ופודקאסטים) ומפרסמי הסקרים.
          </p>
          <h3 className="font-display mt-5 text-lg">קורפוס הציטוטים ({sources.corpus.reduce((s, x) => s + x.records, 0)} רשומות)</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {sources.corpus.map((c) => (
              <li key={c.name} className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-bold text-ink-soft">
                {c.name} <span className="text-ink-faint">· {c.kind} · {c.records}</span>
              </li>
            ))}
          </ul>
          <h3 className="font-display mt-5 text-lg">מפרסמי הסקרים ({sources.poll_publishers.length})</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {sources.poll_publishers.map((c) => (
              <li key={c.name} className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-bold text-ink-soft">
                {publisherHe(c.name)} <span className="text-ink-faint">· {c.polls}</span>
              </li>
            ))}
          </ul>
          <h3 className="font-display mt-5 text-lg">מקורות אנציקלופדיים</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {sources.reference.map((c) => (
              <li key={c.url}>
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline underline-offset-4">
                  {c.name}
                </a>{" "}
                <span className="text-ink-faint">({c.license})</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm">
          <h2 className="font-display text-2xl">🤖 שרת MCP: שאלו את הדאטה ישירות</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            כל הדאטה של האתר זמינה גם כשרת{" "}
            <a
              href="https://modelcontextprotocol.io"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-brand"
            >
              Model Context Protocol
            </a>
            . חברו אותו ל-Claude (או לכל לקוח MCP) ושאלו בשפה חופשית, ״באיזה
            סקר איזנקוט עבר לראשונה את ביבי?״, ״מה אמר וינטר על משאל עם?״,
            ״מי ברשימה של הדמוקרטים?״, והתשובות יגיעו מהדאטה המתועדת, עם
            מקור ותאריך.
          </p>
          <div dir="ltr" className="mt-3 overflow-x-auto rounded-2xl bg-night p-4 text-left text-xs leading-relaxed text-white/90">
            <div className="text-white/50"># claude.ai → Settings → Connectors → Add custom connector</div>
            <div>https://elections.gtmascode.dev/api/mcp</div>
            <div className="mt-2 text-white/50"># Claude Code</div>
            <div>claude mcp add --transport http elections2026 https://elections.gtmascode.dev/api/mcp</div>
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            שבעה כלים: ממוצע הסקרים, חיפוש בכל ארכיון הסקרים, השוואת ראש-בראש,
            רשימות המועמדים, חיפוש בציטוטים (כולל הקשר סקרים), שוקי החיזוי
            ומפתחות המפלגות. ללא הרשמה וללא מפתח.
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
            עם קישור לנתון השגוי ולמקור הנכון, תיקונים מקבלים עדיפות עליונה.
          </p>
        </div>
      </section>

      <KnessetFooter />
    </main>
  );
}
