import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import Hemicycle from "@/components/Hemicycle";
import { OUTGOING_COALITION, partyColor, partyName, polls, seatPolls } from "@/lib/elections";
import { publisherHe } from "@/lib/electionsHe";
import resultsData from "@/data/elections/results.json";

export const metadata: Metadata = {
  title: "תוצאות הבחירות",
  alternates: { canonical: "/knesset/results" },
  description:
    "תוצאות הבחירות לכנסת ה-26 לפי ספירת ועדת הבחירות המרכזית, מתעדכנות עד התוצאות הסופיות: מנדטים, קולות, גושים, ומי צדק יותר: הסקרים או המדגמים.",
};

interface ResultList {
  key: string | null;
  letter: string;
  name_he: string;
  votes: number;
  pct: number;
  seats: number;
  passes: boolean;
}
const results = resultsData as unknown as {
  status: "partial" | "final";
  updated_at: string;
  counting: { boxesCounted: number; boxesTotal: number; boxesPct: number; eligiblePct: number };
  valid_votes: number;
  threshold: { pct: number; votes: number };
  lists: ResultList[];
  sources: { source_name: string; as_of: string; url: string }[];
};

/** The three main broadcasters' exit polls (published at 22:00, some revised overnight). */
const MAIN_EXIT = ["Kan 11", "HaHadashot 12", "Channel 13"];
const FINAL_WEEK = ["2026-10-17", "2026-10-23"];
const OPPOSITION = new Set(["yashar", "together", "democrats", "yisrael_beiteinu"]);
const ARAB = new Set(["joint_list", "raam"]);

function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  }).format(new Date(iso));
}
const n0 = (n: number) => n.toLocaleString("he-IL");
const n1 = (n: number) => n.toLocaleString("he-IL", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function ResultsPage() {
  const inLists = results.lists.filter((l) => l.seats > 0 && l.key);
  const seatsOf = new Map(inLists.map((l) => [l.key!, l.seats]));
  const bloc = (set: Set<string>) => inLists.filter((l) => set.has(l.key!)).reduce((s, l) => s + l.seats, 0);
  const blocs = [
    { label: "הקואליציה היוצאת", seats: bloc(OUTGOING_COALITION), color: "#1f5bd6" },
    { label: "מפלגות האופוזיציה", seats: bloc(OPPOSITION), color: "#0f7f78" },
    { label: "הרשימות הערביות", seats: bloc(ARAB), color: "#8d88a3" },
  ];

  // final week's poll average and the main exit polls, per list
  const avgOf = (list: typeof polls) => {
    const s = new Map<string, { t: number; n: number }>();
    for (const p of list)
      for (const [k, v] of Object.entries(p.results)) {
        if (typeof v !== "number") continue;
        const x = s.get(k) ?? { t: 0, n: 0 };
        x.t += v;
        x.n += 1;
        s.set(k, x);
      }
    return new Map([...s].map(([k, x]) => [k, x.t / x.n]));
  };
  const finalPolls = seatPolls.filter((p) => p.date && p.date >= FINAL_WEEK[0] && p.date <= FINAL_WEEK[1]);
  const pollAvg = avgOf(finalPolls);
  const exits = MAIN_EXIT.map((pub) => polls.find((p) => p.kind === "exit_poll" && p.publisher === pub)).filter(
    (p): p is (typeof polls)[number] => !!p,
  );
  const exitAvg = avgOf(exits);

  const keys = [...new Set([...inLists.map((l) => l.key!), ...[...pollAvg.keys()].filter((k) => (pollAvg.get(k) ?? 0) >= 1.5)])];
  const rows = keys
    .map((k) => ({
      key: k,
      name: partyName(k),
      color: partyColor(k),
      result: seatsOf.get(k) ?? 0,
      poll: pollAvg.get(k) ?? 0,
      exit: exitAvg.get(k) ?? 0,
    }))
    .sort((a, b) => b.result - a.result || b.poll - a.poll);
  const mae = (f: (r: (typeof rows)[number]) => number) => rows.reduce((s, r) => s + Math.abs(f(r) - r.result), 0) / rows.length;
  const accuracy = [
    { label: "ממוצע הסקרים בשבוע האחרון", err: mae((r) => r.poll), note: `${finalPolls.length} סקרים, ${FINAL_WEEK[0].slice(8)}–23.10` },
    { label: "ממוצע שלושת המדגמים", err: mae((r) => r.exit), note: "כאן 11, חדשות 12, חדשות 13" },
    ...exits.map((e) => ({
      label: `המדגם של ${publisherHe(e.publisher)}`,
      err: rows.reduce((s, r) => s + Math.abs(((e.results[r.key] as number) ?? 0) - r.result), 0) / rows.length,
      note: "",
    })),
  ];
  const scaleMax = Math.max(30, ...rows.map((r) => Math.max(r.result, r.poll, r.exit)));
  const pos = (v: number) => `${(v / scaleMax) * 100}%`;
  const below = results.lists.filter((l) => !l.passes && l.pct >= 0.5);
  const partial = results.status !== "final";
  const src = results.sources[0];

  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/results" />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${partial ? "bg-sun/30 text-ink" : "bg-mint/20 text-ink"}`}>
            {partial ? "תוצאות חלקיות" : "תוצאות סופיות"}
          </span>
          <span className="text-xs font-bold text-ink-soft">
            {n1(results.counting.boxesPct)}% מהקלפיות · {n1(results.counting.eligiblePct)}% מבעלי זכות הבחירה · עודכן {fmtTime(results.updated_at)}
          </span>
        </div>
        <h1 className="font-display mt-3 text-4xl">תוצאות הבחירות לכנסת ה-26 🗳️</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          חלוקת המנדטים לפי ספירת ועדת הבחירות המרכזית, כולל הסכמי העודפים.
          {partial &&
            " הספירה עדיין נמשכת: קולות המעטפות הכפולות (חיילים, אסירים, מאושפזים ועוד) נספרים בנפרד ועלולים להזיז מנדטים. התוצאות הרשמיות יפורסמו ברשומות."}
        </p>
        <div className="mt-5">
          <ShareBar path="/knesset/results" text="תוצאות הבחירות לכנסת ה-26, ומי צדק יותר: הסקרים או המדגמים?" />
        </div>
      </section>

      {/* seats */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
            <Hemicycle
              seats={inLists.map((l) => ({ key: l.key!, seats: l.seats }))}
              caption={partial ? "מנדטים · לפי הספירה החלקית" : "מנדטים · תוצאות סופיות"}
              label="הרכב הכנסת לפי תוצאות הבחירות"
              showBlocLine={false}
            />
            <div className="space-y-3">
              {blocs.map((b) => (
                <div key={b.label} className="flex items-center justify-between rounded-2xl border border-line bg-paper/60 px-4 py-3">
                  <span className="flex items-center gap-2 font-bold">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: b.color }} />
                    {b.label}
                  </span>
                  <span className="font-display text-3xl tabular-nums">{b.seats}</span>
                </div>
              ))}
              <p className="text-sm leading-relaxed text-ink-soft">
                {blocs.every((b) => b.seats < 61)
                  ? "אף אחד מהגושים לא הגיע ל-61 מנדטים."
                  : `${blocs.find((b) => b.seats >= 61)!.label} עברה את רף ה-61.`}{" "}
                החלוקה לגושים היא שלנו, לפי הרכב הקואליציה היוצאת; היא לא מנבאת קואליציה.
              </p>
            </div>
          </div>

          <div className="table-scroll mt-8 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-ink-faint">
                  <th className="py-2 font-bold">רשימה</th>
                  <th className="py-2 text-left font-bold">קולות</th>
                  <th className="py-2 text-left font-bold">אחוז</th>
                  <th className="py-2 text-left font-bold">מנדטים</th>
                </tr>
              </thead>
              <tbody>
                {inLists.map((l) => (
                  <tr key={l.letter} className="border-b border-line/50">
                    <td className="py-2">
                      <span className="flex items-center gap-2 font-bold">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: partyColor(l.key!) }} />
                        {l.name_he}
                        <span className="text-[11px] font-normal text-ink-faint">({l.letter})</span>
                      </span>
                    </td>
                    <td className="py-2 text-left tabular-nums">{n0(l.votes)}</td>
                    <td className="py-2 text-left tabular-nums">{n1(l.pct)}%</td>
                    <td className="py-2 text-left font-display text-xl tabular-nums">{l.seats}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {below.length > 0 && (
            <p className="mt-3 text-xs leading-relaxed text-ink-faint">
              מתחת לאחוז החסימה ({n1(results.threshold.pct)}%, כ-{n0(results.threshold.votes)} קולות):{" "}
              {below.map((l) => `${l.name_he} ${n1(l.pct)}%`).join(" · ")}.
            </p>
          )}
        </div>
      </section>

      {/* polls vs exit polls vs results */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">מי צדק: הסקרים, המדגמים או אף אחד?</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            לכל רשימה: ממוצע הסקרים בשבוע האחרון שבו מותר היה לפרסם, ממוצע שלושת
            המדגמים המרכזיים, והתוצאה{partial ? " לפי הספירה החלקית" : ""}.
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-bold text-ink-soft">
            <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-[3px] border-ink-soft" />ממוצע הסקרים</li>
            <li className="flex items-center gap-1.5"><span className="h-3 w-3 rotate-45 bg-ink-soft" />ממוצע המדגמים</li>
            <li className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 rounded-full bg-ink" />התוצאה</li>
          </ul>
          <div className="mt-5 space-y-3">
            {rows.map((r) => (
              <div key={r.key} className="flex items-center gap-3 text-sm" title={`${r.name}: סקרים ${n1(r.poll)} · מדגמים ${n1(r.exit)} · תוצאה ${r.result}`}>
                <span className="flex w-36 shrink-0 items-center gap-1.5 truncate font-bold sm:w-48">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.name}
                </span>
                <div className="relative h-6 flex-1">
                  <div className="absolute inset-x-0 top-[11px] h-0.5 rounded bg-line" />
                  <span className="absolute top-[5px] h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px] bg-card" style={{ right: pos(r.poll), borderColor: r.color, transform: "translateX(50%)" }} />
                  <span className="absolute top-[6px] h-3 w-3 rotate-45 opacity-70" style={{ right: pos(r.exit), backgroundColor: r.color, transform: "translateX(50%) rotate(45deg)" }} />
                  <span className="absolute top-[3px] h-[18px] w-[18px] rounded-full ring-2 ring-card" style={{ right: pos(r.result), backgroundColor: r.color, transform: "translateX(50%)" }} />
                </div>
                <span className="w-28 shrink-0 text-left text-xs tabular-nums text-ink-soft">
                  {n1(r.poll)} · {n1(r.exit)} · <b className="font-display text-base text-ink">{r.result}</b>
                </span>
              </div>
            ))}
          </div>

          <h3 className="font-display mt-8 text-lg">הפער הממוצע מהתוצאה, במנדטים לרשימה</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accuracy.map((a) => (
              <div key={a.label} className="rounded-2xl border border-line bg-paper/60 p-4">
                <div className="font-display text-3xl tabular-nums">{n1(a.err)}</div>
                <div className="text-sm font-bold">{a.label}</div>
                {a.note && <div className="text-xs text-ink-faint">{a.note}</div>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            ממוצע ההפרש המוחלט בין התחזית לתוצאה, על פני {rows.length} הרשימות שנכנסו לכנסת או נמדדו מעל 1.5 מנדטים.
            המדגמים כפי שנרשמו בוויקיפדיה; בחלק מהערוצים עודכנו במהלך הלילה.
            {partial && " ההשוואה תתעדכן עם סיום הספירה."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-10">
        <p className="text-xs leading-relaxed text-ink-faint">
          מקורות: {results.sources.map((s, i) => (
            <span key={s.url}>
              {i > 0 && " · "}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">{s.source_name}</a>
            </span>
          ))}{" "}
          (עודכן {fmtTime(results.updated_at)}). המדגמים:{" "}
          <a href="https://en.wikipedia.org/wiki/Opinion_polling_for_the_2026_Israeli_legislative_election" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
            ויקיפדיה
          </a>
          , לפי ערוצי הטלוויזיה. {src && `הספירה משתנה עד פרסום התוצאות הרשמיות.`}
        </p>
      </section>

      <KnessetFooter />
    </main>
  );
}
