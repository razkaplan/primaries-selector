import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import MoneyBars, { type MoneyRow } from "@/components/MoneyBars";
import MoneyFocus from "@/components/MoneyFocus";
import { fmtNis } from "@/lib/money";
import { partyColor, partyName, roundSeats, seatAverages, seatPolls } from "@/lib/elections";
import moneyData from "@/data/elections/money.json";
import marketsData from "@/data/elections/markets.json";

export const metadata: Metadata = {
  title: "מי מממן את המפלגות",
  alternates: { canonical: "/knesset/money" },
  description:
    "מאיפה המפלגות מגייסות כסף לבחירות 2026: כמה מקבלת כל רשימה מהמדינה לפי הסקרים, מי הערבים הפרטיים שמממנים את המפלגות החדשות, תרומות בפריימריז, חובות לכנסת — כל נתון עם מקור ותאריך.",
};

interface Sourced {
  as_of: string;
  /** "month" when only the month of publication is confirmed */
  date_precision?: "month";
  source_name: string;
  url: string;
  quote?: string;
}
interface PrivateItem extends Sourced {
  party: string;
  entity_he: string;
  category: "self" | "backer" | "donation";
  who: string;
  role: string;
  amount_nis: number;
  origin?: string;
}
interface PrimaryRecord extends Sourced {
  subject: string;
  party: string;
  metric: string;
  value_nis: number | null;
  value_text: string;
  donor?: string;
  donor_country?: string;
}
interface Money {
  updated: string;
  funding_unit: Sourced & { per_seat_nis: number; per_list_nis: number; new_party_advance_nis: number };
  formula: Sourced & { new_list: string; incumbent: string; joint_list: string };
  outgoing_seats: Record<string, Sourced & { seats: number }>;
  headline: Sourced & { state_share_2022_pct: number; income_2022_nis: number; donations_2022_nis: number; scope_note: string };
  rules: (Sourced & { title: string; value: string; detail: string })[];
  private_financing: PrivateItem[];
  private_totals: (Sourced & {
    party: string;
    entity_he: string;
    guarantees_nis: number;
    guarantees_n: number | null;
    self_nis: number;
    donations_nis: number;
    donations_n: number | null;
    loans_text: string;
  })[];
  named_donors_capped: (Sourced & { party: string; names: string[]; cap_nis: number })[];
  debts: (Sourced & { party: string; label: string; amount_nis: number; context: string })[];
  advances: (Sourced & { party: string; amount_nis: number; text: string; parts: [string, number][] })[];
  findings: (Sourced & { party: string; title: string; text: string })[];
  primaries: PrimaryRecord[];
  primaries_totals: (Sourced & { party: string; total_nis: number; text: string })[];
  primaries_context: (Sourced & { text: string })[];
  member_income: (Sourced & { party: string; metric: string; value: number; value_low?: number; approx?: boolean; text: string })[];
  member_income_context: (Sourced & { text: string })[];
  spotlights: (Sourced & { party: string; title: string; text: string; amount_nis: number | null })[];
  third_parties?: (Sourced & { name: string; stance: string; amount_nis: number | null; funders: string })[];
}

const money = moneyData as unknown as Money;

const CATEGORY = {
  state: { label: "מקדמה מהמדינה", color: "#5a31f4" },
  backer: { label: "ערבויות של תומכים פרטיים", color: "#e8435f" },
  self: { label: "ערבות של ראש המפלגה או משפחתו", color: "#c98600" },
  donation: { label: "תרומות", color: "#0e9384" },
  members: { label: "מחברי המפלגה: דמי חבר ודמי התמודדות (הערכה)", color: "#8a6fd1" },
} as const;

/** Prediction-market outcomes (PM candidates) mapped to the list each one heads. */
const LEADER_PARTY: Record<string, string> = {
  "Gadi Eizenkot": "yashar",
  "Benjamin Netanyahu": "likud",
  "Naftali Bennett": "together",
  "Avigdor Lieberman": "yisrael_beiteinu",
  "Itamar Ben Gvir": "otzma_yehudit",
  "Ofer Winter": "amcha_yisrael",
  "Yair Golan": "democrats",
  "Yoaz Hendel": "reserv_nep",
  "Benny Gantz": "blue_white",
};

interface MarketOutcome {
  name: string;
  name_he: string;
  prob: number;
}
const markets = marketsData as {
  fetched_at: string;
  markets: { platform: string; url: string; volume_usd: number; outcomes: MarketOutcome[] }[];
};

/** Lists the CEC voted to disqualify on 23.9.2026, pending Supreme Court review. */
const PENDING_DISQUALIFICATION = new Set(["raam", "joint_list"]);

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso + "T00:00:00Z"));
}

function fmtMonth(iso: string): string {
  return new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(iso + "T00:00:00Z"),
  );
}

function windowStart(latest: string | null, days: number): string {
  const d = new Date((latest ?? "2026-09-06") + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function Src({ s }: { s: Sourced }) {
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      className="whitespace-nowrap text-xs text-ink-faint underline hover:text-brand"
    >
      {s.source_name} · {s.date_precision === "month" ? fmtMonth(s.as_of) : fmtDate(s.as_of)} ↗
    </a>
  );
}

export default function KnessetMoney() {
  const unit = money.funding_unit.per_seat_nis;
  const perList = money.funding_unit.per_list_nis;

  // --- public money: projected election funding from current polls (Section 3 of the law)
  const latest = seatPolls[0]?.date ?? null;
  const seats = roundSeats(seatAverages(windowStart(latest, 30), true).filter((a) => a.avg >= 1.5));
  const publicRows: MoneyRow[] = seats
    .filter((s) => s.seats > 0)
    .map((s) => {
      const out = money.outgoing_seats[s.key];
      const units = out ? (out.seats + s.seats) / 2 : s.seats;
      const total = units * unit + perList;
      return {
        key: s.key,
        label: partyName(s.key),
        dot: partyColor(s.key),
        note: out
          ? `ממוצע של ${out.seats} (יוצאת) ו-${s.seats} (סקרים)`
          : PENDING_DISQUALIFICATION.has(s.key)
            ? `${s.seats} מנדטים · נפסלה בוועדה, ממתינה להכרעת העליון`
            : `${s.seats} מנדטים בסקרים`,
        segments: [{ key: "state", label: "מימון ממלכתי", value: total, color: partyColor(s.key) }],
        details: [
          out
            ? `${units} יחידות מימון (ממוצע ${out.seats} היוצאים ו-${s.seats} בסקרים), ועוד תוספת קבועה לרשימה`
            : `${s.seats} יחידות מימון (מנדט = יחידה), ועוד תוספת קבועה לרשימה`,
          ...money.advances
            .filter((a) => a.party === s.key)
            .map((a) => `כבר שולם כמקדמה: ${fmtNis(a.amount_nis)}`),
        ],
      };
    })
    .sort((a, b) => b.segments[0].value - a.segments[0].value);
  const publicTotal = publicRows.reduce((s, r) => s + r.segments[0].value, 0);

  // --- state advances already paid (Calcalist, 15.9.2026)
  const advanceRows: MoneyRow[] = money.advances
    .slice()
    .sort((a, b) => b.amount_nis - a.amount_nis)
    .map((a) => ({
      key: a.party,
      label: partyName(a.party),
      dot: partyColor(a.party),
      note: a.parts.length > 1 ? `${a.parts.length} מפלגות ברשימה` : undefined,
      segments: [{ key: "adv", label: "מקדמה", value: a.amount_nis, color: partyColor(a.party) }],
      details: [...a.parts.map(([n, v]) => `${n}: ${fmtNis(v)}`), ...(a.text ? [a.text] : [])],
    }));
  const advanceTotal = money.advances.reduce((s, a) => s + a.amount_nis, 0);

  // --- private money of the new lists: guarantees (bank loans are drawn against them) + donations
  const privateRows: MoneyRow[] = money.private_totals.map((t) => ({
    key: t.party,
    label: t.entity_he,
    dot: partyColor(t.party),
    note: t.guarantees_n ? `${t.guarantees_n} ערבויות${t.donations_n ? ` · ${t.donations_n} תרומות` : ""}` : undefined,
    segments: [
      { key: "backer", label: CATEGORY.backer.label, color: CATEGORY.backer.color, value: t.guarantees_nis - t.self_nis },
      { key: "self", label: CATEGORY.self.label, color: CATEGORY.self.color, value: t.self_nis },
      { key: "donation", label: CATEGORY.donation.label, color: CATEGORY.donation.color, value: t.donations_nis },
    ],
    details: [t.loans_text, `${t.source_name}, ${fmtDate(t.as_of)}`].filter(Boolean),
  }));
  const guarantors = money.private_financing
    .filter((p) => p.category === "backer" || p.category === "self")
    .sort((a, b) => b.amount_nis - a.amount_nis);

  // --- primaries (candidate-level money, by source)
  const candidates = [...new Set(
    money.primaries.filter((p) => p.metric === "total_donations" || p.metric === "self_funding").map((p) => p.subject),
  )];
  const primaryRows: MoneyRow[] = candidates
    .map((subject) => {
      const recs = money.primaries.filter((p) => p.subject === subject);
      const self = recs.filter((r) => r.metric === "self_funding").reduce((s, r) => s + (r.value_nis ?? 0), 0);
      const don = recs.filter((r) => r.metric === "total_donations").reduce((s, r) => s + (r.value_nis ?? 0), 0);
      const first = recs[0];
      return {
        key: subject,
        party: first.party,
        label: subject,
        dot: partyColor(first.party),
        note: partyName(first.party),
        segments: [
          { key: "self", label: "מכספו של המועמד", value: self, color: CATEGORY.self.color },
          { key: "donation", label: "תרומות", value: don, color: CATEGORY.donation.color },
        ],
        details: [`${first.source_name}, ${fmtDate(first.as_of)}`],
      };
    })
    .sort((a, b) => b.segments.reduce((s, x) => s + x.value, 0) - a.segments.reduce((s, x) => s + x.value, 0));
  const primaryNotes = money.primaries.filter((p) => p.metric === "note");

  const debtRows: MoneyRow[] = money.debts
    .slice()
    .sort((a, b) => b.amount_nis - a.amount_nis)
    .map((d) => ({
      key: d.label,
      party: d.party,
      label: d.label,
      dot: partyColor(d.party),
      note: d.context || fmtDate(d.as_of),
      segments: [{ key: "debt", label: "חוב", value: d.amount_nis, color: partyColor(d.party) }],
      details: [`${d.source_name}, ${fmtDate(d.as_of)}`],
    }));

  // --- total cost per seat: known campaign money / seats in the poll average
  const seatOf = new Map(seats.map((x) => [x.key, x.seats]));
  const moneyOf = (party: string) => {
    const adv = money.advances.find((a) => a.party === party)?.amount_nis ?? 0;
    const t = money.private_totals.find((x) => x.party === party);
    return {
      state: adv,
      backer: t ? t.guarantees_nis - t.self_nis : 0,
      self: t?.self_nis ?? 0,
      donation: t?.donations_nis ?? 0,
    };
  };
  /** Annual income from members, as a range: members x (reduced .. full) dues,
   * plus primary candidates x fee. Our arithmetic on sourced inputs. */
  const memberIncome = (party: string) => {
    const f = (m: string) => money.member_income.find((x) => x.party === party && x.metric === m);
    const members = f("members");
    const dues = f("dues_nis");
    if (!members || !dues) return null;
    const fees = (f("primary_candidates")?.value ?? 0) * (f("primary_fee_nis")?.value ?? 0);
    return {
      low: members.value * (dues.value_low ?? dues.value) + fees,
      high: members.value * dues.value + fees,
      fees,
      facts: money.member_income.filter((x) => x.party === party),
    };
  };
  const memberParties = [...new Set(money.member_income.map((x) => x.party))];
  const moneyParties = [...new Set([...money.advances.map((a) => a.party), ...money.private_totals.map((t) => t.party)])];
  const totalOf = (party: string) => Object.values(moneyOf(party)).reduce((a, b) => a + b, 0);
  /** reported money plus the low end of the member-income estimate */
  const grandTotal = (party: string) => totalOf(party) + (memberIncome(party)?.low ?? 0);
  const cpsRows: MoneyRow[] = moneyParties
    .filter((party) => (seatOf.get(party) ?? 0) > 0)
    .map((party) => {
      const m = moneyOf(party);
      const n = seatOf.get(party)!;
      return {
        key: party,
        label: partyName(party),
        dot: partyColor(party),
        note: `${fmtNis(grandTotal(party))} ל-${n} מנדטים`,
        segments: [
          ...(Object.keys(m) as (keyof typeof m)[]).map((k) => ({
            key: k,
            label: CATEGORY[k].label,
            color: CATEGORY[k].color,
            value: m[k] / n,
          })),
          ...(memberIncome(party)
            ? [{ key: "members", label: CATEGORY.members.label, color: CATEGORY.members.color, value: memberIncome(party)!.low / n, pattern: true }]
            : []),
        ],
        details: [
          `סה״כ כסף ידוע: ${fmtNis(totalOf(party))}`,
          ...(memberIncome(party)
            ? [`ועוד מחברי המפלגה: ${fmtNis(memberIncome(party)!.low)} עד ${fmtNis(memberIncome(party)!.high)} בשנה (הערכה)`]
            : []),
          `${n} מנדטים בממוצע הסקרים`,
        ],
      };
    })
    .sort((a, b) => b.segments.reduce((s, x) => s + x.value, 0) - a.segments.reduce((s, x) => s + x.value, 0));
  const noSeatMoney = moneyParties
    .filter((party) => (seatOf.get(party) ?? 0) === 0 && totalOf(party) > 0)
    .sort((a, b) => totalOf(b) - totalOf(a));

  // --- the same money against the prediction markets (odds of heading the next government)
  const poly = markets.markets.find((m) => m.platform === "polymarket");
  const kalshi = markets.markets.find((m) => m.platform === "kalshi");
  const marketRows = (poly?.outcomes ?? [])
    .filter((o) => LEADER_PARTY[o.name] && totalOf(LEADER_PARTY[o.name]) > 0)
    .map((o) => {
      const party = LEADER_PARTY[o.name];
      const n = seatOf.get(party) ?? 0;
      return {
        party,
        leader: o.name_he,
        prob: o.prob,
        kalshi: kalshi?.outcomes.find((k) => k.name === o.name)?.prob ?? null,
        total: grandTotal(party),
        perSeat: n > 0 ? grandTotal(party) / n : null,
        seats: n,
      };
    })
    .sort((a, b) => b.prob - a.prob);
  const maxPerSeat = Math.max(...marketRows.map((r) => r.perSeat ?? 0), 1);
  const maxProb = Math.max(...marketRows.map((r) => r.prob), 0.01);

  const h = money.headline;
  const focusParties = [...new Set([...publicRows.map((r) => r.key), ...moneyParties])].map((k) => ({
    key: k,
    label: partyName(k),
    color: partyColor(k),
  }));
  const SECTIONS = [
    { id: "public", label: "הקופה הציבורית" },
    { id: "advances", label: "מקדמות" },
    { id: "private", label: "כסף פרטי" },
    { id: "per-seat", label: "עלות למנדט" },
    { id: "members", label: "דמי חבר" },
    { id: "primaries", label: "פריימריז" },
    { id: "debts", label: "חובות" },
    { id: "findings", label: "מבקר המדינה" },
    { id: "rules", label: "כללי המשחק" },
  ];

  return (
    <main className="min-h-screen">
      <KnessetNav active="/knesset/money" />

      <section className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-4xl">מי מממן את המפלגות? 💰</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-ink-soft">
          מאיפה מגיע הכסף של הקמפיינים: כמה מקבלת כל רשימה מהקופה הציבורית,
          מי הערבים הפרטיים שמאפשרים למפלגות החדשות לרוץ, מה נתרם בפריימריז
          ומי נכנס לבחירות עם חוב. כל נתון מגיע מדיווחים למבקר המדינה, מהחוק
          או מדיווח עיתונאי שמצטט אותם — עם תאריך וקישור.
        </p>
        <div className="mt-5">
          <ShareBar path="/knesset/money" text="מי מממן את המפלגות בבחירות 2026? הקופה הציבורית, הערבים הפרטיים והחובות — עם מקורות:" />
        </div>

        {/* headline */}
        <div className="anim-rise mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-line bg-card p-6 text-center shadow-sm sm:col-span-1">
            <div className="font-display text-5xl text-brand">{h.state_share_2022_pct}%</div>
            <div className="mt-2 text-sm font-bold text-ink-soft">מהכנסות הבחירות של המפלגות ב-2022 הגיעו מהמדינה</div>
            <div className="mt-1 text-[11px] text-ink-faint">{h.scope_note}</div>
          </div>
          <div className="rounded-3xl border border-line bg-card p-6 text-sm leading-relaxed text-ink-soft shadow-sm sm:col-span-2">
            <b className="text-ink">השורה התחתונה:</b> בישראל, הכסף הגדול בבחירות הוא כסף ציבורי.
            ב-2022 הכנסות הבחירות של המפלגות היו {fmtNis(h.income_2022_nis)}, ומתוכן רק כ-
            {fmtNis(h.donations_2022_nis)} מתרומות. ההון הפרטי נכנס בעיקר בשלושה
            פתחים: ערבויות להלוואות של מפלגות חדשות, תרומות ומימון עצמי של מועמדים
            בפריימריז, וגופים חיצוניים שמפעילים קמפיין בעד או נגד.{" "}
            <Src s={h} />
          </div>
        </div>
        <div className="mt-6">
          <MoneyFocus sections={SECTIONS} parties={focusParties} />
        </div>
      </section>

      {/* public money */}
      <section id="public" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl">הקופה הציבורית: כמה תקבל כל רשימה</h2>
            <span className="text-sm text-ink-faint">סה״כ לפי הסקרים: {fmtNis(publicTotal)}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            מימון הבחירות שכל רשימה צפויה לקבל מהמדינה לפי חוק מימון מפלגות,
            אם התוצאות יהיו כמו ממוצע הסקרים של 30 הימים האחרונים: יחידת מימון
            של {fmtNis(unit)} לכל מנדט ועוד {fmtNis(perList)} לכל רשימה. לסיעה
            מכהנת מחשבים ממוצע בין גודלה בכנסת היוצאת לתוצאה החדשה. מתעדכן עם
            כל סקר. <Src s={money.funding_unit} />
          </p>
          <div className="mt-6">
            <MoneyBars rows={publicRows} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            הערכה, לא תשלום בפועל. חושב לפי{" "}
            <a href={money.formula.url} target="_blank" rel="noopener noreferrer" className="underline">
              סעיף 3 לחוק
            </a>
            . הממוצע עם הכנסת היוצאת הוחל רק היכן שגודל הסיעה היוצאת מתועד
            במקור; ברשימות מאוחדות (כמו ביחד, שכוללת את יש עתיד) החוק מחשב כל
            מפלגה בנפרד לפי הסכם ביניהן, ולכן הן מוצגות בנוסחת הבסיס. מפלגה
            שעוברת 1% ולא נכנסת לכנסת מקבלת יחידת מימון אחת.
          </p>
        </div>
      </section>

      {/* advances already paid */}
      <section id="advances" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl">כבר שולם: המקדמות מהקופה הציבורית</h2>
            <span className="text-sm text-ink-faint">סה״כ: {fmtNis(advanceTotal)}</span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            סיעות שמכהנות בכנסת מקבלות לפני הבחירות מקדמה על חשבון המימון,
            לפי גודלן בכנסת היוצאת. זה הכסף שכבר בקופות הקמפיינים. רשימה
            משותפת מקבלת מקדמה נפרדת לכל מפלגה שבה. <Src s={money.advances[0]} />
          </p>
          <div className="mt-6">
            <MoneyBars rows={advanceRows} />
          </div>
          {money.spotlights.length > 0 && (
            <div className="mt-6 rounded-2xl border border-line bg-paper/60 p-4 text-sm">
              <div className="flex items-center gap-2 font-bold">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: partyColor("blue_white") }} />
                {money.spotlights[0].title}
              </div>
              <ul className="mt-2 space-y-2 leading-relaxed text-ink-soft">
                {money.spotlights.map((sp) => (
                  <li key={sp.url} data-party={sp.party}>
                    {sp.title !== money.spotlights[0].title && <b className="text-ink">{sp.title}: </b>}
                    {sp.text} <Src s={sp} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* private money of new lists */}
      <section id="private" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">הכסף הפרטי: איך רצה מפלגה חדשה בלי מימון</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            מפלגה שלא מכהנת בכנסת מקבלת את המימון הציבורי רק אחרי הבחירות,
            ומותר לה ללוות רק מבנק. לכן היא נשענת על ערבויות אישיות של תומכים —
            התחייבות לכסות את ההלוואה אם המפלגה לא תיכנס לכנסת. הערבויות הן
            הבסיס שעליו הבנק מלווה, ולכן ההלוואות עצמן לא נספרות כאן פעם
            נוספת. הנה המפלגות החדשות, לפי סוג הכסף שדווח למבקר המדינה.
            ערבות כזו חוקית ואינה תרומה; היא מוצגת כדי להראות מי נושא בסיכון
            הכספי של הקמפיין, ואין בהופעת שם כאן כדי לרמוז על מניע או השפעה.
          </p>
          <div className="mt-6">
            <MoneyBars
              rows={privateRows}
              legend={[CATEGORY.backer, CATEGORY.self, CATEGORY.donation].map((c) => ({ label: c.label, color: c.color }))}
            />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            הסכומים לפי הדיווח האחרון שפורסם; ביחד נשענת גם על המקדמה של יש
            עתיד (למעלה). פרסום ב
            <a href="https://www.mevaker.gov.il/state-audit/elections/donations" target="_blank" rel="noopener noreferrer" className="underline">
              מאגר מבקר המדינה
            </a>{" "}
            מתעדכן באופן שוטף.
          </p>

          <h3 className="font-display mt-8 text-lg">מי חתם על הערבויות</h3>
          <div className="table-scroll mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-ink-faint">
                  <th className="py-2 font-bold">שם</th>
                  <th className="py-2 font-bold">רקע</th>
                  <th className="py-2 font-bold">מפלגה</th>
                  <th className="py-2 text-left font-bold">סכום</th>
                  <th className="py-2 text-left font-bold">מקור</th>
                </tr>
              </thead>
              <tbody>
                {guarantors.map((g) => (
                  <tr key={g.party + g.who} data-party={g.party} className="border-b border-line/50">
                    <td className="py-2 font-bold">
                      {g.who}
                      {g.origin && (
                        <span className="mr-1.5 rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                          {g.origin}
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-ink-soft">{g.role}</td>
                    <td className="py-2">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: partyColor(g.party) }} />
                        {g.entity_he}
                      </span>
                    </td>
                    <td className="py-2 text-left font-black tabular-nums">{fmtNis(g.amount_nis)}</td>
                    <td className="py-2 text-left"><Src s={g} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {money.named_donors_capped.map((d, i) => (
            <p key={d.party + i} data-party={d.party} className="mt-4 text-sm leading-relaxed text-ink-soft">
              <b className="text-ink">תרומות בתקרה ({fmtNis(d.cap_nis)}) ל{partyName(d.party)}:</b>{" "}
              {d.names.join(", ")}. <Src s={d} />
            </p>
          ))}
        </div>
      </section>

      {/* total cost per seat */}
      <section id="per-seat" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">כמה עולה מנדט?</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            כל הכסף הידוע של כל רשימה לקמפיין (מקדמה מהמדינה, ערבויות ותרומות
            שדווחו) מחולק במספר המנדטים שלה בממוצע הסקרים. זו הערכה: היא לא
            כוללת מימון שוטף, יתרות מהעבר או הוצאות שעוד לא דווחו, והיא משתנה
            עם כל סקר. לליכוד ולדמוקרטים נוספה בפסים הערכה של ההכנסה מחברי
            המפלגה (<a href="#members" className="underline hover:text-brand">פירוט למטה</a>).
          </p>
          <div className="mt-6">
            <MoneyBars
              rows={cpsRows}
              legend={[
                ...[CATEGORY.state, CATEGORY.backer, CATEGORY.self, CATEGORY.donation].map((c) => ({ label: c.label, color: c.color })),
                { label: CATEGORY.members.label, color: CATEGORY.members.color, pattern: true },
              ]}
            />
          </div>
          {noSeatMoney.length > 0 && (
            <div className="mt-6 border-t border-line/60 pt-4">
              <h3 className="font-bold">כסף בלי מנדטים בסקרים</h3>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {noSeatMoney.map((party) => (
                  <li key={party} data-party={party} className="flex items-center gap-1.5 rounded-full border border-line bg-paper/60 px-3 py-1">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: partyColor(party) }} />
                    <b>{partyName(party)}</b>
                    <span className="tabular-nums text-ink-soft">{fmtNis(totalOf(party))}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-ink-faint">
                רשימות שקיבלו או גייסו כסף אבל נמדדות מתחת לאחוז החסימה (או לא נמדדות
                בנפרד). אם לא ייכנסו לכנסת, זה המחיר ללא מנדט.
              </p>
            </div>
          )}

          <h3 className="font-display mt-10 text-lg">הכסף מול שוק ההימורים</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            לצד העלות למנדט: הסיכוי שהשוק נותן לראש כל רשימה להרכיב את הממשלה
            הבאה, לפי{" "}
            <a href={poly?.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
              Polymarket
            </a>{" "}
            (מחזור מסחר של כ-{Math.round((poly?.volume_usd ?? 0) / 1e6)} מיליון דולר), ובסוגריים{" "}
            <a href={kalshi?.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
              Kalshi
            </a>
            , שוק דליל בהרבה. עודכן {fmtDate(markets.fetched_at.slice(0, 10))}. כסף גדול למנדט
            לא מבטיח סיכוי, והשוק מתמחר את ראשות הממשלה ולא את המנדטים.
          </p>
          <div className="table-scroll mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-line text-right text-xs text-ink-faint">
                  <th className="py-2 font-bold">ראש הרשימה</th>
                  <th className="w-[30%] py-2 font-bold">עלות למנדט</th>
                  <th className="w-[30%] py-2 font-bold">סיכוי לראשות הממשלה</th>
                  <th className="py-2 text-left font-bold">כסף לכל נקודת אחוז</th>
                </tr>
              </thead>
              <tbody>
                {marketRows.map((r) => (
                  <tr key={r.party} data-party={r.party} className="border-b border-line/50">
                    <td className="py-2.5">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: partyColor(r.party) }} />
                        {r.leader}
                      </span>
                      <span className="block text-[11px] text-ink-faint">{partyName(r.party)} · {fmtNis(r.total)}</span>
                    </td>
                    <td className="py-2.5 pl-4">
                      {r.perSeat ? (
                        <div className="flex items-center gap-2" title={`${fmtNis(r.total)} / ${r.seats} מנדטים`}>
                          <div className="h-3 flex-1 rounded-full bg-paper">
                            <div className="h-full rounded-full" style={{ width: `${(r.perSeat / maxPerSeat) * 100}%`, backgroundColor: partyColor(r.party) }} />
                          </div>
                          <span className="w-20 shrink-0 text-xs font-black tabular-nums">{fmtNis(r.perSeat)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-faint">אין מנדטים בסקרים</span>
                      )}
                    </td>
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center gap-2" title={`Polymarket ${(r.prob * 100).toFixed(1)}%`}>
                        <div className="h-3 flex-1 rounded-full bg-paper">
                          <div className="h-full rounded-full bg-ink/70" style={{ width: `${Math.max((r.prob / maxProb) * 100, 1)}%` }} />
                        </div>
                        <span className="w-20 shrink-0 text-xs font-black tabular-nums">
                          {(r.prob * 100).toFixed(r.prob < 0.01 ? 2 : 1)}%
                          {r.kalshi !== null && <span className="font-normal text-ink-faint"> ({Math.round(r.kalshi * 100)}%)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-left text-xs font-black tabular-nums">
                      {r.prob > 0 ? fmtNis(r.total / (r.prob * 100)) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            ״כסף לכל נקודת אחוז״ = הכסף הידוע של הרשימה (כולל הערכת ההכנסה מחברי המפלגה, היכן שפורסמה) חלקי הסיכוי (באחוזים) שנותן Polymarket
            לראש הרשימה. שוק הימורים משקף את ההימורים של משתתפיו, לא תחזית רשמית.
          </p>
        </div>
      </section>

      {/* members: dues and primary fees */}
      <section id="members" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
          <h2 className="font-display text-2xl">גם מחברי המפלגה: דמי חבר ודמי התמודדות</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            מפלגות עם מתפקדים גובות דמי חבר שנתיים, ומתמודדים בפריימריז משלמים
            דמי התמודדות. זו הכנסה שוטפת של המפלגה ולא כסף שמיועד לבחירות, אבל
            היא יכולה לממן גם קמפיין. הסכומים כאן הם הערכה שלנו (מספר החברים ×
            דמי החבר, ועוד המתמודדים × דמי ההתמודדות) על בסיס נתונים שפורסמו;
            הטווח נובע מהנחות מופחתות שלא ידוע כמה חברים קיבלו. בתרשים העלות
            למנדט היא מסומנת בפסים, לפי הקצה הנמוך.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {memberParties.map((party) => {
              const mi = memberIncome(party);
              if (!mi) return null;
              return (
                <div key={party} data-party={party} className="rounded-2xl border border-line bg-paper/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: partyColor(party) }} />
                    {partyName(party)}
                  </div>
                  <div className="font-display mt-1 text-3xl">
                    {fmtNis(mi.low)} – {fmtNis(mi.high)}
                  </div>
                  <div className="text-xs text-ink-faint">בשנה, הערכה · מתוכם דמי התמודדות: {fmtNis(mi.fees)}</div>
                  <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-ink-soft">
                    {mi.facts.map((f) => (
                      <li key={f.metric}>
                        • {f.text} <Src s={f} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <ul className="mt-5 space-y-1.5 text-xs leading-relaxed text-ink-faint">
            {money.member_income_context.map((c, i) => (
              <li key={i}>• {c.text} <Src s={c} /></li>
            ))}
            <li>• נתוני חברות ודמי חבר פורסמו רק לליכוד ולדמוקרטים, ולכן רק הן מופיעות כאן.</li>
          </ul>
        </div>
      </section>

      {/* primaries */}
      {(primaryRows.length > 0 || money.primaries_totals.length > 0) && (
        <section id="primaries" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
          <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl">תרומות בפריימריז: שם נכנס ההון הפרטי</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              מועמד בפריימריז רשאי לקבל מתורם יחיד פי חמישה ויותר ממה שמפלגה
              מכהנת רשאית לקבל, וכל תרומה מדווחת למבקר המדינה ומתפרסמת. בפועל,
              הסכומים שדווחו ב-2026 קטנים — והמימון העצמי בולט יותר מהתרומות.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {money.primaries_totals.map((t) => (
                <div key={t.party} data-party={t.party} className="rounded-2xl border border-line bg-paper/60 p-4">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: partyColor(t.party) }} />
                    {partyName(t.party)}
                  </div>
                  <div className="font-display mt-1 text-3xl">{fmtNis(t.total_nis)}</div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{t.text}</p>
                  <div className="mt-1"><Src s={t} /></div>
                </div>
              ))}
            </div>
            {primaryRows.length > 0 && (
              <>
                <h3 className="font-display mt-8 text-lg">המועמדים שגייסו הכי הרבה (לפי דיווחים שפורסמו)</h3>
                <div className="mt-4">
                  <MoneyBars
                    rows={primaryRows}
                    legend={[
                      { label: "מכספו של המועמד", color: CATEGORY.self.color },
                      { label: "תרומות", color: CATEGORY.donation.color },
                    ]}
                  />
                </div>
              </>
            )}
            {primaryNotes.length > 0 && (
              <ul className="mt-6 space-y-2 border-t border-line/60 pt-4 text-sm leading-relaxed text-ink-soft">
                {primaryNotes.map((p, i) => (
                  <li key={i} data-party={p.party}>
                    <b className="text-ink">{p.subject}</b> ({partyName(p.party)}): {p.value_text}{" "}
                    <Src s={p} />
                  </li>
                ))}
              </ul>
            )}
            <ul className="mt-4 space-y-1.5 text-xs leading-relaxed text-ink-faint">
              {money.primaries_context.map((c, i) => (
                <li key={i}>• {c.text} <Src s={c} /></li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* third parties */}
      {money.third_parties && money.third_parties.length > 0 && (
        <section id="third-parties" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
          <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl">הגופים שמסביב: קמפיינים שלא של המפלגות</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              ארגונים שמוציאים יותר מ-120,400 ₪ על קמפיין בעד או נגד רשימה
              חייבים להירשם אצל מבקר המדינה כ״גוף פעיל בבחירות״.
            </p>
            <ul className="mt-5 space-y-3">
              {money.third_parties.map((t) => (
                <li key={t.name} className="rounded-2xl border border-line bg-paper/60 p-4 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <b>{t.name}</b>
                    {t.amount_nis && <span className="font-black tabular-nums">{fmtNis(t.amount_nis)}</span>}
                  </div>
                  <p className="mt-1 leading-relaxed text-ink-soft">{t.stance}{t.funders ? ` · מממנים: ${t.funders}` : ""}</p>
                  <Src s={t} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* debts */}
      {debtRows.length > 0 && (
        <section id="debts" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
          <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl">החובות: מי נכנס לבחירות במינוס</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              רוב המפלגות מוציאות יותר ממה שהן מקבלות, ומחזירות את החוב לכנסת
              מהמימון השוטף של הקדנציה הבאה. מפלגה שנעלמת מהכנסת משאירה לעיתים
              חוב שהציבור סופג.
            </p>
            <div className="mt-6">
              <MoneyBars rows={debtRows} />
            </div>
          </div>
        </section>
      )}

      {/* comptroller findings */}
      {money.findings.length > 0 && (
        <section id="findings" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
          <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl">מה מצא מבקר המדינה</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              ממצאים מביקורת חשבונות המפלגות, וביקורת עיתונאית על אופן חלוקת הכסף.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {money.findings.map((f) => (
                <li key={f.title} data-party={f.party} className="rounded-2xl border border-line bg-paper/60 p-4 text-sm">
                  <div className="flex items-center gap-2 text-xs font-bold text-ink-soft">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: partyColor(f.party) }} />
                    {partyName(f.party)}
                  </div>
                  <b className="mt-1 block">{f.title}</b>
                  <p className="mt-1 leading-relaxed text-ink-soft">{f.text}</p>
                  <div className="mt-1"><Src s={f} /></div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* rules */}
      <section id="rules" className="mx-auto max-w-5xl scroll-mt-24 px-4 pb-10">
        <h2 className="font-display mb-4 text-2xl">כללי המשחק</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {money.rules.map((r) => (
            <div key={r.title} className="rounded-3xl border border-line bg-card p-5 shadow-sm">
              <div className="font-display text-2xl text-brand">{r.value}</div>
              <div className="mt-1 font-bold">{r.title}</div>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{r.detail}</p>
              <div className="mt-2"><Src s={r} /></div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs leading-relaxed text-ink-faint">
          עודכן {fmtDate(money.updated)}. המידע על תרומות, ערבויות והלוואות
          מבוסס על דיווחי הגורמים עצמם למבקר המדינה, כפי שפורסמו במאגר המבקר
          או צוטטו בתקשורת. מצאתם נתון חסר או שגוי?{" "}
          <a href="https://github.com/razkaplan/primaries-selector/issues" target="_blank" rel="noopener noreferrer" className="underline hover:text-brand">
            פתחו Issue עם מקור
          </a>
          .
        </p>
      </section>

      <KnessetFooter />
    </main>
  );
}
