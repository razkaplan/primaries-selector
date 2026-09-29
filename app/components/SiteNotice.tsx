import noticesData from "@/data/elections/notices.json";

interface Source {
  source_name: string;
  as_of: string;
  url: string;
}
interface Notice {
  id: string;
  active: boolean;
  as_of: string;
  headline: string;
  summary: string;
  facts: { text: string; sources: Source[] }[];
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(iso + "T00:00:00Z"),
  );
}

/** Sitewide strip for developments that change how every page should be
 * read (e.g. a list disqualified pending the Supreme Court). Facts are
 * listed one by one, each with its own dated sources, under a disclosure. */
export default function SiteNotice() {
  const active = (noticesData.notices as Notice[]).filter((n) => n.active);
  if (active.length === 0) return null;
  return (
    <aside aria-label="עדכון חשוב" className="border-b border-line bg-sun/15 text-sm">
      {active.map((n) => (
        <details key={n.id} className="group mx-auto max-w-6xl px-4 py-2">
          <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-2 gap-y-0.5 leading-snug [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true">⚖️</span>
            <b className="text-ink">{n.headline}</b>
            <span className="text-ink-soft">{n.summary}</span>
            <span className="whitespace-nowrap text-xs font-bold text-brand underline group-open:hidden">
              פרטים ומקורות
            </span>
            <span className="hidden whitespace-nowrap text-xs font-bold text-brand underline group-open:inline">
              סגירה
            </span>
          </summary>
          <ul className="mt-2 space-y-1.5 pb-1 leading-relaxed text-ink-soft">
            {n.facts.map((f) => (
              <li key={f.text}>
                • {f.text}{" "}
                {f.sources.map((s, i) => (
                  <span key={s.url}>
                    {i > 0 && " · "}
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whitespace-nowrap text-xs text-ink-faint underline hover:text-brand"
                    >
                      <bdi>{s.source_name}</bdi>, {fmtDate(s.as_of)} ↗
                    </a>
                  </span>
                ))}
              </li>
            ))}
            <li className="text-xs text-ink-faint">עודכן {fmtDate(n.as_of)}. נעדכן כאן עם הכרעת בית המשפט.</li>
          </ul>
        </details>
      ))}
    </aside>
  );
}
