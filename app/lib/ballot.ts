import type { Answers, Candidate, RankedCandidate } from "./types";
import type { AxisKey } from "./types";

/**
 * Graph layer: candidates as nodes, edges weighted by cosine similarity over
 * their normalized issue-axis vectors plus categorical attribute overlap.
 * Used by the smart-ballot builder to avoid recommending 10 near-identical
 * candidates.
 */
export function similarity(a: Candidate, b: Candidate): number {
  const keys = Object.keys(a.axes) as AxisKey[];
  let dot = 0,
    na = 0,
    nb = 0;
  for (const k of keys) {
    const va = a.axes_pct?.[k] ?? (a.axes[k] ?? 0) / 5;
    const vb = b.axes_pct?.[k] ?? (b.axes[k] ?? 0) / 5;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  const cos = na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  // categorical overlap: same experience class / origin / sector nudge
  // similarity up so the diversifier also spreads across backgrounds
  const cat =
    (a.attrs.experience === b.attrs.experience ? 1 : 0) +
    (a.attrs.origin === b.attrs.origin ? 1 : 0) +
    (a.attrs.sector === b.attrs.sector ? 1 : 0);
  return 0.8 * cos + 0.2 * (cat / 3);
}

/**
 * Maximal Marginal Relevance ballot: greedily pick `size` candidates
 * maximizing lambda * match-score - (1 - lambda) * max-similarity-to-selected.
 * lambda=1 reduces to "take the top 10"; 0.75 keeps fit dominant while
 * penalizing redundancy (a submodular-style diversification).
 */
export function smartBallot(
  ranked: RankedCandidate[],
  size = 10,
  lambda = 0.75
): RankedCandidate[] {
  if (ranked.length === 0) return [];
  const maxScore = Math.max(...ranked.map((r) => r.score)) || 1;
  const pool = [...ranked];
  const picked: RankedCandidate[] = [];
  while (picked.length < size && pool.length > 0) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < pool.length; i++) {
      const rel = pool[i].score / maxScore;
      const maxSim = picked.length
        ? Math.max(...picked.map((p) => similarity(pool[i].candidate, p.candidate)))
        : 0;
      const val = lambda * rel - (1 - lambda) * maxSim;
      if (val > bestVal) {
        bestVal = val;
        bestIdx = i;
      }
    }
    picked.push(pool.splice(bestIdx, 1)[0]);
  }
  return picked;
}

/** Human-readable Hebrew note on what the smart ballot balanced. */
export function ballotComposition(picked: RankedCandidate[], _answers: Answers): string {
  const cs = picked.map((p) => p.candidate);
  const women = cs.filter((c) => c.attrs.gender === "f").length;
  const nonJewish = cs.filter((c) => c.attrs.sector !== "jewish").length;
  const mks = cs.filter(
    (c) => c.attrs.experience === "mk_current" || c.attrs.experience === "mk_former"
  ).length;
  const fresh = cs.length - mks;
  return `${women} נשים · ${nonJewish} מהחברה הערבית/דרוזית · ${mks} עם ניסיון פרלמנטרי · ${fresh} כוחות חדשים`;
}
