import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import {
  fmtDate,
  partyColor,
  partyLists,
  partyName,
  roundSeats,
  seatAverages,
  seatPolls,
} from "@/lib/elections";
import metaData from "@/data/elections/candidates_meta.json";

export const metadata: Metadata = {
  title: "מי באמת תשב בכנסת הבאה",
  alternates: { canonical: "/knesset/representation" },
  description:
    "הרכב הכנסת הצפויה לפי ממוצע הסקרים העדכני: נשים וגברים, דתות וקבוצות, מאיפה בארץ מגיעים חברי הכנסת הצפויים, עובדות מפתיעות וקשרים מתועדים ביניהם. מתעדכן עם כל סקר.",
};

interface CandMeta {
  party: string;
  rank: number;
  gender: "m" | "f" | null;
  religion: string | null;
  haredi: boolean | null;
  city: string | null;
  bio: string | null;
}
interface Fact {
  who: string;
  party: string;
  fact: string;
  source: string;
}
interface Connection {
  a: string;
  b: string;
  type: string;
  desc: string;
  source: string;
}

const meta = metaData as unknown as {
  built_at: string;
  note: string;
  candidates: Record<string, CandMeta>;
  facts: Fact[];
  connections: Connection[];
};

const RELIGION_HE: Record<string, string> = {
  jewish: "יהודים ויהודיות",
  muslim: "מוסלמים ומוסלמיות",
  christian: "נוצרים",
  druze: "דרוזים",
};
const RELIGION_COLOR: Record<string, string> = {
  jewish: "#5a31f4",
  muslim: "#12b5a5",
  christian: "#ffc53d",
  druze: "#ff4d6d",
  unknown: "#c9c4d8",
};

function windowStart(latest: string | null, days: number): string {
  const d = new Date((latest ?? "2026-09-06") + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** A single 120-seat proportional bar with labeled, counted segments. */
function SeatBar({
  segments,
}: {
  segments: { label: string; n: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.n, 0);
  return (
    <div>
      <div dir="ltr" className="flex h-7 w-full overflow-hidden rounded-full bg-paper">
        {segments.map(
          (s) =>
            s.n > 0 && (
              <div
                key={s.label}
                className="anim-grow-x h-full border-l-2 border-card first:border-l-0"
                style={{ width: `${(s.n / total) * 100}%`, backgroundColor: s.color }}
                title={`${s.label}: ${s.n}`}
              />
            ),
        )}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {segments.map(
          (s) =>
            s.n > 0 && (
              <li key={s.label} className="flex items-center gap-1.5 font-bold text-ink-soft">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                {s.label} <b className="tabular-nums text-ink">{s.n}</b>
                <span className="font-normal text-ink-faint">({Math.round((s.n / total) * 100)}%)</span>
              </li>
            ),
        )}
      </ul>
    </div>
  );
}

export default function KnessetRepresentation() {
  const latest = seatPolls[0]?.date ?? null;
  const averages = seatAverages(windowStart(latest, 30), true).filter((a) => a.avg >= 1.5);
  const seatMap = roundSeats(averages);
  const byName = meta.candidates;

  // the projected members: top `seats` ranks of each party's list
  const projected: { name: string; party: string; m: CandMeta | undefined }[] = [];
  let unknownSeats = 0;
  const listByParty = new Map(partyLists.map((p) => [p.party, p]));
  for (const { key, seats } of seatMap) {
    const pl = listByParty.get(key);
    for (let rank = 1; rank <= seats; rank++) {
      const c = pl?.candidates.find((x) => x.rank === rank);
      const he = c?.name_he ?? c?.name;
      if (!he || he.includes("שריון") || he.includes("נציג")) {
        unknownSeats++;
        continue;
      }
      projected.push({ name: he, party: key, m: byName[he] });
    }
  }

  const women = projected.filter((p) => p.m?.gender === "f").length;
  const men = projected.filter((p) => p.m?.gender === "m").length;
  const genderUnknown = projected.length - women - men + unknownSeats;

  const relCount = new Map<string, number>();
  for (const p of projected) {
    const r = p.m?.religion ?? "unknown";
    relCount.set(r, (relCount.get(r) ?? 0) + 1);
  }
  const haredi = projected.filter((p) => p.m?.haredi).length;

  const cities = new Map<string, { n: number; who: string[] }>();
  let cityKnown = 0;
  for (const p of projected) {
    if (p.m?.city) {
      cityKnown++;
      const c = cities.get(p.m.city) ?? { n: 0, who: [] };
      c.n++;
      c.who.push(p.name);
      cities.set(p.m.city, c);
    }
  }

  // per-party women share, largest parties first
  const partyGender = seatMap
    .map(({ key, seats }) => {
      const members = projected.filter((p) => p.party === key);
      const f = members.filter((p) => p.m?.gender === "f").length;
      return { key, seats, known: members.length, f };
    })
    .sort((a, b) => b.seats - a.seats);

  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/representation" />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl">מי באמת תשב בכנסת הבאה 🪑</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          לוקחים את ממוצע הסקרים של 30 הימים האחרונים, מעגלים ל-120 מנדטים,
          ופותחים את הרשימות: אלה {projected.length} האנשים שצפויים להיכנס
          לכנסת אם הבחירות היו היום — ועוד {unknownSeats} מקומות של רשימות
          ושריונים שטרם אוישו (ובהם ש״ס, שרשימתה טרם הוגשה). הדף מתעדכן
          אוטומטית עם כל סקר חדש.
        </p>
        <div className="mt-5">
          <ShareBar
            path="/knesset/representation"
            text="כמה נשים? כמה חרדים? מאיפה בארץ? ככה תיראה הכנסת הבאה לפי הסקרים:"
          />
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-6 px-4 pb-12">
        {/* gender */}
        <div className="anim-rise rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">נשים וגברים</h2>
          <p className="mt-1 text-sm text-ink-soft">
            מתוך 120 המושבים הצפויים, לפי המיקומים הריאליים ברשימות שהוגשו.
          </p>
          <div className="mt-5">
            <SeatBar
              segments={[
                { label: "נשים", n: women, color: "#ff4d6d" },
                { label: "גברים", n: men, color: "#5a31f4" },
                { label: "טרם ידוע", n: genderUnknown, color: "#c9c4d8" },
              ]}
            />
          </div>
          <h3 className="font-display mt-7 text-lg">נשים במקומות הריאליים, מפלגה-מפלגה</h3>
          <div className="mt-3 space-y-2">
            {partyGender.map((pg) => (
              <div key={pg.key} className="flex items-center gap-3 text-sm">
                <span className="flex w-44 shrink-0 items-center gap-1.5 truncate font-bold sm:w-56">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: partyColor(pg.key) }} />
                  {partyName(pg.key)}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-paper">
                  {pg.known > 0 && (
                    <div
                      className="anim-grow-x h-full rounded-full"
                      style={{ width: `${(pg.f / pg.known) * 100}%`, backgroundColor: "#ff4d6d" }}
                    />
                  )}
                </div>
                <span className="w-20 shrink-0 text-left text-xs font-black tabular-nums text-ink-soft">
                  {pg.known > 0 ? `${pg.f}/${pg.known}` : "טרם ידוע"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* religion */}
        <div className="anim-rise rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">דתות וקבוצות</h2>
          <p className="mt-1 text-sm text-ink-soft">
            לפי השתייכות מפלגתית וזהות ציבורית מתועדת בלבד.
          </p>
          <div className="mt-5">
            <SeatBar
              segments={[
                ...[...relCount.entries()]
                  .sort((a, b) => b[1] - a[1])
                  .map(([r, n]) => ({
                    label: RELIGION_HE[r] ?? "טרם ידוע",
                    n: r === "unknown" ? n + unknownSeats : n,
                    color: RELIGION_COLOR[r] ?? RELIGION_COLOR.unknown,
                  })),
                ...(relCount.has("unknown") ? [] : [{ label: "טרם ידוע", n: unknownSeats, color: RELIGION_COLOR.unknown }]),
              ]}
            />
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            מתוכם <b className="tabular-nums">{haredi}</b> חברי כנסת חרדים
            (יהדות התורה; רשימת ש״ס, שטרם הוגשה, צפויה להוסיף עוד ~
            {seatMap.find((s) => s.key === "shas")?.seats ?? 0}).
          </p>
        </div>

        {/* residence */}
        <div className="anim-rise rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">איפה הם גרים</h2>
          <p className="mt-1 text-sm text-ink-soft">
            מקום מגורים מתועד ידוע לנו עבור {cityKnown} מתוך {projected.length}{" "}
            חברי הכנסת הצפויים — עוזרים להשלים?{" "}
            <a
              href="https://github.com/razkaplan/primaries-selector/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-brand"
            >
              פתחו Issue עם מקור
            </a>
            .
          </p>
          <ul className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {[...cities.entries()]
              .sort((a, b) => b[1].n - a[1].n)
              .map(([city, c]) => (
                <li key={city} className="flex items-baseline justify-between gap-2 border-b border-line/50 pb-1">
                  <span className="font-bold">{city}</span>
                  <span className="truncate text-xs text-ink-faint">{c.who.join(", ")}</span>
                </li>
              ))}
          </ul>
        </div>

        {/* fun facts */}
        <div className="anim-rise rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">רגע, זה נכון? 🤯</h2>
          <p className="mt-1 text-sm text-ink-soft">
            עובדות על המועמדים בצמרת הרשימות — כל עובדה עם מקור.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {meta.facts.map((f) => (
              <article key={f.who + f.fact.slice(0, 12)} className="rounded-2xl border border-line bg-paper/60 p-4">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: partyColor(f.party) }} />
                  {f.who}
                  <span className="font-normal text-ink-faint">· {partyName(f.party)}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink">{f.fact}</p>
                <a
                  href={f.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-ink-faint underline hover:text-brand"
                >
                  למקור ↗
                </a>
              </article>
            ))}
          </div>
        </div>

        {/* connections */}
        <div className="anim-rise rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">מי קשור למי 🔗</h2>
          <p className="mt-1 text-sm text-ink-soft">
            קשרים מתועדים בין מועמדים — פוליטיים, צבאיים ואישיים. רק מה שפורסם, עם מקור.
          </p>
          <div className="mt-5 space-y-3">
            {meta.connections.map((c) => (
              <article key={c.a + c.b} className="rounded-2xl border border-line bg-paper/60 p-4">
                <div className="flex flex-wrap items-center gap-2 text-sm font-black">
                  {c.a}
                  <span className="rounded-full bg-brand-wash px-2 py-0.5 text-[11px] font-bold text-brand-deep">
                    {c.type}
                  </span>
                  {c.b}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{c.desc}</p>
                <a
                  href={c.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-ink-faint underline hover:text-brand"
                >
                  למקור ↗
                </a>
              </article>
            ))}
          </div>
        </div>

        <p className="text-xs leading-relaxed text-ink-faint">
          מתודולוגיה: {meta.note} עודכן {fmtDate(meta.built_at, meta.built_at)}.
          מפלגות מתחת ל-1.5 מנדטים בממוצע אינן נכללות בחלוקת המושבים.
        </p>
      </section>

      <KnessetFooter />
    </main>
  );
}
