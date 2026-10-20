import { partyColor, partyName } from "@/lib/elections";
import stancesData from "@/data/elections/coalition_stances.json";

export interface Stance {
  who: string;
  party: string;
  kind: "refuses" | "open";
  about: string[];
  quote: string;
  date: string;
  source_name: string;
  url: string;
}

const stances = (stancesData as { stances: Stance[] }).stances;

export interface Scenario {
  title: string;
  blurb: string;
  members: string[];
  outside?: { parties: string[]; note: string };
}

function fmtHe(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}

/** Stances that bear on this scenario: a member refusing another member
 * (a landmine), or a member/outsider explicitly enabling it. */
function relevantStances(members: Set<string>, outside: Set<string>) {
  const mines: Stance[] = [];
  const enablers: Stance[] = [];
  for (const s of stances) {
    if (s.kind === "refuses" && members.has(s.party) && s.about.some((k) => members.has(k))) {
      mines.push(s);
    } else if (
      s.kind === "open" &&
      (members.has(s.party) || outside.has(s.party)) &&
      s.about.some((k) => members.has(k) || outside.has(k))
    ) {
      enablers.push(s);
    }
  }
  return { mines, enablers };
}

/** Seat math + documented feasibility for hypothetical coalitions. Bars are
 * proportional to seats; every feasibility note is a dated, linked quote. */
export default function CoalitionScenarios({
  seats,
  scenarios,
}: {
  seats: Map<string, number>;
  scenarios: Scenario[];
}) {
  return (
    <div className="space-y-5">
      {scenarios.map((sc, i) => {
        const members = sc.members.filter((k) => (seats.get(k) ?? 0) > 0);
        const total = members.reduce((s, k) => s + (seats.get(k) ?? 0), 0);
        const majority = total >= 61;
        const { mines, enablers } = relevantStances(
          new Set(members),
          new Set(sc.outside?.parties ?? []),
        );
        return (
          <article
            key={sc.title}
            className="anim-rise rounded-3xl border border-line bg-card p-6 shadow-sm"
            style={{ "--rise-delay": `${i * 80}ms` } as React.CSSProperties}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-xl">{sc.title}</h3>
              <span
                className={`rounded-full px-3 py-1 text-sm font-black tabular-nums ${
                  majority ? "bg-mint/15 text-mint" : "bg-coral/15 text-coral"
                }`}
              >
                {total} מנדטים · {majority ? "רוב ✓" : `חסרים ${61 - total} לרוב`}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">{sc.blurb}</p>

            {/* proportional seat bar with the 61 line */}
            <div dir="ltr" className="relative mt-4">
              <div className="flex h-6 w-full overflow-hidden rounded-full bg-paper">
                {[...members]
                  .sort((a, b) => (seats.get(b) ?? 0) - (seats.get(a) ?? 0))
                  .map((k) => (
                    <div
                      key={k}
                      className="anim-grow-x h-full border-l-2 border-card first:border-l-0"
                      style={{
                        width: `${((seats.get(k) ?? 0) / 120) * 100}%`,
                        backgroundColor: partyColor(k),
                      }}
                      title={`${partyName(k)}: ${seats.get(k)}`}
                    />
                  ))}
              </div>
              <div
                className="absolute -top-1 bottom--1 h-8 w-0.5 bg-ink"
                style={{ left: `${(61 / 120) * 100}%` }}
                aria-hidden
              />
              <span
                className="absolute -top-5 -translate-x-1/2 text-[10px] font-black text-ink"
                style={{ left: `${(61 / 120) * 100}%` }}
              >
                61
              </span>
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {[...members]
                .sort((a, b) => (seats.get(b) ?? 0) - (seats.get(a) ?? 0))
                .map((k) => (
                  <li key={k} className="flex items-center gap-1.5 font-bold text-ink-soft">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: partyColor(k) }} />
                    {partyName(k)} <b className="tabular-nums text-ink">{seats.get(k)}</b>
                  </li>
                ))}
            </ul>
            {sc.outside && (
              <p className="mt-2 text-xs text-ink-faint">
                מבחוץ: {sc.outside.parties.map((k) => partyName(k)).join(", ")} — {sc.outside.note}
              </p>
            )}

            {(mines.length > 0 || enablers.length > 0) && (
              <div className="mt-4 space-y-2 border-t border-line/60 pt-3">
                {mines.map((s, j) => (
                  <p key={`m${j}`} className="text-sm leading-relaxed text-ink-soft">
                    <span className="ml-1 font-black text-coral">⛔ מוקש:</span>
                    <b> {s.who}</b> על {s.about.filter((k) => members.includes(k)).map((k) => partyName(k)).join(", ")}: ״{s.quote}״{" "}
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-xs underline hover:text-brand">
                      {s.source_name} · {fmtHe(s.date)} ↗
                    </a>
                  </p>
                ))}
                {enablers.map((s, j) => (
                  <p key={`e${j}`} className="text-sm leading-relaxed text-ink-soft">
                    <span className="ml-1 font-black text-mint">🟢 מאפשר:</span>
                    <b> {s.who}</b>: ״{s.quote}״{" "}
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap text-xs underline hover:text-brand">
                      {s.source_name} · {fmtHe(s.date)} ↗
                    </a>
                  </p>
                ))}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
