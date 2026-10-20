import data from "@/data/elections/arab_media.json";

export interface Outlet {
  id: string;
  name_ar: string;
  name_he: string;
  country_he: string;
  country_code: string;
  city_he: string | null;
  type_he: string;
  ownership_he: string | null;
  ownership_url: string | null;
  site_url: string;
  region: Region;
}

export interface CoverageItem {
  outlet_id: string;
  date: string;
  date_precision?: "month";
  url: string;
  headline_ar: string;
  headline_he: string;
  topics: Topic[];
  terms?: string[];
}

export type Region = "israel" | "palestine" | "gulf" | "levant_egypt" | "international";
export type Topic =
  | "disqualification"
  | "arab_turnout"
  | "arab_lists"
  | "netanyahu"
  | "opposition"
  | "polls"
  | "far_right"
  | "crime"
  | "war"
  | "normalization"
  | "other";

export const arabMedia = data as unknown as {
  updated: string;
  period: { from: string; to: string };
  outlets: Outlet[];
  items: CoverageItem[];
};

/** Region order and colors (validated categorical palette; always shown
 * with a text label, never color alone). */
export const REGIONS: { key: Region; label: string; color: string }[] = [
  { key: "israel", label: "תקשורת בערבית בישראל", color: "#5a31f4" },
  { key: "palestine", label: "תקשורת פלסטינית", color: "#0e9384" },
  { key: "gulf", label: "מדינות המפרץ", color: "#c98600" },
  { key: "levant_egypt", label: "מצרים, ירדן ולבנון", color: "#e8435f" },
  { key: "international", label: "שידור בינלאומי בערבית", color: "#8a6fd1" },
];

export const TOPICS: { key: Topic; label: string }[] = [
  { key: "disqualification", label: "הפסילות והעליון" },
  { key: "arab_lists", label: "הרשימות הערביות" },
  { key: "arab_turnout", label: "שיעור ההצבעה בחברה הערבית" },
  { key: "netanyahu", label: "נתניהו" },
  { key: "opposition", label: "איזנקוט, בנט וגוש השינוי" },
  { key: "polls", label: "סקרים" },
  { key: "far_right", label: "בן גביר וסמוטריץ׳" },
  { key: "war", label: "המלחמה" },
  { key: "crime", label: "פשיעה בחברה הערבית" },
  { key: "normalization", label: "נורמליזציה" },
  { key: "other", label: "אחר" },
];

/** Terms used for Israel / the Knesset. "Alternative" = names used instead
 * of the state's name: occupation, entity, enemy, "48 lands". Descriptions of
 * parties (e.g. the party name «الصهيونية الدينية») are not names for Israel
 * and are deliberately not counted. */
const LOADED = /الاحتلال|الكيان|كيان\s|العدو|أراضي\s*الـ?\s*48/;
const NEUTRAL = /إسرائيل|اسرائيل|الإسرائيلي|الاسرائيلي|الكنيست/;

export type TermClass = "loaded" | "neutral" | "none";
export function termClass(headline: string): TermClass {
  if (LOADED.test(headline)) return "loaded";
  if (NEUTRAL.test(headline)) return "neutral";
  return "none";
}

/** Regional-indicator flag for an ISO-3166 alpha-2 code. */
export function flag(code: string): string {
  return code
    .toUpperCase()
    .replace(/[A-Z]/g, (c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65));
}
