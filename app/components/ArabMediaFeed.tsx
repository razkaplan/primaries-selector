"use client";

import { useMemo, useState } from "react";

export interface FeedItem {
  url: string;
  date_label: string;
  headline_ar: string;
  headline_he: string;
  topics: string[];
  region: string;
  outlet_he: string;
  outlet_ar: string;
  country_he: string;
  flag: string;
  city_he: string | null;
}

/** Headline feed with region and topic filters. Arabic headlines are shown
 * verbatim (lang="ar"), with our Hebrew translation under each. */
export default function ArabMediaFeed({
  items,
  regions,
  topics,
}: {
  items: FeedItem[];
  regions: { key: string; label: string; color: string }[];
  topics: { key: string; label: string }[];
}) {
  const [region, setRegion] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);

  const shown = useMemo(
    () => items.filter((i) => (!region || i.region === region) && (!topic || i.topics.includes(topic))),
    [items, region, topic],
  );
  const color = Object.fromEntries(regions.map((r) => [r.key, r.color]));
  const topicLabel = Object.fromEntries(topics.map((t) => [t.key, t.label]));

  const chip = (on: boolean) =>
    `flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold transition ${
      on ? "border-ink bg-ink text-paper" : "border-line bg-paper/60 text-ink-soft hover:border-ink/40"
    }`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="סינון לפי אזור">
        <span className="ml-1 text-xs font-bold text-ink-faint">אזור:</span>
        {regions.map((r) => (
          <button key={r.key} type="button" aria-pressed={region === r.key} onClick={() => setRegion(region === r.key ? null : r.key)} className={chip(region === r.key)}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
            {r.label}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label="סינון לפי נושא">
        <span className="ml-1 text-xs font-bold text-ink-faint">נושא:</span>
        {topics.map((t) => (
          <button key={t.key} type="button" aria-pressed={topic === t.key} onClick={() => setTopic(topic === t.key ? null : t.key)} className={chip(topic === t.key)}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-ink-faint" aria-live="polite">
        {shown.length} כותרות{region || topic ? " (מסונן)" : ""}
      </p>

      <ul className="mt-3 space-y-3">
        {shown.slice(0, limit).map((i) => (
          <li key={i.url} className="rounded-2xl border border-line bg-paper/60 p-4">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color[i.region] }} />
              <b className="text-ink">{i.outlet_he}</b>
              <span className="text-ink-faint" lang="ar" dir="rtl">{i.outlet_ar}</span>
              <span className="rounded-full bg-card px-2 py-0.5 font-bold text-ink-soft">
                <span aria-hidden="true">{i.flag}</span> {i.country_he}
                {i.city_he ? ` · ${i.city_he}` : ""}
              </span>
              <span className="text-ink-faint">{i.date_label}</span>
            </div>
            <a href={i.url} target="_blank" rel="noopener noreferrer" className="mt-2 block text-lg font-bold leading-snug text-ink hover:text-brand" lang="ar" dir="rtl">
              {i.headline_ar} <span className="text-xs font-normal text-ink-faint">↗</span>
            </a>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              <span className="text-[11px] font-bold text-ink-faint">בתרגום שלנו: </span>
              {i.headline_he}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {i.topics.map((t) => (
                <span key={t} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-faint">
                  {topicLabel[t] ?? t}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {shown.length > limit && (
        <button type="button" onClick={() => setLimit(limit + 20)} className="mt-4 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold text-ink-soft hover:border-ink/40">
          עוד כותרות ({shown.length - limit})
        </button>
      )}
    </div>
  );
}
