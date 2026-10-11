import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import ArabMediaFeed, { type FeedItem } from "@/components/ArabMediaFeed";
import { REGIONS, TOPICS, arabMedia, flag, termClass, type Region } from "@/lib/arabMedia";

export const metadata: Metadata = {
  title: "הבחירות בעיני התקשורת בערבית",
  alternates: { canonical: "/knesset/arab-media" },
  description:
    "איך כלי תקשורת בערבית בישראל, ברשות הפלסטינית, במפרץ, במצרים, בירדן, בלבנון ובשידור הבינלאומי מסקרים את הבחירות לכנסת 2026: על מה כותבים, באילו מילים, ומאיזו מדינה כל כלי. כל כותרת במקור ובתרגום, עם קישור ותאריך.",
};

const { outlets, items, period } = arabMedia;
const outletById = new Map(outlets.map((o) => [o.id, o]));

function fmtDate(iso: string, month = false): string {
  return new Intl.DateTimeFormat("he-IL", month
    ? { month: "long", year: "numeric", timeZone: "UTC" }
    : { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(iso + "T00:00:00Z"));
}

const TERM_COLORS = { loaded: "#e8435f", neutral: "#5a31f4", none: "#d9d3c4" } as const;
const TERM_LABELS = {
  loaded: "שם חלופי לישראל (״הכיבוש״, ״הישות״, ״האויב״, ״אדמות 48״)",
  neutral: "״ישראל״ או ״הכנסת״ בלבד",
  none: "בלי שם למדינה או לכנסת בכותרת",
} as const;

export default function ArabMediaPage() {
  const regionOf = (outletId: string) => outletById.get(outletId)!.region;
  const byRegion = (r: Region) => items.filter((i) => regionOf(i.outlet_id) === r);
  const countries = new Set(outlets.map((o) => o.country_he));

  // topic shares per region (an item can carry several topics)
  const topicCols = TOPICS.filter((t) => t.key !== "other" && items.some((i) => i.topics.includes(t.key)));
  const share = (r: Region, t: string) => {
    const list = byRegion(r);
    return list.length ? list.filter((i) => i.topics.includes(t as never)).length / list.length : 0;
  };
  const topTopic = (r: Region) =>
    topicCols.map((t) => ({ t, s: share(r, t.key) })).sort((a, b) => b.s - a.s)[0];

  // terminology per region
  const terms = REGIONS.map((r) => {
    const list = byRegion(r.key);
    const counts = { loaded: 0, neutral: 0, none: 0 };
    for (const i of list) counts[termClass(i.headline_ar)]++;
    const example = list.find((i) => termClass(i.headline_ar) === "loaded");
    return { ...r, n: list.length, counts, example };
  });

  const feed: FeedItem[] = items.map((i) => {
    const o = outletById.get(i.outlet_id)!;
    return {
      url: i.url,
      date_label: fmtDate(i.date, i.date_precision === "month"),
      headline_ar: i.headline_ar,
      headline_he: i.headline_he,
      topics: i.topics,
      region: o.region,
      outlet_he: o.name_he,
      outlet_ar: o.name_ar,
      country_he: o.country_he,
      flag: flag(o.country_code),
      city_he: o.city_he,
    };
  });

  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/arab-media" />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl">הבחירות בעיני התקשורת בערבית 📰</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          איך כלי תקשורת בערבית, מנצרת ועד מוסקבה, מסקרים את הבחירות לכנסת: על
          מה הם כותבים, באילו מילים הם קוראים לישראל ולכנסת, ומאיזו מדינה כל
          אחד מהם. כל כותרת מופיעה במקור, בערבית, ובתרגום שלנו לעברית, עם
          קישור ותאריך.
        </p>
        <div className="mt-5">
          <ShareBar path="/knesset/arab-media" text={`איך התקשורת בערבית מסקרת את הבחירות בישראל? מדגם כותרות מ-${outlets.length} כלי תקשורת ב-${countries.size} מדינות, עם מדינת המקור של כל אחד:`} />
        </div>

        <div className="anim-rise mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            [String(outlets.length), "כלי תקשורת"],
            [String(countries.size), "מדינות מקור"],
            [String(items.length), "כותרות"],
            [`${fmtDate(period.from).replace(/ \d{4}$/, "")} – ${fmtDate(period.to)}`, "תקופת המדגם"],
          ].map(([n, l]) => (
            <div key={l} className="rounded-3xl border border-line bg-card p-5 text-center shadow-sm">
              <div className="font-display text-3xl text-brand">{n}</div>
              <div className="mt-1 text-sm font-bold text-ink-soft">{l}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          זה מדגם, לא סקירה מלאה: כותרות על הבחירות שאיתרנו באתרי הכלים ובמנועי
          חיפוש. מספר הכותרות לכל כלי משקף את מה שנמצא, לא את היקף הסיקור שלו.
          כלי התקשורת שבעמוד הם נושא הסקירה, לא מקורות מידע לשאר האתר.
        </p>
      </section>

      {/* who */}
      <section id="outlets" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">מי מסקר, ומאיפה</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            מדינת המקור היא מדינת הבעלים או המממן; כשהמערכת יושבת במקום אחר, העיר
            מצוינת לצידה. תיאור הבעלות מקושר למקור.
          </p>
          <div className="mt-6 space-y-8">
            {REGIONS.map((r) => {
              const os = outlets.filter((o) => o.region === r.key);
              return (
                <div key={r.key}>
                  <h3 className="flex items-center gap-2 font-bold">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
                    {r.label}
                    <span className="text-xs font-normal text-ink-faint">· {os.length} כלים, {byRegion(r.key).length} כותרות</span>
                  </h3>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                    {os.map((o) => {
                      const n = items.filter((i) => i.outlet_id === o.id).length;
                      return (
                        <li key={o.id} className="rounded-2xl border border-line bg-paper/60 p-3 text-sm">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span>
                              <b>{o.name_he}</b>{" "}
                              <span className="text-ink-faint" lang="ar" dir="rtl">{o.name_ar}</span>
                            </span>
                            <span className="text-xs text-ink-faint">{n} כותרות</span>
                          </div>
                          <div className="mt-1 text-xs font-bold text-ink-soft">
                            <span aria-hidden="true">{flag(o.country_code)}</span> {o.country_he}
                            {o.city_he ? ` · ${o.city_he}` : ""} · {o.type_he}
                          </div>
                          {o.ownership_he ? (
                            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                              {o.ownership_he}{" "}
                              <a href={o.ownership_url!} target="_blank" rel="noopener noreferrer" className="text-ink-faint underline hover:text-brand">
                                מקור ↗
                              </a>
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-ink-faint">בעלות: לא אימתנו מקור, ולכן לא מצוין.</p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* topics heatmap */}
      <section id="topics" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">על מה כותבים</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            שיעור הכותרות בכל אזור שעוסקות בכל נושא (כותרת יכולה לעסוק בכמה נושאים).
            ככל שהתא כהה יותר, הנושא בולט יותר באזור.
          </p>
          <div className="table-scroll mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="w-44" />
                  {topicCols.map((t) => (
                    <th key={t.key} className="px-1 pb-1 text-center align-bottom font-bold text-ink-soft">{t.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REGIONS.map((r) => (
                  <tr key={r.key}>
                    <th className="pl-2 text-right font-bold">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.label}
                      </span>
                    </th>
                    {topicCols.map((t) => {
                      const s = share(r.key, t.key);
                      return (
                        <td
                          key={t.key}
                          className="h-11 rounded-lg text-center font-black tabular-nums"
                          style={{
                            backgroundColor: `rgba(90, 49, 244, ${s === 0 ? 0.04 : 0.12 + s * 0.78})`,
                            color: s > 0.45 ? "#fff" : "var(--color-ink)",
                          }}
                          title={`${r.label} · ${t.label}: ${Math.round(s * 100)}%`}
                        >
                          {s === 0 ? "–" : `${Math.round(s * 100)}%`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="mt-4 space-y-1 text-sm text-ink-soft">
            {REGIONS.map((r) => {
              const top = topTopic(r.key);
              return (
                <li key={r.key}>
                  <b className="text-ink">{r.label}:</b> הנושא הבולט הוא {top.t.label} ({Math.round(top.s * 100)}% מהכותרות).
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* terminology */}
      <section id="terms" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">איך קוראים לישראל ולכנסת</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            בדקנו בכל כותרת אילו מילים משמשות לתיאור המדינה והכנסת. ההבחנה מילולית
            בלבד: היא סופרת מילים בכותרות, ואינה מעריכה את התוכן או את מהימנות הכלי.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-bold text-ink-soft">
            {(Object.keys(TERM_LABELS) as (keyof typeof TERM_LABELS)[]).map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: TERM_COLORS[k] }} />
                {TERM_LABELS[k]}
              </li>
            ))}
          </ul>
          <div className="mt-5 space-y-4">
            {terms.map((r) => (
              <div key={r.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <b>{r.label}</b>
                  <span className="text-xs text-ink-faint">{r.n} כותרות</span>
                </div>
                <div className="mt-1.5 flex h-4 gap-[2px] overflow-hidden rounded-full">
                  {(["loaded", "neutral", "none"] as const).map((k) =>
                    r.counts[k] > 0 ? (
                      <div
                        key={k}
                        style={{ width: `${(r.counts[k] / r.n) * 100}%`, backgroundColor: TERM_COLORS[k] }}
                        title={`${TERM_LABELS[k]}: ${r.counts[k]}`}
                      />
                    ) : null,
                  )}
                </div>
                <div className="mt-1 text-xs tabular-nums text-ink-faint">
                  {r.counts.loaded} שם חלופי · {r.counts.neutral} ״ישראל״/״הכנסת״ · {r.counts.none} בלי שם
                </div>
                {r.example && (
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                    לדוגמה ({outletById.get(r.example.outlet_id)!.name_he}):{" "}
                    <a href={r.example.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand" lang="ar" dir="rtl">
                      {r.example.headline_ar}
                    </a>{" "}
                    <span className="text-ink-faint">({r.example.headline_he})</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* feed */}
      <section id="headlines" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">כל הכותרות</h2>
          <p className="mt-1 mb-5 text-sm leading-relaxed text-ink-soft">
            מהחדשה לישנה. הכותרת בערבית מקושרת לכתבה המקורית.
          </p>
          <ArabMediaFeed items={feed} regions={REGIONS} topics={TOPICS} />
        </div>
      </section>

      {/* method */}
      <section id="method" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 text-sm leading-relaxed text-ink-soft shadow-sm sm:p-8">
          <h2 className="font-display text-2xl text-ink">איך נבנה העמוד</h2>
          <ul className="mt-3 list-disc space-y-1.5 pr-5">
            <li>חיפשנו כותרות על הבחירות לכנסת שפורסמו בין {fmtDate(period.from)} ל-{fmtDate(period.to)}, באתרי הכלים עצמם ובמנועי חיפוש, בערבית.</li>
            <li>כל כותרת מובאת מילה במילה כפי שפורסמה, עם קישור לכתבה ותאריך הפרסום. כשידוע רק החודש, מוצג החודש.</li>
            <li>התרגום לעברית הוא שלנו, מילולי ככל האפשר; מונחים טעונים מתורגמים כלשונם (״الاحتلال״ = ״הכיבוש״).</li>
            <li>מדינת המקור היא מדינת הבעלים או המממן, לפי מקור מקושר. כשלא מצאנו מקור מהימן לבעלות, היא לא מצוינת.</li>
            <li>סיווג הנושאים והמונחים נעשה לפי הכותרת בלבד, לא לפי גוף הכתבה.</li>
            <li>הכללת כלי בסקירה אינה המלצה עליו ואינה הסתמכות עליו: בשאר האתר אנחנו לא משתמשים בחלק מהכלים שכאן (למשל אל-ג׳זירה) כמקור לעובדות.</li>
            <li>
              הנתונים פתוחים:{" "}
              <a href="https://github.com/razkaplan/primaries-selector/blob/main/data/elections/arab_media.json" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
                arab_media.json
              </a>
              . מצאתם טעות בתרגום או בשיוך?{" "}
              <a href="https://github.com/razkaplan/primaries-selector/issues" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
                פתחו Issue
              </a>
              .
            </li>
          </ul>
        </div>
      </section>

      <KnessetFooter />
    </main>
  );
}
