#!/usr/bin/env node
// Render /video/weekly (the weekly polls summary animation) to an MP4.
//
// The page is a pure function of time (window.__seek), so each frame is
// seeked and screenshotted, then piped to ffmpeg: deterministic, no dropped
// frames. Needs a running site (next start), playwright-core and ffmpeg.
//
//   cd app && npm run build && npx next start -p 3200 &
//   node scripts/render_weekly_video.mjs http://localhost:3200 out.mp4
//
// Env: CHROMIUM (browser path), FFMPEG (ffmpeg binary), FPS (default 30).
import { spawn } from "node:child_process";
import { chromium } from "playwright-core";

const [base = "http://localhost:3200", out = "weekly.mp4"] = process.argv.slice(2);
const FPS = Number(process.env.FPS || 30);
const ffmpegBin = process.env.FFMPEG || "ffmpeg";

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto(`${base}/video/weekly?render=1`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const duration = await page.evaluate(() => window.__duration);

const ff = spawn(ffmpegBin, [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-preset", "slow",
  "-movflags", "+faststart", out,
], { stdio: ["pipe", "inherit", "inherit"] });

const frames = Math.round(duration * FPS);
for (let i = 0; i < frames; i++) {
  await page.evaluate((s) => window.__seek(s), i / FPS);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const png = await page.screenshot({ type: "png" });
  if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once("drain", r));
  if (i % FPS === 0) process.stdout.write(`\r${Math.round((i / frames) * 100)}%`);
}
ff.stdin.end();
await new Promise((r, j) => ff.on("close", (c) => (c === 0 ? r() : j(new Error(`ffmpeg exited ${c}`)))));
await browser.close();
console.log(`\n${out}: ${frames} frames, ${duration}s @ ${FPS}fps`);
