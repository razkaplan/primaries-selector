# Popularity / Electability Signal Schema

Write one JSON file per candidate at `data/popularity/<id>.json`:

```json
{
  "id": "29717",
  "name": "עלי סלאלחה",
  "signals": {
    "wikipedia": {
      "exists": true,
      "title": "עלי_סלאלחה",
      "monthly_views_avg": 1234
    },
    "followers": {
      "facebook": 12000,
      "instagram": 3400,
      "x": 8100,
      "tiktok": null,
      "total_known": 23500
    },
    "news_presence": {
      "major_domains_top20": 4,
      "domains": ["ynet.co.il", "haaretz.co.il"]
    },
    "prior_national_list": true
  },
  "notes_he": "one short Hebrew sentence on their public reach"
}
```

## Rules
- NUMBERS MUST BE REAL, taken from a tool result or API response. If a signal
  cannot be verified, use null. NEVER estimate or invent a number.
- wikipedia.monthly_views_avg: average of the last 3 full months from the
  Wikimedia pageviews REST API (no auth needed):
  `curl -s "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/he.wikipedia/all-access/user/<URL-ENCODED-TITLE>/monthly/2026030100/2026070100"`
  Sum views / number of months. exists=false -> title=null, views=null.
- followers: use Bright Data web_data_* profile tools where a profile URL is in
  the candidate's socials (instagram/facebook/tiktok/x). Skip whatsapp. If a
  tool fails or the URL is a share link that cannot be resolved, null.
- news_presence: search the candidate's exact name (quoted, geo il). Count how
  many DISTINCT major Israeli news domains appear in the top ~20 organic
  results: ynet.co.il, mako.co.il, walla.co.il, haaretz.co.il, maariv.co.il,
  israelhayom.co.il, kan.org.il, n12.co.il, calcalist.co.il, globes.co.il,
  timesofisrael.com, jpost.com, davar1.co.il, srugim.co.il, kikar.co.il.
- prior_national_list: true if the candidate ran on a national Knesset list
  before (any slot), from the existing research files data/research/<id>.md.
