"use client";

import { useState } from "react";
import type { Candidate } from "@/lib/types";

const SOCIAL_LABELS: Record<string, string> = {
  facebook: "פייסבוק",
  instagram: "אינסטגרם",
  x: "X",
  tiktok: "טיקטוק",
  linkedin: "לינקדאין",
  whatsapp: "וואטסאפ",
};

export default function CandidateCard({
  candidate,
  score,
  reasons,
  rank,
  starred,
  onToggleStar,
  ballotFull,
}: {
  candidate: Candidate;
  score?: number;
  reasons?: string[];
  rank?: number;
  starred: boolean;
  onToggleStar: () => void;
  ballotFull: boolean;
}) {
  const [open, setOpen] = useState(false);
  const c = candidate;

  return (
    <div
      className={`rounded-2xl border bg-white transition-shadow hover:shadow-md ${
        starred ? "border-[#2A38D7] ring-2 ring-[#2A38D7]/40" : "border-neutral-200"
      }`}
    >
      <div className="flex items-start gap-4 p-4">
        {rank !== undefined && (
          <div className="hidden sm:flex w-8 shrink-0 items-center justify-center text-lg font-bold text-neutral-400 pt-2">
            {rank}
          </div>
        )}
        {c.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.photo}
            alt={c.name}
            className="h-16 w-16 shrink-0 rounded-full object-cover bg-neutral-100"
            loading="lazy"
          />
        ) : (
          <div className="h-16 w-16 shrink-0 rounded-full bg-neutral-200 flex items-center justify-center text-xl font-bold text-neutral-500">
            {c.name.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-bold">{c.name}</h3>
            {score !== undefined && (
              <span className="rounded-full bg-[#2A38D7] px-2.5 py-0.5 text-sm font-bold text-white">
                {Math.round(score)}% התאמה
              </span>
            )}
            {(c.sources?.length ?? 0) < 3 && (
              <span
                title="על מועמד/ת זה נמצא מעט מידע פומבי, ייתכן שהציון אינו משקף את מלוא הפעילות"
                className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
              >
                מידע מוגבל
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-neutral-600 line-clamp-2">
            {c.summary_he || c.bio}
          </p>
          {reasons && reasons.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {reasons.map((r) => (
                <span
                  key={r}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-700"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            onClick={onToggleStar}
            disabled={!starred && ballotFull}
            title={starred ? "הסרה מהפתק שלי" : ballotFull ? "הפתק מלא" : "הוספה לפתק שלי"}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              starred
                ? "bg-[#101CAA] text-white"
                : ballotFull
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                  : "bg-neutral-100 hover:bg-[#2A38D7]/10"
            }`}
          >
            {starred ? "✓ בפתק שלי" : "+ לפתק שלי"}
          </button>
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-sm text-neutral-500 hover:text-neutral-800 underline underline-offset-2"
          >
            {open ? "פחות פרטים" : "עוד פרטים"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-neutral-100 px-4 py-4 sm:px-16">
          <p className="text-sm leading-relaxed text-neutral-700 whitespace-pre-line">{c.bio}</p>
          {c.highlights_he?.length > 0 && (
            <ul className="mt-3 space-y-1">
              {c.highlights_he.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-neutral-700">
                  <span className="text-[#D92731] font-bold">•</span>
                  {h}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {c.website && (
              <a
                href={c.website}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-[#101CAA] px-3 py-1.5 font-medium text-white hover:bg-[#2A38D7]"
              >
                אתר המועמד/ת
              </a>
            )}
            {c.cv && (
              <a
                href={c.cv}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-50"
              >
                קורות חיים
              </a>
            )}
            {Object.entries(c.socials).map(([k, url]) => (
              <a
                key={k}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-neutral-600 hover:bg-neutral-50"
              >
                {SOCIAL_LABELS[k] ?? k}
              </a>
            ))}
          </div>
          {c.electability_signals && (
            <p className="mt-3 text-xs text-neutral-400">
              נוכחות ציבורית (נתונים גולמיים):{" "}
              {c.electability_signals.wikipedia_monthly_views !== null &&
                `ויקיפדיה ~${c.electability_signals.wikipedia_monthly_views.toLocaleString()} צפיות/חודש · `}
              {c.electability_signals.followers_total !== null &&
                `${c.electability_signals.followers_total.toLocaleString()} עוקבים ידועים · `}
              {c.electability_signals.news_domains !== null &&
                `${c.electability_signals.news_domains} אתרי חדשות מרכזיים`}
            </p>
          )}
          {c.sources?.length > 0 && (
            <details className="mt-3 text-xs text-neutral-400">
              <summary className="cursor-pointer hover:text-neutral-600">
                המקורות ששימשו לניתוח ({c.sources.length})
              </summary>
              <ul className="mt-1 space-y-0.5">
                {c.sources.map((s) => (
                  <li key={s} className="truncate">
                    <a href={s} target="_blank" rel="noopener noreferrer" className="underline">
                      {s}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
