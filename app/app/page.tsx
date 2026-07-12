"use client";

import { useState } from "react";
import type { Answers, Candidate } from "@/lib/types";
import Quiz from "@/components/Quiz";
import Results from "@/components/Results";
import candidatesData from "@/data/candidates.json";

const candidates = candidatesData as unknown as Candidate[];

type Stage = "intro" | "quiz" | "results";

export default function Home() {
  const [stage, setStage] = useState<Stage>("intro");
  const [answers, setAnswers] = useState<Answers | null>(null);

  return (
    <main className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            onClick={() => setStage("intro")}
            className="text-lg font-black tracking-tight"
          >
            בוחרים<span className="text-[#D92731]">בפריימריז</span>
          </button>
          <span className="text-xs text-neutral-400">כלי עזר לא רשמי</span>
        </div>
      </header>

      {stage === "intro" && (
        <section className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            את מי לסמן בפתק?
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-neutral-600">
            {candidates.length} מועמדות ומועמדים מתמודדים בפריימריז של הדמוקרטים.
            ענו על 4 שאלות קצרות וקבלו דירוג אישי המבוסס על המצע, קורות החיים
            והפעילות הציבורית של כל מועמד ומועמדת, ממקורות פומביים.
          </p>
          <button
            onClick={() => setStage("quiz")}
            className="mt-8 rounded-2xl bg-[#101CAA] px-10 py-4 text-lg font-bold text-white transition-colors hover:bg-[#2A38D7]"
          >
            מתחילים ←
          </button>
          <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-neutral-200 bg-white p-5 text-right text-sm leading-relaxed text-neutral-500">
            <p className="font-bold text-neutral-700">שקיפות מלאה:</p>
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

      <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
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
