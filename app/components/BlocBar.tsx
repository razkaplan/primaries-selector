import { OUTGOING_COALITION, partyColor, partyName } from "@/lib/elections";

/** The 61 question, in one bar: 120 rounded seats stacked by party, the
 * outgoing coalition from the right, with the majority line marked. */
export default function BlocBar({
  seats,
}: {
  seats: { key: string; seats: number }[];
}) {
  const coalition = seats
    .filter((s) => OUTGOING_COALITION.has(s.key) && s.seats > 0)
    .sort((a, b) => b.seats - a.seats);
  const others = seats
    .filter((s) => !OUTGOING_COALITION.has(s.key) && s.seats > 0)
    .sort((a, b) => b.seats - a.seats);
  const orderRtl = [...coalition, ...others]; // rendered right-to-left
  const coalitionTotal = coalition.reduce((s, x) => s + x.seats, 0);

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm font-black">
        <span className="text-ink">
          הקואליציה היוצאת · {coalitionTotal}
        </span>
        <span className="text-ink-soft">
          {120 - coalitionTotal} · שאר המפלגות
        </span>
      </div>
      <div className="relative mt-2" dir="rtl">
        <div className="flex h-9 w-full gap-[2px] overflow-hidden rounded-full">
          {orderRtl.map((s) => (
            <div
              key={s.key}
              className="anim-grow-x h-full min-w-0"
              style={{ width: `${(s.seats / 120) * 100}%`, backgroundColor: partyColor(s.key) }}
              title={`${partyName(s.key)}: ${s.seats} מנדטים`}
            />
          ))}
        </div>
        {/* the 61 line, measured from the right (coalition side) */}
        <div
          className="absolute -top-1.5 bottom-[-6px] w-[3px] rounded-full bg-ink"
          style={{ right: `calc(${(61 / 120) * 100}% - 1.5px)` }}
        />
        <div
          className="absolute -top-7 translate-x-1/2 rounded-full bg-ink px-2 py-0.5 text-[11px] font-black text-sun"
          style={{ right: `${(61 / 120) * 100}%` }}
        >
          61
        </div>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1 text-[11px]">
        {orderRtl.map((s) => (
          <li key={s.key} className="flex items-center gap-1 font-bold text-ink-soft">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: partyColor(s.key) }} />
            {partyName(s.key)} <b className="text-ink">{s.seats}</b>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-faint">
        עיגול לממוצע 30 הימים בשיטת השארית הגדולה; "הקואליציה היוצאת" = מפלגות
        הקואליציה בכנסת ה-25 בעת פיזורה, כהגדרת עמודת הגוש בסקרים.
      </p>
    </div>
  );
}
