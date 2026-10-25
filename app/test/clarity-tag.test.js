// Microsoft Clarity on the shared gtmascode.dev project, next to the GA tag.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const layout = fs.readFileSync(path.join(__dirname, "..", "app", "layout.tsx"), "utf8");

test("root layout loads Clarity for project z0mh7paigf and tags AI referrers", () => {
  assert.match(layout, /clarity\.ms\/tag\//);
  assert.match(layout, /"z0mh7paigf"/);
  assert.match(layout, /clarity\("set","traffic","ai-assistant"\)/);
});

test("the Clarity inline script is valid JavaScript as rendered", () => {
  // JSX children are a template literal: without String.raw, "\/" collapses
  // to "/" and the referrer regex /^https?:\/\// becomes a syntax error,
  // which kills the whole snippet (Clarity never loads).
  const m = layout.match(/<Script id="clarity"[^>]*>\s*\{(String\.raw)?`([\s\S]*?)`\}/);
  assert.ok(m, "clarity <Script> block not found");
  const rendered = m[1] ? m[2] : eval("`" + m[2] + "`");
  assert.doesNotThrow(() => new Function(rendered));
});
