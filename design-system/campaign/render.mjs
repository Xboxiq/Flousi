import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
/**
 * Renders each artboard at 1920×1080 with a 2× device pixel ratio, i.e. a
 * 3840×2160 print-grade PNG. Chromium is the camera: every highlight, contact
 * shadow and specular in these frames is authored, not sampled.
 */
const BASE = process.env.BASE || "http://localhost:8360";
const only = process.argv[2];
const SHOTS = [
  ["01-poster.html", "01-poster"],
  ["02-objects.html", "02-objects"],
  ["03-macro.html", "03-macro"],
  ["04-night.html", "04-night"],
  ["05-editorial.html", "05-editorial"],
];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
for (const [file, name] of SHOTS) {
  if (only && !name.includes(only)) continue;
  const res = await p.goto(`${BASE}/${file}`, { waitUntil: "networkidle" });
  if (!res || !res.ok()) { console.log("skip", file, res && res.status()); continue; }
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  await p.screenshot({ path: `design-system/campaign/renders/${name}.png` });
  console.log("shot", name);
}
await b.close();
