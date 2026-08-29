/* Eye-verify: every route, both themes, both widths, into one contact sheet per set. */
import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const BASE = process.env.BASE || "http://localhost:8123";
const OUT = process.env.OUT || "/tmp/shots";
const ROUTES = (process.env.ROUTES || "/dashboard/,/orders/,/products/,/reps/,/reps/schemes/,/targets/,/ledger/,/settlements/,/access/,/periods/,/reports/,/settings/,/calculator/,/products/p-1/,/reps/r-1/").split(",");
const W = Number(process.env.W || 1440), H = Number(process.env.H || 1000);
const THEME = process.env.THEME || "dark";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(`${BASE}/dashboard/`, { waitUntil: "domcontentloaded" });
await page.evaluate((t) => localStorage.setItem("ritm-theme", t), THEME);
for (const r of ROUTES) {
  try {
    await page.goto(`${BASE}${r}`, { waitUntil: "networkidle", timeout: 25000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    const name = r.replace(/\//g, "_").replace(/^_|_$/g, "") || "root";
    await page.screenshot({ path: `${OUT}/${THEME}-${W}-${name}.png`, fullPage: process.env.FULL === "1" });
    process.stdout.write(".");
  } catch (e) { console.log(`\n! ${r}: ${e.message.split("\n")[0]}`); }
}
console.log(`\n${THEME} @ ${W} done`);
await browser.close();
