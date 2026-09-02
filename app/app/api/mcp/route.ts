import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  meta,
  partyLists,
  partyName,
  polls,
  seatAverages,
  seatPolls,
  sourceUrl,
  type Poll,
} from "@/lib/elections";
import quotesData from "@/data/elections/quotes.json";
import marketsData from "@/data/elections/markets.json";

interface Quote {
  candidate_id: string;
  candidate_he: string;
  party: string;
  source_type: string;
  source_name: string;
  date: string | null;
  url: string;
  text: string;
}
const quotes = quotesData as Quote[];

const POLL_KINDS = [
  "seat_projection",
  "preferred_pm",
  "scenario",
  "coalition",
  "arab_voters",
  "voting_intention_pct",
  "other",
] as const;

function shiftISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Resolve a user-supplied party/candidate name (English key or Hebrew label,
 * full or partial) to result keys present in the given polls. */
function resolveKey(input: string, pool: Poll[]): string[] {
  const keys = new Set<string>();
  for (const p of pool) for (const k of Object.keys(p.results)) keys.add(k);
  const q = input.trim().toLowerCase();
  const exact = [...keys].filter((k) => k.toLowerCase() === q);
  if (exact.length) return exact;
  return [...keys].filter(
    (k) => k.toLowerCase().includes(q) || partyName(k).includes(input.trim()),
  );
}

function pollRow(p: Poll) {
  return {
    date: p.date ?? p.date_raw,
    kind: p.kind,
    firm: p.firm,
    publisher: p.publisher,
    sample: p.sample ?? undefined,
    scenario: p.scenario ?? undefined,
    results: p.results,
    gov_bloc: p.gov_bloc ?? undefined,
    source: sourceUrl(p.source_page),
  };
}

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 1) }] };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "list_parties",
      {
        title: "רשימת המפלגות",
        description:
          "All parties running for the 26th Knesset (election day 2026-10-27) with their canonical keys, Hebrew names, whether a candidate list is published, and their 30-day seat-polling average. Call this first to discover valid party keys for the other tools.",
        inputSchema: z.object({}),
      },
      async () => {
        const latest = seatPolls[0]?.date ?? "2026-08-29";
        const avg = new Map(seatAverages(shiftISO(latest, -30)).map((a) => [a.key, a]));
        const rows = partyLists.map((pl) => ({
          key: pl.party,
          name_he: partyName(pl.party),
          candidates: pl.candidates.length,
          seat_avg_30d: avg.get(pl.party) ? +avg.get(pl.party)!.avg.toFixed(1) : null,
        }));
        return json({ election_date: "2026-10-27", data_updated: meta.scraped_at, parties: rows });
      },
    );

    server.registerTool(
      "get_poll_average",
      {
        title: "ממוצע הסקרים",
        description:
          "Per-party average Knesset seats over the seat-projection polls of the last N days (default 30), anchored to the newest poll. 61 of 120 seats are needed for a majority.",
        inputSchema: z.object({
          days: z.number().int().min(7).max(720).default(30).describe("Window size in days"),
        }),
      },
      async ({ days }) => {
        const latest = seatPolls[0]?.date ?? "2026-08-29";
        const averages = seatAverages(shiftISO(latest, -days))
          .filter((a) => a.avg >= 0.5)
          .map((a) => ({ key: a.key, name_he: partyName(a.key), seats_avg: +a.avg.toFixed(1) }));
        return json({ window_days: days, latest_poll: latest, majority: 61, averages });
      },
    );

    server.registerTool(
      "list_polls",
      {
        title: "חיפוש סקרים",
        description:
          "Search the full poll archive (every published poll since Nov 2022): seat projections, preferred-PM polls, hypothetical scenarios, coalition questions and more. Each row carries date, pollster, publisher, full results and a source link. Dates are ISO YYYY-MM-DD; results values are seats (seat_projection) or percent (other kinds).",
        inputSchema: z.object({
          kind: z.enum(POLL_KINDS).optional().describe("Poll type filter"),
          party: z
            .string()
            .optional()
            .describe("Only polls whose results include this party/candidate (key or Hebrew name)"),
          firm: z.string().optional().describe("Pollster name filter (substring)"),
          from: z.string().optional().describe("Earliest date, YYYY-MM-DD"),
          to: z.string().optional().describe("Latest date, YYYY-MM-DD"),
          limit: z.number().int().min(1).max(100).default(20),
        }),
      },
      async ({ kind, party, firm, from, to, limit }) => {
        let list = polls.filter((p) => p.date);
        if (kind) list = list.filter((p) => p.kind === kind);
        if (from) list = list.filter((p) => p.date! >= from);
        if (to) list = list.filter((p) => p.date! <= to);
        if (firm) {
          const f = firm.toLowerCase();
          list = list.filter((p) => (p.firm ?? "").toLowerCase().includes(f));
        }
        if (party) {
          const keys = resolveKey(party, list);
          list = list.filter((p) => keys.some((k) => p.results[k] != null));
        }
        list.sort((a, b) => b.date!.localeCompare(a.date!));
        return json({ total_matching: list.length, polls: list.slice(0, limit).map(pollRow) });
      },
    );

    server.registerTool(
      "head_to_head",
      {
        title: "ראש בראש",
        description:
          'Compare two parties (seat projections) or two PM candidates (preferred-PM polls) across every poll that includes both, oldest first, marking each lead change, e.g. "in which poll did Eizenkot first pass Netanyahu?". Accepts English keys or Hebrew names (e.g. a="eisenkot", b="netanyahu", kind="preferred_pm"; or a="yashar", b="likud", kind="seats").',
        inputSchema: z.object({
          a: z.string().describe("First party/candidate (key or Hebrew name)"),
          b: z.string().describe("Second party/candidate (key or Hebrew name)"),
          kind: z.enum(["seats", "preferred_pm"]).default("seats"),
          from: z.string().optional().describe("Earliest date, YYYY-MM-DD"),
        }),
      },
      async ({ a, b, kind, from }) => {
        const pool = polls.filter(
          (p) => p.date && p.kind === (kind === "seats" ? "seat_projection" : "preferred_pm"),
        );
        const [ka] = resolveKey(a, pool);
        const [kb] = resolveKey(b, pool);
        if (!ka || !kb) {
          return json({
            error: `could not resolve "${!ka ? a : b}", call list_parties or list_polls to see valid keys`,
          });
        }
        let rows = pool
          .filter((p) => typeof p.results[ka] === "number" && typeof p.results[kb] === "number")
          .sort((x, y) => x.date!.localeCompare(y.date!));
        if (from) rows = rows.filter((p) => p.date! >= from);
        let prevLeader: string | null = null;
        const series = rows.map((p) => {
          const va = p.results[ka] as number;
          const vb = p.results[kb] as number;
          const leader = va > vb ? ka : vb > va ? kb : "tie";
          const leadChange = leader !== "tie" && prevLeader !== null && leader !== prevLeader;
          if (leader !== "tie") prevLeader = leader;
          return {
            date: p.date,
            firm: p.firm,
            publisher: p.publisher,
            [ka]: va,
            [kb]: vb,
            leader,
            lead_change: leadChange || undefined,
            source: sourceUrl(p.source_page),
          };
        });
        return json({
          a: { key: ka, name_he: partyName(ka) },
          b: { key: kb, name_he: partyName(kb) },
          unit: kind === "seats" ? "seats" : "percent",
          polls: series,
        });
      },
    );

    server.registerTool(
      "get_party_list",
      {
        title: "רשימת מועמדים",
        description:
          "The published candidate list of one party, in ballot order, with Hebrew names.",
        inputSchema: z.object({
          party: z.string().describe("Party key or Hebrew name (see list_parties)"),
        }),
      },
      async ({ party }) => {
        const q = party.trim().toLowerCase();
        const pl =
          partyLists.find((p) => p.party.toLowerCase() === q) ??
          partyLists.find(
            (p) => p.party.toLowerCase().includes(q) || partyName(p.party).includes(party.trim()),
          );
        if (!pl) return json({ error: `unknown party "${party}", call list_parties for keys` });
        return json({
          party: pl.party,
          name_he: partyName(pl.party),
          source: sourceUrl("candidates"),
          candidates: pl.candidates.map((c) => ({
            rank: c.rank,
            name_he: c.name_he ?? c.name,
            name_en: c.name,
          })),
        });
      },
    );

    server.registerTool(
      "search_quotes",
      {
        title: "חיפוש ציטוטים",
        description:
          "Search the documented statements corpus (X, TikTok, YouTube, podcasts, news) of Knesset candidates. Every record carries a date and a link to the primary source. When enough polls surround a dated quote, the party's 14-day seat average before vs. after is attached as context (correlation, not causation).",
        inputSchema: z.object({
          query: z.string().optional().describe("Free text to match in the quote (Hebrew)"),
          party: z.string().optional().describe("Party key or Hebrew name"),
          candidate: z.string().optional().describe("Candidate name (Hebrew, full or partial)"),
          limit: z.number().int().min(1).max(50).default(10),
        }),
      },
      async ({ query, party, candidate, limit }) => {
        let list = quotes;
        if (party) {
          const q = party.trim().toLowerCase();
          list = list.filter(
            (x) => x.party.toLowerCase() === q || partyName(x.party).includes(party.trim()),
          );
        }
        if (candidate) list = list.filter((x) => x.candidate_he.includes(candidate.trim()));
        if (query) list = list.filter((x) => x.text.includes(query.trim()));
        list = [...list].sort((x, y) => (y.date ?? "").localeCompare(x.date ?? ""));
        const windowAvg = (pk: string, fromD: string, toD: string) => {
          let total = 0;
          let n = 0;
          for (const p of seatPolls) {
            if (!p.date || p.date < fromD || p.date > toD) continue;
            const v = p.results[pk];
            if (typeof v === "number") {
              total += v;
              n += 1;
            }
          }
          return n >= 2 ? +(total / n).toFixed(1) : null;
        };
        const rows = list.slice(0, limit).map((x) => {
          const before = x.date ? windowAvg(x.party, shiftISO(x.date, -14), shiftISO(x.date, -1)) : null;
          const after = x.date ? windowAvg(x.party, x.date, shiftISO(x.date, 14)) : null;
          return {
            candidate: x.candidate_he,
            party: partyName(x.party),
            date: x.date,
            text: x.text,
            source: x.url,
            source_type: x.source_type,
            party_seat_avg_around_quote:
              before !== null && after !== null ? { before_14d: before, after_14d: after } : undefined,
          };
        });
        return json({ total_matching: list.length, quotes: rows });
      },
    );

    server.registerTool(
      "get_prediction_markets",
      {
        title: "שוקי חיזוי",
        description:
          'Latest "who will be the next Israeli PM" probabilities from the Polymarket and Kalshi prediction markets, with trading volume and source links. Market prices reflect bettors, not a voter sample.',
        inputSchema: z.object({}),
      },
      async () => json(marketsData),
    );
  },
  {
    serverInfo: { name: "elections-2026", version: "1.0.0" },
    instructions:
      "Open election data for the 26th Knesset election (Israel, 2026-10-27), from elections.gtmascode.dev: every published poll since Nov 2022, all party candidate lists, a documented-statements corpus, and prediction-market odds. Every datum carries a date and a source link, cite them. Party/candidate arguments accept English keys or Hebrew names; call list_parties to discover keys.",
  },
);

export { handler as GET, handler as POST };
