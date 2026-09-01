import {
  type Poll,
  fmtDate,
  partyColor,
  partyName,
  resultKeys,
  sourceUrl,
} from "@/lib/elections";
import { firmHe, publisherHe } from "@/lib/electionsHe";

function Cell({ value, pct }: { value: number | string | null; pct?: number }) {
  if (value === null || value === undefined)
    return <td className="px-2 py-1.5 text-center text-line">–</td>;
  if (value === 0 && pct !== undefined)
    return (
      <td
        className="px-2 py-1.5 text-center text-ink-faint"
        title={`מתחת לאחוז החסימה: ${pct}%`}
      >
        ({pct})
      </td>
    );
  return <td className="px-2 py-1.5 text-center tabular-nums">{value}</td>;
}

/** Server-rendered poll table; columns are the union of result keys in
 * `polls`, ordered by mean value. Values are seats or percentages. */
export default function PollsTable({
  polls,
  percent = false,
}: {
  polls: Poll[];
  percent?: boolean;
}) {
  const keys = resultKeys(polls);
  const hasGov = polls.some((p) => p.gov_bloc != null);
  return (
    <div className="table-scroll overflow-x-auto rounded-3xl border border-line bg-card shadow-sm">
      <table className="w-full min-w-max border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b-2 border-line bg-paper/60 text-ink-soft">
            <th className="sticky right-0 bg-paper px-2 py-2 text-right font-bold">
              תאריך
            </th>
            <th className="px-2 py-2 text-right font-bold">סוקר</th>
            <th className="px-2 py-2 text-right font-bold">מפרסם</th>
            <th className="px-2 py-2 text-center font-bold">מדגם</th>
            {keys.map((k) => (
              <th key={k} className="px-2 py-2 text-center font-bold">
                <span
                  className="mb-1 block h-1 w-full rounded-full"
                  style={{ backgroundColor: partyColor(k) }}
                />
                {partyName(k)}
                {percent ? " %" : ""}
              </th>
            ))}
            {hasGov && (
              <th className="px-2 py-2 text-center font-bold" title="גוש הקואליציה היוצאת">
                גוש נתניהו
              </th>
            )}
            <th className="px-2 py-2 text-center font-bold">מקור</th>
          </tr>
        </thead>
        <tbody>
          {polls.map((p, i) => (
            <tr
              key={i}
              className="border-b border-line/60 last:border-0 hover:bg-brand-wash/40"
            >
              <td
                className="sticky right-0 whitespace-nowrap bg-card px-2 py-1.5 font-bold"
                title={p.date_raw}
              >
                {fmtDate(p.date, p.date_raw)}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-ink-soft">
                {firmHe(p.firm)}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-ink-faint">
                {publisherHe(p.publisher)}
              </td>
              <td className="px-2 py-1.5 text-center tabular-nums text-ink-faint">
                {p.sample ?? "–"}
              </td>
              {keys.map((k) => (
                <Cell
                  key={k}
                  value={p.results[k] ?? null}
                  pct={p.below_threshold_pct?.[k]}
                />
              ))}
              {hasGov && (
                <td className="px-2 py-1.5 text-center font-bold tabular-nums">
                  {p.gov_bloc ?? "–"}
                </td>
              )}
              <td className="px-2 py-1.5 text-center">
                <a
                  href={sourceUrl(p.source_page)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ink-faint underline hover:text-brand"
                  title="לטבלת המקור בוויקיפדיה"
                >
                  ↗
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
