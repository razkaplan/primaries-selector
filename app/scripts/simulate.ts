/**
 * Persona simulation: run the questionnaire for 30 stratified personas and
 * measure whether top-10 exposure is structurally biased relative to the
 * roster, overall and for the neutral subset (personas with no representation,
 * experience, or origin preferences, i.e. pure issue-driven rankings).
 *
 * Usage: npx tsx scripts/simulate.ts [weightsJson]
 *   weightsJson example: '{"issues":0.6,"experience":0.15,"reps":0.15,"origin":0.1,"electability":0.15}'
 */
import candidatesData from "../data/candidates.json";
import { scoreCandidate, DEFAULT_WEIGHTS } from "../lib/scoring";
import type { Answers, AxisKey, Candidate, RepKey, Weights } from "../lib/types";

const candidates = candidatesData as unknown as Candidate[];

const AXES: AxisKey[] = [
  "peace_diplomacy", "religion_state", "socioeconomic", "democracy_law",
  "arab_jewish", "climate_env", "periphery", "security", "gender_lgbtq",
  "education_health",
];

/** 30 stratified personas.
 * - Personas 0-9   : "neutral" issue voters, one axis each, no other prefs.
 * - Personas 10-19 : two issues + experience preference split 5 experienced / 5 fresh.
 * - Personas 20-29 : three issues + representation and origin preferences.
 * Electability: 10 none, 10 some, 10 high, interleaved across all blocks.
 */
export function buildPersonas(): Answers[] {
  const personas: Answers[] = [];
  const elect = (i: number) => (["none", "some", "high"] as const)[i % 3];

  // Block A: TRULY neutral single-issue voters, one per axis. Everything
  // except the issue is off so this subset isolates issue-scoring bias.
  for (let i = 0; i < 10; i++) {
    personas.push({
      issues: [AXES[i]],
      experience: "any",
      reps: [],
      origin: "any",
      electability: "none",
    });
  }
  // Block B: adjacent-axis pairs + experience pref
  for (let i = 0; i < 10; i++) {
    personas.push({
      issues: [AXES[i], AXES[(i + 3) % 10]],
      experience: i < 5 ? "experienced" : "fresh",
      reps: [],
      origin: "any",
      electability: elect(i + 1),
    });
  }
  // Block C: triples + representation + origin
  const repSets: RepKey[][] = [
    ["women"], ["arab_society"], ["periphery"], ["young"], ["lgbtq"],
    ["women", "arab_society"], ["women", "young"], ["periphery", "arab_society"],
    ["women", "periphery", "young"], [],
  ];
  const origins = ["meretz", "labor", "new", "any", "meretz", "labor", "new", "any", "meretz", "labor"] as const;
  for (let i = 0; i < 10; i++) {
    personas.push({
      issues: [AXES[i], AXES[(i + 1) % 10], AXES[(i + 5) % 10]],
      experience: "any",
      reps: repSets[i],
      origin: origins[i],
      electability: elect(i + 2),
    });
  }
  return personas;
}

function gini(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  const n = v.length;
  const sum = v.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let cum = 0;
  for (let i = 0; i < n; i++) cum += (2 * (i + 1) - n - 1) * v[i];
  return cum / (n * sum);
}

interface GroupDef {
  name: string;
  member: (c: Candidate) => boolean;
}

const GROUPS: GroupDef[] = [
  { name: "women", member: (c) => c.attrs.gender === "f" },
  { name: "arab_druze_other", member: (c) => c.attrs.sector !== "jewish" },
  { name: "origin_new", member: (c) => c.attrs.origin === "new" },
  { name: "origin_meretz", member: (c) => c.attrs.origin === "meretz" },
  { name: "origin_labor", member: (c) => c.attrs.origin === "labor" },
  { name: "mk_current_or_former", member: (c) => c.attrs.experience === "mk_current" || c.attrs.experience === "mk_former" },
  { name: "civil_society", member: (c) => c.attrs.experience === "activist" || c.attrs.experience === "professional" },
];

function analyze(personas: Answers[], weights: Weights, label: string) {
  const TOP = 10;
  const exposure = new Map<string, number>(candidates.map((c) => [c.id, 0]));
  const firstPlace = new Map<string, number>();

  for (const p of personas) {
    const ranked = candidates
      .map((c) => ({ c, s: scoreCandidate(c, p, weights) }))
      // deterministic tie-break by id so the sim is reproducible
      .sort((a, b) => b.s - a.s || a.c.id.localeCompare(b.c.id));
    ranked.slice(0, TOP).forEach(({ c }) => exposure.set(c.id, (exposure.get(c.id) ?? 0) + 1));
    const top = ranked[0].c.id;
    firstPlace.set(top, (firstPlace.get(top) ?? 0) + 1);
  }

  const slots = personas.length * TOP;
  const rows = GROUPS.map((g) => {
    const members = candidates.filter(g.member);
    const rosterShare = members.length / candidates.length;
    const got = members.reduce((s, c) => s + (exposure.get(c.id) ?? 0), 0);
    const exposureShare = got / slots;
    return {
      group: g.name,
      roster: +(rosterShare * 100).toFixed(1),
      exposure: +(exposureShare * 100).toFixed(1),
      ratio: +(exposureShare / rosterShare).toFixed(2),
    };
  });

  const exposures = [...exposure.values()];
  const zeroExposure = exposures.filter((e) => e === 0).length;
  const g = +gini(exposures).toFixed(3);

  console.log(`\n=== ${label} (${personas.length} personas) ===`);
  console.table(rows);
  console.log(`gini=${g}  never-in-top10=${zeroExposure}/${candidates.length}`);
  const topHogs = [...exposure.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([id, n]) => `${candidates.find((c) => c.id === id)?.name}:${n}`);
  console.log("most exposed:", topHogs.join(" | "));
  return { rows, gini: g, zeroExposure };
}

const weights: Weights = process.argv[2] ? JSON.parse(process.argv[2]) : DEFAULT_WEIGHTS;
console.log("weights:", weights);
const personas = buildPersonas();
const all = analyze(personas, weights, "ALL PERSONAS");
const neutral = analyze(personas.slice(0, 10), weights, "NEUTRAL SUBSET (issue-only)");

// Machine-readable summary for the tuning loop
console.log("\nJSON_SUMMARY " + JSON.stringify({ all: all.rows, neutral: neutral.rows, giniAll: all.gini, giniNeutral: neutral.gini, zeroAll: all.zeroExposure }));
