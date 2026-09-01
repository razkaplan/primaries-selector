"use client";

import { useState } from "react";
import Link from "next/link";
import type { Answers, Candidate } from "@/lib/types";
import Quiz from "@/components/Quiz";
import Results from "@/components/Results";
import candidatesData from "@/data/candidates.json";

const candidates = candidatesData as unknown as Candidate[];

type Stage = "intro" | "quiz" | "results";

export default function PrimariesTool() {
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<Answers | null>(null);

  return (
    <main className="min-h-screen">
      <header className="border-b border-line bg-paper/90">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            onClick={() => setStage("intro")}
            className="font-display text-xl tracking-tight"
          >
            בוחרים<span className="text-coral">בפריימריז</span>
          </button>
          <span className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-full bg-brand-wash px-3 py-1.5 text-xs font-bold text-brand-deep transition-colors hover:bg-brand hover:text-white"
            >
              ← לבחירות 2026: כל המפלגות והסקרים
            </Link>
            <span className="hidden text-xs text-ink-faint sm:inline">
              כלי עזר לא רשמי
            </span>
          </span>
        </div>
      </header>

      {stage === "intro" && (
        <section className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            את מי לסמן בפתק?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
            {candidates.length} מועמדות ומועמדים מתמודדים בפריימריז של הדמוקרטים.
            ענו על 4 שאלות קצרות וקבלו דירוג אישי המבוסס על המצע, קורות החיים
            והפעילות הציבורית של כל מועמד ומועמדת, ממקורות פומביים.
          </p>
          <button
            onClick={() => setStage("quiz")}
            className="mt-8 rounded-3xl bg-[#3d1ebe] px-10 py-4 text-lg font-bold text-white transition-colors hover:bg-[#5a31f4]"
          >
            מתחילים ←
          </button>
          <div className="mx-auto mt-12 max-w-xl rounded-3xl border border-line bg-card p-5 text-right text-sm leading-relaxed text-ink-soft">
            <p className="font-bold text-ink">שקיפות מלאה:</p>
            <ul className="mt-2 list-disc space-y-1 pr-5">
              <li>הכלי אינו קשור למפלגת הדמוקרטים ואינו ממליץ על מועמדים.</li>
              <li>
                המידע נאסף מהאתר הרשמי של המפלגה, מאתרי המועמדים וממקורות חדשותיים
                פומביים.
              </li>
              <li>ייתכנו אי-דיוקים, בדקו בעצמכם לפני ההצבעה.</li>
              <li>שום נתון אישי שלכם לא נשמר או נשלח לשרת.</li>
            </ul>
          </div>
        </section>
      )}

      {stage === "quiz" && (
        <Quiz
          onDone={(a) => {
            setAnswers(a);
            setStage("results");
          }}
        />
      )}

      {stage === "results" && answers && (
        <Results candidates={candidates} answers={answers} onRestart={() => setStage("quiz")} />
      )}

      <footer className="border-t border-line py-6 text-center text-xs text-ink-faint">
        נבנה באהבה לדמוקרטיה • המידע על המועמדים מגיע מ
        <a
          href="https://democrats.org.il/candidates/"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          האתר הרשמי
        </a>
        , מאתרי המועמדים וממקורות פומביים
        <span className="mt-1 block">
          הקוד והמודל פתוחים לביקורת ולהצעות:{" "}
          <a
            href="https://github.com/razkaplan/primaries-selector"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </span>
        <span className="mt-1 block" dir="ltr">
          Made with &lt;3 by{" "}
          <a
            href="https://il.linkedin.com/in/razkaplan"
            className="underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Raz Kaplan
          </a>
        </span>
      </footer>
    </main>
  );
}
