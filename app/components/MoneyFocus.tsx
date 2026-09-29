"use client";

import { useEffect, useState } from "react";

/** Jump-to-section links plus a party focus: picking a party dims every
 * element on the page tagged with another party (data-party), across all
 * charts and tables at once. The choice lives in the URL (?party=),
 * so a focused view can be shared. */
export default function MoneyFocus({
  sections,
  parties,
}: {
  sections: { id: string; label: string }[];
  parties: { key: string; label: string; color: string }[];
}) {
  const [party, setParty] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(location.search).get("party");
    if (q && parties.some((p) => p.key === q)) setParty(q);
  }, [parties]);

  useEffect(() => {
    const url = new URL(location.href);
    if (party) url.searchParams.set("party", party);
    else url.searchParams.delete("party");
    history.replaceState(null, "", url);
  }, [party]);

  return (
    <div className="rounded-3xl border border-line bg-card/95 p-4 shadow-sm backdrop-blur">
      {party && (
        // filter, not opacity: the entry animations hold opacity at 1
        <style>{`[data-party]:not([data-party="${party}"]){filter:grayscale(.85) opacity(.2);transition:filter .2s}`}</style>
      )}
      <nav aria-label="קפיצה לחלק בעמוד" className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-bold">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="text-ink-soft underline-offset-4 hover:text-brand hover:underline">
            {s.label}
          </a>
        ))}
      </nav>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-3" role="group" aria-label="התמקדות במפלגה">
        <span className="ml-1 text-xs font-bold text-ink-faint">התמקדות במפלגה:</span>
        {parties.map((p) => {
          const on = party === p.key;
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={on}
              onClick={() => setParty(on ? null : p.key)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition ${
                on ? "border-ink bg-ink text-paper" : "border-line bg-paper/60 text-ink-soft hover:border-ink/40"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
              {p.label}
            </button>
          );
        })}
        {party && (
          <button type="button" onClick={() => setParty(null)} className="mr-1 text-xs font-bold text-brand underline">
            הצגת הכול
          </button>
        )}
      </div>
    </div>
  );
}
