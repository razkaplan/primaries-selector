import type { Metadata } from "next";
import KnessetNav from "@/components/KnessetNav";
import KnessetFooter from "@/components/KnessetFooter";
import ShareBar from "@/components/ShareBar";
import MoneyBars, { type MoneyRow } from "@/components/MoneyBars";
import { fmtNis } from "@/lib/money";
import { partyColor, partyName, roundSeats, seatAverages, seatPolls } from "@/lib/elections";
import moneyData from "@/data/elections/money.json";

export const metadata: Metadata = {
  title: "מי מממן את המפלגות",
  alternates: { canonical: "/knesset/money" },
  description:
    "מאיפה המפלגות מגייסות כסף לבחירות 2026: כמה מקבלת כל רשימה מהמדינה לפי הסקרים, מי הערבים הפרטיים שמממנים את המפלגות החדשות, תרומות בפריימריז, חובות לכנסת — כל נתון עם מקור ותאריך.",
};

interface Sourced {
  as_of: string;
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
  headline: Sourced & { state_share_2022_pct: number; income_2022_nis: number; donations_2022_nis: number };
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
  third_parties?: (Sourced & { name: string; stance: string; amount_nis: number | null; funders: string })[];
}

const money = moneyData as unknown as Money;

const CATEGORY = {
  backer: { label: "ערבויות של תומכים פרטיים", color: "#e8435f" },
  self: { label: "ערבות של ראש המפלגה או משפחתו", color: "#c98600" },
  donation: { label: "תרומות", color: "#0e9384" },
} as const;

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
      {s.source_name} · {fmtDate(s.as_of)} ↗
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
      label: d.label,
      dot: partyColor(d.party),
      note: d.context || fmtDate(d.as_of),
      segments: [{ key: "debt", label: "חוב", value: d.amount_nis, color: partyColor(d.party) }],
      details: [`${d.source_name}, ${fmtDate(d.as_of)}`],
    }));

  const h = money.headline;

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
            <div className="mt-2 text-sm font-bold text-ink-soft">מהכנסות המפלגות ב-2022 הגיעו מהמדינה</div>
          </div>
          <div className="rounded-3xl border border-line bg-card p-6 text-sm leading-relaxed text-ink-soft shadow-sm sm:col-span-2">
            <b className="text-ink">השורה התחתונה:</b> בישראל, הכסף הגדול בבחירות הוא כסף ציבורי.
            ב-2022 הכנסות המפלגות היו {fmtNis(h.income_2022_nis)}, ומתוכן רק כ-
            {fmtNis(h.donations_2022_nis)} מתרומות. ההון הפרטי נכנס בעיקר בשלושה
            פתחים: ערבויות להלוואות של מפלגות חדשות, תרומות ומימון עצמי של מועמדים
            בפריימריז, וגופים חיצוניים שמפעילים קמפיין בעד או נגד.{" "}
            <Src s={h} />
          </div>
        </div>
      </section>

      {/* public money */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
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
      <section className="mx-auto max-w-5xl px-4 pb-10">
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
        </div>
      </section>

      {/* private money of new lists */}
      <section className="mx-auto max-w-5xl px-4 pb-10">
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
              legend={Object.values(CATEGORY).map((c) => ({ label: c.label, color: c.color }))}
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
                  <tr key={g.party + g.who} className="border-b border-line/50">
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
            <p key={d.party + i} className="mt-4 text-sm leading-relaxed text-ink-soft">
              <b className="text-ink">תרומות בתקרה ({fmtNis(d.cap_nis)}) ל{partyName(d.party)}:</b>{" "}
              {d.names.join(", ")}. <Src s={d} />
            </p>
          ))}
        </div>
      </section>

      {/* primaries */}
      {(primaryRows.length > 0 || money.primaries_totals.length > 0) && (
        <section className="mx-auto max-w-5xl px-4 pb-10">
          <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl">תרומות בפריימריז: שם נכנס ההון הפרטי</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              מועמד בפריימריז רשאי לקבל מתורם יחיד פי חמישה ויותר ממה שמפלגה
              מכהנת רשאית לקבל, וכל תרומה מדווחת למבקר המדינה ומתפרסמת. בפועל,
              הסכומים שדווחו ב-2026 קטנים — והמימון העצמי בולט יותר מהתרומות.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {money.primaries_totals.map((t) => (
                <div key={t.party} className="rounded-2xl border border-line bg-paper/60 p-4">
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
                  <li key={i}>
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
        <section className="mx-auto max-w-5xl px-4 pb-10">
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
        <section className="mx-auto max-w-5xl px-4 pb-10">
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
        <section className="mx-auto max-w-5xl px-4 pb-10">
          <div className="rounded-3xl border border-line bg-card p-6 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl">מה מצא מבקר המדינה</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              ממצאים מביקורת חשבונות המפלגות, וביקורת עיתונאית על אופן חלוקת הכסף.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {money.findings.map((f) => (
                <li key={f.title} className="rounded-2xl border border-line bg-paper/60 p-4 text-sm">
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
      <section className="mx-auto max-w-5xl px-4 pb-10">
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
