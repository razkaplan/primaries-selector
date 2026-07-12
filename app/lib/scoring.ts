import type {
  Answers,
  AxisKey,
  Candidate,
  RankedCandidate,
  RepKey,
  Weights,
} from "./types";
import { AXIS_SHORT, REP_LABELS } from "./questions";

/**
 * Base weights. Electability only participates when the voter opts in
 * (pref "high" = full base weight, "some" = half, "none" = 0); the active
 * weights are then normalized to sum to 1, so opting out redistributes
 * proportionally instead of penalizing anyone.
 */
/**
 * Weights follow the literature review (docs/political-science-review.md):
 * issue congruence stays dominant (55%); electability enters opt-in at a
 * modest base (10%) because closed-list evidence shows only modest party-level
 * returns to individual popularity.
 */
export const DEFAULT_WEIGHTS: Weights = {
  issues: 0.55,
  experience: 0.15,
  reps: 0.15,
  origin: 0.1,
  electability: 0.1,
};

/**
 * Blended issue score: 50% absolute centrality (axis/5) + 50% percentile rank
 * within the roster on that axis. The percentile half equalizes discriminative
 * power across axes: on a crowded axis like democracy_law (roster mean 3.3)
 * raw scores barely separate candidates, while on a sparse axis like
 * religion_state (mean 1.3) they separate a lot. Pure raw scoring would make
 * the same "4" mean very different things depending on the axis chosen.
 */
function axisValue(c: Candidate, k: AxisKey): number {
  const raw = (c.axes[k] ?? 0) / 5;
  const pct = c.axes_pct?.[k];
  return pct === undefined ? raw : 0.8 * raw + 0.2 * pct;
}

/**
 * Track-record coefficient ("תוספת רצינות"): how much verifiable public
 * delivery backs the candidate's declared agenda. Knesset service and NGO /
 * civil-society leadership both count as public track record (the categories
 * come from the candidate's documented roles, not self-description). Applied
 * only when the voter opts in, as a partial discount on the issue component:
 * declared-but-unverified agendas keep at least 75% of their weight.
 */
export function trackRecord(c: Candidate): number {
  const base: Record<string, number> = {
    mk_current: 1.0,
    mk_former: 0.95,
    local_gov: 0.8,
    activist: 0.7,
    professional: 0.5,
  };
  let t = base[c.attrs.experience] ?? 0.6;
  if (c.electability_signals?.prior_national_list) t = Math.min(1, t + 0.05);
  return t;
}

/** Selection order matters: 1st/2nd/3rd issue weighted 50/30/20 (or 60/40, or 100). */
const ISSUE_RANK_WEIGHTS: Record<number, number[]> = {
  1: [1],
  2: [0.6, 0.4],
  3: [0.5, 0.3, 0.2],
};

function issueScore(c: Candidate, issues: AxisKey[]): number {
  if (issues.length === 0) {
    const all = (Object.keys(c.axes) as AxisKey[]).map((k) => axisValue(c, k));
    return all.reduce((a, b) => a + b, 0) / all.length;
  }
  const rw = ISSUE_RANK_WEIGHTS[issues.length] ?? issues.map(() => 1 / issues.length);
  return issues.reduce((sum, k, i) => sum + axisValue(c, k) * rw[i], 0);
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

export function repMatch(c: Candidate, rep: RepKey): boolean {
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
  return matched > 0 ? 0.6 + 0.4 * (matched / reps.length) : 0.35;
}

function originScore(c: Candidate, pref: Answers["origin"]): number {
  if (pref === "any") return 1;
  return c.attrs.origin === pref ? 1 : 0.4;
}

function electabilityScore(c: Candidate): number {
  // null (no data) scores neutral 0.5 rather than 0, so thin data
  // doesn't bury a candidate when the voter opts into electability.
  if (c.electability === null || c.electability === undefined) return 0.5;
  // Shrink 30% toward the neutral midpoint: public-reach metrics are inflated
  // by incumbency (coverage begets coverage), so raw percentile gaps would
  // over-reward already-famous candidates (see docs/political-science-review.md).
  return 0.5 + (c.electability / 5 - 0.5) * 0.7;
}

/** Compute the effective, normalized weights for a given answer set. */
export function effectiveWeights(answers: Answers, base: Weights = DEFAULT_WEIGHTS): Weights {
  const electFactor = answers.electability === "high" ? 1 : answers.electability === "some" ? 0.5 : 0;
  // A component the voter is indifferent about scores every candidate
  // identically, so keeping it in the mix only compresses the displayed
  // range (the "everyone lands at 60-80%" effect). Indifferent components
  // are removed and their weight redistributed to what the voter DID answer.
  const raw = {
    issues: base.issues,
    experience: answers.experience === "any" ? 0 : base.experience,
    reps: answers.reps.length === 0 ? 0 : base.reps,
    origin: answers.origin === "any" ? 0 : base.origin,
    electability: base.electability * electFactor,
  };
  const sum = raw.issues + raw.experience + raw.reps + raw.origin + raw.electability;
  return {
    issues: raw.issues / sum,
    experience: raw.experience / sum,
    reps: raw.reps / sum,
    origin: raw.origin / sum,
    electability: raw.electability / sum,
  };
}

/** Pure per-candidate score in 0..100 for a given answer set. Deterministic. */
export function scoreCandidate(
  c: Candidate,
  answers: Answers,
  base: Weights = DEFAULT_WEIGHTS
): number {
  const w = effectiveWeights(answers, base);
  const cred = answers.credibility ? 0.75 + 0.25 * trackRecord(c) : 1;
  return (
    (issueScore(c, answers.issues) * cred * w.issues +
      experienceScore(c, answers.experience) * w.experience +
      repsScore(c, answers.reps) * w.reps +
      originScore(c, answers.origin) * w.origin +
      electabilityScore(c) * w.electability) *
    100
  );
}

export function rankCandidates(
  candidates: Candidate[],
  answers: Answers,
  base: Weights = DEFAULT_WEIGHTS
): RankedCandidate[] {
  // Shuffle before scoring so candidates with identical scores appear in a
  // random relative order on every visit, instead of roster order winning ties.
  const ranked = shuffle(candidates).map((c) => {
    const score = scoreCandidate(c, answers, base);
    const reasons: string[] = [];
    for (const k of answers.issues) {
      if ((c.axes[k] ?? 0) >= 4) reasons.push(AXIS_SHORT[k]);
    }
    for (const r of answers.reps) {
      if (repMatch(c, r)) reasons.push(`ייצוג: ${REP_LABELS[r]}`);
    }
    if (
      answers.experience === "experienced" &&
      (c.attrs.experience === "mk_current" || c.attrs.experience === "mk_former")
    ) {
      reasons.push("ניסיון פרלמנטרי");
    }
    if (
      answers.experience === "fresh" &&
      (c.attrs.experience === "activist" || c.attrs.experience === "professional")
    ) {
      reasons.push("כוח חדש");
    }
    if (answers.origin !== "any" && c.attrs.origin === answers.origin) {
      const originLabel = { meretz: "מרצ", labor: "העבודה", new: "דור חדש" }[answers.origin];
      reasons.push(originLabel);
    }
    if (answers.electability !== "none" && (c.electability ?? 0) >= 4) {
      reasons.push("נוכחות ציבורית רחבה");
    }
    if (answers.credibility && trackRecord(c) >= 0.9) {
      reasons.push("רקורד ביצוע מוכח");
    }
    return { candidate: c, score, reasons: reasons.slice(0, 4) };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

/** Fisher-Yates shuffle used for fair tie-breaking and random browsing order */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
