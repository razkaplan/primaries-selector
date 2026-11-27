// The results page is the site's most-shown page in search (114 of 366
// impressions in the 28 days to 2026-11-24) and took no clicks. People type
// "תוצאות הבחירות לכנסת ה 26" and "כמה מנדטים יש לליכוד". The old title was
// "תוצאות הבחירות" and the description promised results "updating until final".
// The title now carries the full phrase and the description is built from the
// data, so the seat counts sit in the search result itself.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const page = fs.readFileSync(path.join(__dirname, "..", "app", "knesset", "results", "page.tsx"), "utf8");
const results = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "elections", "results.json"), "utf8"));

test("title carries the phrase people search for", () => {
  assert.match(page, /title: "תוצאות הבחירות לכנסת ה-26: מנדטים וקולות לכל מפלגה"/);
});

test("description is built from the results data, not typed by hand", () => {
  assert.match(page, /description: resultsDescription\(/);
  assert.doesNotMatch(page, /מתעדכנות עד התוצאות הסופיות/);
});

test("the description the data yields today names every party's seats", () => {
  const seated = results.lists.filter((l) => l.seats > 0).map((l) => `${l.name_he} ${l.seats}`).join(", ");
  assert.equal(results.status, "final");
  assert.match(seated, /^הליכוד 27, ישר! 21, ביחד 12, /);
  assert.equal(results.lists.reduce((s, l) => s + l.seats, 0), 120);
});

test("a final count shows turnout, not counting progress", () => {
  assert.match(page, /results\.turnout/);
  assert.match(page, /אחוז הצבעה/);
});
