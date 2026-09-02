import metaData from "@/data/elections/meta.json";
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
  name_he: string | null;
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
export const meta = metaData as { scraped_at: string; sources: Record<string, string> };

export function sourceUrl(sourcePage: string): string {
  return meta.sources[sourcePage] ?? meta.sources["polls_2026"];
}

const partyByKey = new Map(parties.map((p) => [p.key, p]));

/** Entity-anchored, roughly-conventional media colors; not official branding.
 * Identity is never color-alone: every mark carries the party name label.
 * Near-identical hues that co-appear were separated (validated for adjacent
 * CVD confusion with the dataviz palette checker). */
export const PARTY_COLORS: Record<string, string> = {
  likud: "#1e58c8",
  together: "#0096c7",
  yesh_atid: "#0096c7",
  bennett_2026: "#5bc0de",
  rzp: "#124e32",
  otzma_yehudit: "#d19a00",
  blue_white: "#183b8e",
  shas: "#111111",
  utj: "#1a1a6e",
  yisrael_beiteinu: "#7b3fa0",
  raam: "#00934a",
  joint_list: "#d7263d",
  hadash_taal: "#8e2043",
  hadash: "#8e2043",
  taal: "#a4243b",
  balad: "#f28c28",
  democrats: "#d92731",
  labor: "#d92731",
  meretz: "#69b342",
  yashar: "#0e7c7b",
  zionist_home: "#e87722",
  unity: "#c99700",
  amcha_yisrael: "#c05299",
  reservists: "#64748b",
  new_hope: "#33658a",
  noam: "#3d348b",
  israel_first: "#8d6e63",
};

/** Hebrew labels for non-party result columns (question polls, PM polls,
 * hypothetical parties in scenario polls). */
const RESULT_LABELS_HE: Record<string, string> = {
  israel_first: "ישראל תחילה",
  netanyahu: "נתניהו",
  bennett: "בנט",
  naftali_bennett: "נפתלי בנט",
  lapid: "לפיד",
  gantz: "גנץ",
  eisenkot: "איזנקוט",
  golan: "גולן",
  lieberman: "ליברמן",
  segalovitz: "סגלוביץ'",
  barkat: "ברקת",
  cohen: "כהן",
  gallant: "גלנט",
  hendel: "הנדל",
  levin: "לוין",
  simchi: "שמחי",
  tropper: "טרופר",
  winter: "וינטר",
  bennett_cohen: "בנט–כהן",
  hendel_bennett: "הנדל–בנט",
  likud_b: "ליכוד ב'",
  oy_rz: "עוצמה–הציונות הדתית",
  nep: "הכלכלית החדשה",
  beyachad_natzliach: "ביחד נצליח",
  tov_haddad_deri: "שם טוב–חדאד–דרעי",
  protest_party: "מפלגת מחאה",
  right_wing_liberal_party: "מפלגה ליברלית-ימנית",
  a_new_right_wing_party: "מפלגת ימין חדשה",
  bennett_party: "מפלגת בנט",
  hendel_party: "מפלגת הנדל",
  other_jewish_parties: "מפלגות יהודיות אחרות",
  would_like: "בעד",
  would_dislike: "נגד",
  undecided: "לא הכריעו",
  don_t_know: "לא יודעים",
  no_answer: "ללא תשובה",
  absent: "לא ישתתפו",
  other: "אחר",
  others: "אחרות",
  none: "אף אחד",
  neither: "אף אחד מהם",
  combined_yes: "בעד (משוקלל)",
  combined_no: "נגד (משוקלל)",
  yes_in_any_coalition: "בעד בכל קואליציה",
  only_in_center_left_coalition: "רק בקואליציית מרכז-שמאל",
  oppose_any_government: "נגד בכל ממשלה",
  oppose_but_support_govt_from_outside: "נגד, אך תמיכה מבחוץ",
  cross_bloc: "חוצת גושים",
  cross_bloc_w_arabs: "חוצת גושים עם הערבים",
  cross_bloc_w_haredi: "חוצת גושים עם החרדים",
  cross_bloc_w_o_extremists: "חוצת גושים בלי הקיצוניים",
  other_cross_bloc: "חוצת גושים אחרת",
  distinct_bloc: "גוש מובחן",
  right_wing_bloc: "גוש הימין",
  right_wing_w_opposition_party: "ימין עם מפלגת אופוזיציה",
  opposition_w_arabs: "אופוזיציה עם הערבים",
  opposition_w_coalition_party: "אופוזיציה עם מפלגת קואליציה",
  opposition: "האופוזיציה",
  gov_total: "סך הקואליציה",
  now: "עכשיו",
  at_the_end_of_the_war: "בסוף המלחמה",
  november_2026_as_scheduled: "בנובמבר 2026 כמתוכנן",
  two_lists: "שתי רשימות",
  three_lists: "שלוש רשימות",
  same_party: "אותה מפלגה",
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

/** Parties of the outgoing (25th-Knesset) coalition at dissolution, matching
 * the polls' own "Gov." bloc column. New Hope merged into Likud. */
export const OUTGOING_COALITION = new Set([
  "likud",
  "shas",
  "utj",
  "otzma_yehudit",
  "rzp",
  "noam",
]);

/** Round fractional seat averages to whole seats summing to `total`
 * (largest-remainder / Hare). */
export function roundSeats(
  averages: { key: string; avg: number }[],
  total = 120,
): { key: string; seats: number }[] {
  const sum = averages.reduce((s, a) => s + a.avg, 0);
  if (sum <= 0) return averages.map((a) => ({ key: a.key, seats: 0 }));
  const scaled = averages.map((a) => ({ key: a.key, exact: (a.avg / sum) * total }));
  const out = scaled.map((s) => ({ key: s.key, seats: Math.floor(s.exact) }));
  let left = total - out.reduce((s, o) => s + o.seats, 0);
  const byRemainder = scaled
    .map((s, i) => ({ i, r: s.exact - Math.floor(s.exact) }))
    .sort((a, b) => b.r - a.r);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    out[i].seats += 1;
    left -= 1;
  }
  return out;
}

export interface TrendSeries {
  key: string;
  name: string;
  color: string;
  points: { date: string; value: number }[];
}

/** 14-day trailing averages sampled weekly over 2026, for the `topN`
 * parties by latest average, the data behind the trend chart. */
export function seatTrends(topN = 8): TrendSeries[] {
  const year = seatPolls.filter((p) => p.date && p.date >= "2026-01-01");
  if (year.length === 0) return [];
  const last = year[0].date!;
  const first = year[year.length - 1].date!;
  const keys = seatAverages(windowBack(last, 30))
    .slice(0, topN)
    .map((a) => a.key);
  const sampleDates: string[] = [];
  for (let d = new Date(first + "T00:00:00Z"); d.toISOString().slice(0, 10) <= last; d.setUTCDate(d.getUTCDate() + 7)) {
    sampleDates.push(d.toISOString().slice(0, 10));
  }
  if (sampleDates[sampleDates.length - 1] !== last) sampleDates.push(last);
  return keys.map((key) => {
    const points: { date: string; value: number }[] = [];
    for (const date of sampleDates) {
      const from = windowBack(date, 14);
      let total = 0;
      let n = 0;
      for (const p of year) {
        if (!p.date || p.date > date || p.date < from) continue;
        const v = p.results[key];
        if (typeof v === "number") {
          total += v;
          n += 1;
        }
      }
      if (n > 0) points.push({ date, value: total / n });
    }
    return { key, name: partyName(key), color: partyColor(key), points };
  });
}

function windowBack(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
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
