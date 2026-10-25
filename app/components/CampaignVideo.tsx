"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/KnessetNav";

export interface CampaignData {
  pollCount: number;
  weeks: { from: string; to: string; likud: number; yashar: number; coalition: number }[];
  leadChanges: number;
  movers: { key: string; name: string; color: string; start: number | null; end: number }[];
  odds: { name: string; prob: number }[];
  oddsDate: string;
  narration: { id: string; text: string }[];
}

const W = 1080;
const H = 1920;
const INK = "#1c1832";
const SOFT = "#55506e";
const FAINT = "#8d88a3";
const PAPER = "#faf6ee";
const BRAND = "#5a31f4";
const UP = "#0e9384";
const DOWN = "#d63352";
const LIKUD = "#1f5bd6";
const YASHAR = "#0f7f78";

const LEAD_IN = 0.5;
const GAP = 0.7;
const TAIL = 1.2;
const DEFAULT_D = [8, 13, 9, 10, 8, 9];

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};
const he1 = (n: number) => n.toLocaleString("he-IL", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const dm = (iso: string) => `${+iso.slice(8, 10)}.${+iso.slice(5, 7)}`;

/** Scene windows from the narration durations: each scene lasts as long as
 * its narration, plus a short gap. The renderer passes ?d=… (seconds). */
function timeline(d: number[]) {
  const out: [number, number][] = [];
  let t = LEAD_IN;
  for (const x of d) {
    out.push([t, t + x + GAP]);
    t += x + GAP;
  }
  return { scenes: out, duration: t + TAIL };
}

function sceneStyle(t: number, [a, b]: [number, number], last: boolean, fade = 0.45) {
  const inP = easeOut((t - (a - (a === LEAD_IN ? LEAD_IN : 0))) / fade);
  const outP = last ? 1 : 1 - easeInOut((t - (b - fade)) / fade);
  const o = Math.min(inP, outP);
  return { opacity: o, transform: `translateY(${(1 - inP) * 40}px)`, display: o <= 0.001 ? "none" : "flex" } as const;
}

/** Line chart over the campaign weeks, drawn progressively (p in 0..1). */
function WeekLines({
  weeks,
  series,
  yMin,
  yMax,
  p,
  ref61,
}: {
  weeks: CampaignData["weeks"];
  series: { key: string; label: string; color: string; values: number[] }[];
  yMin: number;
  yMax: number;
  p: number;
  ref61?: boolean;
}) {
  const cw = 900;
  const ch = 640;
  const x = (i: number) => 40 + (i / (weeks.length - 1)) * (cw - 80);
  const y = (v: number) => ch - 40 - ((v - yMin) / (yMax - yMin)) * (ch - 80);
  const upto = p * (weeks.length - 1);
  const pathFor = (vals: number[]) => {
    const pts: string[] = [];
    for (let i = 0; i <= Math.floor(upto); i++) pts.push(`${x(i)},${y(vals[i])}`);
    const f = upto - Math.floor(upto);
    const i0 = Math.floor(upto);
    if (f > 0 && i0 + 1 < vals.length) pts.push(`${x(i0 + f)},${y(vals[i0] + (vals[i0 + 1] - vals[i0]) * f)}`);
    return `M${pts.join(" L")}`;
  };
  const ticks = [];
  for (let v = Math.ceil(yMin); v <= yMax; v += yMax - yMin > 10 ? 5 : 1) ticks.push(v);
  return (
    <svg width={cw} height={ch} viewBox={`0 0 ${cw} ${ch}`} style={{ direction: "ltr" }}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={40} x2={cw - 40} y1={y(v)} y2={y(v)} stroke="rgba(28,24,50,.08)" strokeWidth={2} />
          <text x={cw - 30} y={y(v) + 9} fontSize={26} fill={FAINT} textAnchor="start" fontWeight={700}>{v}</text>
        </g>
      ))}
      {ref61 && (
        <g>
          <line x1={40} x2={cw - 40} y1={y(61)} y2={y(61)} stroke={INK} strokeWidth={4} strokeDasharray="14 10" />
          <text x={50} y={y(61) - 16} fontSize={30} fill={INK} fontWeight={800} textAnchor="start">61 · רוב בכנסת</text>
        </g>
      )}
      {series.map((s) => (
        <path key={s.key} d={pathFor(s.values)} fill="none" stroke={s.color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {series.map((s) => {
        const i = Math.min(Math.floor(upto + 1e-6), s.values.length - 1);
        return <circle key={s.key + "dot"} cx={x(i)} cy={y(s.values[i])} r={12} fill={s.color} stroke={PAPER} strokeWidth={4} />;
      })}
      <text x={40} y={ch - 4} fontSize={26} fill={FAINT} fontWeight={700}>{dm(weeks[0].from)}</text>
      <text x={cw - 40} y={ch - 4} fontSize={26} fill={FAINT} fontWeight={700} textAnchor="end">{dm(weeks[weeks.length - 1].to)}</text>
    </svg>
  );
}

export default function CampaignVideo({ data }: { data: CampaignData }) {
  const [t, setT] = useState(0);
  const [scale, setScale] = useState(1);
  const [d, setD] = useState<number[]>(DEFAULT_D);
  const { scenes, duration } = useMemo(() => timeline(d), [d]);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const dq = q.get("d")?.split(",").map(Number);
    const dd = dq && dq.length === DEFAULT_D.length && dq.every((x) => x > 0) ? dq : DEFAULT_D;
    setD(dd);
    const tl = timeline(dd);
    const w = window as unknown as { __seek: (s: number) => void; __duration: number; __scenes: [number, number][] };
    w.__seek = (s: number) => setT(s);
    w.__duration = tl.duration;
    w.__scenes = tl.scenes;
    const fit = () => setScale(Math.min(innerWidth / W, innerHeight / H));
    fit();
    addEventListener("resize", fit);
    if (q.has("render")) return () => removeEventListener("resize", fit);
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      setT(((now - t0) / 1000) % (tl.duration + 1));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", fit);
    };
  }, []);

  const [sIntro, sRace, sBloc, sMovers, sMarkets, sOutro] = scenes;
  const local = (s: [number, number]) => t - s[0];
  const prog = (s: [number, number], lead = 0.4, len?: number) => easeInOut((local(s) - lead) / (len ?? s[1] - s[0] - 1.6));
  const last = data.weeks[data.weeks.length - 1];
  const coalVals = data.weeks.map((w) => w.coalition);

  // subtitles: the active segment's sentences, timed by length
  const segIdx = scenes.findIndex(([a, b]) => t >= a && t < b);
  let subtitle = "";
  if (segIdx >= 0) {
    const text = data.narration[segIdx]?.text ?? "";
    const sentences = text.match(/[^.:!?]+[.:!?]?/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
    const total = sentences.reduce((s, x) => s + x.length, 0);
    let acc = scenes[segIdx][0];
    for (const s of sentences) {
      const len = (s.length / total) * d[segIdx];
      if (t < acc + len || s === sentences[sentences.length - 1]) {
        subtitle = s;
        break;
      }
      acc += len;
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#111", display: "grid", placeItems: "center", overflow: "hidden" }}>
      <div
        dir="rtl"
        style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "center", position: "relative", overflow: "hidden", background: PAPER, color: INK, fontFamily: "var(--font-body), sans-serif" }}
      >
        <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "#efeafe", top: -380 + Math.sin(t * 0.5) * 30, left: -300 }} />
        <div style={{ position: "absolute", width: 620, height: 620, borderRadius: "50%", background: "#ffc53d", opacity: 0.18, bottom: -200, right: -180 }} />

        {/* header + legal label, persistent */}
        <div style={{ position: "absolute", top: 60, right: 72, left: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <BrandMark className="h-20 w-20" />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 52 }}>
              בחירות<span style={{ color: BRAND }}>26</span>
            </span>
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", background: INK, borderRadius: 999, padding: "10px 22px" }}>
            סקרים שפורסמו עד 23.10 · אינם עדכניים
          </span>
        </div>

        {/* 1. intro */}
        <div style={{ ...sceneStyle(t, sIntro, false), position: "absolute", inset: 0, flexDirection: "column", justifyContent: "center", padding: "0 90px" }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: BRAND }}>{dm(data.weeks[0].from)} – {dm(last.to)}.2026</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 140, lineHeight: 1.03, marginTop: 20 }}>
            הקמפיין
            <br />
            בסקרים
          </div>
          <div style={{ display: "flex", gap: 28, marginTop: 70 }}>
            {[
              [String(Math.round(data.pollCount * easeOut((local(sIntro) - 0.8) / 1.4))), "סקרי מנדטים"],
              [String(data.weeks.length), "שבועות"],
            ].map(([n, l]) => (
              <div key={l} style={{ background: "#fff", borderRadius: 40, padding: "34px 46px", boxShadow: "0 8px 30px rgba(28,24,50,.08)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 110, lineHeight: 1, color: BRAND }}>{n}</div>
                <div style={{ fontSize: 34, fontWeight: 700, color: SOFT, marginTop: 8 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. race */}
        <div style={{ ...sceneStyle(t, sRace, false), position: "absolute", inset: 0, flexDirection: "column", padding: "250px 72px 0" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 76 }}>המרוץ על המקום הראשון</div>
          <div style={{ fontSize: 32, color: SOFT, marginTop: 8 }}>ממוצע מנדטים שבועי · ההובלה התחלפה {data.leadChanges} פעמים</div>
          <div style={{ marginTop: 50, display: "flex", justifyContent: "center" }}>
            <WeekLines
              weeks={data.weeks}
              yMin={20}
              yMax={26}
              p={prog(sRace, 0.6, (sRace[1] - sRace[0]) * 0.6)}
              series={[
                { key: "likud", label: "הליכוד", color: LIKUD, values: data.weeks.map((w) => w.likud) },
                { key: "yashar", label: "ישר", color: YASHAR, values: data.weeks.map((w) => w.yashar) },
              ]}
            />
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 30, opacity: easeOut((local(sRace) - (sRace[1] - sRace[0]) * 0.65) / 0.6) }}>
            {[
              ["הליכוד", LIKUD, last.likud],
              ["ישר", YASHAR, last.yashar],
            ].map(([name, color, v]) => (
              <div key={name as string} style={{ flex: 1, background: "#fff", borderRadius: 36, padding: "26px 34px", boxShadow: "0 8px 30px rgba(28,24,50,.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 44, fontWeight: 900 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 13, background: color as string }} />
                  {name as string}
                </span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 72 }}>{he1(v as number)}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 26, color: FAINT, marginTop: 16 }}>השבוע האחרון: {dm(last.from)}–{dm(last.to)}</div>
        </div>

        {/* 3. the 61 */}
        <div style={{ ...sceneStyle(t, sBloc, false), position: "absolute", inset: 0, flexDirection: "column", padding: "250px 72px 0" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 76 }}>ומה עם ה-61?</div>
          <div style={{ fontSize: 32, color: SOFT, marginTop: 8 }}>הקואליציה היוצאת, ממוצע שבועי</div>
          <div style={{ marginTop: 50, display: "flex", justifyContent: "center" }}>
            <WeekLines
              weeks={data.weeks}
              yMin={45}
              yMax={63}
              p={prog(sBloc, 0.5, (sBloc[1] - sBloc[0]) * 0.55)}
              ref61
              series={[{ key: "coal", label: "קואליציה", color: BRAND, values: coalVals }]}
            />
          </div>
          <div style={{ display: "flex", gap: 24, marginTop: 30, opacity: easeOut((local(sBloc) - (sBloc[1] - sBloc[0]) * 0.6) / 0.6) }}>
            {[
              ["הכי נמוך", Math.min(...coalVals)],
              ["הכי גבוה", Math.max(...coalVals)],
              ["השבוע האחרון", last.coalition],
            ].map(([l, v]) => (
              <div key={l as string} style={{ flex: 1, background: "#fff", borderRadius: 36, padding: "24px 28px", textAlign: "center", boxShadow: "0 8px 30px rgba(28,24,50,.08)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 72, color: BRAND, lineHeight: 1 }}>{he1(v as number)}</div>
                <div style={{ fontSize: 30, fontWeight: 700, color: SOFT, marginTop: 6 }}>{l as string}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. movers: start vs end of campaign */}
        <div style={{ ...sceneStyle(t, sMovers, false), position: "absolute", inset: 0, flexDirection: "column", padding: "250px 72px 0" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 76 }}>מתחילת הקמפיין לסופו</div>
          <div style={{ fontSize: 30, color: SOFT, marginTop: 8 }}>
            ○ ממוצע {dm(data.weeks[0].from)}–31.7 · ● ממוצע {dm(last.from)}–{dm(last.to)}
          </div>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 22 }}>
            {data.movers.map((m, i) => {
              const p = easeInOut((local(sMovers) - 0.8 - i * 0.08) / 1.6);
              const scaleX = (v: number) => (v / 25) * 100;
              const from = m.start ?? m.end;
              const cur = from + (m.end - from) * p;
              const delta = m.start === null ? null : m.end - m.start;
              return (
                <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 18, opacity: clamp((local(sMovers) - 0.3 - i * 0.06) * 3) }}>
                  <div style={{ width: 330, display: "flex", alignItems: "center", gap: 12, fontSize: 34, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 10, background: m.color, flexShrink: 0 }} />
                    {m.name}
                  </div>
                  <div style={{ position: "relative", flex: 1, height: 40 }}>
                    <div style={{ position: "absolute", top: 18, right: 0, left: 0, height: 4, background: "rgba(28,24,50,.07)", borderRadius: 2 }} />
                    {m.start !== null && (
                      <>
                        <div style={{ position: "absolute", top: 17, height: 6, background: m.color, opacity: 0.35, right: `${Math.min(scaleX(m.start), scaleX(cur))}%`, width: `${Math.abs(scaleX(cur) - scaleX(m.start))}%` }} />
                        <div style={{ position: "absolute", top: 6, width: 28, height: 28, borderRadius: 14, border: `5px solid ${m.color}`, background: PAPER, right: `calc(${scaleX(m.start)}% - 14px)` }} />
                      </>
                    )}
                    <div style={{ position: "absolute", top: 4, width: 32, height: 32, borderRadius: 16, background: m.color, right: `calc(${scaleX(cur)}% - 16px)` }} />
                  </div>
                  <span style={{ width: 80, fontFamily: "var(--font-display)", fontSize: 44, textAlign: "center" }}>{he1(m.end)}</span>
                  <span style={{ width: 120, fontSize: 30, fontWeight: 900, textAlign: "left", color: delta === null ? FAINT : delta >= 0.5 ? UP : delta <= -0.5 ? DOWN : FAINT, opacity: clamp((p - 0.85) * 7) }}>
                    {delta === null ? "חדשה" : delta >= 0.05 ? `▲ ${he1(delta)}` : delta <= -0.05 ? `▼ ${he1(-delta)}` : "="}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 24, color: FAINT, marginTop: 26 }}>״חדשה״: רשימה שלא נמדדה כך בתחילת הקמפיין (למשל אחרי איחוד).</div>
        </div>

        {/* 5. markets */}
        <div style={{ ...sceneStyle(t, sMarkets, false), position: "absolute", inset: 0, flexDirection: "column", justifyContent: "center", padding: "0 72px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 76 }}>ובשוקי ההימורים</div>
          <div style={{ fontSize: 32, color: SOFT, marginTop: 8 }}>הסיכוי להיות ראש הממשלה הבא · Polymarket, {dm(data.oddsDate)}</div>
          <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 34 }}>
            {data.odds.map((o, i) => {
              const p = easeOut((local(sMarkets) - 0.6 - i * 0.25) / 1.4);
              return (
                <div key={o.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 46, fontWeight: 900 }}>
                    <span>{o.name}</span>
                    <span style={{ fontFamily: "var(--font-display)" }}>{he1(o.prob * 100 * p)}%</span>
                  </div>
                  <div style={{ marginTop: 12, height: 56, background: "rgba(28,24,50,.07)", borderRadius: 28, overflow: "hidden" }}>
                    <div style={{ width: `${o.prob * 100 * p}%`, height: "100%", background: i === 0 ? BRAND : i === 1 ? "#7a6fb0" : "#b3abd6", borderRadius: 28 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 26, color: FAINT, marginTop: 34 }}>שוק הימורים משקף את מה שמהמרים חושבים, לא תחזית רשמית.</div>
        </div>

        {/* 6. outro */}
        <div style={{ ...sceneStyle(t, sOutro, true), position: "absolute", inset: 0, flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 80px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 110, lineHeight: 1.05 }}>
            סקר הוא
            <br />
            לא תוצאה
          </div>
          <div style={{ fontSize: 48, fontWeight: 800, color: BRAND, marginTop: 40 }}>יום שלישי, 27 באוקטובר</div>
          <div style={{ fontSize: 40, fontWeight: 700, color: SOFT, marginTop: 8 }}>מצביעים</div>
          <div style={{ marginTop: 70, display: "flex", alignItems: "center", gap: 18 }}>
            <BrandMark className="h-24 w-24" />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 72 }}>
              בחירות<span style={{ color: BRAND }}>26</span>
            </span>
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: BRAND, marginTop: 24, direction: "ltr" }}>elections.gtmascode.dev</div>
        </div>

        {/* subtitles + source, persistent */}
        <div style={{ position: "absolute", bottom: 150, right: 60, left: 60, display: "flex", justifyContent: "center" }}>
          {subtitle && (
            <div style={{ background: "rgba(28,24,50,.86)", color: "#fff", fontSize: 36, fontWeight: 700, lineHeight: 1.35, padding: "16px 28px", borderRadius: 24, textAlign: "center", maxWidth: 940 }}>
              {subtitle}
            </div>
          )}
        </div>
        <div style={{ position: "absolute", bottom: 52, right: 72, left: 72, fontSize: 23, color: FAINT, lineHeight: 1.45 }}>
          ממוצע פשוט של סקרי המנדטים שפורסמו בכלי התקשורת, לפי השבוע שבו פורסמו. הקואליציה היוצאת: הליכוד, ש״ס, יהדות התורה, עוצמה יהודית, הציונות הדתית ונעם.
        </div>
        <span style={{ display: "none" }}>{duration}</span>
      </div>
    </div>
  );
}
