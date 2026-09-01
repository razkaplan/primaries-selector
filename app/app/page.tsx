import type { Metadata } from "next";
import Link from "next/link";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import PollsTable from "@/components/PollsTable";
import ShareBar from "@/components/ShareBar";
import {
  fmtDate,
  meta,
  partyColor,
  partyLists,
  partyName,
  pollEvents,
  polls,
  seatAverages,
  seatPolls,
  sourceUrl,
} from "@/lib/elections";
import { eventHe } from "@/lib/electionsHe";

export const metadata: Metadata = {
  title: "בחירות2026 | כל המפלגות, המועמדים והסקרים במקום אחד",
  description:
    "ממוצע הסקרים העדכני, רשימות המועמדים של כל המפלגות, כל הסקרים שפורסמו מאז 2022 וציטוטים מתועדים — עם תאריך ומקור לכל נתון. הבחירות לכנסת ה-26 · 27.10.2026.",
  alternates: { canonical: "/" },
};

/** 30 days back from the newest poll, so the average is data-anchored. */
function windowStart(latest: string | null, days: number): string {
  const d = new Date((latest ?? "2026-08-29") + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const CARDS = [
  {
    href: "/knesset/lists",
    emoji: "📋",
    title: "רשימות המועמדים",
    blurb: "כל הרשימות שפורסמו, שם-שם, עם תאריך עדכון ומקור לכל רשימה.",
  },
  {
    href: "/knesset/polls/more",
    emoji: "🔮",
    title: "תרחישי ״מה אם״",
    blurb: "ריצות משותפות, מפלגות חדשות, ראש ממשלה מועדף והרכבי קואליציה.",
  },
  {
    href: "/knesset/quotes",
    emoji: "🗣️",
    title: "ציטוטים והתבטאויות",
    blurb: "מה המועמדים באמת אמרו — עם תאריך, מקור ושיתוף כתמונה בקליק.",
  },
  {
    href: "/primaries",
    emoji: "🗳️",
    title: "כלי הפריימריז",
    blurb: "הכלי שליווה את פריימריז הדמוקרטים: שאלון, דירוג ומודל פתוח.",
  },
];

export default function KnessetOverview() {
  const latestDate = seatPolls[0]?.date ?? null;
  const since = windowStart(latestDate, 30);
  const averages = seatAverages(since).filter((a) => a.avg >= 0.5);
  const maxAvg = Math.max(...averages.map((a) => a.avg), 1);
  const nCandidates = partyLists.reduce((s, p) => s + p.candidates.length, 0);
  const recent = seatPolls.slice(0, 5);
  const govAvgPolls = seatPolls.filter(
    (p) => p.date && p.date >= since && p.gov_bloc != null,
  );
  const govAvg =
    govAvgPolls.length > 0
      ? govAvgPolls.reduce((s, p) => s + (p.gov_bloc ?? 0), 0) / govAvgPolls.length
      : null;

  return (
    <main className="min-h-screen">
      <KnessetNav active="/" />

      {/* hero */}
      <section className="mx-auto max-w-6xl px-4 pb-8 pt-12">
        <p className="font-bold text-brand">27 באוקטובר 2026 · בוחרים את הכנסת ה-26</p>
        <h1 className="font-display mt-2 max-w-3xl text-4xl leading-[1.15] sm:text-6xl">
          כל הדאטה של הבחירות.
          <br />
          <span className="squiggle">בלי אג'נדה.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
          רשימות המועמדים של כל המפלגות, כל סקר שפורסם מאז נובמבר 2022,
          וההתבטאויות של המועמדים — הכול מתועד, מתוארך ומקושר למקור.
          פרויקט עצמאי, בקוד פתוח, שלא מחבב אף מפלגה.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <Link
            href="/knesset/polls"
            className="rounded-2xl bg-brand px-7 py-3.5 text-lg font-black text-white shadow-lg shadow-brand/25 transition-all hover:-translate-y-0.5 hover:bg-brand-deep"
          >
            לכל הסקרים ←
          </Link>
          <ShareBar path="/" text="בחירות2026 — כל הדאטה של הבחירות לכנסת ה-26, בלי אג'נדה:" />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { n: seatPolls.length, label: "סקרי מנדטים", color: "text-brand" },
            { n: polls.length - seatPolls.length, label: "סקרי תרחישים ושאלות", color: "text-mint" },
            { n: nCandidates, label: "מועמדות ומועמדים", color: "text-coral" },
            { n: 178, label: "ציטוטים מתועדים", color: "text-ink" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-3xl border border-line bg-card p-5 text-center shadow-sm"
            >
              <div className={`font-display text-4xl ${s.color}`}>{s.n.toLocaleString("he-IL")}</div>
              <div className="mt-1 text-xs font-bold text-ink-faint">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* polling average */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl">ממוצע הסקרים · 30 הימים האחרונים</h2>
            <span className="text-sm text-ink-faint">
              {latestDate && <>עדכני ל-{fmtDate(latestDate, "")} · </>}
              <a href={sourceUrl("polls_2026")} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
                מקור
              </a>
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            ממוצע מנדטים פשוט לכל מפלגה על פני הסקרים שכללו אותה
            {govAvg !== null && (
              <> · גוש הקואליציה היוצאת: <b>{govAvg.toFixed(1)}</b> מנדטים בממוצע</>
            )}
          </p>
          <div className="mt-6 space-y-2.5">
            {averages.map((a) => (
              <div
                key={a.key}
                className="group flex items-center gap-3 text-sm"
                title={`${partyName(a.key)}: ממוצע ${a.avg.toFixed(1)} מנדטים`}
              >
                <span className="w-44 shrink-0 truncate font-bold sm:w-52">
                  {partyName(a.key)}
                </span>
                <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-paper">
                  <div
                    className="h-full rounded-full transition-all group-hover:opacity-80"
                    style={{
                      width: `${(a.avg / maxAvg) * 100}%`,
                      backgroundColor: partyColor(a.key),
                    }}
                  />
                </div>
                <span className="w-10 shrink-0 text-left font-black tabular-nums">
                  {a.avg.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* latest polls */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl">הסקרים האחרונים</h2>
          <Link href="/knesset/polls" className="text-sm font-bold text-brand underline underline-offset-4 hover:text-brand-deep">
            לכל {seatPolls.length} סקרי המנדטים ←
          </Link>
        </div>
        <PollsTable polls={recent} />
      </section>

      {/* section cards */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-3xl border border-line bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-brand hover:shadow-lg hover:shadow-brand/10"
            >
              <span className="text-3xl">{c.emoji}</span>
              <h3 className="font-display mt-3 text-xl group-hover:text-brand">
                {c.title} ←
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* campaign timeline */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <details className="rounded-3xl border border-line bg-card p-6 shadow-sm">
          <summary className="font-display cursor-pointer text-xl">
            📅 ציר הזמן של הקמפיין ({pollEvents.length} אירועים)
          </summary>
          <ul className="mt-5 space-y-3 border-r-2 border-brand-wash pr-4 text-sm leading-relaxed">
            {pollEvents.map((e, i) => (
              <li key={i} className="relative flex gap-3">
                <span className="absolute -right-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand" />
                <span className="w-20 shrink-0 font-black text-ink-faint">
                  {fmtDate(e.date, e.date_raw)}
                </span>
                <span className="text-ink-soft">{eventHe(e.event)}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <KnessetFooter />
    </main>
  );
}
