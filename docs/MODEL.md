# Recommendation Model - Statistical Documentation

This documents the ranking model behind primaries-selector.vercel.app, the
statistical choices in it, and the bias audit. Companion document:
[political-science-review.md](political-science-review.md) (literature grounding).

## 1. Score definition

For candidate c and answers A, the score is a normalized weighted linear model:

```
score(c, A) = 100 * [ w_iss * Issue(c, A) + w_exp * Exp(c, A)
                    + w_rep * Rep(c, A) + w_org * Org(c, A)
                    + w_el  * Elect(c) ]
```

Base weights: issues 0.55, experience 0.15, representation 0.15, origin 0.10,
electability 0.10 (opt-in). Electability's effective weight is x1 / x0.5 / x0
according to the voter's answer, and the active weights are renormalized to
sum to 1, so opting out never penalizes any candidate.

The issue weight follows the literature review: issue congruence is the
defensible core of a primaries recommender, while candidate popularity has
only modest party-level returns in closed-list PR, so it enters small and
opt-in only.

## 2. Statistical treatments

**Per-axis percentile normalization (blended).** Issue axes have very
different roster distributions (democracy_law mean 3.3/5; religion_state mean
1.3/5), so a raw "4" carries different information per axis. Issue score uses
0.8 * raw + 0.2 * percentile-within-axis. The percentile share is deliberately
small: simulations showed heavier percentile weighting amplifies incumbent
over-exposure (incumbents occupy top percentiles on most axes).

**Midrank ties.** All percentile computations assign tied values their group
midrank. An earlier version ranked ties in id order, which injected a
systematic registration-order bias into every axis; the 30-persona simulation
caught this (MK exposure ratio inflated from 1.16 to 1.39 among neutral
personas).

**Electability composite.** Three signal families, each rank-transformed
after a log transform where scale is heavy-tailed:
- Hebrew Wikipedia mean monthly pageviews, Mar-Jun 2026 (Wikimedia REST API).
  No page counts as evidence of low salience (0.15), not missing data, since
  all 51 candidates were checked identically.
- Known social followers (scraped; missing-at-random, excluded when null
  rather than penalized).
- Distinct major Israeli news domains in top-20 organic results for the
  quoted name (uniform measurement for all 51).
Weights 0.4 / 0.2 / 0.4 with renormalization over available components, +0.1
bonus for a prior national-list run, scaled to 0-5.

**Incumbency shrinkage.** At scoring time the electability component is shrunk
30% toward the neutral midpoint (0.5 + 0.7 * (e/5 - 0.5)): public-reach
metrics are structurally inflated by incumbency (coverage begets coverage),
per the pageviews-validity literature.

**Missing data never zeroes a candidate.** Null electability scores 0.5;
candidates with fewer than 3 sources carry a visible "limited info" badge.

**Random tie-breaking.** Candidates are shuffled before scoring so equal
scores appear in random relative order per visit.

## 3. Graph layer

Candidates form a similarity graph: cosine similarity over normalized axis
vectors (0.8) plus categorical overlap in experience/origin/sector (0.2).
The "balanced ballot" button runs Maximal Marginal Relevance over this graph:
greedily pick 10 maximizing `0.75 * relevance - 0.25 * max-similarity-to-picked`,
yielding a high-fit but non-redundant ballot (submodular-style selection).

## 4. Bias audit (30-persona simulation)

`app/scripts/simulate.ts` runs 30 stratified personas: 10 truly neutral
single-issue voters (one per axis, everything else off), 10 issue-pairs with
experience preferences (5 experienced / 5 fresh), 10 issue-triples with
representation and origin preferences. Metric: share of top-10 slots per
demographic group vs. roster share (ratio 1.0 = proportional).

Final state (after the midrank fix and tuning):

| Group | Roster share | Neutral-personas ratio | All-personas ratio |
|---|---|---|---|
| Women | 37.3% | 1.10 | 1.29 |
| Arab/Druze/other | 21.6% | 1.07 | 1.00 |
| Origin: new | 56.9% | 0.91 | 0.79 |
| Origin: Meretz | 19.6% | 1.27 | 1.41 |
| Origin: Labor | 23.5% | 0.98 | 1.16 |
| Current/former MKs | 21.6% | 1.16 | 1.53 |
| Civil society | 64.7% | 0.93 | 0.83 |

Acceptance: neutral personas within [0.8, 1.3] on all groups (pass). The
all-personas MK elevation (1.53) decomposes almost entirely into the 5
personas that explicitly requested parliamentary experience plus the opt-in
electability personas; expected-by-design MK share was ~32% vs 33% observed,
so it reflects honored preferences, not structural bias. Gini over candidate
exposure: 0.26 neutral / 0.36 all. Exactly one candidate never enters a
top-10: the self-declared symbolic candidate who asks people not to vote for
him.

## 5. Known limitations

- Axis scores originate from LLM-assisted coding of public sources against a
  fixed rubric; they are reproducible in process but not model-free.
- Coverage bias survives partially: well-documented candidates have richer
  evidence. Disclosed in-app; conservative scoring plus the neutral-0.5 rule
  bound the damage.
- Followers are scraped for 42/51 candidates; the remaining 9 have no public
  social profiles (itself treated as low-salience evidence via the wiki/news
  components, while the follower component is excluded as missing).
- Electability proxies salience, not affection: high pageviews can reflect
  controversy. The literature review is explicit that these are noisy
  predictors; hence small opt-in weight + shrinkage.

## 6. Score discrimination (data-scientist feedback, 2026-07-12)

External feedback: 20-30 candidates landing in one 60-80% match band means the
questionnaire under-discriminates. Diagnosis confirmed by measurement: a
3-issue voter with no other preferences had 32/51 candidates in the 60-80%
band. Root cause: components answered "don't care" contributed a constant 1.0
to every candidate (up to 45% of total weight), compressing the range.

Fixes:
1. Indifferent components (experience "any", no representation picks, origin
   "any") are now removed from the weight mix entirely, like opted-out
   electability always was. Only answered questions discriminate.
2. Issue selection order now carries information: rank weights 50/30/20
   (60/40 for two, 100 for one). Same question, more signal.

After: the same 3-issue voter has 9 candidates in the 60-80% band and a
32-point top-20 spread (was 20). Bias audit unchanged on the neutral subset
and slightly improved overall (Gini 0.373 to 0.354). The residual truth in
the critique stands and is disclosed in-app: these are 51 candidates of one
party; some genuinely are similar.
