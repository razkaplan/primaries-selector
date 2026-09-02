import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import QuotesTimeline, { type TimelineQuote } from "@/components/QuotesTimeline";
import { seatPolls } from "@/lib/elections";
import quotesData from "@/data/elections/quotes.json";

export const metadata: Metadata = {
  title: "ציר הזמן של ההתבטאויות",
  alternates: { canonical: "/knesset/quotes" },
  description:
    "מה המועמדים אמרו ומה קרה למפלגה שלהם בסקרים: ציר זמן של התבטאויות מתועדות מהרשתות ומהתקשורת, עם תאריך, קישור למקור, שיתוף כתמונה והצלבה מול ממוצע המנדטים.",
};

interface RawQuote {
  candidate_id: string;
  candidate_he: string;
  party: string;
  source_type: string;
  source_name: string;
  date: string | null;
  url: string;
  text: string;
}

function shiftISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Party seat average over dated seat polls in [from, to] (inclusive);
 * null when fewer than 2 polls include the party. */
function windowAvg(party: string, from: string, to: string) {
  let total = 0;
  let n = 0;
  for (const p of seatPolls) {
    if (!p.date || p.date < from || p.date > to) continue;
    const v = p.results[party];
    if (typeof v === "number") {
      total += v;
      n += 1;
    }
  }
  return n >= 2 ? { avg: total / n, n } : null;
}

/** Attach poll context to each quote: the party's 14-day seat average before
 * vs. after the quote date. Server-side, so poll data stays out of the
 * client bundle. */
function enrich(quotes: RawQuote[]): TimelineQuote[] {
  return quotes.map((q) => {
    let impact: TimelineQuote["impact"] = null;
    if (q.date) {
      const before = windowAvg(q.party, shiftISO(q.date, -14), shiftISO(q.date, -1));
      const after = windowAvg(q.party, q.date, shiftISO(q.date, 14));
      if (before && after) {
        impact = {
          before: before.avg,
          after: after.avg,
          nBefore: before.n,
          nAfter: after.n,
        };
      }
    }
    return { ...q, impact };
  });
}

const quotes = enrich(quotesData as RawQuote[]).sort((a, b) => {
  if (!a.date) return 1;
  if (!b.date) return -1;
  return b.date.localeCompare(a.date);
});

export default function KnessetQuotes() {
  const withImpact = quotes.filter((q) => q.impact).length;
  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/quotes" />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl">ציר הזמן של ההתבטאויות 🗣️</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          מה המועמדים אמרו, מתי, ומה קרה למפלגה שלהם בסקרים. כל התבטאות
          מסודרת על ציר הזמן עם תאריך וקישור למקור, וכשיש מספיק סקרים סביבה
          ({withImpact} מתוך {quotes.length} כרגע) מוצמד אליה ממוצע המנדטים של
          המפלגה ב-14 הימים שלפני ואחרי. כל ציטוט ניתן לשיתוף כתמונה; ציטוט
          קטוע (…) קוראים במלואו במקור. תיעוד מלא של האיסוף -{" "}
          <a
            href="https://github.com/razkaplan/primaries-selector/blob/main/data/media/SCHEMA.md"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            בסכמת הקורפוס
          </a>
          .
        </p>
        <div className="mt-4 max-w-2xl rounded-2xl border border-sun/60 bg-sun/10 px-4 py-3 text-sm leading-relaxed text-ink-soft">
          <b className="text-ink">איך לקרוא את המספרים:</b> שינוי בסקרים סביב
          ציטוט הוא הֶקשר, לא הוכחת סיבה, באותם ימים קורים גם אירועים אחרים.
          זה כלי לזיהוי מועמדים לבדיקה, לא פסק דין.
        </div>
        <div className="mt-5">
          <ShareBar
            path="/knesset/quotes"
            text="מה המועמדים באמת אמרו, ומה זה עשה להם בסקרים. ציר הזמן המלא:"
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <QuotesTimeline quotes={quotes} />
      </section>

      <KnessetFooter />
    </main>
  );
}
