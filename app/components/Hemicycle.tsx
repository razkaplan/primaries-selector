import { OUTGOING_COALITION, partyColor, partyName } from "@/lib/elections";

/** The iconic parliament arc: 120 dots, colored by party, outgoing-coalition
 * parties seated on the right. Identity is never color-alone, every dot has
 * a title and the legend carries name + seats. */
export default function Hemicycle({
  seats,
}: {
  seats: { key: string; seats: number }[];
}) {
  // seating order: coalition (largest first) from the right, then the rest
  const coalition = seats.filter((s) => OUTGOING_COALITION.has(s.key));
  const others = seats.filter((s) => !OUTGOING_COALITION.has(s.key));
  coalition.sort((a, b) => b.seats - a.seats);
  others.sort((a, b) => b.seats - a.seats);
  const order = [...coalition, ...others];

  // arc geometry: 6 rows, seats per row proportional to circumference
  const ROWS = 6;
  const R0 = 74;
  const GAP = 17;
  const radii = Array.from({ length: ROWS }, (_, i) => R0 + i * GAP);
  const totalR = radii.reduce((s, r) => s + r, 0);
  let assigned = 0;
  const perRow = radii.map((r, i) => {
    if (i === ROWS - 1) return 120 - assigned;
    const n = Math.round((r / totalR) * 120);
    assigned += n;
    return n;
  });

  // positions: for each row, angles from 0 (right) to PI (left)
  const pos: { x: number; y: number }[] = [];
  perRow.forEach((n, row) => {
    const r = radii[row];
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const a = t * Math.PI; // 0 = right
      pos.push({ x: 210 + r * Math.cos(a), y: 196 - r * Math.sin(a) });
    }
  });
  // fill order: sweep by angle so parties sit in contiguous wedges
  pos.sort((a, b) => {
    const aa = Math.atan2(196 - a.y, a.x - 210);
    const ab = Math.atan2(196 - b.y, b.x - 210);
    return aa - ab || a.x - b.x;
  });

  const dots: { x: number; y: number; key: string }[] = [];
  let i = 0;
  for (const s of order) {
    for (let k = 0; k < s.seats && i < pos.length; k++, i++) {
      dots.push({ ...pos[i], key: s.key });
    }
  }

  const coalitionTotal = coalition.reduce((s, x) => s + x.seats, 0);

  return (
    <div>
      <svg viewBox="0 0 420 210" className="mx-auto w-full max-w-xl" role="img" aria-label="הרכב הכנסת לפי ממוצע הסקרים">
        {dots.map((d, idx) => (
          <circle
            key={idx}
            cx={d.x}
            cy={d.y}
            r={6.4}
            fill={partyColor(d.key)}
            stroke="#faf6ee"
            strokeWidth={1.4}
            className="anim-pop"
            style={{ animationDelay: `${idx * 9}ms` }}
          >
            <title>{partyName(d.key)}</title>
          </circle>
        ))}
        <text x="210" y="192" textAnchor="middle" className="font-display" fontSize="34" fill="#1c1832">
          120
        </text>
        <text x="210" y="208" textAnchor="middle" fontSize="11" fill="#8d88a3" fontWeight="700">
          מנדטים · לפי ממוצע 30 הימים
        </text>
      </svg>
      <p className="mt-2 text-center text-sm font-bold text-ink-soft">
        גוש הקואליציה היוצאת: <span className="text-brand-deep">{coalitionTotal}</span> · שאר
        המפלגות: <span className="text-brand-deep">{120 - coalitionTotal}</span>
      </p>
      <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
        {order.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 font-bold text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: partyColor(s.key) }} />
            {partyName(s.key)}
            <b className="text-ink">{s.seats}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
