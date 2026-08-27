import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const BASE = "http://localhost:8123";
const ROUTES = [
  "/dashboard/",
  "/products/",
  "/orders/",
  "/reps/",
  "/reps/schemes/",
  "/targets/",
  "/settlements/",
  "/ledger/",
  "/periods/",
  "/reports/",
  "/access/",
  "/settings/",
  "/calculator/",
];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
let total = 0;
for (const route of ROUTES) {
  await p.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1600);
  const found = await p.evaluate(() => {
    const out = [];
    // Elements that RESPOND to a pointer but cannot be reached by keyboard: they
    // carry a click cursor (or a React onClick) yet are neither a control nor
    // focusable, and contain no focusable child to stand in for them.
    const FOCUSABLE =
      'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"]),[role="button"],[role="slider"]';
    for (const el of document.querySelectorAll("tr,li,div,article,section")) {
      const cs = getComputedStyle(el);
      if (cs.cursor !== "pointer") continue;
      if (el.matches(FOCUSABLE)) continue;
      if (el.closest(FOCUSABLE)) continue; // inside something focusable already
      if (el.querySelector(FOCUSABLE)) continue; // holds a focusable stand-in
      /* Nor is it a finding when the clickable REGION it belongs to has a focusable
         stand-in: the reps cards make the whole card clickable for the mouse and the
         rep's name a real link for the keyboard, so every inner div inherits the
         pointer cursor while the road for the keyboard exists one level up. */
      let region = el.parentElement,
        covered = false;
      while (region && region !== document.body) {
        if (
          getComputedStyle(region).cursor === "pointer" &&
          (region.matches(FOCUSABLE) || region.querySelector(FOCUSABLE))
        ) {
          covered = true;
          break;
        }
        region = region.parentElement;
      }
      if (covered) continue;
      if (!el.getClientRects().length) continue; // not rendered
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 40),
        text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40),
      });
    }
    return out;
  });
  if (found.length) {
    total += found.length;
    console.log(`✗ ${route} — ${found.length} pointer-only element(s)`);
    for (const f of found.slice(0, 3)) console.log(`    <${f.tag} class="${f.cls}"> «${f.text}»`);
  } else console.log(`✓ ${route}`);
}
console.log("\n" + "═".repeat(60));
console.log(
  total === 0
    ? "every clickable is keyboard reachable"
    : `${total} clickable element(s) unreachable by keyboard`,
);
await b.close();
