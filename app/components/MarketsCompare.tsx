interface Outcome {
  name: string;
  name_he: string;
  prob: number;
  volume_usd: number;
}
export interface Market {
  platform: string;
  id: string;
  question_en: string;
  url: string;
  volume_usd: number;
  end_date: string | null;
  currency: string;
  outcomes: Outcome[];
}

const PLATFORM = {
  polymarket: { label: "Polymarket", color: "#5a31f4" },
  kalshi: { label: "Kalshi", color: "#12b5a5" },
} as const;

/** Paired probability bars: the same "who will be PM" question as priced by
 * two independent markets. Candidates shown if either platform gives >=1%. */
export default function MarketsCompare({ markets }: { markets: Market[] }) {
  const poly = markets.find((m) => m.platform === "polymarket");
  const kalshi = markets.find((m) => m.platform === "kalshi");
  if (!poly || !kalshi) return null;

  const byName = new Map<string, { he: string; poly?: number; kalshi?: number }>();
  for (const o of poly.outcomes) {
    byName.set(o.name_he, { he: o.name_he, poly: o.prob });
  }
  for (const o of kalshi.outcomes) {
    const row = byName.get(o.name_he) ?? { he: o.name_he };
    row.kalshi = o.prob;
    byName.set(o.name_he, row);
  }
  const rows = [...byName.values()]
    .filter((r) => (r.poly ?? 0) >= 0.01 || (r.kalshi ?? 0) >= 0.01)
    .sort((a, b) => Math.max(b.poly ?? 0, b.kalshi ?? 0) - Math.max(a.poly ?? 0, a.kalshi ?? 0));
  const max = Math.max(...rows.map((r) => Math.max(r.poly ?? 0, r.kalshi ?? 0)), 0.1);

  return (
    <div>
      <ul className="flex flex-wrap gap-4 text-xs font-bold text-ink-soft">
        {(["polymarket", "kalshi"] as const).map((p) => (
          <li key={p} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PLATFORM[p].color }} />
            {PLATFORM[p].label}
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-3.5">
        {rows.map((r, i) => (
          <div key={r.he} className="anim-rise" style={{ "--rise-delay": `${i * 60}ms` } as React.CSSProperties}>
            <div className="mb-1 text-sm font-black">{r.he}</div>
            {(["poly", "kalshi"] as const).map((k) => {
              const v = k === "poly" ? r.poly : r.kalshi;
              const plat = k === "poly" ? PLATFORM.polymarket : PLATFORM.kalshi;
              return (
                <div key={k} className="mb-0.5 flex items-center gap-2">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-paper">
                    {v !== undefined && (
                      <div
                        className="anim-grow-x h-full rounded-full"
                        style={{ width: `${(v / max) * 100}%`, backgroundColor: plat.color }}
                        title={`${plat.label}: ${(v * 100).toFixed(1)}%`}
                      />
                    )}
                  </div>
                  <span className="w-14 shrink-0 text-left text-xs font-black tabular-nums text-ink-soft">
                    {v !== undefined ? `${(v * 100).toFixed(v >= 0.1 ? 0 : 1)}%` : "-"}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
