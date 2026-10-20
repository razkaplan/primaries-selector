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
