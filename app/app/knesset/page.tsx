import type { Metadata } from "next";
import Link from "next/link";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import PollsTable from "@/components/PollsTable";
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
  title: "בחירות 2026 לכנסת | כל המפלגות, המועמדים והסקרים",
  description:
    "סקירת הבחירות לכנסת ה-26 (27.10.2026): ממוצע הסקרים העדכני, רשימות המועמדים של כל המפלגות וכל הסקרים שפורסמו מאז 2022.",
};

/** 30 days back from the newest poll, so the average is data-anchored. */
function windowStart(latest: string | null, days: number): string {
  const d = new Date((latest ?? "2026-08-29") + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

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
      <KnessetNav active="/knesset" />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-black leading-tight sm:text-4xl">
          הבחירות לכנסת ה-26
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-neutral-600">
          ב-27.10.2026 בוחרים את 120 חברות וחברי הכנסת הבאה. כאן מרוכזים, מכל
          המפלגות: רשימות המועמדים שפורסמו, וכל סקרי הבחירות מאז נובמבר 2022 —
          הקצאות מנדטים, תרחישי ריצה משותפת, ראש ממשלה מועדף וסקרי קואליציה.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { n: seatPolls.length, label: "סקרי מנדטים" },
            { n: polls.length - seatPolls.length, label: "סקרי תרחישים ושאלות" },
            { n: partyLists.length, label: "רשימות שפורסמו" },
            { n: nCandidates, label: "מועמדות ומועמדים" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-neutral-200 bg-white p-4 text-center"
            >
              <div className="text-2xl font-black text-[#101CAA]">{s.n}</div>
              <div className="mt-1 text-xs text-neutral-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <h2 className="text-xl font-black">ממוצע הסקרים · 30 הימים האחרונים</h2>
        <p className="mt-1 text-sm text-neutral-500">
          ממוצע מנדטים פשוט לכל מפלגה על פני הסקרים שכללו אותה
          {latestDate && <> · עדכני ל-{fmtDate(latestDate, "")}</>}
          {govAvg !== null && (
            <> · גוש הקואליציה היוצאת בממוצע: {govAvg.toFixed(1)} מנדטים</>
          )}
          {" · נאסף ב-"}
          {fmtDate(meta.scraped_at, meta.scraped_at)}
          {" · "}
          <a
            href={sourceUrl("polls_2026")}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-[#101CAA]"
          >
            מקור
          </a>
        </p>
        <div className="mt-4 space-y-2 rounded-2xl border border-neutral-200 bg-white p-5">
          {averages.map((a) => (
            <div key={a.key} className="flex items-center gap-3 text-sm">
              <span className="w-44 shrink-0 truncate font-medium sm:w-52">
                {partyName(a.key)}
              </span>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(a.avg / maxAvg) * 100}%`,
                    backgroundColor: partyColor(a.key),
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-left font-bold tabular-nums">
                {a.avg.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-black">הסקרים האחרונים</h2>
          <Link href="/knesset/polls" className="text-sm font-medium text-[#101CAA] underline">
            לכל {seatPolls.length} סקרי המנדטים ←
          </Link>
        </div>
        <div className="mt-4">
          <PollsTable polls={recent} />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/knesset/lists"
            className="rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <h3 className="text-lg font-black">רשימות המועמדים ←</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {nCandidates} מועמדות ומועמדים ב-{partyLists.length} רשימות שכבר
              פורסמו. מפלגות נוספות יגישו רשימות עד 9.9.2026.
            </p>
          </Link>
          <Link
            href="/knesset/polls/more"
            className="rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md"
          >
            <h3 className="text-lg font-black">תרחישים, ראש ממשלה וקואליציה ←</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              סקרי "מה אם": ריצות משותפות ומפלגות חדשות, ראש הממשלה המועדף,
              הרכבי קואליציה וסקרי החברה הערבית.
            </p>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <details className="rounded-2xl border border-neutral-200 bg-white p-5">
          <summary className="cursor-pointer text-lg font-black">
            ציר הזמן של הקמפיין ({pollEvents.length} אירועים)
          </summary>
          <ul className="mt-4 space-y-2 text-sm leading-relaxed">
            {pollEvents.map((e, i) => (
              <li key={i} className="flex gap-3">
                <span className="w-20 shrink-0 font-bold text-neutral-500">
                  {fmtDate(e.date, e.date_raw)}
                </span>
                <span className="text-neutral-700">{eventHe(e.event)}</span>
              </li>
            ))}
          </ul>
        </details>
      </section>

      <KnessetFooter />
    </main>
  );
}
