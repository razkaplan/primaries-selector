import type { AxisKey, RepKey } from "./types";

export const AXIS_LABELS: Record<AxisKey, string> = {
  peace_diplomacy: "שלום, הסדרים מדיניים וסיום המלחמה",
  religion_state: "הפרדת דת ומדינה",
  socioeconomic: "כלכלה חברתית ויוקר המחיה",
  democracy_law: "דמוקרטיה, שלטון החוק ומאבק בשחיתות",
  arab_jewish: "שותפות יהודית-ערבית ושוויון",
  climate_env: "אקלים, סביבה ואנרגיה",
  periphery: "חיזוק הפריפריה",
  security: "ביטחון וניסיון ביטחוני",
  gender_lgbtq: "שוויון מגדרי וזכויות להט\"ב",
  education_health: "חינוך ובריאות",
};

export const AXIS_SHORT: Record<AxisKey, string> = {
  peace_diplomacy: "שלום ומדיניות",
  religion_state: "דת ומדינה",
  socioeconomic: "כלכלה חברתית",
  democracy_law: "דמוקרטיה ושלטון החוק",
  arab_jewish: "שותפות יהודית-ערבית",
  climate_env: "אקלים וסביבה",
  periphery: "פריפריה",
  security: "ביטחון",
  gender_lgbtq: "מגדר ולהט\"ב",
  education_health: "חינוך ובריאות",
};

export const REP_LABELS: Record<RepKey, string> = {
  women: "נשים",
  arab_society: "החברה הערבית והדרוזית",
  periphery: "תושבי הפריפריה",
  young: "צעירים ודור חדש",
  lgbtq: "הקהילה הגאה",
};

export const EXPERIENCE_OPTIONS = [
  {
    value: "experienced" as const,
    label: "ניסיון פרלמנטרי",
    desc: "חשוב לי שייבחרו חברי כנסת מכהנים או לשעבר שמכירים את העבודה",
  },
  {
    value: "fresh" as const,
    label: "כוחות חדשים",
    desc: "חשוב לי דם חדש: פעילים, אנשי שטח ומקצוע שטרם כיהנו בכנסת",
  },
  {
    value: "any" as const,
    label: "שילוב / לא משנה לי",
    desc: "אשקול כל מועמד לגופו",
  },
];

export const ORIGIN_OPTIONS = [
  { value: "meretz" as const, label: "השורשים של מרצ", desc: "קרוב לבי המחנה של מרצ" },
  { value: "labor" as const, label: "השורשים של העבודה", desc: "קרוב לבי המחנה של מפלגת העבודה" },
  { value: "new" as const, label: "הדור החדש", desc: "מעדיפים מי שהגיעו מהמחאה ומהחברה האזרחית" },
  { value: "any" as const, label: "לא משנה לי", desc: "המיזוג כבר מאחורינו" },
];
