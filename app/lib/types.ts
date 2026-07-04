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

export interface Candidate {
  id: string;
  name: string;
  bio: string;
  photo: string | null;
  website: string | null;
  cv: string | null;
  socials: Record<string, string>;
  axes: Record<AxisKey, number>;
  attrs: {
    gender: "m" | "f";
    sector: string;
    origin: Origin;
    region: string;
    experience: Experience;
    age: number | null;
  };
  summary_he: string;
  highlights_he: string[];
  sources: string[];
}

export type RepKey = "women" | "arab_society" | "periphery" | "young" | "lgbtq";

export interface Answers {
  issues: AxisKey[]; // up to 3
  experience: "experienced" | "fresh" | "any";
  reps: RepKey[]; // 0..n
  origin: Origin | "any";
}

export interface RankedCandidate {
  candidate: Candidate;
  score: number; // 0..100
  reasons: string[]; // Hebrew explanation chips
}
