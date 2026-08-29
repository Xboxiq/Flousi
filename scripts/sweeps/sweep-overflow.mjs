import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";

/**
 * No page scrolls sideways. At any width.
 *
 * The rule this enforces is the one the boards restate on every screen: wide
 * content — a table, a chart, a long code — scrolls INSIDE its own container, and
 * the page itself never does. A body that scrolls horizontally in RTL is the
 * worst version of the bug, because the merchant's own reading direction is the
 * one that hides the overflow: the content runs off the LEFT edge, which is
 * where the eye stops looking.
 *
 * The culprit list deliberately ignores anything with a scrolling ancestor, so a
 * `.r-tablewrap` doing its job is not reported as a defect.
 *
 *   BASE=http://localhost:8123 node scripts/sweeps/sweep-overflow.mjs
 */
const BASE = process.env.BASE || "http://localhost:8123";
const ROUTES = (
  process.env.ROUTES ||
  "/,/dashboard/,/orders/,/products/,/reps/,/reps/schemes/,/ledger/,/settlements/,/periods/,/targets/,/reports/,/access/,/settings/,/calculator/"
).split(",");
/** A phone in one hand, the shop counter, and the desk the accounts are done on. */
const WIDTHS = [390, 768, 1440];

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let bad = 0;
for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  for (const route of ROUTES) {
    const page = await ctx.newPage();
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const out = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      win: window.innerWidth,
      culprits: [...document.querySelectorAll("main *")]
        .filter((el) => {
          if (el.getBoundingClientRect().width <= window.innerWidth + 1) return false;
          for (let n = el.parentElement; n; n = n.parentElement) {
            const ox = getComputedStyle(n).overflowX;
            if (ox === "auto" || ox === "scroll" || ox === "hidden") return false;
          }
          return true;
        })
        .slice(0, 3)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 44)}`),
    }));
    if (out.doc > out.win + 1) {
      bad++;
      console.log(`✗ ${width}  ${route}   document ${out.doc} > viewport ${out.win}`);
      for (const c of out.culprits) console.log(`     ${c}`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(
  "\n" + "═".repeat(60) + "\n" +
    (bad ? `${bad} page(s) scroll sideways` : `no page scrolls sideways at ${WIDTHS.join(" / ")}`),
);
process.exit(bad ? 1 : 0);
