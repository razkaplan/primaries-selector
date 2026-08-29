import {
  type Poll,
  fmtDate,
  partyColor,
  partyName,
  resultKeys,
} from "@/lib/elections";

function Cell({ value, pct }: { value: number | string | null; pct?: number }) {
  if (value === null || value === undefined)
    return <td className="px-2 py-1.5 text-center text-neutral-300">–</td>;
  if (value === 0 && pct !== undefined)
    return (
      <td
        className="px-2 py-1.5 text-center text-neutral-400"
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
    <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
      <table className="w-full min-w-max border-collapse text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
            <th className="sticky right-0 bg-neutral-50 px-2 py-2 text-right font-bold">
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
          </tr>
        </thead>
        <tbody>
          {polls.map((p, i) => (
            <tr
              key={i}
              className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
            >
              <td
                className="sticky right-0 whitespace-nowrap bg-white px-2 py-1.5 font-medium"
                title={p.date_raw}
              >
                {fmtDate(p.date, p.date_raw)}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-neutral-600">
                {p.firm ?? "–"}
              </td>
              <td className="whitespace-nowrap px-2 py-1.5 text-neutral-500">
                {p.publisher ?? "–"}
              </td>
              <td className="px-2 py-1.5 text-center tabular-nums text-neutral-500">
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
