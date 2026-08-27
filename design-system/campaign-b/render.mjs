import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
/** Style B renders, 1920×1080 at 2× → 3840×2160. */
const BASE = process.env.BASE || "http://localhost:8370";
const only = process.argv[2];
const SHOTS = [
  ["b1-foil.html", "b1-foil"],
  ["b2-underlit.html", "b2-underlit"],
  ["b3-macro.html", "b3-macro"],
  ["b4-vault.html", "b4-vault"],
  ["b5-numeral.html", "b5-numeral"],
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
  await p.screenshot({ path: `design-system/campaign-b/renders/${name}.png` });
  console.log("shot", name);
}
await b.close();
