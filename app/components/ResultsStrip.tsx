import Link from "next/link";
import { partyColor } from "@/lib/elections";
import resultsData from "@/data/elections/results.json";

/** Home-page strip with the live count: status, counting progress and the
 * seat split, linking to the full results page. Data-driven, so it stays
 * current with every refresh of results.json. */
export default function ResultsStrip() {
  const r = resultsData as unknown as {
    status: string;
    updated_at: string;
    counting: { boxesPct: number };
    lists: { key: string | null; name_he: string; seats: number }[];
  };
  const lists = r.lists.filter((l) => l.seats > 0 && l.key);
  const when = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" }).format(new Date(r.updated_at));
  return (
    <Link href="/knesset/results" className="block border-b border-line bg-card hover:bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <b>
            🗳️ {r.status === "final" ? "תוצאות הבחירות" : "תוצאות חלקיות"}: {r.counting.boxesPct.toLocaleString("he-IL", { maximumFractionDigits: 1 })}% מהקלפיות
          </b>
          <span className="text-xs text-ink-faint">עודכן {when} · לכל התוצאות ←</span>
        </div>
        <div className="mt-2 flex h-6 gap-[2px] overflow-hidden rounded-full" aria-hidden="true">
          {lists.map((l) => (
            <div key={l.key} style={{ width: `${(l.seats / 120) * 100}%`, backgroundColor: partyColor(l.key!) }} />
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-soft">
          {lists.map((l) => (
            <span key={l.key}>
              {l.name_he} <b className="text-ink">{l.seats}</b>
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
