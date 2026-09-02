import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import MarketsCompare, { type Market } from "@/components/MarketsCompare";
import marketsData from "@/data/elections/markets.json";

const { fetched_at, markets } = marketsData as { fetched_at: string; markets: Market[] };

export const metadata: Metadata = {
  title: "שוקי חיזוי: פוליטיקה בכסף אמיתי",
  alternates: { canonical: "/knesset/markets" },
  description:
    "מה שוקי החיזוי Polymarket ו-Kalshi אומרים על הבחירות בישראל: הסתברויות בזמן אמת למי יהיה ראש הממשלה הבא, לפי אנשים שמהמרים על זה בכסף שלהם.",
};

const PLATFORM_HE: Record<string, { name: string; blurb: string }> = {
  polymarket: {
    name: "Polymarket",
    blurb: "שוק החיזוי הגדול בעולם, מבוסס קריפטו. מחיר החוזה = ההסתברות שהשוק מייחס לתוצאה.",
  },
  kalshi: {
    name: "Kalshi",
    blurb: "בורסת חוזי אירועים אמריקאית מפוקחת (CFTC). המחיר בסנטים = הסתברות באחוזים.",
  },
};

function fmtHe(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso.slice(0, 10) + "T00:00:00Z"));
}

export default function KnessetMarkets() {
  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/markets" />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl">שוקי חיזוי 💸</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          סקרים שואלים אנשים מה הם חושבים. שוקי חיזוי שואלים אותם כמה הם מוכנים
          להמר על זה. כאן מוצגות ההסתברויות שנגזרות ממחירי החוזים ב-Polymarket
          וב-Kalshi לשאלה <b>מי יהיה ראש הממשלה הבא של ישראל</b>, מתעדכן בכל
          ריצת איסוף, עם קישור ישיר לכל שוק.
        </p>
        <div className="mt-5">
          <ShareBar
            path="/knesset/markets"
            text="מי יהיה רה״מ הבא? ככה מתמחרים את זה בשוקי החיזוי Polymarket ו-Kalshi:"
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="anim-rise rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl">מי יהיה ראש הממשלה הבא?</h2>
            <span className="text-sm text-ink-faint">נכון ל-{fmtHe(fetched_at)}</span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            הסתברות לפי מחיר החוזה בכל פלטפורמה. מוצגים מועמדים שלפחות שוק אחד
            מתמחר ב-1% ומעלה.
          </p>
          <div className="mt-6">
            <MarketsCompare markets={markets} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {markets.map((m, i) => {
            const plat = PLATFORM_HE[m.platform] ?? { name: m.platform, blurb: "" };
            return (
              <div
                key={m.platform}
                className="anim-rise rounded-3xl border border-line bg-card p-6 shadow-sm"
                style={{ "--rise-delay": `${i * 90}ms` } as React.CSSProperties}
              >
                <h3 className="font-display text-xl">{plat.name}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{plat.blurb}</p>
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-faint">שאלת השוק</dt>
                    <dd dir="ltr" className="text-left font-bold">{m.question_en}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-faint">מחזור מסחר</dt>
                    <dd className="font-black tabular-nums">
                      {m.platform === "kalshi"
                        ? `${m.volume_usd.toLocaleString("he-IL")} חוזים`
                        : `$${m.volume_usd.toLocaleString("en-US")}`}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-faint">השוק נסגר</dt>
                    <dd className="font-bold">{fmtHe(m.end_date)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-ink-faint">תוצאות מתומחרות</dt>
                    <dd className="font-bold tabular-nums">{m.outcomes.length}</dd>
                  </div>
                </dl>
                <a
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block rounded-full border border-line px-4 py-1.5 text-sm font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand"
                >
                  לשוק המקורי ↗
                </a>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <div className="rounded-3xl border border-sun/60 bg-sun/10 p-5 text-sm leading-relaxed text-ink-soft">
          <b className="text-ink">רגע, זה לא סקר.</b> שוקי חיזוי משקפים את דעת
          המהמרים (קהל לא מייצג, ברובו מחוץ לישראל) ולא מדגם של בוחרים.
          המחירים תנודתיים, מושפעים מנזילות ומהטיות, והשאלה (״מי יהיה רה״מ״)
          שונה מהשאלה שסקרים מודדים (״כמה מנדטים לכל מפלגה״). מוצג כאן כזווית
          נוספת על המרוץ, לא כתחזית ולא כהמלצה לסחור.
        </div>
      </section>

      <KnessetFooter />
    </main>
  );
}
