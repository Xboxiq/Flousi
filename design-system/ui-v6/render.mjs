import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
/** UI v6 «مساحات». Desktop 1600×1000, 2× DPR → 3200×2000. */
const BASE = process.env.BASE || "http://localhost:8390";
const only = process.argv[2];
const SHOTS = [
  ["f1-map.html", "f1-map"],
  ["f2-register.html", "f2-register"],
  ["f3-weave.html", "f3-weave"],
  ["f4-seam.html", "f4-seam"],
  ["f5-pocket.html", "f5-pocket"],
  ["f6-foundry.html", "f6-foundry"],
];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const [file, name] of SHOTS) {
  if (only && !name.includes(only)) continue;
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const res = await p.goto(`${BASE}/${file}`, { waitUntil: "networkidle" });
  if (!res || !res.ok()) { console.log("skip", file, res && res.status()); await ctx.close(); continue; }
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(350);
  await p.screenshot({ path: `design-system/ui-v6/renders/${name}.png` });
  await ctx.close();
  console.log("shot", name);
}
await b.close();
