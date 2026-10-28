#!/usr/bin/env node
// Load pages in headless Chromium and save what they show: the rendered
// HTML, a screenshot, and every JSON response the page fetched (that is
// where JS-rendered sites like the CEC results page keep their data).
//   node scripts/fetch_pages.mjs out_dir url1 url2 ...
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const [outDir, ...urls] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const [i, url] of urls.entries()) {
  const dir = path.join(outDir, `${i}_${new URL(url).hostname}`);
  fs.mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ locale: "he-IL" });
  const index = [];
  page.on("response", async (r) => {
    try {
      const ct = r.headers()["content-type"] || "";
      if (!/json/.test(ct)) return;
      const body = await r.text();
      const name = `json_${index.length}.json`;
      fs.writeFileSync(path.join(dir, name), body);
      index.push({ name, url: r.url(), status: r.status() });
    } catch {}
  });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(4000);
    fs.writeFileSync(path.join(dir, "page.html"), await page.content());
    await page.screenshot({ path: path.join(dir, "page.png"), fullPage: true });
  } catch (e) {
    fs.writeFileSync(path.join(dir, "error.txt"), String(e));
  }
  fs.writeFileSync(path.join(dir, "index.json"), JSON.stringify({ url, fetched_at: new Date().toISOString(), responses: index }, null, 1));
  await page.close();
}
await browser.close();
