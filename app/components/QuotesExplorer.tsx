"use client";

import { useMemo, useRef, useState } from "react";
import { partyColor, partyName } from "@/lib/elections";
import quotesData from "@/data/elections/quotes.json";

export interface Quote {
  candidate_id: string;
  candidate_he: string;
  party: string;
  source_type: string;
  source_name: string;
  date: string | null;
  url: string;
  text: string;
}

const quotes = quotesData as Quote[];

const TYPE_LABEL: Record<string, string> = {
  social_x: "X (טוויטר)",
  social_instagram: "אינסטגרם",
  social_tiktok: "טיקטוק",
  social_facebook: "פייסבוק",
  news: "חדשות",
};

function fmtHe(iso: string | null): string {
  if (!iso) return "תאריך לא צוין";
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}

/** Word-wrap `text` right-to-left for canvas rendering. */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 14);
}

function renderQuoteImage(q: Quote): HTMLCanvasElement {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";

  ctx.fillStyle = "#f7f8fc";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = partyColor(q.party);
  ctx.fillRect(0, 0, W, 14);

  ctx.direction = "rtl";
  ctx.textAlign = "right";

  // quote mark
  ctx.fillStyle = partyColor(q.party);
  ctx.font = `900 110px ${font}`;
  ctx.fillText("”", W - 70, 165);

  // body: shrink until it fits
  const text = q.text.length > 420 ? q.text.slice(0, 420) + "…" : q.text;
  let size = 54;
  let lines: string[];
  do {
    ctx.font = `700 ${size}px ${font}`;
    lines = wrapLines(ctx, text, W - 160);
    size -= 2;
  } while (lines.length * (size + 18) > 560 && size > 26);
  ctx.fillStyle = "#111111";
  let y = 250;
  for (const line of lines) {
    ctx.fillText(line, W - 80, y);
    y += size + 20;
  }

  // attribution
  y = Math.max(y + 40, 830);
  ctx.fillStyle = partyColor(q.party);
  ctx.fillRect(W - 80, y - 34, 10, 90);
  ctx.fillStyle = "#111111";
  ctx.font = `900 40px ${font}`;
  ctx.fillText(`${q.candidate_he} · ${partyName(q.party)}`, W - 110, y);
  ctx.fillStyle = "#555555";
  ctx.font = `400 30px ${font}`;
  ctx.fillText(
    `${fmtHe(q.date)} · ${TYPE_LABEL[q.source_type] ?? q.source_name}`,
    W - 110,
    y + 48,
  );

  ctx.fillStyle = "#9ca3af";
  ctx.font = `400 26px ${font}`;
  ctx.fillText("המקור המלא ופרטים: elections.gtmascode.dev/knesset/quotes", W - 80, H - 50);
  return canvas;
}

async function shareQuote(q: Quote) {
  const canvas = renderQuoteImage(q);
  const blob: Blob | null = await new Promise((res) =>
    canvas.toBlob(res, "image/png"),
  );
  if (!blob) return;
  const file = new File([blob], `quote-${q.candidate_id}.png`, {
    type: "image/png",
  });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        text: `${q.candidate_he}, ${fmtHe(q.date)} — המקור: ${q.url}`,
      });
      return;
    } catch {
      /* user cancelled - fall through to download */
    }
  }
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `quote-${q.candidate_id}.png`;
  a.click();
}

export default function QuotesExplorer() {
  const [party, setParty] = useState<string>("all");
  const [who, setWho] = useState<string>("all");
  const [preview, setPreview] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const parties = useMemo(() => {
    const count = new Map<string, number>();
    for (const q of quotes) count.set(q.party, (count.get(q.party) ?? 0) + 1);
    return [...count.entries()].sort((a, b) => b[1] - a[1]);
  }, []);
  const candidates = useMemo(() => {
    const seen = new Map<string, Quote>();
    for (const q of quotes)
      if ((party === "all" || q.party === party) && !seen.has(q.candidate_id))
        seen.set(q.candidate_id, q);
    return [...seen.values()].sort((a, b) =>
      a.candidate_he.localeCompare(b.candidate_he, "he"),
    );
  }, [party]);
  const shown = quotes.filter(
    (q) =>
      (party === "all" || q.party === party) &&
      (who === "all" || q.candidate_id === who),
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setParty("all");
            setWho("all");
          }}
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            party === "all" ? "bg-[#101CAA] text-white" : "border border-neutral-200 bg-white text-neutral-600"
          }`}
        >
          כל המפלגות ({quotes.length})
        </button>
        {parties.map(([p, n]) => (
          <button
            key={p}
            onClick={() => {
              setParty(p);
              setWho("all");
            }}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${
              party === p
                ? "bg-[#101CAA] text-white"
                : "border border-neutral-200 bg-white text-neutral-600"
            }`}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: partyColor(p) }}
            />
            {partyName(p)} ({n})
          </button>
        ))}
      </div>

      {party !== "all" && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-200 pt-3">
          <button
            onClick={() => setWho("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              who === "all" ? "bg-neutral-800 text-white" : "border border-neutral-200 bg-white text-neutral-500"
            }`}
          >
            כל המועמדים
          </button>
          {candidates.map((c) => (
            <button
              key={c.candidate_id}
              onClick={() => setWho(c.candidate_id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                who === c.candidate_id
                  ? "bg-neutral-800 text-white"
                  : "border border-neutral-200 bg-white text-neutral-500"
              }`}
            >
              {c.candidate_he}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {shown.map((q) => (
          <article
            key={q.url}
            className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-5"
          >
            <div className="flex items-center gap-2 text-sm">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: partyColor(q.party) }}
              />
              <span className="font-bold">{q.candidate_he}</span>
              <span className="text-neutral-400">· {partyName(q.party)}</span>
            </div>
            <p className="mt-3 flex-1 leading-relaxed text-neutral-800">
              {q.text}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-3 text-xs text-neutral-500">
              <span>
                {fmtHe(q.date)} · {TYPE_LABEL[q.source_type] ?? q.source_name} ·{" "}
                <a
                  href={q.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#101CAA]"
                >
                  למקור ↗
                </a>
              </span>
              <span className="flex gap-2">
                <button
                  onClick={() => {
                    const c = renderQuoteImage(q);
                    setPreview(c.toDataURL("image/png"));
                    setTimeout(
                      () => previewRef.current?.scrollIntoView({ behavior: "smooth" }),
                      50,
                    );
                  }}
                  className="rounded-full border border-neutral-200 px-3 py-1.5 font-bold text-neutral-600 hover:bg-neutral-50"
                >
                  תצוגה
                </button>
                <button
                  onClick={() => shareQuote(q)}
                  className="rounded-full bg-[#101CAA] px-3 py-1.5 font-bold text-white hover:bg-[#2A38D7]"
                >
                  שיתוף כתמונה
                </button>
              </span>
            </div>
          </article>
        ))}
      </div>

      {preview && (
        <div ref={previewRef} className="mt-8 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold">תצוגה מקדימה של תמונת השיתוף</span>
            <button
              onClick={() => setPreview(null)}
              className="text-sm text-neutral-400 underline"
            >
              סגירה
            </button>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="תמונת ציטוט לשיתוף" className="mx-auto w-full max-w-md rounded-xl border border-neutral-100" />
        </div>
      )}
    </div>
  );
}
