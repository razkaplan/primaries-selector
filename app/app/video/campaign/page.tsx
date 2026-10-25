import type { Metadata } from "next";
import CampaignVideo, { type CampaignData } from "@/components/CampaignVideo";
import { OUTGOING_COALITION, partyColor, partyName, seatPolls } from "@/lib/elections";
import marketsData from "@/data/elections/markets.json";
import narration from "@/data/video/campaign-narration.json";

export const metadata: Metadata = {
  title: "הסקרים של הקמפיין בדקה",
  robots: { index: false, follow: false },
};

/** Campaign window: from the first full week after the Knesset dissolved
 * (17.7.2026) to the last day polls could be published (23.10.2026). */
const FROM = "2026-07-18";
const TO = "2026-10-23";
const START_TO = "2026-07-31"; // "start of campaign" = first two weeks
const END_FROM = "2026-10-17"; // "end of campaign" = final week

function shift(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Simple mean per list over a closed window, as everywhere on the site. */
function means(from: string, to: string) {
  const list = seatPolls.filter((p) => p.date && p.date >= from && p.date <= to);
  const sums = new Map<string, { t: number; n: number }>();
  for (const p of list)
    for (const [k, v] of Object.entries(p.results)) {
      if (typeof v !== "number") continue;
      const s = sums.get(k) ?? { t: 0, n: 0 };
      s.t += v;
      s.n += 1;
      sums.set(k, s);
    }
  return { n: list.length, avg: new Map([...sums].map(([k, s]) => [k, s.t / s.n])) };
}

const coalition = (avg: Map<string, number>) =>
  [...avg].filter(([k]) => OUTGOING_COALITION.has(k)).reduce((s, [, v]) => s + v, 0);

export default function CampaignVideoPage() {
  // weekly windows ending on the final publication day
  const weeks: { from: string; to: string; likud: number; yashar: number; coalition: number }[] = [];
  for (let end = TO; end >= FROM; end = shift(end, -7)) {
    const from = shift(end, -6) < FROM ? FROM : shift(end, -6);
    const m = means(from, end);
    if (m.n === 0) continue;
    weeks.unshift({ from, to: end, likud: m.avg.get("likud") ?? 0, yashar: m.avg.get("yashar") ?? 0, coalition: coalition(m.avg) });
  }
  let leadChanges = 0;
  for (let i = 1; i < weeks.length; i++)
    if ((weeks[i].likud > weeks[i].yashar) !== (weeks[i - 1].likud > weeks[i - 1].yashar)) leadChanges++;

  const start = means(FROM, START_TO).avg;
  const end = means(END_FROM, TO).avg;
  const movers = [...end]
    .filter(([, v]) => v >= 3.5)
    .map(([k, v]) => ({
      key: k,
      name: partyName(k).split(/[–-]/)[0].trim(),
      color: partyColor(k),
      start: start.has(k) ? start.get(k)! : null,
      end: v,
    }))
    .sort((a, b) => b.end - a.end);

  const poly = marketsData.markets.find((m) => m.platform === "polymarket")!;
  const odds = poly.outcomes.slice(0, 3).map((o) => ({ name: o.name_he, prob: o.prob }));

  const data: CampaignData = {
    pollCount: means(FROM, TO).n,
    weeks,
    leadChanges,
    movers,
    odds,
    oddsDate: marketsData.fetched_at.slice(0, 10),
    narration: narration.segments,
  };
  return <CampaignVideo data={data} />;
}
