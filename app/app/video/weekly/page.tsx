import type { Metadata } from "next";
import WeeklyVideo, { type WeeklyData } from "@/components/WeeklyVideo";
import {
  OUTGOING_COALITION,
  RUNNING_2026,
  meta,
  partyColor,
  partyName,
  roundSeats,
  seatPolls,
} from "@/lib/elections";
import { publisherHe } from "@/lib/electionsHe";

export const metadata: Metadata = {
  title: "סיכום שבועי של הסקרים",
  robots: { index: false, follow: false },
};

/** Lists the CEC voted to disqualify on 23.9.2026, pending the Supreme Court. */
const PENDING = new Set(["raam", "joint_list"]);
const ELECTION_DAY = "2026-10-27";

function shift(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Same method as the rest of the site (simple mean of seat polls, running
 * lists, >= 1.5 average, rounded to 120), over a closed date window. */
function windowSeats(from: string, to: string) {
  const list = seatPolls.filter((p) => p.date && p.date >= from && p.date <= to);
  const sums = new Map<string, { total: number; n: number }>();
  for (const p of list) {
    for (const [k, v] of Object.entries(p.results)) {
      if (typeof v !== "number" || !RUNNING_2026.has(k)) continue;
      const s = sums.get(k) ?? { total: 0, n: 0 };
      s.total += v;
      s.n += 1;
      sums.set(k, s);
    }
  }
  const avgs = [...sums.entries()].map(([key, s]) => ({ key, avg: s.total / s.n })).filter((a) => a.avg >= 1.5);
  return { polls: list, seats: new Map(roundSeats(avgs).map((s) => [s.key, s.seats])) };
}

function heRange(from: string, to: string): string {
  const d = (iso: string) => new Date(iso + "T00:00:00Z");
  const month = new Intl.DateTimeFormat("he-IL", { month: "long", timeZone: "UTC" });
  const a = d(from).getUTCDate();
  const b = d(to).getUTCDate();
  return month.format(d(from)) === month.format(d(to))
    ? `${a}–${b} ב${month.format(d(to))} ${d(to).getUTCFullYear()}`
    : `${a} ב${month.format(d(from))} – ${b} ב${month.format(d(to))} ${d(to).getUTCFullYear()}`;
}

export default function WeeklyVideoPage() {
  const latest = seatPolls.find((p) => p.date)?.date ?? meta.scraped_at;
  const thisWeek = windowSeats(shift(latest, -6), latest);
  const lastWeek = windowSeats(shift(latest, -13), shift(latest, -7));

  const rows = [...thisWeek.seats.entries()]
    .filter(([, n]) => n > 0)
    .map(([key, seats]) => ({
      key,
      name: partyName(key).split(/[–-]/)[0].trim(),
      color: partyColor(key),
      seats,
      delta: lastWeek.polls.length ? seats - (lastWeek.seats.get(key) ?? 0) : null,
      pending: PENDING.has(key),
    }))
    .sort((a, b) => b.seats - a.seats);

  const bloc = (m: Map<string, number>) =>
    [...m.entries()].filter(([k]) => OUTGOING_COALITION.has(k)).reduce((s, [, n]) => s + n, 0);

  const days = Math.round(
    (new Date(ELECTION_DAY + "T00:00:00Z").getTime() - new Date(meta.scraped_at + "T00:00:00Z").getTime()) / 864e5,
  );

  const data: WeeklyData = {
    range: heRange(shift(latest, -6), latest),
    pollCount: thisWeek.polls.length,
    publishers: [...new Set(thisWeek.polls.map((p) => publisherHe(p.publisher)))],
    daysToElection: days,
    rows,
    coalition: bloc(thisWeek.seats),
    coalitionPrev: lastWeek.polls.length ? bloc(lastWeek.seats) : null,
  };

  return <WeeklyVideo data={data} />;
}
