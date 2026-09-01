import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import {
  fmtDate,
  meta,
  parties,
  partyColor,
  partyLists,
  partyName,
  seatAverages,
  sourceUrl,
} from "@/lib/elections";

export const metadata: Metadata = {
  title: "רשימות המועמדים של כל המפלגות",
  description:
    "רשימות המועמדים המלאות של כל המפלגות לבחירות לכנסת ה-26, לפי סדר המקומות ברשימה, עם תאריך עדכון ומקור לכל רשימה.",
  alternates: { canonical: "/knesset/lists" },
};

export default function KnessetLists() {
  // order published lists by current polling strength
  const avg = new Map(seatAverages("2026-07-01").map((a) => [a.key, a.avg]));
  const lists = [...partyLists].sort(
    (a, b) => (avg.get(b.party) ?? 0) - (avg.get(a.party) ?? 0),
  );
  const withoutList = parties.filter(
    (p) => !p.has_list && (avg.get(p.key) ?? 0) >= 0.5,
  );

  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/lists" />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl">רשימות המועמדים</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          כל הרשימות שפורסמו עד כה, לפי סדר המקומות. את הרשימות הסופיות מגישות
          המפלגות לוועדת הבחירות המרכזית עד 9.9.2026, ולכן רשימות עשויות עוד
          להשתנות ומפלגות שטרם פרסמו רשימה אינן מופיעות כאן.
        </p>
        <div className="mt-5">
          <ShareBar path="/knesset/lists" text="רשימות המועמדים של כל המפלגות לכנסת ה-26, במקום אחד:" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-6 px-4 pb-10">
        {lists.map((list) => (
          <article
            key={list.party}
            className="rounded-3xl border border-line bg-card p-6"
          >
            <header className="flex flex-wrap items-baseline gap-3">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: partyColor(list.party) }}
              />
              <h2 className="font-display text-2xl">{partyName(list.party)}</h2>
              <span className="text-sm text-ink-faint">
                {list.candidates.length} מועמדות ומועמדים
                {avg.get(list.party) !== undefined && (
                  <> · {avg.get(list.party)!.toFixed(1)} מנדטים בממוצע הסקרים</>
                )}
                {" · עודכן "}
                {fmtDate(meta.scraped_at, meta.scraped_at)}
                {" · "}
                <a
                  href={sourceUrl("party_lists")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-brand"
                >
                  מקור
                </a>
              </span>
            </header>
            <ol className="mt-4 gap-x-8 text-sm leading-7 sm:columns-2 lg:columns-3">
              {list.candidates.map((c) => (
                <li key={c.rank} className="flex gap-2 break-inside-avoid">
                  <span className="w-6 shrink-0 text-left font-bold tabular-nums text-ink-faint">
                    {c.rank}
                  </span>
                  {c.wikipedia ? (
                    <a
                      href={c.wikipedia}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate underline decoration-line underline-offset-2 hover:text-brand"
                    >
                      {c.name_he ?? c.name}
                    </a>
                  ) : (
                    <span className="truncate">{c.name_he ?? c.name}</span>
                  )}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-12">
        <div className="rounded-3xl border border-dashed border-line bg-card p-6">
          <h2 className="font-display text-xl text-ink">טרם פרסמו רשימה</h2>
          <p className="mt-1 text-sm text-ink-soft">
            מפלגות שנסקרות בסקרי המנדטים אך רשימתן המלאה עוד לא פורסמה:
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {withoutList.map((p) => (
              <li
                key={p.key}
                className="flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm"
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: partyColor(p.key) }}
                />
                {partyName(p.key)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <KnessetFooter />
    </main>
  );
}
