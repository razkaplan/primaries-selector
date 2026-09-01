import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import PollsTable from "@/components/PollsTable";
import { type Poll, polls } from "@/lib/elections";
import { scenarioHe } from "@/lib/electionsHe";

export const metadata: Metadata = {
  title: "סקרי תרחישים, ראש ממשלה וקואליציה",
  alternates: { canonical: "/knesset/polls/more" },
  description:
    "סקרי תרחישים (ריצות משותפות ומפלגות חדשות), ראש הממשלה המועדף, הרכבי קואליציה, סקרי החברה הערבית ושאלות נוספות.",
};

function byScenario(list: Poll[]): [string, Poll[]][] {
  const groups = new Map<string, Poll[]>();
  for (const p of list) {
    const k = p.scenario ?? "אחר";
    groups.set(k, [...(groups.get(k) ?? []), p]);
  }
  // newest scenarios first, by their latest poll date
  return [...groups.entries()].sort((a, b) =>
    (b[1][0].date ?? "").localeCompare(a[1][0].date ?? ""),
  );
}

const QUESTION_SECTIONS: {
  kind: Poll["kind"];
  title: string;
  blurb: string;
  percent: boolean;
}[] = [
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
    kind: "coalition",
    title: "סקרי קואליציה",
    blurb: "עמדות לגבי הרכבי קואליציה אפשריים, באחוזים.",
    percent: true,
  },
  {
    kind: "other",
    title: "שאלות נוספות",
    blurb: "נאמנות מצביעים, מועד הבחירות, איחוד הרשימה המשותפת ועוד, באחוזים.",
    percent: true,
  },
];

export default function KnessetPollsMore() {
  const scenarios = byScenario(polls.filter((p) => p.kind === "scenario"));

  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/polls/more" />

      <section className="mx-auto max-w-7xl px-4 py-10">
        <h1 className="font-display text-4xl">תרחישים, ראש ממשלה וקואליציה</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          כל מה שנסקר מעבר לשאלת המנדטים הישירה: תרחישי "מה אם" על ריצות
          משותפות ומפלגות חדשות, ראש הממשלה המועדף, הרכבי קואליציה וסקרים
          ייעודיים לחברה הערבית.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-8">
        <h2 className="mb-1 font-display text-2xl">
          סקרי תרחישים · {scenarios.reduce((s, [, l]) => s + l.length, 0)} סקרים
          ב-{scenarios.length} תרחישים
        </h2>
        <p className="mb-4 text-sm text-ink-soft">
          הקצאת מנדטים בתרחישים היפותטיים, כפי שהוגדרו על ידי הסוקרים. כותרת כל
          תרחיש מתארת את ההנחה שנבדקה.
        </p>
        <div className="space-y-3">
          {scenarios.map(([name, list]) => (
            <details
              key={name}
              className="rounded-3xl border border-line bg-card p-4"
            >
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
