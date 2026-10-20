import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import PollsTable from "@/components/PollsTable";
import ShareBar from "@/components/ShareBar";
import CoalitionScenarios, { type Scenario } from "@/components/CoalitionScenarios";
import { type Poll, polls, roundSeats, seatAverages, seatPolls } from "@/lib/elections";
import { scenarioHe } from "@/lib/electionsHe";

export const metadata: Metadata = {
  title: "מי מרכיב ממשלה? תרחישי הקואליציה",
  alternates: { canonical: "/knesset/polls/more" },
  description:
    "חשבון הקואליציות של הבחירות לכנסת ה-26: אילו ממשלות אפשריות לפי ממוצע הסקרים העדכני, ומה המנהיגים באמת הצהירו על מי יישב עם מי — עם תאריך ומקור לכל הצהרה.",
};

function windowStart(latest: string | null, days: number): string {
  const d = new Date((latest ?? "2026-09-06") + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const SCENARIOS: Scenario[] = [
  {
    title: "גוש נתניהו — הקואליציה היוצאת",
    blurb: "הליכוד עם החרדים, עוצמה יהודית, הציונות הדתית-זהות ונעם.",
    members: ["likud", "shas", "utj", "otzma_yehudit", "rzp", "noam"],
  },
  {
    title: "גוש נתניהו + עמך ישראל",
    blurb: "אותו גוש, אם עופר וינטר — שהגדיר את מפלגתו ״חלק מובהק ממחנה הימין״ — יצטרף אליו.",
    members: ["likud", "shas", "utj", "otzma_yehudit", "rzp", "noam", "amcha_yisrael"],
  },
  {
    title: "ממשלת שינוי רחבה בהובלת איזנקוט",
    blurb: "ישר!, ביחד, הדמוקרטים, ישראל ביתנו והמילואימניקים–הכלכלית החדשה.",
    members: ["yashar", "together", "democrats", "yisrael_beiteinu", "reserv_nep"],
  },
  {
    title: "ממשלת שינוי + רע״מ",
    blurb: "הגוש הקודם בתוספת רע״מ של מנסור עבאס בתוך הקואליציה.",
    members: ["yashar", "together", "democrats", "yisrael_beiteinu", "reserv_nep", "raam"],
    outside: {
      parties: ["joint_list"],
      note: "הרשימה המשותפת לא הביעה נכונות לשבת בקואליציה.",
    },
  },
  {
    title: "ממשלת מיעוט ציונית, בתמיכה ערבית מבחוץ",
    blurb: "התוכנית שאיזנקוט נערך אליה לפי הארץ: קואליציה ציונית צרה, כשהסיעות הערביות תומכות, נמנעות או נעדרות.",
    members: ["yashar", "together", "democrats", "yisrael_beiteinu", "reserv_nep"],
    outside: {
      parties: ["raam", "joint_list"],
      note: "תמיכה או הימנעות מבחוץ בהצבעת ההשבעה.",
    },
  },
  {
    title: "ממשלת אחדות נתניהו–איזנקוט",
    blurb: "שתי המפלגות הגדולות עם החרדים — התרחיש שהליכוד מקדם.",
    members: ["likud", "yashar", "shas", "utj"],
  },
];

const QUESTION_SECTIONS: {
  kind: Poll["kind"];
  title: string;
  blurb: string;
  percent: boolean;
}[] = [
  {
    kind: "coalition",
    title: "מה הציבור עונה על הרכבי קואליציה",
    blurb: "סקרי עמדות על הרכבי ממשלה אפשריים, באחוזים.",
    percent: true,
  },
  {
    kind: "preferred_pm",
    title: "ראש הממשלה המועדף",
    blurb: "אחוז התמיכה בכל מועמד בעימותים ישירים.",
    percent: true,
  },
  {
    kind: "arab_voters",
    title: "סקרי החברה הערבית",
    blurb: "סקרים ייעודיים לבוחרות ולבוחרים בחברה הערבית (מנדטים או אחוזים).",
    percent: false,
  },
  {
    kind: "other",
    title: "שאלות נוספות",
    blurb: "נאמנות מצביעים, מועד הבחירות ועוד, באחוזים.",
    percent: true,
  },
];

function byScenario(list: Poll[]): [string, Poll[]][] {
  const groups = new Map<string, Poll[]>();
  for (const p of list) {
    const k = p.scenario ?? "אחר";
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  return [...groups.entries()].sort((a, b) =>
    (b[1][0].date ?? "").localeCompare(a[1][0].date ?? ""),
  );
}

export default function KnessetPollsMore() {
  const latest = seatPolls[0]?.date ?? null;
  const averages = seatAverages(windowStart(latest, 30), true).filter((a) => a.avg >= 1.5);
  const seats = new Map(roundSeats(averages).map((s) => [s.key, s.seats]));
  const scenarios = byScenario(polls.filter((p) => p.kind === "scenario"));

  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/polls/more" />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl">מי מרכיב ממשלה? 🧩</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          המשחק האמיתי של הבחירות הוא 61. כאן עושים את החשבון: הרכבי הקואליציה
          האפשריים לפי ממוצע המנדטים של 30 הימים האחרונים (מעוגל לשיטת השארית
          הגדולה), מול מה שהמנהיגים באמת הצהירו על מי יישב עם מי — כל הצהרה עם
          תאריך ומקור. הצהרות, כידוע מגנץ 2020, אינן חוזה — אבל הן הדאטה שיש.
        </p>
        <div className="mt-5">
          <ShareBar
            path="/knesset/polls/more"
            text="מי באמת יכול להרכיב ממשלה אחרי הבחירות? חשבון הקואליציות המלא, עם ההצהרות והמקורות:"
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <CoalitionScenarios seats={seats} scenarios={SCENARIOS} />
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          מפלגות מתחת ל-1.5 מנדטים בממוצע (ובהן נעם וישראל תחילה) אינן נכללות
          בחשבון המושבים. החישוב מתעדכן אוטומטית עם כל סקר חדש.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8">
        <h2 className="mb-1 font-display text-2xl">
          סקרי תרחישים · {scenarios.reduce((s, [, l]) => s + l.length, 0)} סקרים
        </h2>
        <p className="mb-4 text-sm text-ink-soft">
          מה הסוקרים בדקו ב״מה אם״: ריצות משותפות, מפלגות חדשות ופיצולים.
          כותרת כל תרחיש מתארת את ההנחה שנבדקה.
        </p>
        <div className="space-y-3">
          {scenarios.map(([name, list]) => (
            <details key={name} className="rounded-3xl border border-line bg-card p-4">
              <summary className="cursor-pointer text-sm font-bold sm:text-base">
                {scenarioHe(name)}
                <span className="mr-2 text-sm font-normal text-ink-faint">
                  · {list.length} סקרים
                </span>
              </summary>
              <div className="mt-4">
                <PollsTable polls={list} />
              </div>
            </details>
          ))}
        </div>
      </section>

      {QUESTION_SECTIONS.map((sec) => {
        const list = polls.filter((p) => p.kind === sec.kind);
        if (list.length === 0) return null;
        return (
          <section key={sec.kind} className="mx-auto max-w-7xl px-4 pb-8">
            <h2 className="mb-1 font-display text-2xl">
              {sec.title} · {list.length} סקרים
            </h2>
            <p className="mb-4 text-sm text-ink-soft">{sec.blurb}</p>
            <PollsTable polls={list} percent={sec.percent} />
          </section>
        );
      })}

      <KnessetFooter />
    </main>
  );
}
