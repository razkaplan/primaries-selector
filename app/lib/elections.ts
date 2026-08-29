import partiesData from "@/data/elections/parties.json";
import partyListsData from "@/data/elections/party_lists.json";
import pollsData from "@/data/elections/polls.json";

export interface Party {
  key: string;
  name_he: string | null;
  name_en: string;
  has_list: boolean;
}

export interface ListCandidate {
  rank: number;
  name: string;
  wikipedia: string | null;
}

export interface PartyList {
  party: string;
  party_section: string;
  candidates: ListCandidate[];
}

export type PollKind =
  | "seat_projection"
  | "voting_intention_pct"
  | "scenario"
  | "arab_voters"
  | "preferred_pm"
  | "coalition"
  | "other";

export interface Poll {
  date_raw: string;
  date: string | null;
  kind: PollKind;
  firm: string | null;
  publisher: string | null;
  sample: number | null;
  results: Record<string, number | string | null>;
  below_threshold_pct?: Record<string, number>;
  others?: number | null;
  gov_bloc?: number | null;
  lead?: number | null;
  scenario?: string;
  source_page: string;
}

export interface PollEvent {
  date_raw: string;
  date: string | null;
  event: string;
}

export const parties = partiesData as Party[];
export const partyLists = partyListsData as PartyList[];
export const polls = (pollsData as { polls: Poll[] }).polls;
export const pollEvents = (pollsData as { events: PollEvent[] }).events;

const partyByKey = new Map(parties.map((p) => [p.key, p]));

/** Decorative, roughly-conventional media colors; not official branding. */
export const PARTY_COLORS: Record<string, string> = {
  likud: "#1e58c8",
  together: "#00aeef",
  yesh_atid: "#00aeef",
  bennett_2026: "#5bc0de",
  rzp: "#2f6b4f",
  otzma_yehudit: "#b8860b",
  blue_white: "#183b8e",
  shas: "#111111",
  utj: "#1a1a6e",
  yisrael_beiteinu: "#7b3fa0",
  raam: "#007a3d",
  joint_list: "#c8102e",
  hadash_taal: "#c8102e",
  hadash: "#c8102e",
  taal: "#a4243b",
  balad: "#f28c28",
  democrats: "#d92731",
  labor: "#d92731",
  meretz: "#69b342",
  yashar: "#0e7c7b",
  zionist_home: "#e87722",
  unity: "#c99700",
  amcha_yisrael: "#6b8e23",
  reservists: "#64748b",
  new_hope: "#33658a",
  noam: "#3d348b",
};

/** Hebrew labels for non-party result columns (question polls, PM polls). */
const RESULT_LABELS_HE: Record<string, string> = {
  netanyahu: "נתניהו",
  bennett: "בנט",
  lapid: "לפיד",
  gantz: "גנץ",
  eisenkot: "איזנקוט",
  golan: "גולן",
  lieberman: "ליברמן",
  segalovitz: "סגלוביץ'",
  would_like: "בעד",
  would_dislike: "נגד",
  undecided: "לא הכריעו",
  don_t_know: "לא יודעים",
  other: "אחר",
  others: "אחרות",
  none: "אף אחד",
  neither: "אף אחד מהם",
};

export function partyName(key: string): string {
  // strip only the _2/_3 duplicate-column suffix (keep e.g. bennett_2026)
  const base = key.replace(/_\d$/, "");
  const p = partyByKey.get(key) ?? partyByKey.get(base);
  if (p) return p.name_he ?? p.name_en;
  if (RESULT_LABELS_HE[base]) return RESULT_LABELS_HE[base];
  return base.replace(/_/g, " ");
}

export function partyColor(key: string): string {
  return PARTY_COLORS[key.replace(/_\d$/, "")] ?? "#9ca3af";
}

export const seatPolls = polls.filter((p) => p.kind === "seat_projection");

export function pollYear(p: Poll): string {
  return p.date ? p.date.slice(0, 4) : "לא מתוארך";
}

/** Mean seats per party over seat-projection polls since `sinceISO`
 * (party counted only in polls that include it). */
export function seatAverages(sinceISO: string): { key: string; avg: number; n: number }[] {
  const sums = new Map<string, { total: number; n: number }>();
  let used = 0;
  for (const p of seatPolls) {
    if (!p.date || p.date < sinceISO) continue;
    used++;
    for (const [k, v] of Object.entries(p.results)) {
      if (typeof v !== "number") continue;
      const s = sums.get(k) ?? { total: 0, n: 0 };
      s.total += v;
      s.n += 1;
      sums.set(k, s);
    }
  }
  return [...sums.entries()]
    .map(([key, s]) => ({ key, avg: s.total / s.n, n: used }))
    .sort((a, b) => b.avg - a.avg);
}

/** Union of result keys in a set of polls, ordered by mean value desc. */
export function resultKeys(list: Poll[]): string[] {
  const sums = new Map<string, { total: number; n: number }>();
  for (const p of list) {
    for (const [k, v] of Object.entries(p.results)) {
      const s = sums.get(k) ?? { total: 0, n: 0 };
      if (typeof v === "number") {
        s.total += v;
        s.n += 1;
      }
      sums.set(k, s);
    }
  }
  return [...sums.entries()]
    .sort((a, b) => (b[1].n ? b[1].total / b[1].n : 0) - (a[1].n ? a[1].total / a[1].n : 0))
    .map(([k]) => k);
}

export function fmtDate(iso: string | null, raw: string): string {
  if (!iso) return raw;
  const d = new Date(iso + "T00:00:00Z");
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(d);
}
