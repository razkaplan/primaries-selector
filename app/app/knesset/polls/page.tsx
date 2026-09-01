import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import PollsTable from "@/components/PollsTable";
import { polls, pollYear, seatPolls } from "@/lib/elections";

export const metadata: Metadata = {
  title: "כל סקרי המנדטים מאז 2022",
  description:
    "כל סקרי הקצאת המנדטים שפורסמו לקראת הבחירות לכנסת ה-26, מנובמבר 2022 ועד היום, עם סוקר, מפרסם, מדגם וקישור למקור.",
  alternates: { canonical: "/knesset/polls" },
};

export default function KnessetPolls() {
  const byYear = new Map<string, typeof seatPolls>();
  for (const p of seatPolls) {
    const y = pollYear(p);
    byYear.set(y, [...(byYear.get(y) ?? []), p]);
  }
  const years = [...byYear.keys()].sort().reverse();
  const pctPolls = polls.filter((p) => p.kind === "voting_intention_pct");

  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/polls" />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-display text-4xl">כל סקרי המנדטים</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          {seatPolls.length} סקרי הקצאת מנדטים מאז בחירות נובמבר 2022, מהחדש
          לישן. ערך בסוגריים = מפלגה שנסקרה מתחת לאחוז החסימה (3.25%), והמספר
          הוא אחוז ההצבעה שנמדד; קו מפריד = המפלגה לא נכללה בסקר. הרכב העמודות
          משתנה עם הזמן בעקבות פיצולים ומיזוגים.
        </p>
        <div className="mt-5">
          <ShareBar path="/knesset/polls" text="כל סקרי המנדטים לכנסת ה-26 מאז 2022, במקום אחד:" />
        </div>
      </section>

      {years.map((year, i) => (
        <section key={year} className="mx-auto max-w-7xl px-4 pb-8">
          {i === 0 ? (
            <>
              <h2 className="mb-4 font-display text-2xl">
                {year} · {byYear.get(year)!.length} סקרים
              </h2>
              <PollsTable polls={byYear.get(year)!} />
            </>
          ) : (
            <details className="group">
              <summary className="mb-4 cursor-pointer font-display text-2xl">
                {year} · {byYear.get(year)!.length} סקרים
                <span className="mr-2 text-sm font-normal text-ink-faint group-open:hidden">
                  (לחצו להצגה)
                </span>
              </summary>
              <PollsTable polls={byYear.get(year)!} />
            </details>
          )}
        </section>
      ))}

      {pctPolls.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-12">
          <h2 className="mb-1 font-display text-2xl">
            סקרי אחוזי הצבעה · {pctPolls.length} סקרים
          </h2>
          <p className="mb-4 text-sm text-ink-soft">
            סקרים שפורסמו כאחוזי תמיכה ולא כמנדטים (בעיקר עימותים ישירים בין
            שתי מפלגות).
          </p>
          <PollsTable polls={pctPolls} percent />
        </section>
      )}

      <KnessetFooter />
    </main>
  );
}
