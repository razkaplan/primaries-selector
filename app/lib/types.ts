export type AxisKey =
  | "peace_diplomacy"
  | "religion_state"
  | "socioeconomic"
  | "democracy_law"
  | "arab_jewish"
  | "climate_env"
  | "periphery"
  | "security"
  | "gender_lgbtq"
  | "education_health";

export type Experience =
  | "mk_current"
  | "mk_former"
  | "local_gov"
  | "activist"
  | "professional";

export type Origin = "meretz" | "labor" | "new";

export interface ElectabilitySignals {
  wikipedia_monthly_views: number | null;
  followers_total: number | null;
  news_domains: number | null;
  prior_national_list: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  bio: string;
  photo: string | null;
  website: string | null;
  cv: string | null;
  socials: Record<string, string>;
  axes: Record<AxisKey, number>;
  /** per-axis percentile rank within the roster, 0..1 */
  axes_pct?: Record<AxisKey, number>;
  attrs: {
    gender: "m" | "f";
    sector: string;
    origin: Origin;
    region: string;
    experience: Experience;
    age: number | null;
  };
  /** 0-5 percentile-based public-reach score; null when signals were unavailable */
  electability: number | null;
  electability_signals?: ElectabilitySignals;
  summary_he: string;
  highlights_he: string[];
  sources: string[];
}

export type RepKey = "women" | "arab_society" | "periphery" | "young" | "lgbtq";

export type ElectabilityPref = "high" | "some" | "none";

export interface Answers {
  issues: AxisKey[]; // up to 3
  experience: "experienced" | "fresh" | "any";
  reps: RepKey[]; // 0..n
  origin: Origin | "any";
  electability: ElectabilityPref;
  /** discount declared agendas by verified public track record */
  credibility: boolean;
}

export interface Weights {
  issues: number;
  experience: number;
  reps: number;
  origin: number;
  electability: number; // base weight when pref="high"; scaled down for "some", 0 for "none"
}

export interface RankedCandidate {
  candidate: Candidate;
  score: number; // 0..100
  reasons: string[]; // Hebrew explanation chips
}
