import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
import { readdirSync } from "node:fs";
const BASE = process.env.BASE || "http://localhost:8391";
const DIR = "design-system/ui-v7";
const only = process.argv[2];
const files = readdirSync(DIR).filter(f => /^s\d.*\.html$/.test(f)).sort();
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const f of files) {
  if (only && !f.includes(only)) continue;
  const ctx = await b.newContext({ viewport: { width: 1440, height: 2100 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const r = await p.goto(`${BASE}/${f}`, { waitUntil: "networkidle" });
  if (!r?.ok()) { console.log("skip", f, r?.status()); await ctx.close(); continue; }
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.locator(".viewport").screenshot({ path: `${DIR}/renders/${f.replace(".html", ".png")}` });
  await ctx.close(); console.log("shot", f);
}
await b.close();
