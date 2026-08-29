import { chromium } from "/opt/node22/lib/node_modules/playwright/index.mjs";
const BASE = process.env.BASE || "http://localhost:8123";
/* The four screens that read the most: the ladder's till + detail, the catalogue,
   the trips, and the team's derived balances. */
const ROUTES = ["/dashboard/", "/products/", "/orders/", "/reps/"];
const CASES = [
  ["a key holds invalid JSON", (k) => `localStorage.setItem("ritm:${k}", "{not json")`],
  ["a key holds an object, not a list", (k) => `localStorage.setItem("ritm:${k}", '{"a":1}')`],
  ["a key holds null", (k) => `localStorage.setItem("ritm:${k}", "null")`],
  ["a row is missing its fields", (k) => `localStorage.setItem("ritm:${k}", '[{"id":"x"}]')`],
  ["the key is gone entirely", (k) => `localStorage.removeItem("ritm:${k}")`],
];
/* The four load-bearing collections: everything else is read through these. */
const KEYS = ["products", "sales", "orders", "reps"];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let broken = 0,
  checked = 0;
for (const [label, mut] of CASES) {
  for (const key of KEYS) {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(String(e).split("\n")[0].slice(0, 110)));
    // boot once so the seed lands, then corrupt, then visit every screen
    await p.goto(`${BASE}/products/`, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    await p.evaluate(mut(key));
    const dead = [];
    for (const route of ROUTES) {
      await p.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      await p.waitForTimeout(600);
      /* A blank screen is a crash even without a thrown error — but "blank" has to
         mean RENDERED NOTHING, not "rendered few characters".
         The first version of this check counted characters in <main> and failed
         anything under 40. That held only while every screen printed its own <h1>
         inside <main>; once the title moved to the top bar, a perfectly correct
         empty state («لا يوجد مندوبون بعد» + its button, 31 characters) started
         reporting as a crash. A gate that fails on a screen doing exactly the right
         thing teaches everyone to ignore it.
         So the test is now two facts that cannot be true of a crash: <main> put
         SOMETHING in the document, and the chrome hydrated — the breadcrumb is
         rendered by React from the route, so its presence proves the tree mounted. */
      const state = await p.evaluate(() => {
        const main = document.querySelector("main");
        return {
          nodes: main ? main.querySelectorAll("*").length : 0,
          text: (main?.innerText || "").trim().length,
          chrome: (document.querySelector(".r-crumbs")?.innerText || "").trim().length,
        };
      });
      if (state.nodes === 0 || state.text === 0) dead.push(route + " (blank)");
      else if (state.chrome === 0) dead.push(route + " (chrome did not mount)");
    }
    checked++;
    if (errs.length || dead.length) {
      broken++;
      console.log(`✗ ${label} · ${key}`);
      if (errs.length) console.log(`    ${errs[0]}`);
      if (dead.length) console.log(`    blank: ${dead.slice(0, 3).join(", ")}`);
    }
    await ctx.close();
  }
}
console.log("\n" + "═".repeat(60));
console.log(
  broken === 0
    ? `all ${checked} corruption cases survived — every screen still rendered`
    : `${broken}/${checked} corruption cases broke a screen`,
);
await b.close();
