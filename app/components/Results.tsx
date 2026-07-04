"use client";

import { useMemo, useState } from "react";
import type { Answers, Candidate } from "@/lib/types";
import { rankCandidates, shuffle } from "@/lib/scoring";
import CandidateCard from "./CandidateCard";

export const MAX_PICKS = 10;

export default function Results({
  candidates,
  answers,
  onRestart,
}: {
  candidates: Candidate[];
  answers: Answers;
  onRestart: () => void;
}) {
  const ranked = useMemo(() => rankCandidates(candidates, answers), [candidates, answers]);
  const randomOrder = useMemo(() => shuffle(candidates), [candidates]);
  const [view, setView] = useState<"ranked" | "all">("ranked");
  const [ballot, setBallot] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const byId = useMemo(() => new Map(candidates.map((c) => [c.id, c])), [candidates]);

  function toggle(id: string) {
    setBallot((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < MAX_PICKS ? [...prev, id] : prev
    );
  }

  async function copyBallot() {
    const names = ballot.map((id) => byId.get(id)?.name).filter(Boolean);
    const text = `הפתק שלי לפריימריז של הדמוקרטים:\n${names.map((n, i) => `${i + 1}. ${n}`).join("\n")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-40 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">
          {view === "ranked" ? "ההתאמות שלך" : "כל המועמדים (סדר אקראי)"}
        </h2>
        <div className="flex gap-2 text-sm">
          <button
            onClick={() => setView(view === "ranked" ? "all" : "ranked")}
            className="rounded-xl border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
          >
            {view === "ranked" ? "הצגת כולם בסדר אקראי" : "חזרה לדירוג"}
          </button>
          <button
            onClick={onRestart}
            className="rounded-xl border border-neutral-300 px-3 py-1.5 hover:bg-neutral-50"
          >
            מילוי מחדש
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-neutral-500">
        הדירוג משקף התאמה להעדפות שמילאתם, על בסיס מידע פומבי. הוא כלי עזר בלבד, הבחירה
        שלכם. סמנו עד {MAX_PICKS} מועמדים לבניית הפתק.
      </p>

      <details className="mt-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
        <summary className="cursor-pointer font-medium text-neutral-800">
          איך הדירוג עובד? (שקיפות מלאה)
        </summary>
        <div className="mt-2 space-y-2 leading-relaxed">
          <p>
            הציון הוא נוסחה קבועה ושקופה, זהה לכל המועמדים, ללא העדפה מערכתית לאף מועמד:
          </p>
          <ul className="list-disc space-y-1 pr-5">
            <li>
              <b>60%</b> - עד כמה הנושאים שבחרתם מרכזיים באג'נדה המוצהרת ובעשייה של
              המועמד/ת (ציון 0-5 לכל נושא, שנקבע מראש לכל המועמדים באותו תהליך: הביו הרשמי,
              אתר המועמד/ת, קורות החיים וסיקור חדשותי)
            </li>
            <li><b>15%</b> - התאמה להעדפת הניסיון שציינתם</li>
            <li><b>15%</b> - התאמה להעדפות הייצוג שסימנתם</li>
            <li><b>10%</b> - זיקה מפלגתית (מרצ / העבודה / חדשים), אם בחרתם כזו</li>
          </ul>
          <p>
            מועמדים עם ציון זהה מוצגים בסדר אקראי שמתחלף בכל ביקור. מועמדים עם מעט מידע
            פומבי מסומנים בתגית "מידע מוגבל" כי ייתכן שציונם מוטה כלפי מטה. המקורות המלאים
            של כל מועמד/ת מופיעים תחת "עוד פרטים". הכלי אינו ממליץ, אינו מקדם אף מועמד,
            ואינו שומר את תשובותיכם.
          </p>
        </div>
      </details>

      <div className="mt-6 space-y-3">
        {view === "ranked"
          ? ranked.map((r, i) => (
              <CandidateCard
                key={r.candidate.id}
                candidate={r.candidate}
                score={r.score}
                reasons={r.reasons}
                rank={i + 1}
                starred={ballot.includes(r.candidate.id)}
                onToggleStar={() => toggle(r.candidate.id)}
                ballotFull={ballot.length >= MAX_PICKS}
              />
            ))
          : randomOrder.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                starred={ballot.includes(c.id)}
                onToggleStar={() => toggle(c.id)}
                ballotFull={ballot.length >= MAX_PICKS}
              />
            ))}
      </div>

      {/* ballot bar */}
      {ballot.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-3">
            <span className="font-bold">
              הפתק שלי ({ballot.length}/{MAX_PICKS}):
            </span>
            <div className="flex flex-1 flex-wrap gap-1.5">
              {ballot.map((id) => (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  title="הסרה"
                  className="rounded-full bg-[#2A38D7]/15 px-2.5 py-0.5 text-sm font-medium hover:bg-red-100"
                >
                  {byId.get(id)?.name} ✕
                </button>
              ))}
            </div>
            <button
              onClick={copyBallot}
              className="rounded-xl bg-[#101CAA] px-4 py-2 text-sm font-bold text-white hover:bg-[#2A38D7]"
            >
              {copied ? "הועתק ✓" : "העתקת הרשימה"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
