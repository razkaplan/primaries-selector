"use client";

import { useState } from "react";
import type { Answers, AxisKey, RepKey } from "@/lib/types";
import {
  AXIS_LABELS,
  ELECTABILITY_OPTIONS,
  EXPERIENCE_OPTIONS,
  ORIGIN_OPTIONS,
  REP_LABELS,
} from "@/lib/questions";

const AXIS_KEYS = Object.keys(AXIS_LABELS) as AxisKey[];
const REP_KEYS = Object.keys(REP_LABELS) as RepKey[];

export default function Quiz({ onDone }: { onDone: (a: Answers) => void }) {
  const [step, setStep] = useState(0);
  const [issues, setIssues] = useState<AxisKey[]>([]);
  const [experience, setExperience] = useState<Answers["experience"] | null>(null);
  const [reps, setReps] = useState<RepKey[]>([]);
  const [origin, setOrigin] = useState<Answers["origin"] | null>(null);
  const [electability, setElectability] = useState<Answers["electability"] | null>(null);
  const [credibility, setCredibility] = useState(false);

  const steps = 5;

  function toggleIssue(k: AxisKey) {
    setIssues((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : prev.length < 3 ? [...prev, k] : prev
    );
  }
  function toggleRep(k: RepKey) {
    setReps((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  }

  const canNext =
    step === 0
      ? issues.length > 0
      : step === 1
        ? experience !== null
        : step === 2
          ? true
          : step === 3
            ? origin !== null
            : electability !== null;

  function next() {
    if (step < steps - 1) setStep(step + 1);
    else
      onDone({
        issues,
        experience: experience ?? "any",
        reps,
        origin: origin ?? "any",
        electability: electability ?? "none",
        credibility,
      });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* progress */}
      <div className="mb-8 flex items-center gap-2">
        {Array.from({ length: steps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-[#2A38D7]" : "bg-neutral-200"
            }`}
          />
        ))}
        <span className="mr-2 text-sm text-neutral-500">
          {step + 1}/{steps}
        </span>
      </div>

      {step === 0 && (
        <section>
          <h2 className="text-2xl font-bold">אילו נושאים הכי חשובים לכם?</h2>
          <p className="mt-1 text-neutral-500">בחרו עד שלושה נושאים לפי סדר חשיבות, הראשון מקבל את המשקל הגבוה ביותר ({issues.length}/3)</p>
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AXIS_KEYS.map((k) => {
              const active = issues.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => toggleIssue(k)}
                  className={`rounded-xl border px-4 py-3 text-right text-sm font-medium transition-colors ${
                    active
                      ? "border-[#2A38D7] bg-[#2A38D7]/10"
                      : "border-neutral-200 bg-white hover:border-neutral-400"
                  } ${!active && issues.length >= 3 ? "opacity-50" : ""}`}
                >
                  {active && (
                    <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2A38D7] text-xs font-bold text-white">
                      {issues.indexOf(k) + 1}
                    </span>
                  )}
                  {AXIS_LABELS[k]}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 1 && (
        <section>
          <h2 className="text-2xl font-bold">ניסיון או התחדשות?</h2>
          <p className="mt-1 text-neutral-500">איזה סוג של מועמדים הייתם רוצים לראות ברשימה?</p>
          <div className="mt-6 space-y-2">
            {EXPERIENCE_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setExperience(o.value)}
                className={`w-full rounded-xl border px-4 py-3 text-right transition-colors ${
                  experience === o.value
                    ? "border-[#2A38D7] bg-[#2A38D7]/10"
                    : "border-neutral-200 bg-white hover:border-neutral-400"
                }`}
              >
                <div className="font-bold">{o.label}</div>
                <div className="text-sm text-neutral-500">{o.desc}</div>
              </button>
            ))}
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={credibility}
              onChange={(e) => setCredibility(e.target.checked)}
              className="mt-0.5 accent-[#2A38D7]"
            />
            <span>
              <span className="font-bold">תוספת רצינות:</span> תנו משקל גבוה יותר להצהרות
              שמגובות ברקורד ביצוע ציבורי מוכח (כנסת, שלטון מקומי, הובלת ארגונים), כי קל
              להצהיר וקשה לממש
            </span>
          </label>
        </section>
      )}

      {step === 2 && (
        <section>
          <h2 className="text-2xl font-bold">ייצוג ברשימה</h2>
          <p className="mt-1 text-neutral-500">
            חשוב לי לחזק ברשימה ייצוג של... (אפשר לבחור כמה, או לדלג)
          </p>
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {REP_KEYS.map((k) => {
              const active = reps.includes(k);
              return (
                <button
                  key={k}
                  onClick={() => toggleRep(k)}
                  className={`rounded-xl border px-4 py-3 text-right text-sm font-medium transition-colors ${
                    active
                      ? "border-[#2A38D7] bg-[#2A38D7]/10"
                      : "border-neutral-200 bg-white hover:border-neutral-400"
                  }`}
                >
                  {REP_LABELS[k]}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 3 && (
        <section>
          <h2 className="text-2xl font-bold">מאיפה הלב שלכם מגיע?</h2>
          <p className="mt-1 text-neutral-500">
            הדמוקרטים היא איחוד של מרצ, העבודה וכוחות חדשים
          </p>
          <div className="mt-6 space-y-2">
            {ORIGIN_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setOrigin(o.value)}
                className={`w-full rounded-xl border px-4 py-3 text-right transition-colors ${
                  origin === o.value
                    ? "border-[#2A38D7] bg-[#2A38D7]/10"
                    : "border-neutral-200 bg-white hover:border-neutral-400"
                }`}
              >
                <div className="font-bold">{o.label}</div>
                <div className="text-sm text-neutral-500">{o.desc}</div>
              </button>
            ))}
          </div>
        </section>
      )}


      {step === 4 && (
        <section>
          <h2 className="text-2xl font-bold">כוח משיכה אלקטורלי</h2>
          <p className="mt-1 text-neutral-500">
            עד כמה חשוב לכם שהמועמדים יוכלו למשוך קולות למפלגה גם מחוץ למחנה?
          </p>
          <div className="mt-6 space-y-2">
            {ELECTABILITY_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => setElectability(o.value)}
                className={`w-full rounded-xl border px-4 py-3 text-right transition-colors ${
                  electability === o.value
                    ? "border-[#2A38D7] bg-[#2A38D7]/10"
                    : "border-neutral-200 bg-white hover:border-neutral-400"
                }`}
              >
                <div className="font-bold">{o.label}</div>
                <div className="text-sm text-neutral-500">{o.desc}</div>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-400">
            מדד הנוכחות הציבורית מחושב מנתונים מדידים בלבד: צפיות בוויקיפדיה, עוקבים
            ברשתות ונוכחות בחדשות. הוא איננו סקר ואיננו תחזית.
          </p>
        </section>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="rounded-xl px-4 py-2 text-neutral-500 hover:text-neutral-800 disabled:invisible"
        >
          → חזרה
        </button>
        <button
          onClick={next}
          disabled={!canNext}
          className="rounded-xl bg-[#101CAA] px-8 py-3 font-bold text-white transition-colors hover:bg-[#2A38D7] disabled:bg-neutral-300"
        >
          {step === steps - 1 ? "הצגת ההתאמות שלי" : "המשך"}
        </button>
      </div>
    </div>
  );
}
