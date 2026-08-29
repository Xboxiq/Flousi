import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
/** UI v5 screens. Desktop 1600×1000, phone triptych at the same frame, 2× DPR. */
const BASE = process.env.BASE || "http://localhost:8380";
const only = process.argv[2];
const SHOTS = [
  ["s1-open.html", "s1-open", 1600, 1000],
  ["s2-trips.html", "s2-trips", 1600, 1000],
  ["s3-record.html", "s3-record", 1600, 1000],
  ["s4-split.html", "s4-split", 1600, 1000],
  ["s5-close.html", "s5-close", 1600, 1000],
  ["s6-phone.html", "s6-phone", 1600, 1000],
  ["s7-states.html", "s7-states", 1600, 1000],
];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [file, name, w, h] of SHOTS) {
  if (only && !name.includes(only)) continue;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const res = await p.goto(`${BASE}/${file}`, { waitUntil: "networkidle" });
  if (!res || !res.ok()) { console.log("skip", file, res && res.status()); await ctx.close(); continue; }
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(350);
  await p.screenshot({ path: `design-system/ui-v5/renders/${name}.png` });
  await ctx.close();
  console.log("shot", name);
}
await b.close();
