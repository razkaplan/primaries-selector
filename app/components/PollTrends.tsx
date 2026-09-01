"use client";

import { useMemo, useRef, useState } from "react";
import type { TrendSeries } from "@/lib/elections";

const W = 760;
const H = 340;
const PAD = { top: 16, left: 34, right: 96, bottom: 28 };

function fmtHe(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(iso + "T00:00:00Z"));
}

/** 2026 seat-trend lines (14-day trailing average, weekly samples) with a
 * crosshair + tooltip hover layer. Chart plane is LTR (time left→right). */
export default function PollTrends({ series }: { series: TrendSeries[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const dates = useMemo(() => {
    const set = new Set<string>();
    for (const s of series) for (const p of s.points) set.add(p.date);
    return [...set].sort();
  }, [series]);

  const maxY = useMemo(
    () => Math.ceil(Math.max(...series.flatMap((s) => s.points.map((p) => p.value)), 10)) + 2,
    [series],
  );

  const x = (date: string) => {
    const i = dates.indexOf(date);
    return PAD.left + (i / Math.max(dates.length - 1, 1)) * (W - PAD.left - PAD.right);
  };
  const y = (v: number) => H - PAD.bottom - (v / maxY) * (H - PAD.top - PAD.bottom);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = (px - PAD.left) / (W - PAD.left - PAD.right);
    const idx = Math.round(t * (dates.length - 1));
    setHoverIdx(Math.max(0, Math.min(dates.length - 1, idx)));
  };

  const hover = hoverIdx !== null ? dates[hoverIdx] : null;
  const hoverVals = hover
    ? series
        .map((s) => ({ s, p: s.points.find((p) => p.date === hover) }))
        .filter((v) => v.p)
        .sort((a, b) => b.p!.value - a.p!.value)
    : [];
  const gridSteps = [0, 10, 20, 30];

  return (
    <div dir="ltr" className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="מגמות ממוצע המנדטים במהלך 2026"
        onPointerMove={onMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        {gridSteps.filter((g) => g <= maxY).map((g) => (
          <g key={g}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(g)} y2={y(g)} stroke="#e9e2d2" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(g) + 4} textAnchor="end" fontSize="11" fill="#8d88a3">
              {g}
            </text>
          </g>
        ))}
        {dates.filter((_, i) => i % 4 === 0).map((d) => (
          <text key={d} x={x(d)} y={H - 8} textAnchor="middle" fontSize="10.5" fill="#8d88a3">
            {fmtHe(d)}
          </text>
        ))}
        {series.map((s) => (
          <path
            key={s.key}
            d={s.points.map((p, i) => `${i === 0 ? "M" : "L"}${x(p.date).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth={2.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            className="anim-draw"
          />
        ))}
        {/* end labels with a simple collision pass (min 13px apart) */}
        {(() => {
          const labels = series
            .filter((s) => s.points.length > 0)
            .map((s) => ({
              s,
              lx: x(s.points[s.points.length - 1].date) + 6,
              ly: y(s.points[s.points.length - 1].value) + 4,
            }))
            .sort((a, b) => a.ly - b.ly);
          for (let i = 1; i < labels.length; i++) {
            if (labels[i].ly - labels[i - 1].ly < 13) {
              labels[i].ly = labels[i - 1].ly + 13;
            }
          }
          return labels.map((l) => (
            <text key={l.s.key} x={l.lx} y={l.ly} fontSize="11.5" fontWeight="700" fill={l.s.color}>
              {l.s.name}
            </text>
          ));
        })()}
        {hover && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={H - PAD.bottom} stroke="#1c1832" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
            {hoverVals.map(({ s, p }) => (
              <circle key={s.key} cx={x(hover)} cy={y(p!.value)} r={4.5} fill={s.color} stroke="#fff" strokeWidth={2} />
            ))}
          </g>
        )}
      </svg>
      {hover && hoverVals.length > 0 && (
        <div
          dir="rtl"
          className="pointer-events-none absolute top-2 z-10 w-44 rounded-2xl border border-line bg-card p-3 text-xs shadow-lg"
          style={{
            left: `${(x(hover) / W) * 100 > 55 ? 4 : 60}%`,
          }}
        >
          <div className="mb-1 font-black text-ink">{fmtHe(hover)} · ממוצע 14 יום</div>
          {hoverVals.map(({ s, p }) => (
            <div key={s.key} className="flex items-center justify-between gap-2 py-0.5">
              <span className="flex items-center gap-1.5 truncate font-bold text-ink-soft">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </span>
              <b className="tabular-nums text-ink">{p!.value.toFixed(1)}</b>
            </div>
          ))}
        </div>
      )}
      <ul dir="rtl" className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {series.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 font-bold text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
