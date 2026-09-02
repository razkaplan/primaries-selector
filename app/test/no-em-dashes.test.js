// The project rule is that no em-dash appears in the copy, and several had
// leaked as far as the meta description and the og/twitter tags, which is the
// version search engines and social cards show. A rule nothing checks is a
// rule that comes back, so this is the check.
//
// Source only. data/ is deliberately out of scope: it holds scraped source
// titles and quote context, an automated pipeline rewrites it several times a
// day, and rewriting sourced material on a site whose premise is a dated link
// to the source for every item would be the wrong fix.
//
// Zero dependencies: node --test, so the gate needs no install to run.

const { test } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const DIRS = ["app", "components", "lib"];
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".css", ".md"]);
const SKIP = new Set(["node_modules", ".next", "test"]);
const EM_DASH = "—";

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXTS.has(path.extname(e.name))) out.push(p);
  }
  return out;
}

test("no em-dash in site source", () => {
  const offenders = [];
  for (const dir of DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      const lines = fs.readFileSync(file, "utf8").split("\n");
      lines.forEach((line, i) => {
        if (line.includes(EM_DASH)) {
          offenders.push(`${path.relative(ROOT, file)}:${i + 1}: ${line.trim().slice(0, 90)}`);
        }
      });
    }
  }
  assert.deepStrictEqual(
    offenders,
    [],
    `em-dash found in ${offenders.length} place(s). Use a comma, a colon, or parentheses:\n` +
      offenders.join("\n")
  );
});

test("the scanner actually looks at files", () => {
  // Guards the assertion above from silently passing because it walked nothing.
  const count = DIRS.reduce((n, d) => n + walk(path.join(ROOT, d)).length, 0);
  assert.ok(count > 20, `expected to scan the source tree, only found ${count} files`);
});
