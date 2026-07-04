import type { Answers, AxisKey, Candidate, RankedCandidate, RepKey } from "./types";
import { AXIS_SHORT, REP_LABELS } from "./questions";

const W_ISSUES = 0.6;
const W_EXPERIENCE = 0.15;
const W_REPS = 0.15;
const W_ORIGIN = 0.1;

function issueScore(c: Candidate, issues: AxisKey[]): number {
  if (issues.length === 0) {
    const all = Object.values(c.axes);
    return all.reduce((a, b) => a + b, 0) / all.length / 5;
  }
  return issues.reduce((sum, k) => sum + (c.axes[k] ?? 0) / 5, 0) / issues.length;
}

function experienceScore(c: Candidate, pref: Answers["experience"]): number {
  const exp = c.attrs.experience;
  if (pref === "any") return 1;
  const experiencedRank: Record<string, number> = {
    mk_current: 1,
    mk_former: 0.9,
    local_gov: 0.6,
    activist: 0.25,
    professional: 0.25,
  };
  const r = experiencedRank[exp] ?? 0.5;
  return pref === "experienced" ? r : 1 - r * 0.85;
}

function repMatch(c: Candidate, rep: RepKey): boolean {
  switch (rep) {
    case "women":
      return c.attrs.gender === "f";
    case "arab_society":
      return c.attrs.sector !== "jewish";
    case "periphery":
      return (
        c.attrs.region === "north" ||
        c.attrs.region === "south" ||
        (c.axes.periphery ?? 0) >= 4
      );
    case "young":
      return c.attrs.age !== null && c.attrs.age <= 42;
    case "lgbtq":
      return (c.axes.gender_lgbtq ?? 0) >= 4;
  }
}

function repsScore(c: Candidate, reps: RepKey[]): number {
  if (reps.length === 0) return 1;
  const matched = reps.filter((r) => repMatch(c, r)).length;
  // Any match counts a lot; full neutrality (0.35) if none matched
  return matched > 0 ? 0.6 + 0.4 * (matched / reps.length) : 0.35;
}

function originScore(c: Candidate, pref: Answers["origin"]): number {
  if (pref === "any") return 1;
  return c.attrs.origin === pref ? 1 : 0.4;
}

export function rankCandidates(candidates: Candidate[], answers: Answers): RankedCandidate[] {
  // Shuffle before scoring so candidates with identical scores appear in a
  // random relative order on every visit, instead of roster order winning ties.
  const ranked = shuffle(candidates).map((c) => {
    const sIssues = issueScore(c, answers.issues);
    const sExp = experienceScore(c, answers.experience);
    const sReps = repsScore(c, answers.reps);
    const sOrigin = originScore(c, answers.origin);
    const score =
      (sIssues * W_ISSUES + sExp * W_EXPERIENCE + sReps * W_REPS + sOrigin * W_ORIGIN) * 100;

    const reasons: string[] = [];
    for (const k of answers.issues) {
      if ((c.axes[k] ?? 0) >= 4) reasons.push(AXIS_SHORT[k]);
    }
    for (const r of answers.reps) {
      if (repMatch(c, r)) reasons.push(`ייצוג: ${REP_LABELS[r]}`);
    }
    if (answers.experience === "experienced" && (c.attrs.experience === "mk_current" || c.attrs.experience === "mk_former")) {
      reasons.push("ניסיון פרלמנטרי");
    }
    if (answers.experience === "fresh" && (c.attrs.experience === "activist" || c.attrs.experience === "professional")) {
      reasons.push("כוח חדש");
    }
    if (answers.origin !== "any" && c.attrs.origin === answers.origin) {
      const originLabel = { meretz: "מרצ", labor: "העבודה", new: "דור חדש" }[answers.origin];
      reasons.push(originLabel);
    }
    return { candidate: c, score, reasons: reasons.slice(0, 4) };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

/** Deterministic-per-visit shuffle for fair "all candidates" browsing */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
