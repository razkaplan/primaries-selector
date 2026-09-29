"use client";

import { useState } from "react";
import { fmtNis } from "@/lib/money";

export interface MoneySegment {
  key: string;
  label: string;
  value: number;
  color: string;
  /** diagonal stripes: marks an estimate rather than a reported figure */
  pattern?: boolean;
}

export interface MoneyRow {
  key: string;
  label: string;
  /** party key, for the page's focus filter (defaults to key) */
  party?: string;
  /** identity dot shown beside the label (party color) */
  dot?: string;
  /** stacked segments; a single segment renders a plain bar */
  segments: MoneySegment[];
  /** optional small note under the label (e.g. "calculated by base formula") */
  note?: string;
  /** extra tooltip lines */
  details?: string[];
}

/** Horizontal bar list (single or stacked) with a per-row hover tooltip.
 * Bars share one scale (the largest row total), labels carry identity, and
 * segments are separated by a 2px surface gap so adjacent fills never merge. */
export default function MoneyBars({
  rows,
  legend,
  max,
}: {
  rows: MoneyRow[];
  legend?: { label: string; color: string; pattern?: boolean }[];
  max?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const scale = max ?? Math.max(...rows.map((r) => r.segments.reduce((s, x) => s + x.value, 0)), 1);

  return (
    <div>
      {legend && legend.length > 1 && (
        <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-1.5 text-xs font-bold text-ink-soft">
          {legend.map((l) => (
            <li key={l.label} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-sm"
                style={{
                  background: l.pattern
                    ? `repeating-linear-gradient(135deg, ${l.color} 0 2px, color-mix(in srgb, ${l.color} 45%, white) 2px 4px)`
                    : l.color,
                }}
              />
              {l.label}
            </li>
          ))}
        </ul>
      )}
      <div className="space-y-2.5">
        {rows.map((r, i) => {
          const total = r.segments.reduce((s, x) => s + x.value, 0);
          const open = hover === r.key;
          return (
            <div
              key={r.key}
              data-party={r.party ?? r.key}
              className={`anim-rise relative ${open ? "z-30" : "z-0"}`}
              style={{ "--rise-delay": `${i * 45}ms` } as React.CSSProperties}
              onPointerEnter={() => setHover(r.key)}
              onPointerLeave={() => setHover(null)}
              onFocus={() => setHover(r.key)}
              onBlur={() => setHover(null)}
              tabIndex={0}
              aria-label={`${r.label}: ${fmtNis(total)}`}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:flex-nowrap">
                <span className="w-full shrink-0 sm:w-52">
                  <span className="flex items-center gap-1.5 truncate font-bold">
                    {r.dot && (
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.dot }} />
                    )}
                    {r.label}
                  </span>
                  {r.note && <span className="block truncate text-[11px] text-ink-faint">{r.note}</span>}
                </span>
                <div className={`flex h-4 flex-1 gap-[2px] rounded-full bg-paper ${open ? "ring-2 ring-ink/10" : ""}`}>
                  {r.segments.map(
                    (s) =>
                      s.value > 0 && (
                        <div
                          key={s.key}
                          className="anim-grow-x h-full first:rounded-r-full last:rounded-l-full"
                          style={{
                            width: `${(s.value / scale) * 100}%`,
                            background: s.pattern
                              ? `repeating-linear-gradient(135deg, ${s.color} 0 5px, color-mix(in srgb, ${s.color} 45%, white) 5px 8px)`
                              : s.color,
                          }}
                        />
                      ),
                  )}
                </div>
                <span className="w-24 shrink-0 text-left text-xs font-black tabular-nums text-ink">
                  {fmtNis(total)}
                </span>
              </div>
              {open && (
                <div className="pointer-events-none absolute right-0 top-full z-20 mt-1 w-64 sm:right-56 sm:top-6 sm:mt-0 rounded-2xl border border-line bg-card p-3 text-xs shadow-lg">
                  <div className="mb-1 flex items-baseline justify-between gap-2 font-black text-ink">
                    <span>{r.label}</span>
                    <span className="tabular-nums">{fmtNis(total)}</span>
                  </div>
                  {r.segments.length > 1 &&
                    r.segments.map((s) => (
                      <div key={s.key} className="flex items-center justify-between gap-2 py-0.5">
                        <span className="flex items-center gap-1.5 text-ink-soft">
                          <span
                            className="h-2 w-2 rounded-sm"
                            style={{
                              background: s.pattern
                                ? `repeating-linear-gradient(135deg, ${s.color} 0 2px, color-mix(in srgb, ${s.color} 45%, white) 2px 3px)`
                                : s.color,
                            }}
                          />
                          {s.label}
                        </span>
                        <b className="tabular-nums text-ink">{fmtNis(s.value)}</b>
                      </div>
                    ))}
                  {r.details?.map((d) => (
                    <div key={d} className="mt-1 leading-snug text-ink-soft">
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
