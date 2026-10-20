"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "@/components/KnessetNav";

export interface WeeklyData {
  range: string;
  pollCount: number;
  publishers: string[];
  daysToElection: number;
  rows: { key: string; name: string; color: string; seats: number; delta: number | null; pending: boolean }[];
  coalition: number;
  coalitionPrev: number | null;
}

/** Scene timeline, seconds. The whole video is a pure function of t, so the
 * renderer can seek frame by frame (window.__seek) for a deterministic MP4. */
const SCENES = { intro: [0, 3.6], bars: [3.6, 12.8], bloc: [12.8, 17.4], movers: [17.4, 21.6], outro: [21.6, 25] } as const;
export const DURATION = 25;

const W = 1080;
const H = 1920;
const INK = "#1c1832";
const SOFT = "#55506e";
const FAINT = "#8d88a3";
const PAPER = "#faf6ee";
const BRAND = "#5a31f4";
const UP = "#0e9384";
const DOWN = "#d63352";

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const easeInOut = (x: number) => {
  const c = clamp(x);
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

/** Opacity/offset for a scene: fade+rise in, fade out. */
function sceneStyle(t: number, [a, b]: readonly [number, number], fade = 0.45) {
  const inP = easeOut((t - a) / fade);
  const outP = b >= DURATION ? 1 : 1 - easeInOut((t - (b - fade)) / fade);
  const o = Math.min(inP, outP);
  return { opacity: o, transform: `translateY(${(1 - inP) * 40}px)`, display: o <= 0.001 ? "none" : "flex" };
}

function Delta({ d, size = 30 }: { d: number | null; size?: number }) {
  if (d === null) return null;
  const txt = d > 0 ? `▲ ${d}` : d < 0 ? `▼ ${-d}` : "=";
  const color = d > 0 ? UP : d < 0 ? DOWN : FAINT;
  return <span style={{ color, fontSize: size, fontWeight: 800, minWidth: size * 2.4, textAlign: "left" }}>{txt}</span>;
}

export default function WeeklyVideo({ data }: { data: WeeklyData }) {
  const [t, setT] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const render = new URLSearchParams(location.search).has("render");
    (window as unknown as { __seek: (s: number) => void }).__seek = (s: number) => setT(s);
    (window as unknown as { __duration: number }).__duration = DURATION;
    const fit = () => setScale(Math.min(innerWidth / W, innerHeight / H));
    fit();
    addEventListener("resize", fit);
    if (render) return () => removeEventListener("resize", fit);
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT(((now - start) / 1000) % (DURATION + 1.5));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", fit);
    };
  }, []);

  const rows = data.rows;
  const maxSeats = Math.max(...rows.map((r) => r.seats), 1);
  const risers = rows.filter((r) => (r.delta ?? 0) > 0).sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0));
  const fallers = rows.filter((r) => (r.delta ?? 0) < 0).sort((a, b) => (a.delta ?? 0) - (b.delta ?? 0));
  const pendingNames = rows.filter((r) => r.pending).map((r) => r.name);
  const drift = Math.sin(t * 0.6) * 30;

  const barsT = t - SCENES.bars[0];
  const blocT = t - SCENES.bloc[0];
  const coal = Math.round(data.coalition * easeOut((blocT - 0.3) / 1.4));
  const rest = Math.round((120 - data.coalition) * easeOut((blocT - 0.3) / 1.4));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#111", display: "grid", placeItems: "center", overflow: "hidden" }}>
      <div
        dir="rtl"
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "center",
          position: "relative",
          overflow: "hidden",
          background: PAPER,
          color: INK,
          fontFamily: "var(--font-body), sans-serif",
        }}
      >
        {/* ambient shapes */}
        <div style={{ position: "absolute", width: 900, height: 900, borderRadius: "50%", background: "#efeafe", top: -380 + drift, left: -300, opacity: 0.9 }} />
        <div style={{ position: "absolute", width: 620, height: 620, borderRadius: "50%", background: "#ffc53d", opacity: 0.18, bottom: -200 - drift, right: -180 }} />

        {/* header, persistent */}
        <div style={{ position: "absolute", top: 64, right: 72, left: 72, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <BrandMark className="h-20 w-20" />
            <span style={{ fontFamily: "var(--font-display)", fontSize: 52 }}>
              בחירות<span style={{ color: BRAND }}>26</span>
            </span>
          </div>
          <span style={{ fontSize: 30, fontWeight: 700, color: SOFT }}>סיכום שבועי</span>
        </div>

        {/* 1. intro */}
        <div style={{ ...sceneStyle(t, SCENES.intro), position: "absolute", inset: 0, flexDirection: "column", justifyContent: "center", padding: "0 90px" }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: BRAND }}>{data.range}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 150, lineHeight: 1.02, marginTop: 20 }}>
            השבוע
            <br />
            בסקרים
          </div>
          <div style={{ display: "flex", gap: 28, marginTop: 70 }}>
            {[
              [String(Math.round(data.pollCount * easeOut((t - 0.6) / 1.2))), "סקרי מנדטים"],
              [String(data.daysToElection), "ימים לבחירות"],
            ].map(([n, l]) => (
              <div key={l} style={{ background: "#fff", borderRadius: 40, padding: "34px 46px", boxShadow: "0 8px 30px rgba(28,24,50,.08)" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 110, lineHeight: 1, color: BRAND }}>{n}</div>
                <div style={{ fontSize: 34, fontWeight: 700, color: SOFT, marginTop: 8 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. seat bars */}
        <div style={{ ...sceneStyle(t, SCENES.bars), position: "absolute", inset: 0, flexDirection: "column", padding: "220px 72px 0" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 74 }}>ממוצע המנדטים השבוע</div>
          <div style={{ fontSize: 30, color: SOFT, marginTop: 6 }}>
            ממוצע {data.pollCount} סקרים · החצים: שינוי לעומת השבוע הקודם
          </div>
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 20 }}>
            {rows.map((r, i) => {
              const p = easeOut((barsT - 0.4 - i * 0.12) / 1.1);
              return (
                <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 20, opacity: clamp(p * 1.6) }}>
                  <div style={{ width: 410, display: "flex", alignItems: "center", gap: 14, fontSize: 37, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden" }}>
                    <span style={{ width: 22, height: 22, borderRadius: 11, background: r.color, flexShrink: 0 }} />
                    {r.name}
                    {r.pending ? "*" : ""}
                  </div>
                  <div style={{ flex: 1, height: 44, background: "rgba(28,24,50,.06)", borderRadius: 22, overflow: "hidden" }}>
                    <div style={{ width: `${(r.seats / maxSeats) * 100 * p}%`, height: "100%", background: r.color, borderRadius: 22 }} />
                  </div>
                  <span style={{ width: 70, fontFamily: "var(--font-display)", fontSize: 50, textAlign: "center" }}>{Math.round(r.seats * p)}</span>
                  <Delta d={p > 0.95 ? r.delta : null} />
                </div>
              );
            })}
          </div>
          {pendingNames.length > 0 && (
            <div style={{ fontSize: 26, color: FAINT, marginTop: 34, lineHeight: 1.4 }}>
              * {pendingNames.join(" ו")}: נפסלו בוועדת הבחירות, ממתינות להכרעת בית המשפט העליון.
            </div>
          )}
        </div>

        {/* 3. bloc */}
        <div style={{ ...sceneStyle(t, SCENES.bloc), position: "absolute", inset: 0, flexDirection: "column", justifyContent: "center", padding: "0 72px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 84, lineHeight: 1.1 }}>
            ומה עם
            <br />
            ה-61?
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 70 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 170, lineHeight: 1, color: BRAND }}>{coal}</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: SOFT }}>הקואליציה היוצאת</div>
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 170, lineHeight: 1, color: INK }}>{rest}</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: SOFT }}>שאר המפלגות</div>
            </div>
          </div>
          <div style={{ position: "relative", marginTop: 50, height: 70, borderRadius: 35, background: "rgba(28,24,50,.08)", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: `${(coal / 120) * 100}%`, background: BRAND, borderRadius: 35 }} />
          </div>
          <div style={{ position: "relative", height: 70 }}>
            <div style={{ position: "absolute", right: `${(61 / 120) * 100}%`, top: -84, width: 6, height: 98, background: INK, borderRadius: 3 }} />
            <div style={{ position: "absolute", right: `calc(${(61 / 120) * 100}% - 50px)`, top: 22, fontSize: 32, fontWeight: 800 }}>61</div>
          </div>
          {data.coalitionPrev !== null && (
            <div style={{ fontSize: 38, fontWeight: 700, marginTop: 20, opacity: easeOut((blocT - 1.8) / 0.6) }}>
              לעומת השבוע שעבר: <Delta d={data.coalition - data.coalitionPrev} size={38} />
            </div>
          )}
        </div>

        {/* 4. movers */}
        <div style={{ ...sceneStyle(t, SCENES.movers), position: "absolute", inset: 0, flexDirection: "column", justifyContent: "center", padding: "0 72px", gap: 40 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 84 }}>התנועות של השבוע</div>
          {[
            { title: "עלו", list: risers, color: UP },
            { title: "ירדו", list: fallers, color: DOWN },
          ].map((g, i) =>
            g.list.length ? (
              <div
                key={g.title}
                style={{
                  background: "#fff",
                  borderRadius: 48,
                  padding: "40px 48px",
                  boxShadow: "0 10px 36px rgba(28,24,50,.08)",
                  opacity: easeOut((t - SCENES.movers[0] - 0.4 - i * 0.5) / 0.6),
                  transform: `translateX(${(1 - easeOut((t - SCENES.movers[0] - 0.4 - i * 0.5) / 0.6)) * -60}px)`,
                }}
              >
                <div style={{ fontSize: 44, fontWeight: 900, color: g.color }}>{g.title}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginTop: 22 }}>
                  {g.list.map((m) => (
                    <span key={m.key} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 40, fontWeight: 800, background: PAPER, borderRadius: 999, padding: "12px 26px" }}>
                      <span style={{ width: 22, height: 22, borderRadius: 11, background: m.color }} />
                      {m.name}
                      <Delta d={m.delta} size={36} />
                    </span>
                  ))}
                </div>
              </div>
            ) : null,
          )}
          {!risers.length && !fallers.length && <div style={{ fontSize: 44, color: SOFT }}>שבוע יציב: אין שינוי בממוצע אף רשימה.</div>}
        </div>

        {/* 5. outro */}
        <div style={{ ...sceneStyle(t, SCENES.outro), position: "absolute", inset: 0, flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "0 80px" }}>
          <BrandMark className="h-40 w-40" />
          <div style={{ fontFamily: "var(--font-display)", fontSize: 92, marginTop: 30 }}>
            בחירות<span style={{ color: BRAND }}>26</span>
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: SOFT, marginTop: 10 }}>כל הדאטה. בלי אג׳נדה.</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: BRAND, marginTop: 60, direction: "ltr" }}>elections.gtmascode.dev</div>
        </div>

        {/* method + sources footer, persistent */}
        <div style={{ position: "absolute", bottom: 56, right: 72, left: 72, fontSize: 24, color: FAINT, lineHeight: 1.45 }}>
          ממוצע פשוט של סקרי המנדטים שפורסמו ב-{data.range}, מעוגל ל-120 מנדטים.
          <br />
          פורסמו ב: {data.publishers.join(", ")}.
        </div>
      </div>
    </div>
  );
}
